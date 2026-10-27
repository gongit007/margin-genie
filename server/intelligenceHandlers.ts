import {
  decodeDomeggookBuffer,
  decodeHtmlBuffer,
  parseDomeggookHtml,
} from '../src/intelligence/adapters/parseDomeggookHtml'
import { parseDomeggookSearchHtml } from '../src/intelligence/adapters/parseDomeggookSearchHtml'
import { parseDomemeSearchHtml } from '../src/intelligence/adapters/parseDomemeSearchHtml'
import { parseDometopiaSearchHtml } from '../src/intelligence/adapters/parseDometopiaSearchHtml'
import {
  parseNaverShopSearchResponse,
  type NaverShopSearchResponse,
} from '../src/intelligence/adapters/naverShopSearch'
import type { MarketplaceCode, WholesalePlatformCode, WholesaleSearchHit } from '../src/intelligence/types'

const ITEM_CODE_RE = /^\d{5,12}$/
const FOCUS_MARKETPLACES: MarketplaceCode[] = ['NAVER_SMARTSTORE', 'COUPANG']

export type HandlerResult = { status: number; body: unknown }

const DOMEGGOOK_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (compatible; MarginGenie/1.0)',
  'Accept-Language': 'ko-KR,ko;q=0.9',
}

export async function handleDomeggookItem(itemCode: string): Promise<HandlerResult> {
  if (!ITEM_CODE_RE.test(itemCode)) {
    return { status: 400, body: { ok: false, error: '잘못된 상품번호입니다.' } }
  }

  try {
    const upstream = await fetch(`https://domeggook.com/${itemCode}`, {
      headers: DOMEGGOOK_HEADERS,
      redirect: 'follow',
    })

    if (!upstream.ok) {
      return {
        status: upstream.status === 404 ? 404 : 502,
        body: {
          ok: false,
          error: upstream.status === 404 ? '상품을 찾을 수 없습니다.' : '도매꾹 페이지를 불러오지 못했습니다.',
        },
      }
    }

    const buffer = await upstream.arrayBuffer()
    const html = decodeDomeggookBuffer(buffer, upstream.headers.get('content-type'))
    const parsed = parseDomeggookHtml(html, itemCode)

    if (!parsed) {
      return { status: 422, body: { ok: false, error: '상품 정보를 파싱하지 못했습니다.' } }
    }

    return { status: 200, body: { ok: true, data: parsed } }
  } catch {
    return { status: 502, body: { ok: false, error: '도매꾹 연결에 실패했습니다.' } }
  }
}

export async function handleDomeggookSearch(query: string, limit = 15): Promise<HandlerResult> {
  const q = query.trim()
  if (!q) {
    return { status: 400, body: { ok: false, error: '검색어(query)가 필요합니다.' } }
  }

  const capped = Math.min(Math.max(limit, 1), 30)

  try {
    const url = new URL('https://www.domeggook.com/main/item/itemList.php')
    url.searchParams.set('sw', q)
    url.searchParams.set('sf', 'ttl')

    const upstream = await fetch(url, { headers: DOMEGGOOK_HEADERS, redirect: 'follow' })
    if (!upstream.ok) {
      return { status: 502, body: { ok: false, error: '도매매 검색에 실패했습니다.' } }
    }

    const buffer = await upstream.arrayBuffer()
    const html = decodeHtmlBuffer(buffer, upstream.headers.get('content-type'))
    const hits = parseDomeggookSearchHtml(html, capped)
    return { status: 200, body: { ok: true, data: hits, total: hits.length } }
  } catch {
    return { status: 502, body: { ok: false, error: '도매매 검색 연결에 실패했습니다.' } }
  }
}

async function fetchSearchHtml(url: string): Promise<string | null> {
  const upstream = await fetch(url, { headers: DOMEGGOOK_HEADERS, redirect: 'follow' })
  if (!upstream.ok) return null
  const buffer = await upstream.arrayBuffer()
  return decodeHtmlBuffer(buffer, upstream.headers.get('content-type'))
}

function withPlatform(
  platform: WholesalePlatformCode,
  hits: Array<Omit<WholesaleSearchHit, 'platform'>>,
): WholesaleSearchHit[] {
  return hits.map((h) => ({ ...h, platform }))
}

async function searchPlatform(
  platform: WholesalePlatformCode,
  query: string,
  limit: number,
): Promise<WholesaleSearchHit[]> {
  if (platform === 'DOMAEMAE') {
    const url = new URL('https://www.domeggook.com/main/item/itemList.php')
    url.searchParams.set('sw', query)
    url.searchParams.set('sf', 'ttl')
    const html = await fetchSearchHtml(url.toString())
    return html ? withPlatform('DOMAEMAE', parseDomeggookSearchHtml(html, limit)) : []
  }
  if (platform === 'DOMEGGOOK') {
    const url = new URL('https://domemedb.domeggook.com/index/item/supplyList.php')
    url.searchParams.set('sw', query)
    url.searchParams.set('sf', 'ttl')
    url.searchParams.set('mode', 'search')
    const html = await fetchSearchHtml(url.toString())
    return html ? withPlatform('DOMEGGOOK', parseDomemeSearchHtml(html, limit)) : []
  }
  const url = new URL('https://www.dometopia.com/goods/search')
  url.searchParams.set('keyword', query)
  url.searchParams.set('search_text', query)
  url.searchParams.set('sort', 'single_item')
  const html = await fetchSearchHtml(url.toString())
  return html ? withPlatform('DOMETOPIA', parseDometopiaSearchHtml(html, limit)) : []
}

const PLATFORM_CODES: WholesalePlatformCode[] = ['DOMAEMAE', 'DOMEGGOOK', 'DOMETOPIA']

/** 도매 3플랫폼 검색. platform=ALL 이면 병렬 조회 */
export async function handleWholesaleSearch(
  query: string,
  limit = 15,
  platform = 'ALL',
): Promise<HandlerResult> {
  const q = query.trim()
  if (!q) {
    return { status: 400, body: { ok: false, error: '검색어(query)가 필요합니다.' } }
  }
  const capped = Math.min(Math.max(limit, 1), 30)
  const want: WholesalePlatformCode[] =
    platform === 'ALL' || !platform
      ? PLATFORM_CODES
      : PLATFORM_CODES.includes(platform as WholesalePlatformCode)
        ? [platform as WholesalePlatformCode]
        : []
  if (!want.length) {
    return { status: 400, body: { ok: false, error: '잘못된 platform입니다.' } }
  }

  try {
    const parts = await Promise.all(want.map((p) => searchPlatform(p, q, capped)))
    const data = parts.flat()
    return { status: 200, body: { ok: true, data, total: data.length } }
  } catch {
    return { status: 502, body: { ok: false, error: '도매 검색 연결에 실패했습니다.' } }
  }
}

export async function handleRetailSearch(
  searchUrl: string,
  env: Record<string, string>,
): Promise<HandlerResult> {
  const parsed = new URL(searchUrl, 'http://localhost')
  const query = parsed.searchParams.get('query')?.trim() ?? ''
  if (!query) {
    return { status: 400, body: { ok: false, error: '검색어(query)가 필요합니다.' } }
  }

  const clientId = env.NAVER_OPENAPI_CLIENT_ID
  const clientSecret = env.NAVER_OPENAPI_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    return {
      status: 503,
      body: {
        ok: false,
        error:
          'NAVER_OPENAPI_CLIENT_ID / NAVER_OPENAPI_CLIENT_SECRET 환경 변수를 설정해 주세요. (로컬: .env.local)',
      },
    }
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
          ? '네이버 API 인증 실패 — developers.naver.com에서 검색 API·쇼핑 사용 설정 후 키를 갱신하세요.'
          : '네이버 쇼핑 검색에 실패했습니다.'
      return {
        status: upstream.status === 401 ? 401 : 502,
        body: { ok: false, error: naverHint },
      }
    }

    const body = (await upstream.json()) as NaverShopSearchResponse
    const listings = parseNaverShopSearchResponse(body, focus.length ? focus : FOCUS_MARKETPLACES)
    return { status: 200, body: { ok: true, data: listings, total: body.total ?? listings.length } }
  } catch {
    return { status: 502, body: { ok: false, error: '네이버 쇼핑 API 연결에 실패했습니다.' } }
  }
}
