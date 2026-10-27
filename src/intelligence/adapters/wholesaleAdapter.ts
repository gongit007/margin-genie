import type { WholesalePlatformCode } from '../types'
import type { DomeggookParsedListing } from './parseDomeggookHtml'

export type WholesaleListingDraft = {
  platform: WholesalePlatformCode
  itemCode: string
  title: string
  supplierName: string
  rankingScore: number | null
  wholesalePrice: number | null
  shippingFee: number
  sourceUrl: string | null
  manufacturer?: string
  model?: string | null
  quantity?: number | null
}

export type WholesaleFetchResult =
  | { ok: true; data: WholesaleListingDraft }
  | { ok: false; error: string; status?: number }

function fromDomeggook(parsed: DomeggookParsedListing): WholesaleListingDraft {
  return {
    platform: 'DOMAEMAE',
    itemCode: parsed.itemCode,
    title: parsed.title,
    supplierName: parsed.supplierName,
    rankingScore: parsed.rankingScore,
    wholesalePrice: parsed.wholesalePrice,
    shippingFee: parsed.shippingFee,
    sourceUrl: parsed.sourceUrl,
    manufacturer: parsed.manufacturer ?? undefined,
    model: parsed.model,
    quantity: parsed.quantity ?? undefined,
  }
}

/** 도매처 상품번호 → 상세 정보 (도매매=도매꾹 HTML Adapter) */
export async function fetchWholesaleListing(
  platform: WholesalePlatformCode,
  itemCode: string,
): Promise<WholesaleFetchResult> {
  const code = itemCode.trim()
  if (!/^\d{5,12}$/.test(code)) {
    return { ok: false, error: '상품번호는 5~12자리 숫자여야 합니다.' }
  }

  if (platform === 'DOMAEMAE') {
    try {
      const res = await fetch(`/api/intelligence/domeggook/${code}`)
      const body: unknown = await res.json()
      if (!res.ok || !body || typeof body !== 'object') {
        const err =
          body && typeof body === 'object' && 'error' in body && typeof body.error === 'string'
            ? body.error
            : '상품 정보를 가져오지 못했습니다.'
        return { ok: false, error: err, status: res.status }
      }
      if (!('ok' in body) || body.ok !== true || !('data' in body)) {
        const err = 'error' in body && typeof body.error === 'string' ? body.error : '응답 형식 오류'
        return { ok: false, error: err, status: res.status }
      }
      return { ok: true, data: fromDomeggook(body.data as DomeggookParsedListing) }
    } catch {
      return { ok: false, error: '네트워크 오류 — dev 서버에서 다시 시도해 주세요.' }
    }
  }

  return {
    ok: false,
    error: `${platform === 'DOMEGGOOK' ? '도매꾹' : '도매토피아'} Adapter는 준비 중입니다. 도매매 상품번호를 사용해 주세요.`,
  }
}
