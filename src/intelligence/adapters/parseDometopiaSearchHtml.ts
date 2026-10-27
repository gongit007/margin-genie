import { extractModelFromText, extractQuantityFromText } from '../normalizer'

export type DometopiaSearchHit = {
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

function decodeGoodsInfo(b64: string): { title?: string; price?: string; shipping?: string } | null {
  try {
    const binary = atob(b64)
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0))
    const json = JSON.parse(new TextDecoder('utf-8').decode(bytes)) as Record<string, unknown>
    return {
      title: typeof json.goods_name === 'string' ? json.goods_name : undefined,
      price: typeof json.price === 'string' ? json.price : undefined,
      shipping: typeof json.goods_shipping_price === 'string' ? json.goods_shipping_price : undefined,
    }
  } catch {
    return null
  }
}

/** 도매토피아 goods/search 결과 HTML */
export function parseDometopiaSearchHtml(html: string, max = 20): DometopiaSearchHit[] {
  if (html.includes('sch_void') && !html.includes('goodsDisplayItemWrap')) return []

  const hits: DometopiaSearchHit[] = []
  const blocks = html.split(/<dl class="goodsDisplayItemWrap"/)
  for (let i = 1; i < blocks.length && hits.length < max; i++) {
    const block = blocks[i]
    const itemCode = block.match(/goods\/view\?no=(\d+)/)?.[1]
    if (!itemCode) continue

    const info = block.match(/goodsInfo="([^"]+)"/)?.[1]
    const decoded = info ? decodeGoodsInfo(info) : null

    const title =
      decoded?.title ??
      block.match(/<h6[^>]*>([^<]+)<\/h6>/)?.[1]?.trim() ??
      ''
    if (!title) continue

    const wholesalePrice =
      parseNumber(decoded?.price) ??
      parseNumber(block.match(/class\s*=\s*"price_num"[\s\S]{0,60}?>([\d,]+)/)?.[1])

    const shippingFee = parseNumber(decoded?.shipping) ?? 0

    hits.push({
      itemCode,
      title,
      supplierName: '도매토피아',
      wholesalePrice,
      shippingFee,
      listingUrl: `https://www.dometopia.com/goods/view?no=${itemCode}`,
    })
  }
  return hits
}

export function dometopiaHitToRaw(hit: DometopiaSearchHit) {
  return {
    title: hit.title,
    model: extractModelFromText(hit.title),
    quantity: extractQuantityFromText(hit.title),
    supplierItemCode: hit.itemCode,
    sourceUrl: hit.listingUrl,
  }
}
