import { fetchWholesaleSearch } from './adapters/wholesaleAdapter'
import { extractModelFromText, extractQuantityFromText } from './normalizer'
import { createProductEntity } from './productEntity'
import { matchListing, isCompetitiveMatch } from './matchingEngine'
import { lookupDomemeProduct } from './supplierStub'
import { myProductToSupplier } from './myProductStorage'
import { stubWholesaleCompetitors } from './wholesaleCatalog'
import { WHOLESALE_PLATFORM_LABELS, WHOLESALE_PLATFORMS } from './platformLabels'
import type {
  MyProduct,
  RawListingInput,
  SupplierProduct,
  WholesaleListing,
  WholesalePlatformCode,
  WholesaleSearchHit,
  WholesaleSearchResult,
} from './types'

function buildSearchQuery(model: string | null, quantity: number | null): string {
  const parts: string[] = []
  if (model) parts.push(model)
  if (quantity) parts.push(`${quantity}개`)
  if (!parts.length) parts.push('브라켓')
  return parts.join(' ')
}

function eff(price: number | null, ship: number): number | null {
  if (price === null) return null
  return price + ship
}

function anchorListingFromProduct(product: MyProduct): WholesaleListing {
  const raw: RawListingInput = {
    title: product.title,
    manufacturer: product.manufacturer,
    model: product.model,
    quantity: product.quantity,
    supplierItemCode: product.itemCode,
    sourceUrl: product.sourceUrl ?? undefined,
  }
  const url =
    product.sourceUrl ??
    (product.platform === 'DOMAEMAE' ? `https://domeggook.com/${product.itemCode}` : null)
  return {
    id: `anchor-${product.id}`,
    platform: product.platform,
    discoveryStatus: 'FOUND',
    sellerName: product.supplierName,
    itemCode: product.itemCode,
    title: product.title,
    wholesalePrice: product.wholesalePrice,
    shippingFee: product.shippingFee,
    effectivePrice: eff(product.wholesalePrice, product.shippingFee),
    listingUrl: url,
    capturedAt: new Date().toISOString(),
    isAnchor: true,
    raw,
  }
}

function listingFromSearchHit(hit: WholesaleSearchHit): WholesaleListing {
  const raw: RawListingInput = {
    title: hit.title,
    model: extractModelFromText(hit.title) ?? undefined,
    quantity: extractQuantityFromText(hit.title) ?? undefined,
    supplierItemCode: hit.itemCode,
    sourceUrl: hit.listingUrl,
  }
  return {
    id: `ws-live-${hit.platform}-${hit.itemCode}`,
    platform: hit.platform,
    discoveryStatus: 'FOUND',
    sellerName: hit.supplierName,
    itemCode: hit.itemCode,
    title: hit.title,
    wholesalePrice: hit.wholesalePrice,
    shippingFee: hit.shippingFee,
    effectivePrice: eff(hit.wholesalePrice, hit.shippingFee),
    listingUrl: hit.listingUrl,
    capturedAt: new Date().toISOString(),
    raw,
  }
}

function isSameListingAsAnchor(listing: WholesaleListing, product: MyProduct): boolean {
  if (listing.itemCode && listing.itemCode === product.itemCode) return true
  if (
    listing.platform === product.platform &&
    listing.sellerName &&
    listing.sellerName === product.supplierName &&
    listing.itemCode === product.itemCode
  ) {
    return true
  }
  return false
}

function dedupeListings(listings: WholesaleListing[]): WholesaleListing[] {
  const seen = new Set<string>()
  const out: WholesaleListing[] = []
  for (const l of listings) {
    const key = `${l.platform}:${l.itemCode ?? l.id}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push(l)
  }
  return out
}

function competitorsForPlatform(
  platform: WholesalePlatformCode,
  product: MyProduct,
  liveByPlatform: Partial<Record<WholesalePlatformCode, WholesaleListing[]>>,
): WholesaleListing[] {
  const live = (liveByPlatform[platform] ?? []).filter((l) => !isSameListingAsAnchor(l, product))
  if (live.length) return dedupeListings(live)
  return stubWholesaleCompetitors(platform).filter((l) => !isSameListingAsAnchor(l, product))
}

function lowestCompetitorEffective(rows: WholesaleSearchResult['rows']): number | null {
  const prices = rows
    .filter(
      (r) =>
        !r.listing.isAnchor &&
        r.match &&
        isCompetitiveMatch(r.match.matchStatus) &&
        r.listing.effectivePrice != null,
    )
    .map((r) => r.listing.effectivePrice!)
  return prices.length ? Math.min(...prices) : null
}

function buildStats(rows: WholesaleSearchResult['rows']): WholesaleSearchResult['stats'] {
  const found = rows.filter((r) => r.listing.discoveryStatus === 'FOUND')
  const byPlatform = WHOLESALE_PLATFORMS.reduce(
    (acc, p) => {
      acc[p] = found.filter((r) => r.listing.platform === p).length
      return acc
    },
    {} as Record<WholesalePlatformCode, number>,
  )
  return {
    total: found.length,
    byPlatform,
    exactMatch: rows.filter(
      (r) => !r.listing.isAnchor && r.match?.matchStatus === 'EXACT_MATCH',
    ).length,
    lowestEffective: lowestCompetitorEffective(rows),
  }
}

function buildWholesaleResult(
  product: MyProduct,
  anchor: SupplierProduct,
  customQuery?: string,
  liveByPlatform: Partial<Record<WholesalePlatformCode, WholesaleListing[]>> = {},
  meta?: { source: WholesaleSearchResult['source']; sourceNote?: string },
): WholesaleSearchResult {
  const entity = createProductEntity(anchor.listing)
  const query =
    customQuery?.trim() ||
    buildSearchQuery(entity.dna.model.normalized, entity.dna.quantity.normalized)

  const anchorRow = anchorListingFromProduct(product)
  const competitorListings = WHOLESALE_PLATFORMS.flatMap((platform) =>
    competitorsForPlatform(platform, product, liveByPlatform),
  )

  const listings = [anchorRow, ...competitorListings]

  const rows = listings.map((listing) => ({
    listing,
    match: listing.isAnchor
      ? null
      : listing.raw
        ? matchListing(entity, listing.raw, listing.id)
        : null,
  }))

  const hasLive = WHOLESALE_PLATFORMS.some((p) => (liveByPlatform[p]?.length ?? 0) > 0)
  const hasStub = competitorListings.some((l) => l.id.startsWith('ws-ggook') || l.id.startsWith('ws-topia'))
  const source = meta?.source ?? (hasLive && hasStub ? 'hybrid' : hasLive ? 'live' : 'stub')

  return {
    query,
    anchor,
    entity,
    rows,
    searchedAt: new Date().toISOString(),
    source,
    sourceNote: meta?.sourceNote,
    stats: buildStats(rows),
  }
}

function resolveAnchor(product: MyProduct): SupplierProduct {
  const stub = lookupDomemeProduct(product.itemCode)
  return stub
    ? {
        ...stub,
        platform: product.platform,
        platformLabel: WHOLESALE_PLATFORM_LABELS[product.platform],
        supplierName: product.supplierName,
        title: product.title,
        rankingScore: product.rankingScore ?? stub.rankingScore,
        wholesalePrice: product.wholesalePrice ?? stub.wholesalePrice,
        itemCode: product.itemCode,
      }
    : myProductToSupplier(product)
}

/** 동기 검색 — stub + 고정 카탈로그 (테스트·오프라인) */
export function searchWholesaleCompetitorsForProduct(
  product: MyProduct,
  customQuery?: string,
): WholesaleSearchResult {
  const anchor = resolveAnchor(product)
  return buildWholesaleResult(product, anchor, customQuery, {}, { source: 'stub' })
}

/** 도매 3플랫폼 실검색 (실패 플랫폼은 stub) */
export async function searchWholesaleCompetitorsForProductLive(
  product: MyProduct,
  customQuery?: string,
): Promise<WholesaleSearchResult> {
  const anchor = resolveAnchor(product)
  const entity = createProductEntity(anchor.listing)
  const query =
    customQuery?.trim() ||
    buildSearchQuery(entity.dna.model.normalized, entity.dna.quantity.normalized)

  const fallbacks = [query]
  const modelOnly = buildSearchQuery(entity.dna.model.normalized, null)
  if (modelOnly && !fallbacks.includes(modelOnly)) fallbacks.push(modelOnly)
  if (product.model && !fallbacks.includes(product.model)) fallbacks.push(product.model)

  let live = await fetchWholesaleSearch(fallbacks[0], 15, 'ALL')
  let searchQueryUsed = fallbacks[0]
  for (const next of fallbacks.slice(1)) {
    if (live.ok && live.data.length > 0) break
    const retry = await fetchWholesaleSearch(next, 15, 'ALL')
    if (retry.ok && retry.data.length > 0) {
      live = retry
      searchQueryUsed = next
    }
  }

  const liveByPlatform: Partial<Record<WholesalePlatformCode, WholesaleListing[]>> = {}
  if (live.ok) {
    for (const hit of live.data) {
      const listing = listingFromSearchHit(hit)
      const bucket = liveByPlatform[hit.platform] ?? []
      bucket.push(listing)
      liveByPlatform[hit.platform] = bucket
    }
  }

  const liveCount = live.ok ? live.data.length : 0
  const source: WholesaleSearchResult['source'] = liveCount > 0 ? 'hybrid' : 'stub'
  const sourceNote = live.ok
    ? liveCount > 0
      ? `도매 3플랫폼 검색 · 「${searchQueryUsed}」 · ${live.total}건 후보`
      : '실검색 결과 없음 — 도매꾹·도매토피아 예시 데이터를 표시합니다.'
    : `${live.error} (예시 데이터)`

  return buildWholesaleResult(product, anchor, customQuery, liveByPlatform, { source, sourceNote })
}

/** 도매매 상품번호 → DNA → 3플랫폼 검색 (stub) */
export function searchWholesaleCompetitors(itemCode: string, customQuery?: string): WholesaleSearchResult | null {
  const anchor = lookupDomemeProduct(itemCode.trim())
  if (!anchor) return null
  const product: MyProduct = {
    id: `lookup-${itemCode}`,
    platform: anchor.platform,
    itemCode: anchor.itemCode,
    supplierName: anchor.supplierName,
    title: anchor.title,
    rankingScore: anchor.rankingScore,
    wholesalePrice: anchor.wholesalePrice,
    shippingFee: anchor.shippingFee,
    sourceUrl: anchor.sourceUrl,
    manufacturer: anchor.listing.manufacturer,
    model: anchor.listing.model,
    quantity: anchor.listing.quantity,
    createdAt: anchor.capturedAt,
    updatedAt: anchor.capturedAt,
  }
  return searchWholesaleCompetitorsForProduct(product, customQuery)
}
