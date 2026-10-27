import { describe, expect, it } from 'vitest'
import { DEMO_MY_PRODUCT } from './myProductStorage'
import { searchWholesaleCompetitors, searchWholesaleCompetitorsForProduct } from './wholesaleSearch'
import { isCompetitiveMatch } from './matchingEngine'

describe('searchWholesaleCompetitors', () => {
  it('returns only the selling platform (DOMAEMAE) for 63253617', () => {
    const result = searchWholesaleCompetitors('63253617')
    expect(result).not.toBeNull()
    expect(result!.anchor.supplierName).toBe('터치라이프')
    expect(result!.rows.every((r) => r.listing.platform === 'DOMAEMAE')).toBe(true)
    expect(result!.stats.byPlatform.DOMAEMAE).toBe(1)
    expect(result!.stats.byPlatform.DOMEGGOOK).toBe(0)
    expect(result!.stats.byPlatform.DOMETOPIA).toBe(0)
  })

  it('has no DOMAEMAE competitors besides anchor (터치라이프)', () => {
    const result = searchWholesaleCompetitors('63253617')!
    const domaeCompetitors = result.rows.filter(
      (r) => r.listing.platform === 'DOMAEMAE' && !r.listing.isAnchor,
    )
    expect(domaeCompetitors).toHaveLength(0)
  })

  it('includes anchor listing URL', () => {
    const result = searchWholesaleCompetitors('63253617')!
    const anchor = result.rows.find((r) => r.listing.isAnchor)
    expect(anchor?.listing.listingUrl).toContain('63253617')
  })

  it('does not treat anchor price as competitive min when no competitors', () => {
    const result = searchWholesaleCompetitors('63253617')!
    expect(result.stats.lowestEffective).toBeNull()
    const competitive = result.rows.filter((r) => r.match && isCompetitiveMatch(r.match.matchStatus))
    expect(competitive).toHaveLength(0)
  })
})

describe('searchWholesaleCompetitorsForProduct', () => {
  it('shows DOMEGGOOK competitors when product is on DOMEGGOOK', () => {
    const product = { ...DEMO_MY_PRODUCT, id: 'test-ggook', platform: 'DOMEGGOOK' as const, itemCode: '4455667' }
    const result = searchWholesaleCompetitorsForProduct(product)
    expect(result.rows.every((r) => r.listing.platform === 'DOMEGGOOK')).toBe(true)
    expect(result.rows.some((r) => r.listing.isAnchor)).toBe(true)
    expect(result.stats.byPlatform.DOMEGGOOK).toBeGreaterThan(1)
    expect(result.stats.byPlatform.DOMAEMAE).toBe(0)
  })
})
