import { WHOLESALE_PLATFORM_LABELS } from './platformLabels'
import type { MyProduct, SupplierProduct, WholesalePlatformCode } from './types'

const STORAGE_KEY = 'margin-genie:my-products:v1'

const PLATFORMS: WholesalePlatformCode[] = ['DOMAEMAE', 'DOMEGGOOK', 'DOMETOPIA']

function newId(): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `mp_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function sanitizeProduct(raw: unknown): MyProduct | null {
  if (!isRecord(raw)) return null
  const platform = raw.platform
  if (typeof platform !== 'string' || !PLATFORMS.includes(platform as WholesalePlatformCode)) return null
  if (typeof raw.itemCode !== 'string' || !raw.itemCode.trim()) return null
  if (typeof raw.title !== 'string' || !raw.title.trim()) return null
  if (typeof raw.supplierName !== 'string') return null
  const id = typeof raw.id === 'string' ? raw.id : newId()
  const now = new Date().toISOString()
  return {
    id,
    platform: platform as WholesalePlatformCode,
    itemCode: raw.itemCode.trim(),
    supplierName: raw.supplierName.trim() || '미입력',
    title: raw.title.trim(),
    rankingScore: typeof raw.rankingScore === 'number' ? raw.rankingScore : null,
    wholesalePrice: typeof raw.wholesalePrice === 'number' ? raw.wholesalePrice : null,
    shippingFee: typeof raw.shippingFee === 'number' ? raw.shippingFee : 0,
    sourceUrl: typeof raw.sourceUrl === 'string' ? raw.sourceUrl : null,
    manufacturer: typeof raw.manufacturer === 'string' ? raw.manufacturer : undefined,
    model: typeof raw.model === 'string' ? raw.model : undefined,
    quantity: typeof raw.quantity === 'number' ? raw.quantity : undefined,
    createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : now,
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : now,
  }
}

export const DEMO_MY_PRODUCT: MyProduct = {
  id: 'demo-63253617',
  platform: 'DOMAEMAE',
  itemCode: '63253617',
  supplierName: '터치라이프',
  title: '플라스틱 너트 브라켓 1.7cm볼 고정 조임링10개입 T45-10',
  rankingScore: 5932,
  wholesalePrice: 3500,
  shippingFee: 0,
  sourceUrl: 'https://domeggook.com/63253617',
  manufacturer: 'TouchLife',
  model: 'T45',
  quantity: 10,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

export function loadMyProducts(): MyProduct[] {
  if (typeof localStorage === 'undefined') return [DEMO_MY_PRODUCT]
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return [DEMO_MY_PRODUCT]
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return [DEMO_MY_PRODUCT]
    const products = parsed.map(sanitizeProduct).filter((p): p is MyProduct => p !== null)
    return products.length ? products : [DEMO_MY_PRODUCT]
  } catch {
    return [DEMO_MY_PRODUCT]
  }
}

export function saveMyProducts(products: MyProduct[]): void {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(products))
}

export function addMyProduct(input: Omit<MyProduct, 'id' | 'createdAt' | 'updatedAt'>): MyProduct {
  const now = new Date().toISOString()
  const product: MyProduct = { ...input, id: newId(), createdAt: now, updatedAt: now }
  const list = loadMyProducts().filter((p) => !(p.platform === product.platform && p.itemCode === product.itemCode))
  saveMyProducts([product, ...list])
  return product
}

export function removeMyProduct(id: string): MyProduct[] {
  const next = loadMyProducts().filter((p) => p.id !== id)
  saveMyProducts(next.length ? next : [DEMO_MY_PRODUCT])
  return loadMyProducts()
}

/** 내 상품 목록에 실제 등록된 도매처 (중복 제거, 등록 순) */
export function myWholesalePlatforms(products: MyProduct[]): WholesalePlatformCode[] {
  const seen = new Set<WholesalePlatformCode>()
  const out: WholesalePlatformCode[] = []
  for (const p of products) {
    if (!seen.has(p.platform)) {
      seen.add(p.platform)
      out.push(p.platform)
    }
  }
  return out
}

export function myProductToSupplier(product: MyProduct): SupplierProduct {
  const platformLabel = WHOLESALE_PLATFORM_LABELS[product.platform]
  const url =
    product.sourceUrl ??
    (product.platform === 'DOMAEMAE' ? `https://domeggook.com/${product.itemCode}` : null)
  return {
    platform: product.platform,
    platformLabel,
    supplierName: product.supplierName,
    itemCode: product.itemCode,
    rankingScore: product.rankingScore,
    title: product.title,
    wholesalePrice: product.wholesalePrice,
    shippingFee: product.shippingFee,
    sourceUrl: url,
    capturedAt: new Date().toISOString(),
    listing: {
      title: product.title,
      manufacturer: product.manufacturer,
      model: product.model,
      quantity: product.quantity,
      supplierItemCode: product.itemCode,
      sourceUrl: url ?? undefined,
    },
  }
}
