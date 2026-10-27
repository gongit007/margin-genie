import type { SupplierProduct, WholesalePlatformCode } from './types'

const ANCHOR_LISTING = {
  title: '플라스틱 너트 브라켓 1.7cm볼 고정 조임링10개입 T45-10',
  manufacturer: 'TouchLife',
  brand: '터치라이프',
  model: 'T45',
  dimension: '1.7cm',
  quantity: 10,
  color: 'Black',
  material: 'Plastic',
  supplierItemCode: '63253617',
}

const DOMAEMAE_ANCHOR: SupplierProduct = {
  platform: 'DOMAEMAE',
  platformLabel: '도매매',
  supplierName: '터치라이프',
  itemCode: '63253617',
  rankingScore: 5932,
  title: ANCHOR_LISTING.title,
  wholesalePrice: 3500,
  shippingFee: 0,
  sourceUrl: 'https://domeggook.com/63253617',
  capturedAt: new Date().toISOString(),
  listing: { ...ANCHOR_LISTING, sourceUrl: 'https://domeggook.com/63253617' },
}

/** 도매매 상품번호 lookup (stub) */
export function lookupWholesaleAnchor(platform: WholesalePlatformCode, itemCode: string): SupplierProduct | null {
  const key = itemCode.trim()
  if (platform === 'DOMAEMAE' && key === '63253617') return DOMAEMAE_ANCHOR
  return null
}

export function lookupDomemeProduct(itemCode: string): SupplierProduct | null {
  return lookupWholesaleAnchor('DOMAEMAE', itemCode)
}
