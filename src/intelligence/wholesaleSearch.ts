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

function buildStats(
  rows: WholesaleSearchResult['rows'],
  activePlatforms: WholesalePlatformCode[],
): WholesaleSearchResult['stats'] {
  const found = rows.filter((r) => r.listing.discoveryStatus === 'FOUND')
  const byPlatform = WHOLESALE_PLATFORMS.reduce(
    (acc, p) => {
      acc[p] = activePlatforms.includes(p)
        ? found.filter((r) => r.listing.platform === p).length
        : 0
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

function searchForProduct(product: MyProduct, anchor: SupplierProduct, customQuery?: string): WholesaleSearchResult {
  const entity = createProductEntity(anchor.listing)
  const query =
    customQuery?.trim() ||
    buildSearchQuery(entity.dna.model.normalized, entity.dna.quantity.normalized)

  const activePlatforms: WholesalePlatformCode[] = [product.platform]
  const anchorRow = anchorListingFromProduct(product)
  const competitors = stubWholesaleCompetitors(product.platform)
  const listings = [anchorRow, ...competitors]

  const rows = listings.map((listing) => ({
    listing,
    match: listing.isAnchor
      ? null
      : listing.raw
        ? matchListing(entity, listing.raw, listing.id)
        : null,
  }))

  return {
    query,
    anchor,
    entity,
    rows,
    searchedAt: new Date().toISOString(),
    stats: buildStats(rows, activePlatforms),
  }
}

/** 내 상품 → 해당 도매처만 경쟁 검색 (내가 판매 중인 도매처) */
export function searchWholesaleCompetitorsForProduct(product: MyProduct, customQuery?: string): WholesaleSearchResult {
  const stub = lookupDomemeProduct(product.itemCode)
  const anchor = stub
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
  return searchForProduct(product, anchor, customQuery)
}

/** 도매매 상품번호 → DNA → 해당 도매처만 검색 (Adapter 전) */
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
  return searchForProduct(product, anchor, customQuery)
}
