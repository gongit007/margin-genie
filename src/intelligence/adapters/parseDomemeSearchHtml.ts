import { extractModelFromText, extractQuantityFromText } from '../normalizer'

export type DomemeSearchHit = {
  itemCode: string
  title: string
  supplierName: string
  wholesalePrice: number | null
  shippingFee: number
  listingUrl: string
}

function parseNumber(text: string | undefined | null): number | null {
  if (!text) return null
  const n = Number(text.replace(/,/g, '').trim())
  return Number.isFinite(n) ? n : null
}

function parseBlock(block: string, itemCode: string): DomemeSearchHit | null {
  const title =
    block.match(/class="main_cont_text1 b itemName[^"]*"[^>]*onClick="domeggookGo\(\d+\);">\s*([^<]+)/)?.[1]?.trim() ??
    block.match(/itemName[^>]*>\s*([^<]+)/)?.[1]?.trim()
  if (!title) return null

  const supplierName = (
    block.match(/title="([^"(]+)\([^)]+\)"/)?.[1]?.trim() ??
    block.match(/>\s*([^\s<(]+)\([^)]+\)<\/a>\s*<\/div>\s*<div class="image_bai/)?.[1]?.trim() ??
    '미입력'
  ).replace(/&nbsp;/g, '').trim() || '미입력'

  const priceFromAmt = parseNumber(
    block.match(/class="main_cont_text1[^"]*priceLg"[\s\S]{0,80}?<strong>([\d,]+)<\/strong>/)?.[1],
  )
  const shippingFee =
    parseNumber(block.match(/선결제[^0-9]*([\d,]+)\s*원/)?.[1]) ??
    parseNumber(block.match(/infoDeli[^>]*>[\s\S]{0,80}?<b>([\d,]+)<\/b>/)?.[1]) ??
    0

  return {
    itemCode,
    title,
    supplierName,
    wholesalePrice: priceFromAmt,
    shippingFee,
    listingUrl: `https://domeme.domeggook.com/s/${itemCode}`,
  }
}

/** 도매꾹(도매DB) supplyList 검색 HTML */
export function parseDomemeSearchHtml(html: string, max = 20): DomemeSearchHit[] {
  const seen = new Set<string>()
  const hits: DomemeSearchHit[] = []
  const parts = html.split(/itemInfo\((\d{5,12})\)/)
  for (let i = 1; i < parts.length && hits.length < max; i += 2) {
    const itemCode = parts[i]
    if (seen.has(itemCode)) continue
    const block = parts[i + 1] ?? ''
    const hit = parseBlock(block, itemCode)
    if (hit) {
      seen.add(itemCode)
      hits.push(hit)
    }
  }
  return hits
}

export function domemeHitToRaw(hit: DomemeSearchHit) {
  return {
    title: hit.title,
    model: extractModelFromText(hit.title),
    quantity: extractQuantityFromText(hit.title),
    supplierItemCode: hit.itemCode,
    sourceUrl: hit.listingUrl,
  }
}
