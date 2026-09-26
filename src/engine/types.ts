export const ENGINE_VERSION = '1.0.0' as const
export const POLICY_VERSION = '2026-11' as const

export const VAT_RATE = 0.1 as const

export type ChannelCode =
  | 'NAVER_SMARTSTORE'
  | 'COUPANG'
  | 'ELEVEN_ST'
  | 'GMARKET'
  | 'KAKAO'
  | 'OWN_STORE'
  | 'CUSTOM'

export type VerificationStatus = 'VERIFIED' | 'ESTIMATED' | 'USER_DEFINED' | 'EXPIRED' | 'UNKNOWN'

export type VatMode = 'INCLUDED' | 'EXCLUDED' | 'IGNORE'

export type RiskLevel = 'SAFE' | 'CAUTION' | 'DANGER' | 'LOSS'

export type AdMode = 'PER_ORDER' | 'PERCENT_OF_NET' | 'MONTHLY'

export type ShippingPayer = 'CUSTOMER' | 'SELLER' | 'FREE'

export type PromoBearer = 'SELLER' | 'PLATFORM' | 'SHARED' | 'UNKNOWN'

export type NpayGrade = 'MICRO' | 'SME1' | 'SME2' | 'SME3' | 'GENERAL'

export interface FeeComponent {
  code: string
  label: string
  rate: number
  fixedFee: number
  vatMode: VatMode
  verificationStatus: VerificationStatus
  sourceType: string
  sourceUrl?: string
  sourceReference: string
  effectiveFrom: string
  notes: string
}

export interface ChannelFeePolicy {
  channel: ChannelCode
  name: string
  channelType: string
  category: string
  components: FeeComponent[]
  lastVerified: string
  disclaimer: string
}

export interface MarginInput {
  listPrice: number
  productCost: number
  packagingCost: number
  shippingCost: number
  shippingPayer: ShippingPayer
  otherCost: number
  channel: ChannelCode
  customSalesFeeRate: number | null
  customPaymentFeeRate: number | null
  npayGrade: NpayGrade
  coupangCategoryRate: number
  elevenstRate: number
  gmarketRate: number
  kakaoRate: number
  priceVatMode: VatMode
  feeVatMode: VatMode
  discountRate: number
  couponAmount: number
  couponBearer: PromoBearer
  advertisingMode: AdMode
  advertisingPerOrder: number
  advertisingRate: number
  monthlyAdBudget: number
  expectedMonthlyUnits: number
  returnRate: number
  returnShippingCost: number
  discardRate: number
  targetMarginRate: number
  monthlyUnits: number
  monthlyFixedCost: number
  targetMonthlyProfit: number
  targetUnitProfit: number
}

export interface CostLine {
  key: string
  label: string
  amount: number
  shareOfList: number
  provenance?: {
    status: VerificationStatus
    detail: string
  }
}

export interface MarginResult {
  engineVersion: typeof ENGINE_VERSION
  policyVersion: typeof POLICY_VERSION
  listPrice: number
  grossListPrice: number | null
  priceVatAmount: number | null
  netSales: number
  sellerDiscount: number
  sellerCoupon: number
  sellerShipping: number
  salesFee: number
  paymentFee: number
  advertisingCost: number
  expectedReturnCost: number
  productCost: number
  packagingCost: number
  otherCost: number
  totalVariableCost: number
  contributionProfit: number
  marginRate: number | null
  costRate: number | null
  markupRate: number | null
  breakEvenPrice: number | null
  targetMarginPrice: number | null
  targetProfitPrice: number | null
  breakEvenRoas: number | null
  impliedRoas: number | null
  monthlyRevenue: number
  monthlyContribution: number
  monthlyOperatingProfit: number
  unitsForTargetMonthly: number | null
  dailyUnitsForTarget: number | null
  risk: RiskLevel
  costLines: CostLine[]
  warnings: string[]
  feePolicy: ChannelFeePolicy
}

export function emptyInput(): MarginInput {
  return {
    listPrice: 29900,
    productCost: 10000,
    packagingCost: 0,
    shippingCost: 3000,
    shippingPayer: 'SELLER',
    otherCost: 0,
    channel: 'NAVER_SMARTSTORE',
    customSalesFeeRate: null,
    customPaymentFeeRate: null,
    npayGrade: 'GENERAL',
    coupangCategoryRate: 0.108,
    elevenstRate: 0.11,
    gmarketRate: 0.13,
    kakaoRate: 0.1,
    priceVatMode: 'INCLUDED',
    feeVatMode: 'IGNORE',
    discountRate: 0,
    couponAmount: 0,
    couponBearer: 'SELLER',
    advertisingMode: 'PER_ORDER',
    advertisingPerOrder: 0,
    advertisingRate: 0,
    monthlyAdBudget: 0,
    expectedMonthlyUnits: 300,
    returnRate: 0,
    returnShippingCost: 6000,
    discardRate: 0,
    targetMarginRate: 0.3,
    monthlyUnits: 300,
    monthlyFixedCost: 0,
    targetMonthlyProfit: 5_000_000,
    targetUnitProfit: 8000,
  }
}
