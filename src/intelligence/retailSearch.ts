import { MARKETPLACE_CODES, RETAIL_FOCUS_MARKETPLACES } from './marketplaceLabels'
import { createProductEntity } from './productEntity'
import { matchListing, isCompetitiveMatch } from './matchingEngine'
import { myProductToSupplier } from './myProductStorage'
import { fetchRetailListingsFromNaver } from './adapters/retailAdapter'
import { stubRetailSearchResults } from './retailCatalog'
import type { MyProduct, RetailCompetitionRow, RetailListing, RetailSearchResult } from './types'

function buildSearchQuery(model: string | null, quantity: number | null, title: string): string {
  const parts: string[] = []
  if (model) parts.push(model)
  if (quantity) parts.push(`${quantity}개`)
  if (!parts.length) parts.push(title.split(/\s+/).slice(0, 3).join(' ') || '상품')
  return parts.join(' ')
}

function isCompetitorRow(row: RetailCompetitionRow): boolean {
  return !row.listing.isMine
}

function lowestCompetitorEffective(rows: RetailCompetitionRow[]): number | null {
  const prices = rows
    .filter(
      (r) =>
        isCompetitorRow(r) &&
        r.match &&
        isCompetitiveMatch(r.match.matchStatus) &&
        r.listing.effectivePrice != null,
    )
    .map((r) => r.listing.effectivePrice!)
  return prices.length ? Math.min(...prices) : null
}

function buildStats(rows: RetailCompetitionRow[]): RetailSearchResult['stats'] {
  const found = rows.filter((r) => r.listing.discoveryStatus === 'FOUND')
  const competitors = found.filter(isCompetitorRow)
  const mine = found.filter((r) => r.listing.isMine)

  const byMarketplace = MARKETPLACE_CODES.reduce(
    (acc, m) => {
      acc[m] = found.filter((r) => r.listing.marketplace === m).length
      return acc
    },
    {} as RetailSearchResult['stats']['byMarketplace'],
  )

  const byMarketplaceCompetitors = MARKETPLACE_CODES.reduce(
    (acc, m) => {
      acc[m] = competitors.filter((r) => r.listing.marketplace === m).length
      return acc
    },
    {} as RetailSearchResult['stats']['byMarketplaceCompetitors'],
  )

  return {
    total: found.length,
    competitorCount: competitors.length,
    myListingCount: mine.length,
    byMarketplace,
    byMarketplaceCompetitors,
    exactMatch: competitors.filter((r) => r.match?.matchStatus === 'EXACT_MATCH').length,
    lowestEffective: lowestCompetitorEffective(rows),
  }
}

function toRetailListing(parsed: {
  id: string
  marketplace: RetailListing['marketplace']
  sellerName: string
  itemCode: string | null
  title: string
  listPrice: number
  shippingFee: number
  effectivePrice: number
  listingUrl: string
  raw: RetailListing['raw']
}): RetailListing {
  const now = new Date().toISOString()
  return {
    id: parsed.id,
    marketplace: parsed.marketplace,
    discoveryStatus: 'FOUND',
    sellerName: parsed.sellerName,
    itemCode: parsed.itemCode,
    title: parsed.title,
    listPrice: parsed.listPrice,
    shippingFee: parsed.shippingFee,
    effectivePrice: parsed.effectivePrice,
    listingUrl: parsed.listingUrl,
    capturedAt: now,
    raw: parsed.raw,
  }
}

function buildRowsFromListings(
  listings: RetailListing[],
  entity: ReturnType<typeof createProductEntity>,
): RetailCompetitionRow[] {
  return listings.map((listing) => ({
    listing,
    match: listing.isMine
      ? null
      : listing.raw
        ? matchListing(entity, listing.raw, listing.id)
        : null,
  }))
}

function stubResult(
  product: MyProduct,
  entity: ReturnType<typeof createProductEntity>,
  query: string,
  sourceNote?: string,
): RetailSearchResult {
  const listings = stubRetailSearchResults().filter((l) =>
    RETAIL_FOCUS_MARKETPLACES.includes(l.marketplace),
  )
  const rows = buildRowsFromListings(listings, entity)
  return {
    query,
    product,
    entity,
    rows,
    searchedAt: new Date().toISOString(),
    source: 'stub',
    sourceNote,
    stats: buildStats(rows),
  }
}

/** 도매매 구매 상품 → 스마트스토어·쿠팡 경쟁 셀러 (네이버 쇼핑 API, 실패 시 stub) */
export async function searchRetailListingsForProduct(
  product: MyProduct,
  customQuery?: string,
): Promise<RetailSearchResult> {
  const anchor = myProductToSupplier(product)
  const entity = createProductEntity(anchor.listing)
  const query =
    customQuery?.trim() ||
    buildSearchQuery(
      entity.dna.model.normalized,
      entity.dna.quantity.normalized,
      product.title,
    )

  const live = await fetchRetailListingsFromNaver(query, RETAIL_FOCUS_MARKETPLACES)
  if (!live.ok) {
    return stubResult(product, entity, query, live.error)
  }

  const listings = live.data.map(toRetailListing)
  const rows = buildRowsFromListings(listings, entity)
  return {
    query,
    product,
    entity,
    rows,
    searchedAt: new Date().toISOString(),
    source: 'live',
    sourceNote:
      listings.length > 0
        ? `네이버 쇼핑 검색 · 총 ${live.total.toLocaleString('ko-KR')}건 중 스마트스토어·쿠팡 ${listings.length}건`
        : '검색 결과 없음 — 스마트스토어·쿠팡 링크가 포함된 상품이 없습니다.',
    stats: buildStats(rows),
  }
}

/** 테스트·오프라인용 stub 검색 */
export function searchRetailListingsStub(product: MyProduct, customQuery?: string): RetailSearchResult {
  const anchor = myProductToSupplier(product)
  const entity = createProductEntity(anchor.listing)
  const query =
    customQuery?.trim() ||
    buildSearchQuery(
      entity.dna.model.normalized,
      entity.dna.quantity.normalized,
      product.title,
    )
  return stubResult(product, entity, query)
}

export function retailCompetitorRows(result: RetailSearchResult): RetailCompetitionRow[] {
  return result.rows.filter(isCompetitorRow)
}

export function retailMyListingRows(result: RetailSearchResult): RetailCompetitionRow[] {
  return result.rows.filter((r) => r.listing.isMine)
}
