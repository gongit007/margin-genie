import { feeRates, resolveFeePolicy } from './feeEngine'
import { clamp, ratio, won } from './money'
import {
  ENGINE_VERSION,
  POLICY_VERSION,
  VAT_RATE,
  type CostLine,
  type MarginInput,
  type MarginResult,
  type RiskLevel,
  type VatMode,
} from './types'

function priceVatBreakdown(listPrice: number, mode: VatMode): { grossListPrice: number | null; priceVatAmount: number | null } {
  if (mode !== 'EXCLUDED') return { grossListPrice: null, priceVatAmount: null }
  const priceVatAmount = won(listPrice * VAT_RATE)
  return { grossListPrice: won(listPrice + priceVatAmount), priceVatAmount }
}

export function validateInput(input: MarginInput): string[] {
  const errors: string[] = []
  if (!(input.listPrice > 0)) errors.push('판매가는 0보다 커야 합니다.')
  if (input.productCost < 0) errors.push('원가는 0 이상이어야 합니다.')
  if (input.packagingCost < 0) errors.push('포장비는 0 이상이어야 합니다.')
  if (input.shippingCost < 0) errors.push('배송비는 0 이상이어야 합니다.')
  if (input.discountRate < 0 || input.discountRate > 1) errors.push('할인율은 0~100%여야 합니다.')
  if (input.returnRate < 0 || input.returnRate > 1) errors.push('반품률은 0~100%여야 합니다.')
  if (input.advertisingRate < 0 || input.advertisingRate > 1) errors.push('광고비율은 0~100%여야 합니다.')
  if (input.targetMarginRate < 0 || input.targetMarginRate >= 1) errors.push('목표 마진율은 0% 이상 100% 미만이어야 합니다.')
  return errors
}

function adCost(input: MarginInput, netSales: number): number {
  if (input.advertisingMode === 'PERCENT_OF_NET') {
    return won(netSales * input.advertisingRate)
  }
  if (input.advertisingMode === 'MONTHLY') {
    const units = Math.max(1, input.expectedMonthlyUnits)
    return won(input.monthlyAdBudget / units)
  }
  return won(input.advertisingPerOrder)
}

function sellerShipping(input: MarginInput): number {
  if (input.shippingPayer === 'CUSTOMER') return 0
  return won(input.shippingCost)
}

function expectedReturnCost(input: MarginInput): number {
  const perReturn = won(input.returnShippingCost + input.productCost * input.discardRate)
  return won(input.returnRate * perReturn)
}

type VariableParts = {
  productCost: number
  packagingCost: number
  sellerShipping: number
  otherCost: number
  expectedReturnCost: number
  salesFee: number
  paymentFee: number
  advertisingCost: number
}

function variableFromNet(
  input: MarginInput,
  netSales: number,
  rates: { sales: number; payment: number; fixed: number },
): VariableParts {
  const salesFee = won(netSales * rates.sales + rates.fixed)
  const paymentFee = won(netSales * rates.payment)
  return {
    productCost: won(input.productCost),
    packagingCost: won(input.packagingCost),
    sellerShipping: sellerShipping(input),
    otherCost: won(input.otherCost),
    expectedReturnCost: expectedReturnCost(input),
    salesFee,
    paymentFee,
    advertisingCost: adCost(input, netSales),
  }
}

function sumVariable(p: VariableParts): number {
  return (
    p.productCost +
    p.packagingCost +
    p.sellerShipping +
    p.otherCost +
    p.expectedReturnCost +
    p.salesFee +
    p.paymentFee +
    p.advertisingCost
  )
}

function sellerCouponAmount(input: MarginInput): number {
  if (input.couponAmount <= 0) return 0
  if (input.couponBearer === 'SELLER') return won(input.couponAmount)
  if (input.couponBearer === 'SHARED') return won(input.couponAmount * clamp(input.couponSellerShare, 0, 1))
  return 0
}

function netFromList(listPrice: number, input: MarginInput): { netSales: number; sellerDiscount: number; sellerCoupon: number } {
  const sellerDiscount = won(listPrice * clamp(input.discountRate, 0, 1))
  const sellerCoupon = sellerCouponAmount(input)
  const netSales = won(listPrice - sellerDiscount - sellerCoupon)
  return { netSales, sellerDiscount, sellerCoupon }
}

function riskLevel(profit: number, marginRate: number | null, target: number): RiskLevel {
  if (profit < 0) return 'LOSS'
  if (marginRate === null) return 'DANGER'
  if (marginRate < target * 0.5) return 'DANGER'
  if (marginRate < target) return 'CAUTION'
  return 'SAFE'
}

function solveListPrice(
  input: MarginInput,
  kind: 'zero' | 'margin' | 'unitProfit',
): number | null {
  const rates = feeRates(resolveFeePolicy(input), input.feeVatMode)
  const d = clamp(input.discountRate, 0, 1)
  const coupon = sellerCouponAmount(input)
  const adRate = input.advertisingMode === 'PERCENT_OF_NET' ? input.advertisingRate : 0
  const feeRate = rates.sales + rates.payment
  const m = kind === 'margin' ? input.targetMarginRate : 0
  const denom = (1 - d) * (1 - feeRate - adRate - m)
  if (denom <= 0.0001) return null

  const adFixed =
    input.advertisingMode === 'PER_ORDER'
      ? input.advertisingPerOrder
      : input.advertisingMode === 'MONTHLY'
        ? input.monthlyAdBudget / Math.max(1, input.expectedMonthlyUnits)
        : 0

  const extra = kind === 'unitProfit' ? input.targetUnitProfit : 0
  const fixed =
    input.productCost +
    input.packagingCost +
    sellerShipping(input) +
    input.otherCost +
    expectedReturnCost(input) +
    rates.fixed +
    adFixed +
    extra +
    coupon * (1 - feeRate - adRate - m)

  const price = fixed / denom
  if (!Number.isFinite(price) || price <= 0) return null
  return won(price)
}

export function calculateMargin(input: MarginInput): MarginResult {
  const feePolicy = resolveFeePolicy(input)
  const rates = feeRates(feePolicy, input.feeVatMode)
  const warnings = [...validateInput(input)]
  const { grossListPrice, priceVatAmount } = priceVatBreakdown(input.listPrice, input.priceVatMode)
  const { netSales, sellerDiscount, sellerCoupon } = netFromList(input.listPrice, input)

  if (netSales <= 0) warnings.push('할인·쿠폰 후 실매출이 0원 이하입니다.')
  if (input.productCost > input.listPrice) warnings.push('원가가 판매가보다 높습니다.')

  const parts = variableFromNet(input, Math.max(0, netSales), rates)
  const totalVariableCost = sumVariable(parts)
  const contributionProfit = won(netSales - totalVariableCost)
  const marginRate = netSales > 0 ? contributionProfit / netSales : null
  const costRate = netSales > 0 ? totalVariableCost / netSales : null
  const markupRate = input.productCost > 0 ? contributionProfit / input.productCost : null

  const breakEvenPrice = solveListPrice(input, 'zero')
  const targetMarginPrice = solveListPrice(input, 'margin')
  const targetProfitPrice = solveListPrice(input, 'unitProfit')

  const adForRoas = parts.advertisingCost
  const profitBeforeAd = contributionProfit + adForRoas
  const marginBeforeAds = netSales > 0 ? profitBeforeAd / netSales : 0
  const bepRoas = marginBeforeAds > 0 ? 1 / marginBeforeAds : null
  const impliedRoas = adForRoas > 0 ? netSales / adForRoas : null

  const units = Math.max(0, input.monthlyUnits)
  const monthlyRevenue = won(netSales * units)
  const monthlyContribution = won(contributionProfit * units)
  const monthlyOperatingProfit = won(monthlyContribution - input.monthlyFixedCost)

  const unitsForTargetMonthly =
    contributionProfit > 0 ? Math.ceil((input.targetMonthlyProfit + input.monthlyFixedCost) / contributionProfit) : null

  const costLines: CostLine[] = [
    line('product', '상품 원가', parts.productCost, input.listPrice),
    line('packaging', '포장비', parts.packagingCost, input.listPrice),
    line('shipping', '판매자 배송비', parts.sellerShipping, input.listPrice),
    {
      key: 'salesFee',
      label: '플랫폼 판매수수료',
      amount: parts.salesFee,
      shareOfList: ratio(parts.salesFee, input.listPrice),
      provenance: {
        status: feePolicy.components[0]?.verificationStatus ?? 'UNKNOWN',
        detail: feePolicy.components[0]?.sourceReference ?? '',
      },
    },
    {
      key: 'paymentFee',
      label: feePolicy.channel === 'NAVER_SMARTSTORE' ? 'Npay 수수료' : '결제수수료',
      amount: parts.paymentFee,
      shareOfList: ratio(parts.paymentFee, input.listPrice),
      provenance: {
        status: feePolicy.components.find((c) => c.code === 'npay' || c.code === 'payment_fee')?.verificationStatus ?? 'UNKNOWN',
        detail: feePolicy.components.find((c) => c.code === 'npay' || c.code === 'payment_fee')?.sourceReference ?? '',
      },
    },
    line('ads', '광고비', parts.advertisingCost, input.listPrice),
    line('return', '예상 반품 비용', parts.expectedReturnCost, input.listPrice),
    line('other', '기타 변동비', parts.otherCost, input.listPrice),
  ].filter((l) => l.amount !== 0 || ['product', 'salesFee'].includes(l.key))

  if (input.returnRate > 0) {
    warnings.push('반품 비용은 예상 반품률 기반 추정치입니다.')
  }
  if (feePolicy.components.some((c) => c.verificationStatus === 'ESTIMATED')) {
    warnings.push('일부 수수료는 추정치입니다. 판매자센터 요율을 확인하세요.')
  }
  if (input.priceVatMode === 'EXCLUDED') {
    warnings.push('판매가·원가는 VAT 별도(공급가) 기준으로 계산됩니다.')
  }
  if (input.feeVatMode === 'EXCLUDED') {
    warnings.push('모든 수수료 요율에 VAT 10%를 가산해 계산합니다.')
  } else if (input.feeVatMode === 'INCLUDED') {
    warnings.push('모든 수수료를 VAT 포함 요율로 해석합니다.')
  }

  return {
    engineVersion: ENGINE_VERSION,
    policyVersion: POLICY_VERSION,
    listPrice: won(input.listPrice),
    grossListPrice,
    priceVatAmount,
    netSales,
    sellerDiscount,
    sellerCoupon,
    sellerShipping: parts.sellerShipping,
    salesFee: parts.salesFee,
    paymentFee: parts.paymentFee,
    advertisingCost: parts.advertisingCost,
    expectedReturnCost: parts.expectedReturnCost,
    productCost: parts.productCost,
    packagingCost: parts.packagingCost,
    otherCost: parts.otherCost,
    totalVariableCost,
    contributionProfit,
    marginRate,
    costRate,
    markupRate,
    breakEvenPrice,
    targetMarginPrice,
    targetProfitPrice,
    breakEvenRoas: bepRoas,
    impliedRoas,
    monthlyRevenue,
    monthlyContribution,
    monthlyOperatingProfit,
    unitsForTargetMonthly,
    dailyUnitsForTarget: unitsForTargetMonthly ? unitsForTargetMonthly / 30 : null,
    risk: riskLevel(contributionProfit, marginRate, input.targetMarginRate),
    costLines,
    warnings,
    feePolicy,
  }
}

function line(key: string, label: string, amount: number, list: number): CostLine {
  return { key, label, amount, shareOfList: ratio(amount, list) }
}

export function priceLadder(input: MarginInput, prices: number[]): MarginResult[] {
  return prices.map((listPrice) => calculateMargin({ ...input, listPrice }))
}

export function compareChannels(input: MarginInput, channels: MarginInput['channel'][]): MarginResult[] {
  return channels.map((channel) => calculateMargin({ ...input, channel, customSalesFeeRate: channel === 'CUSTOM' ? input.customSalesFeeRate : null }))
}
