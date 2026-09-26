import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest'
import { emptyInput } from '../engine'
import { clearMarginInput, loadMarginInput, saveMarginInput } from './marginInputStorage'

const DEMO = { ...emptyInput(), listPrice: 89000, productCost: 32000 }

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

describe('marginInputStorage', () => {
  beforeEach(() => {
    store.clear()
    mockLocalStorage()
    clearMarginInput()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns fallback when nothing saved', () => {
    expect(loadMarginInput(DEMO)).toEqual(DEMO)
  })

  it('round-trips margin input', () => {
    saveMarginInput(DEMO)
    const loaded = loadMarginInput(emptyInput())
    expect(loaded.listPrice).toBe(89000)
    expect(loaded.productCost).toBe(32000)
  })

  it('ignores invalid channel and falls back', () => {
    localStorage.setItem('margin-genie:input:v1', JSON.stringify({ ...DEMO, channel: 'INVALID' }))
    const loaded = loadMarginInput(DEMO)
    expect(loaded.channel).toBe(DEMO.channel)
  })

  it('ignores corrupt json', () => {
    localStorage.setItem('margin-genie:input:v1', '{not json')
    expect(loadMarginInput(DEMO)).toEqual(DEMO)
  })

  it('handles save failure gracefully', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => null,
      setItem: () => {
        throw new Error('quota')
      },
      removeItem: () => {},
    })
    expect(() => saveMarginInput(DEMO)).not.toThrow()
  })
})
