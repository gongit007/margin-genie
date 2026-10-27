import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest'
import {
  addMyProduct,
  loadMyProducts,
  myProductToSupplier,
  removeMyProduct,
  saveMyProducts,
  DEMO_MY_PRODUCT,
} from './myProductStorage'

const store = new Map<string, string>()

function mockLocalStorage() {
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => {
      store.set(k, v)
    },
    removeItem: (k: string) => {
      store.delete(k)
    },
  })
}

describe('myProductStorage', () => {
  beforeEach(() => {
    store.clear()
    mockLocalStorage()
    saveMyProducts([DEMO_MY_PRODUCT])
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('loads demo product by default', () => {
    const list = loadMyProducts()
    expect(list.some((p) => p.itemCode === '63253617')).toBe(true)
  })

  it('adds and removes products', () => {
    addMyProduct({
      platform: 'DOMAEMAE',
      itemCode: '99999',
      supplierName: '테스트',
      title: '테스트 상품',
      rankingScore: null,
      wholesalePrice: 1000,
      shippingFee: 0,
      sourceUrl: null,
    })
    expect(loadMyProducts().some((p) => p.itemCode === '99999')).toBe(true)
    const added = loadMyProducts().find((p) => p.itemCode === '99999')!
    removeMyProduct(added.id)
    expect(loadMyProducts().some((p) => p.itemCode === '99999')).toBe(false)
  })

  it('converts to supplier product', () => {
    const supplier = myProductToSupplier(DEMO_MY_PRODUCT)
    expect(supplier.itemCode).toBe('63253617')
    expect(supplier.listing.title).toContain('T45')
  })
})
