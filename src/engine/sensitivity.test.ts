import { describe, expect, it } from 'vitest'
import { emptyInput } from './types'
import { sensitivityAnalysis } from './sensitivity'

describe('sensitivityAnalysis', () => {
  it('returns negative deltas when costs rise', () => {
    const input = {
      ...emptyInput(),
      listPrice: 50000,
      productCost: 15000,
      channel: 'CUSTOM' as const,
      customSalesFeeRate: 0.08,
      customPaymentFeeRate: 0,
      advertisingPerOrder: 0,
    }
    const rows = sensitivityAnalysis(input)
    const fee = rows.find((row) => row.id === 'fee_plus_1pp')
    const cost = rows.find((row) => row.id === 'cost_plus_10pp')
    expect(fee?.delta).toBeLessThan(0)
    expect(cost?.delta).toBeLessThan(0)
  })

  it('includes ad scenario for percent-of-net mode', () => {
    const input = {
      ...emptyInput(),
      listPrice: 50000,
      productCost: 15000,
      advertisingMode: 'PERCENT_OF_NET' as const,
      advertisingRate: 0.05,
      channel: 'CUSTOM' as const,
      customSalesFeeRate: 0,
    }
    const rows = sensitivityAnalysis(input)
    expect(rows.some((row) => row.id === 'ad_plus_5pp')).toBe(true)
  })
})
