import type { MarketplaceCode } from '../types'
import type { ParsedRetailListing } from './naverShopSearch'

export type RetailSearchFetchResult =
  | { ok: true; data: ParsedRetailListing[]; total: number }
  | { ok: false; error: string; status?: number }

/** 네이버 쇼핑 검색 API (스마트스토어·쿠팡 링크 필터) */
export async function fetchRetailListingsFromNaver(
  query: string,
  marketplaces: MarketplaceCode[] = ['NAVER_SMARTSTORE', 'COUPANG'],
): Promise<RetailSearchFetchResult> {
  const q = query.trim()
  if (!q) return { ok: false, error: '검색어를 입력해 주세요.' }

  try {
    const params = new URLSearchParams({ query: q, display: '50', sort: 'sim' })
    for (const m of marketplaces) params.append('marketplace', m)
    const res = await fetch(`/api/intelligence/retail/search?${params}`)
    const body: unknown = await res.json()
    if (!res.ok || !body || typeof body !== 'object') {
      const err =
        body && typeof body === 'object' && 'error' in body && typeof body.error === 'string'
          ? body.error
          : '마켓 검색에 실패했습니다.'
      return { ok: false, error: err, status: res.status }
    }
    if (!('ok' in body) || body.ok !== true || !('data' in body) || !Array.isArray(body.data)) {
      return { ok: false, error: '응답 형식 오류', status: res.status }
    }
    const total =
      'total' in body && typeof body.total === 'number' ? body.total : body.data.length
    return { ok: true, data: body.data as ParsedRetailListing[], total }
  } catch {
    return { ok: false, error: '네트워크 오류 — dev 서버에서 다시 시도해 주세요.' }
  }
}
