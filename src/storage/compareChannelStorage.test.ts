import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defaultCompareChannels, loadCompareChannels, saveCompareChannels } from './compareChannelStorage'

const store = new Map<string, string>()

beforeEach(() => {
  store.clear()
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => store.set(key, value),
    removeItem: (key: string) => store.delete(key),
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('compareChannelStorage', () => {
  it('persists selected compare channels', () => {
    const selected = ['NAVER_SMARTSTORE', 'COUPANG'] as const
    saveCompareChannels([...selected])
    expect(loadCompareChannels()).toEqual([...selected])
  })

  it('returns defaults when storage empty', () => {
    expect(loadCompareChannels()).toEqual(defaultCompareChannels())
  })
})
