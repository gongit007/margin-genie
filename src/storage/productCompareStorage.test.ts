import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { emptyInput } from '../engine'
import { addProduct, clearProducts, listProducts, removeProduct } from './productCompareStorage'

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

describe('productCompareStorage', () => {
  beforeEach(() => {
    store.clear()
    mockLocalStorage()
    clearProducts()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('adds and lists products', () => {
    const saved = addProduct({ ...emptyInput(), productName: '테스트 상품' })
    expect(saved.input.productName).toBe('테스트 상품')
    expect(listProducts()).toHaveLength(1)
  })

  it('removes a product by id', () => {
    const saved = addProduct(emptyInput())
    removeProduct(saved.id)
    expect(listProducts()).toHaveLength(0)
  })
})
