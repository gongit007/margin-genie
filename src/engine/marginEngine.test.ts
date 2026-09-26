import { describe, expect, it } from 'vitest'
import { emptyInput } from './types'
import { calculateMargin, compareChannels } from './marginEngine'
import { resolveFeePolicy } from './feeEngine'

describe('margin engine', () => {
  it('matches the simple 10% fee example', () => {
    const result = calculateMargin({
      ...emptyInput(),
      channel: 'CUSTOM',
      customSalesFeeRate: 0.1,
      customPaymentFeeRate: 0,
      shippingPayer: 'SELLER',
      shippingCost: 3000,
      productCost: 10000,
      listPrice: 29900,
      advertisingMode: 'PER_ORDER',
      advertisingPerOrder: 2000,
      packagingCost: 0,
      otherCost: 0,
      discountRate: 0,
      couponAmount: 0,
      returnRate: 0,
    })
    expect(result.salesFee).toBe(2990)
    expect(result.contributionProfit).toBe(11910)
    expect(result.marginRate).toBeCloseTo(11910 / 29900, 6)
    expect(result.engineVersion).toBe('1.0.0')
  })

  it('flags negative margin when cost exceeds price', () => {
    const result = calculateMargin({
      ...emptyInput(),
      channel: 'CUSTOM',
      customSalesFeeRate: 0,
      listPrice: 10000,
      productCost: 15000,
      shippingCost: 0,
      advertisingPerOrder: 0,
    })
    expect(result.contributionProfit).toBeLessThan(0)
    expect(result.risk).toBe('LOSS')
    expect(result.warnings.some((w) => w.includes('원가'))).toBe(true)
  })

  it('is deterministic', () => {
    const input = emptyInput()
    const a = calculateMargin(input)
    const b = calculateMargin(input)
    expect(a).toEqual(b)
  })

  it('solves break-even above variable costs', () => {
    const input = {
      ...emptyInput(),
      channel: 'CUSTOM' as const,
      customSalesFeeRate: 0.1,
      customPaymentFeeRate: 0,
      advertisingPerOrder: 0,
      discountRate: 0,
      returnRate: 0,
    }
    const result = calculateMargin(input)
    expect(result.breakEvenPrice).not.toBeNull()
    const atBep = calculateMargin({ ...input, listPrice: result.breakEvenPrice! })
    expect(Math.abs(atBep.contributionProfit)).toBeLessThanOrEqual(2)
  })

  it('zero selling price is invalid', () => {
    const result = calculateMargin({ ...emptyInput(), listPrice: 0 })
    expect(result.warnings.some((w) => w.includes('판매가'))).toBe(true)
  })

  it('applies smartstore verified sales and npay fees', () => {
    const input = { ...emptyInput(), listPrice: 100000, productCost: 30000, discountRate: 0, advertisingPerOrder: 0 }
    const policy = resolveFeePolicy(input)
    expect(policy.components.some((c) => c.verificationStatus === 'VERIFIED')).toBe(true)
    const result = calculateMargin(input)
    expect(result.salesFee).toBeGreaterThan(0)
    expect(result.paymentFee).toBeGreaterThan(0)
    expect(result.feePolicy.channel).toBe('NAVER_SMARTSTORE')
  })

  it('reduces net sales with seller discount and coupon', () => {
    const base = {
      ...emptyInput(),
      listPrice: 50000,
      productCost: 10000,
      discountRate: 0,
      couponAmount: 0,
      advertisingPerOrder: 0,
      channel: 'CUSTOM' as const,
      customSalesFeeRate: 0,
    }
    const plain = calculateMargin(base)
    const discounted = calculateMargin({ ...base, discountRate: 0.2 })
    const coupon = calculateMargin({ ...base, couponAmount: 5000, couponBearer: 'SELLER' as const })

    expect(discounted.netSales).toBe(40000)
    expect(coupon.netSales).toBe(45000)
    expect(discounted.contributionProfit).toBeLessThan(plain.contributionProfit)
  })

  it('warns when discount wipes out net sales', () => {
    const result = calculateMargin({
      ...emptyInput(),
      listPrice: 10000,
      discountRate: 1,
      channel: 'CUSTOM',
      customSalesFeeRate: 0,
    })
    expect(result.warnings.some((w) => w.includes('실매출'))).toBe(true)
  })

  it('compares channels with different fee structures', () => {
    const input = {
      ...emptyInput(),
      listPrice: 89000,
      productCost: 32000,
      shippingCost: 3000,
      packagingCost: 1500,
      advertisingMode: 'PERCENT_OF_NET' as const,
      advertisingRate: 0.06,
    }
    const rows = compareChannels(input, ['NAVER_SMARTSTORE', 'COUPANG', 'ELEVEN_ST'])
    expect(rows).toHaveLength(3)
    expect(new Set(rows.map((r) => r.contributionProfit)).size).toBeGreaterThan(1)
  })

  it('solves target margin price above break-even', () => {
    const input = {
      ...emptyInput(),
      channel: 'CUSTOM' as const,
      customSalesFeeRate: 0.08,
      customPaymentFeeRate: 0,
      listPrice: 50000,
      productCost: 15000,
      targetMarginRate: 0.25,
      advertisingPerOrder: 0,
      discountRate: 0,
    }
    const result = calculateMargin(input)
    expect(result.targetMarginPrice).not.toBeNull()
    expect(result.breakEvenPrice).not.toBeNull()
    expect(result.targetMarginPrice!).toBeGreaterThan(result.breakEvenPrice!)

    const atTarget = calculateMargin({ ...input, listPrice: result.targetMarginPrice! })
    expect(atTarget.marginRate).not.toBeNull()
    expect(atTarget.marginRate!).toBeCloseTo(0.25, 2)
  })

  it('calculates own store with default pg fee', () => {
    const result = calculateMargin({
      ...emptyInput(),
      channel: 'OWN_STORE',
      listPrice: 50000,
      productCost: 15000,
      advertisingPerOrder: 0,
      customSalesFeeRate: null,
      customPaymentFeeRate: null,
    })
    expect(result.feePolicy.channel).toBe('OWN_STORE')
    expect(result.paymentFee).toBeGreaterThan(0)
    expect(result.salesFee).toBe(0)
  })

  it('returns null target price when fees exceed capacity', () => {
    const result = calculateMargin({
      ...emptyInput(),
      channel: 'CUSTOM',
      customSalesFeeRate: 0.5,
      customPaymentFeeRate: 0.4,
      targetMarginRate: 0.2,
      advertisingMode: 'PERCENT_OF_NET',
      advertisingRate: 0.1,
      listPrice: 50000,
    })
    expect(result.targetMarginPrice).toBeNull()
    expect(result.breakEvenPrice).toBeNull()
  })
})
