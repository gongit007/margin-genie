import { describe, expect, it } from 'vitest'
import { calculateMargin, emptyInput } from './index'
import { buildProductCompareRows } from './productCompare'

describe('markup and monthly revenue', () => {
  it('computes markup as contribution profit over product cost', () => {
    const input = { ...emptyInput(), listPrice: 30000, productCost: 10000, monthlyUnits: 100 }
    const result = calculateMargin(input)
    expect(result.contributionProfit).toBeGreaterThan(0)
    expect(result.markupRate).toBeCloseTo(result.contributionProfit / input.productCost, 5)
  })

  it('computes monthly revenue and contribution from units', () => {
    const input = { ...emptyInput(), listPrice: 20000, productCost: 8000, monthlyUnits: 50 }
    const result = calculateMargin(input)
    expect(result.monthlyRevenue).toBe(result.netSales * 50)
    expect(result.monthlyContribution).toBe(result.contributionProfit * 50)
  })
})

describe('buildProductCompareRows', () => {
  it('sorts products by contribution profit descending', () => {
    const high = { ...emptyInput(), productName: 'High', listPrice: 50000, productCost: 10000 }
    const low = { ...emptyInput(), productName: 'Low', listPrice: 15000, productCost: 10000 }
    const rows = buildProductCompareRows(
      [
        { id: 'a', input: low },
        { id: 'b', input: high },
      ],
      'primary',
      [],
    )
    expect(rows[0].productName).toBe('High')
    expect(rows[1].productName).toBe('Low')
  })

  it('expands to all compare channels when requested', () => {
    const input = { ...emptyInput(), productName: 'One', listPrice: 30000, productCost: 10000 }
    const rows = buildProductCompareRows([{ id: 'x', input }], 'all_channels', ['NAVER_SMARTSTORE', 'COUPANG'])
    expect(rows).toHaveLength(2)
    expect(rows.map((r) => r.channel)).toEqual(expect.arrayContaining(['NAVER_SMARTSTORE', 'COUPANG']))
  })
})
