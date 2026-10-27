import { extractModelFromText, extractQuantityFromText } from '../normalizer'
import type { MarketplaceCode, RawListingInput } from '../types'

export type NaverShopItem = {
  title: string
  link: string
  image: string
  lprice: string
  hprice: string
  mallName: string
  productId: string
  productType: string
  brand: string
  maker: string
  category1: string
  category2: string
  category3: string
  category4: string
}

export type NaverShopSearchResponse = {
  lastBuildDate: string
  total: number
  start: number
  display: number
  items: NaverShopItem[]
}

export type ParsedRetailListing = {
  id: string
  marketplace: MarketplaceCode
  sellerName: string
  itemCode: string | null
  title: string
  listPrice: number
  shippingFee: number
  effectivePrice: number
  listingUrl: string
  raw: RawListingInput
}

function stripHtml(text: string): string {
  return text.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').trim()
}

function parsePrice(text: string | undefined): number | null {
  if (!text) return null
  const n = Number(text.replace(/,/g, ''))
  return Number.isFinite(n) && n > 0 ? n : null
}

/** 네이버 쇼핑 검색 결과 → 스마트스토어·쿠팡 Listing */
export function detectMarketplace(link: string, mallName: string): MarketplaceCode | null {
  const url = link.toLowerCase()
  const mall = mallName.toLowerCase()
  if (url.includes('smartstore.naver.com') || mall.includes('스마트스토어') || mall.includes('smart store')) {
    return 'NAVER_SMARTSTORE'
  }
  if (url.includes('coupang.com') || mall.includes('쿠팡')) {
    return 'COUPANG'
  }
  return null
}

function itemCodeFromLink(link: string, productId: string): string | null {
  const smart = link.match(/smartstore\.naver\.com\/[^/]+\/products\/(\d+)/i)
  if (smart) return smart[1]
  const coupang = link.match(/coupang\.com\/(?:vp\/)?products\/(\d+)/i)
  if (coupang) return coupang[1]
  return productId || null
}

export function parseNaverShopItem(item: NaverShopItem, index: number): ParsedRetailListing | null {
  const marketplace = detectMarketplace(item.link, item.mallName)
  if (!marketplace) return null

  const title = stripHtml(item.title)
  const listPrice = parsePrice(item.lprice)
  if (!title || listPrice === null) return null

  const raw: RawListingInput = {
    title,
    brand: item.brand || undefined,
    manufacturer: item.maker || undefined,
    model: extractModelFromText(title) ?? undefined,
    quantity: extractQuantityFromText(title) ?? undefined,
    sourceUrl: item.link,
  }

  return {
    id: `naver-${marketplace.toLowerCase()}-${item.productId || index}`,
    marketplace,
    sellerName: item.mallName.trim() || '미입력',
    itemCode: itemCodeFromLink(item.link, item.productId),
    title,
    listPrice,
    shippingFee: 0,
    effectivePrice: listPrice,
    listingUrl: item.link,
    raw,
  }
}

export function parseNaverShopSearchResponse(
  body: NaverShopSearchResponse,
  focus: MarketplaceCode[],
): ParsedRetailListing[] {
  const seen = new Set<string>()
  const out: ParsedRetailListing[] = []
  for (let i = 0; i < body.items.length; i++) {
    const parsed = parseNaverShopItem(body.items[i], i)
    if (!parsed || !focus.includes(parsed.marketplace)) continue
    const key = `${parsed.marketplace}:${parsed.listingUrl}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push(parsed)
  }
  return out
}
