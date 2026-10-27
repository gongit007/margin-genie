import { describe, expect, it } from 'vitest'
import { DEMO_MY_PRODUCT } from './myProductStorage'
import {
  retailCompetitorRows,
  retailMyListingRows,
  searchRetailListingsStub,
} from './retailSearch'

describe('searchRetailListingsStub', () => {
  it('returns rows for smartstore and coupang only', () => {
    const result = searchRetailListingsStub(DEMO_MY_PRODUCT)
    expect(result.rows.every((r) => ['NAVER_SMARTSTORE', 'COUPANG'].includes(r.listing.marketplace))).toBe(true)
    expect(result.stats.byMarketplace.NAVER_SMARTSTORE).toBeGreaterThan(0)
    expect(result.stats.byMarketplace.COUPANG).toBeGreaterThan(0)
    expect(result.stats.byMarketplace.KAKAO).toBe(0)
    expect(result.source).toBe('stub')
  })

  it('separates my listings from market competitors', () => {
    const result = searchRetailListingsStub(DEMO_MY_PRODUCT)
    expect(result.stats.myListingCount).toBeGreaterThan(0)
    expect(result.stats.competitorCount).toBeGreaterThan(0)
    expect(retailMyListingRows(result).every((r) => r.listing.isMine)).toBe(true)
    expect(retailCompetitorRows(result).every((r) => !r.listing.isMine)).toBe(true)
  })

  it('computes competitor lowest price excluding my listings', () => {
    const result = searchRetailListingsStub(DEMO_MY_PRODUCT)
    expect(result.stats.lowestEffective).not.toBeNull()
    const minePrices = retailMyListingRows(result)
      .map((r) => r.listing.effectivePrice)
      .filter((p): p is number => p != null)
    if (result.stats.lowestEffective != null && minePrices.length) {
      expect(minePrices.includes(result.stats.lowestEffective)).toBe(false)
    }
  })
})
