import type { Connect, Plugin } from 'vite'
import { loadEnv } from 'vite'
import { decodeDomeggookBuffer, parseDomeggookHtml } from '../src/intelligence/adapters/parseDomeggookHtml'
import {
  parseNaverShopSearchResponse,
  type NaverShopSearchResponse,
} from '../src/intelligence/adapters/naverShopSearch'
import type { MarketplaceCode } from '../src/intelligence/types'

const ITEM_CODE_RE = /^\d{5,12}$/
const FOCUS_MARKETPLACES: MarketplaceCode[] = ['NAVER_SMARTSTORE', 'COUPANG']

function json(res: Connect.ServerResponse, status: number, body: unknown) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(body))
}

async function handleDomeggook(itemCode: string, res: Connect.ServerResponse) {
  if (!ITEM_CODE_RE.test(itemCode)) {
    json(res, 400, { ok: false, error: '잘못된 상품번호입니다.' })
    return
  }

  try {
    const upstream = await fetch(`https://domeggook.com/${itemCode}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; MarginGenie/1.0)',
        'Accept-Language': 'ko-KR,ko;q=0.9',
      },
      redirect: 'follow',
    })

    if (!upstream.ok) {
      json(res, upstream.status === 404 ? 404 : 502, {
        ok: false,
        error: upstream.status === 404 ? '상품을 찾을 수 없습니다.' : '도매꾹 페이지를 불러오지 못했습니다.',
      })
      return
    }

    const buffer = await upstream.arrayBuffer()
    const html = decodeDomeggookBuffer(buffer, upstream.headers.get('content-type'))
    const parsed = parseDomeggookHtml(html, itemCode)

    if (!parsed) {
      json(res, 422, { ok: false, error: '상품 정보를 파싱하지 못했습니다.' })
      return
    }

    json(res, 200, { ok: true, data: parsed })
  } catch {
    json(res, 502, { ok: false, error: '도매꾹 연결에 실패했습니다.' })
  }
}

async function handleRetailSearch(url: string, env: Record<string, string>, res: Connect.ServerResponse) {
  const parsed = new URL(url, 'http://localhost')
  const query = parsed.searchParams.get('query')?.trim() ?? ''
  if (!query) {
    json(res, 400, { ok: false, error: '검색어(query)가 필요합니다.' })
    return
  }

  const clientId = env.NAVER_OPENAPI_CLIENT_ID
  const clientSecret = env.NAVER_OPENAPI_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    json(res, 503, {
      ok: false,
      error: '.env.local에 NAVER_OPENAPI_CLIENT_ID / NAVER_OPENAPI_CLIENT_SECRET를 설정해 주세요.',
    })
    return
  }

  const display = Math.min(Number(parsed.searchParams.get('display') ?? '50') || 50, 100)
  const requested = parsed.searchParams.getAll('marketplace') as MarketplaceCode[]
  const focus = requested.length
    ? requested.filter((m): m is MarketplaceCode => FOCUS_MARKETPLACES.includes(m as MarketplaceCode))
    : FOCUS_MARKETPLACES

  try {
    const apiUrl = new URL('https://openapi.naver.com/v1/search/shop.json')
    apiUrl.searchParams.set('query', query)
    apiUrl.searchParams.set('display', String(display))
    apiUrl.searchParams.set('sort', 'sim')

    const upstream = await fetch(apiUrl, {
      headers: {
        'X-Naver-Client-Id': clientId,
        'X-Naver-Client-Secret': clientSecret,
      },
    })

    if (!upstream.ok) {
      const naverHint =
        upstream.status === 401
          ? '네이버 API 인증 실패 — developers.naver.com에서 (1) 검색 API·쇼핑 사용 설정 (2) Client ID/Secret 재발급 후 .env.local 갱신 (3) dev 서버 재시작'
          : '네이버 쇼핑 검색에 실패했습니다.'
      json(res, upstream.status === 401 ? 401 : 502, {
        ok: false,
        error: naverHint,
      })
      return
    }

    const body = (await upstream.json()) as NaverShopSearchResponse
    const listings = parseNaverShopSearchResponse(body, focus.length ? focus : FOCUS_MARKETPLACES)
    json(res, 200, { ok: true, data: listings, total: body.total ?? listings.length })
  } catch {
    json(res, 502, { ok: false, error: '네이버 쇼핑 API 연결에 실패했습니다.' })
  }
}

function intelligenceApiMiddleware(env: Record<string, string>): Connect.NextHandleFunction {
  return async (req, res, next) => {
    const url = req.url ?? ''

    const domeggook = url.match(/^\/api\/intelligence\/domeggook\/(\d{5,12})(?:\?.*)?$/)
    if (domeggook) {
      await handleDomeggook(domeggook[1], res)
      return
    }

    if (url.startsWith('/api/intelligence/retail/search')) {
      await handleRetailSearch(url, env, res)
      return
    }

    next()
  }
}

/** dev/preview — CORS 우회용 Intelligence Adapter API */
export function intelligenceApiPlugin(): Plugin {
  const attach = (server: { config: { mode: string; envDir: string }; middlewares: Connect.Server }) => {
    const env = loadEnv(server.config.mode, server.config.envDir, '')
    server.middlewares.use(intelligenceApiMiddleware(env))
  }
  return {
    name: 'margin-genie-intelligence-api',
    configureServer: attach,
    configurePreviewServer: attach,
  }
}
