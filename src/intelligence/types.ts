/** Product Intelligence — types */

export const INTELLIGENCE_VERSION = '0.5.0'

export type FieldStatus = 'KNOWN' | 'UNKNOWN' | 'NOT_VISIBLE'
export type FieldSource = 'INPUT' | 'EXTRACTED' | 'NORMALIZED'

export type DnaField<T = string | number> = {
  raw: string | null
  normalized: T | null
  status: FieldStatus
  source: FieldSource
}

export type MatchStatus =
  | 'EXACT_MATCH'
  | 'VARIANT_MATCH'
  | 'SAME_BASE_DIFFERENT_PACKAGE'
  | 'PROBABLE_MATCH'
  | 'POSSIBLE_MATCH'
  | 'NOT_MATCH'
  | 'UNKNOWN'

export type ComparisonResult = 'EXACT' | 'SIMILAR' | 'DIFFERENT' | 'MISSING'

export type WholesalePlatformCode = 'DOMAEMAE' | 'DOMEGGOOK' | 'DOMETOPIA'

export type MarketplaceCode =
  | 'NAVER_SMARTSTORE'
  | 'COUPANG'
  | 'ELEVEN_ST'
  | 'GMARKET'
  | 'AUCTION'
  | 'KAKAO'

export type ProductIdentifier = {
  type: 'barcode' | 'sku' | 'manufacturer_model' | 'manufacturer_code' | 'supplier_item_code' | 'marketplace_listing_id'
  value: string
  sourceType: 'supplier' | 'marketplace' | 'manual'
  confidence: number
}

export type RawListingInput = {
  title: string
  brand?: string
  manufacturer?: string
  model?: string
  sku?: string
  barcode?: string
  quantity?: number
  color?: string
  material?: string
  dimension?: string
  packageUnit?: string
  origin?: string
  description?: string
  sourceUrl?: string
  supplierItemCode?: string
}

export type ProductDna = {
  version: 1
  title: DnaField<string>
  normalizedTitle: DnaField<string>
  brand: DnaField<string>
  manufacturer: DnaField<string>
  model: DnaField<string>
  sku: DnaField<string>
  barcode: DnaField<string>
  material: DnaField<string>
  color: DnaField<string>
  dimension: DnaField<string>
  weight: DnaField<string>
  quantity: DnaField<number>
  packageUnit: DnaField<string>
  origin: DnaField<string>
  description: DnaField<string>
  images: string[]
  identifiers: ProductIdentifier[]
  extractedAt: string
}

export type ProductEntity = {
  id: string
  version: 1
  canonicalName: string
  dna: ProductDna
  identityConfidence: number
  createdAt: string
  updatedAt: string
}

export type SupplierProduct = {
  platform: WholesalePlatformCode
  platformLabel: string
  supplierName: string
  itemCode: string
  rankingScore: number | null
  title: string
  listing: RawListingInput
  wholesalePrice: number | null
  shippingFee: number
  sourceUrl: string | null
  capturedAt: string
}

export type ListingDiscoveryStatus = 'FOUND' | 'NOT_FOUND' | 'MANUAL' | 'PENDING'

export type WholesaleListing = {
  id: string
  platform: WholesalePlatformCode
  discoveryStatus: ListingDiscoveryStatus
  sellerName: string | null
  itemCode: string | null
  title: string | null
  wholesalePrice: number | null
  shippingFee: number | null
  effectivePrice: number | null
  listingUrl: string | null
  capturedAt: string | null
  raw: RawListingInput | null
  isAnchor?: boolean
}

export type MatchEvidence = {
  attribute: string
  anchorValue: string | null
  candidateValue: string | null
  comparisonResult: ComparisonResult
  similarityScore: number | null
}

export type ProductMatchResult = {
  listingId: string
  matchStatus: MatchStatus
  confidence: number
  matchVersion: string
  evidence: MatchEvidence[]
  matchedAt: string
}

export type WholesaleCompetitionRow = {
  listing: WholesaleListing
  match: ProductMatchResult | null
}

/** 내가 도매처에 등록한 상품 (localStorage) */
export type MyProduct = {
  id: string
  platform: WholesalePlatformCode
  itemCode: string
  supplierName: string
  title: string
  rankingScore: number | null
  wholesalePrice: number | null
  shippingFee: number
  sourceUrl: string | null
  manufacturer?: string
  model?: string
  quantity?: number
  createdAt: string
  updatedAt: string
}

export type WholesaleSearchResult = {
  query: string
  anchor: SupplierProduct
  entity: ProductEntity
  rows: WholesaleCompetitionRow[]
  searchedAt: string
  stats: {
    total: number
    byPlatform: Record<WholesalePlatformCode, number>
    exactMatch: number
    lowestEffective: number | null
  }
}

export type RetailListing = {
  id: string
  marketplace: MarketplaceCode
  discoveryStatus: ListingDiscoveryStatus
  sellerName: string | null
  itemCode: string | null
  title: string | null
  listPrice: number | null
  shippingFee: number | null
  effectivePrice: number | null
  listingUrl: string | null
  capturedAt: string | null
  raw: RawListingInput | null
  isMine?: boolean
}

export type RetailCompetitionRow = {
  listing: RetailListing
  match: ProductMatchResult | null
}

export type RetailSearchResult = {
  query: string
  product: MyProduct
  entity: ProductEntity
  rows: RetailCompetitionRow[]
  searchedAt: string
  source: 'live' | 'stub'
  sourceNote?: string
  stats: {
    total: number
    competitorCount: number
    myListingCount: number
    byMarketplace: Record<MarketplaceCode, number>
    byMarketplaceCompetitors: Record<MarketplaceCode, number>
    exactMatch: number
    lowestEffective: number | null
  }
}
