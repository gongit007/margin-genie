import { extractModelFromText, extractQuantityFromText } from '../normalizer'

export type DomeggookSearchHit = {
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

/** 도매꾹/도매매 검색 결과 HTML (itemList.php) → 상품 후보 */
export function parseDomeggookSearchHtml(html: string, max = 20): DomeggookSearchHit[] {
  const hits: DomeggookSearchHit[] = []
  const blocks = html.split(/<li\s+id="li(\d{5,12})"/i)
  for (let i = 1; i < blocks.length && hits.length < max; i += 2) {
    const itemCode = blocks[i]
    const block = blocks[i + 1] ?? ''
    const title =
      block.match(/class="title"[^>]*>([^<]+)</)?.[1]?.trim() ??
      block.match(/<a[^>]*class="title"[^>]*>([^<]+)</)?.[1]?.trim()
    if (!title) continue

    const supplierName =
      block.match(/class="seller"[\s\S]{0,400}?<a[^>]*>([^<]+)</)?.[1]?.trim() ?? '미입력'

    const wholesalePrice = parseNumber(block.match(/class="amt"[\s\S]{0,120}?<b>([\d,]+)<\/b>/)?.[1])
    const shippingFee =
      parseNumber(block.match(/infoDeli[^>]*>[\s\S]{0,80}?<b>([\d,]+)<\/b>/)?.[1]) ??
      (block.includes('무료배송') ? 0 : 0)

    hits.push({
      itemCode,
      title,
      supplierName,
      wholesalePrice,
      shippingFee,
      listingUrl: `https://domeggook.com/${itemCode}`,
    })
  }
  return hits
}

export function domeggookHitToRaw(hit: DomeggookSearchHit) {
  return {
    title: hit.title,
    model: extractModelFromText(hit.title),
    quantity: extractQuantityFromText(hit.title),
    supplierItemCode: hit.itemCode,
    sourceUrl: hit.listingUrl,
  }
}
