import { extractModelFromText, extractQuantityFromText } from '../normalizer'

export type DomeggookParsedListing = {
  itemCode: string
  title: string
  supplierName: string
  wholesalePrice: number | null
  shippingFee: number
  rankingScore: number | null
  manufacturer: string | null
  model: string | null
  quantity: number | null
  sourceUrl: string
}

function parseNumber(text: string | undefined | null): number | null {
  if (!text) return null
  const n = Number(text.replace(/,/g, '').trim())
  return Number.isFinite(n) ? n : null
}

function stripDomggookTitlePrefix(title: string): string {
  return title.replace(/^\[(?:도매꾹|도매매)\]\s*/, '').trim()
}

/** 도매꾹/도매매 상품 상세 HTML → Listing 필드 */
export function parseDomeggookHtml(html: string, itemCode: string): DomeggookParsedListing | null {
  const code = itemCode.trim()
  if (!code || !html.includes(code)) return null

  const ogTitle = html.match(/property="og:title"\s+content="([^"]+)"/)?.[1]
  const h1Title = html.match(/<h1[^>]*>\s*([^<]+)/)?.[1]?.trim()
  const rawTitle = h1Title ?? ogTitle
  if (!rawTitle) return null
  const title = stripDomggookTitlePrefix(rawTitle)

  const supplierFromSeller =
    html.match(/id="lInfoSellerId"[\s\S]{0,400}?<b>([^<]+)<\/b>/)?.[1]?.trim() ??
    html.match(/공급사명<\/th>\s*<td>([^<(]+)/)?.[1]?.trim()
  const supplierName = supplierFromSeller?.replace(/\s*\([^)]+\)\s*$/, '').trim() || '미입력'

  const wholesalePrice =
    parseNumber(html.match(/baseAmtDome\s*:\s*(\d+)/)?.[1]) ??
    parseNumber(html.match(/<table id="lBaseAmtTbl"[\s\S]{0,800}?<td>([\d,]+)<\/td>/)?.[1])

  const shippingText = html.match(/택배\s*([\d,]+)\s*원/)?.[1]
  const shippingFee = shippingText ? (parseNumber(shippingText) ?? 0) : html.includes('무료배송') ? 0 : 0

  const rankingScore = parseNumber(html.match(/class="rankInfoPopLayerPointTotal">([\d,]+)/)?.[1])

  const manufacturer =
    html.match(/제조사<\/label>\s*<div class="lTblCell">([^<]+)/)?.[1]?.trim() ??
    html.match(/제조사<\/th>\s*<td>([^<]+)/)?.[1]?.trim() ??
    null

  const model =
    html.match(/모델명<\/label>\s*<div class="lTblCell">([^<]+)/)?.[1]?.trim() ??
    extractModelFromText(title)
  const normalizedModel = model && model !== '해당없음' ? model : extractModelFromText(title)

  const quantity = extractQuantityFromText(title)

  return {
    itemCode: code,
    title,
    supplierName,
    wholesalePrice,
    shippingFee,
    rankingScore,
    manufacturer,
    model: normalizedModel,
    quantity,
    sourceUrl: `https://domeggook.com/${code}`,
  }
}

function encodingFromCharset(charset: string): string {
  const c = charset.toLowerCase()
  if (c === 'euc-kr' || c === 'cp949' || c === 'ks_c_5601-1987') return 'euc-kr'
  if (c === 'utf8') return 'utf-8'
  return c
}

export function decodeDomeggookBuffer(buffer: ArrayBuffer, contentType: string | null): string {
  const charset = /charset=([\w-]+)/i.exec(contentType ?? '')?.[1]?.toLowerCase() ?? 'euc-kr'
  try {
    return new TextDecoder(encodingFromCharset(charset)).decode(buffer)
  } catch {
    return new TextDecoder('utf-8').decode(buffer)
  }
}

/** 헤더 charset이 없으면 HTML meta charset을 본다 (도매꾹 UTF-8 / 도매매 EUC-KR 혼용) */
export function decodeHtmlBuffer(buffer: ArrayBuffer, contentType: string | null): string {
  const header = /charset=([\w-]+)/i.exec(contentType ?? '')?.[1]
  const peek = new TextDecoder('utf-8', { fatal: false }).decode(buffer.slice(0, 1200))
  const meta = /charset=["']?([\w-]+)/i.exec(peek)?.[1]
  return decodeDomeggookBuffer(buffer, `text/html; charset=${header ?? meta ?? 'euc-kr'}`)
}
