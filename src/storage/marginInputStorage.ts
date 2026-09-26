import { emptyInput, type ChannelCode, type MarginInput, type VatMode } from '../engine'

const STORAGE_KEY = 'margin-genie:input:v1'

const CHANNELS: ChannelCode[] = [
  'NAVER_SMARTSTORE',
  'COUPANG',
  'ELEVEN_ST',
  'GMARKET',
  'AUCTION',
  'KAKAO',
  'LOTTEON',
  'OWN_STORE',
  'CUSTOM',
]

const VAT_MODES: VatMode[] = ['INCLUDED', 'EXCLUDED', 'IGNORE']

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function asNumber(v: unknown, fallback: number): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : fallback
}

export function sanitizeMarginInput(parsed: unknown, fallback: MarginInput): MarginInput {
  if (!isRecord(parsed)) return fallback
  const base = emptyInput()
  const channel = parsed.channel
  return {
    ...base,
    ...parsed,
    listPrice: asNumber(parsed.listPrice, fallback.listPrice),
    productCost: asNumber(parsed.productCost, fallback.productCost),
    packagingCost: asNumber(parsed.packagingCost, fallback.packagingCost),
    shippingCost: asNumber(parsed.shippingCost, fallback.shippingCost),
    otherCost: asNumber(parsed.otherCost, fallback.otherCost),
    coupangCategoryRate: asNumber(parsed.coupangCategoryRate, base.coupangCategoryRate),
    elevenstRate: asNumber(parsed.elevenstRate, base.elevenstRate),
    gmarketRate: asNumber(parsed.gmarketRate, base.gmarketRate),
    auctionRate: asNumber(parsed.auctionRate, base.auctionRate),
    kakaoRate: asNumber(parsed.kakaoRate, base.kakaoRate),
    lotteonRate: asNumber(parsed.lotteonRate, base.lotteonRate),
    priceVatMode:
      typeof parsed.priceVatMode === 'string' && VAT_MODES.includes(parsed.priceVatMode as VatMode)
        ? (parsed.priceVatMode as VatMode)
        : base.priceVatMode,
    feeVatMode:
      typeof parsed.feeVatMode === 'string' && VAT_MODES.includes(parsed.feeVatMode as VatMode)
        ? (parsed.feeVatMode as VatMode)
        : base.feeVatMode,
    discountRate: asNumber(parsed.discountRate, base.discountRate),
    couponAmount: asNumber(parsed.couponAmount, base.couponAmount),
    advertisingPerOrder: asNumber(parsed.advertisingPerOrder, base.advertisingPerOrder),
    advertisingRate: asNumber(parsed.advertisingRate, base.advertisingRate),
    monthlyAdBudget: asNumber(parsed.monthlyAdBudget, base.monthlyAdBudget),
    expectedMonthlyUnits: asNumber(parsed.expectedMonthlyUnits, base.expectedMonthlyUnits),
    returnRate: asNumber(parsed.returnRate, base.returnRate),
    returnShippingCost: asNumber(parsed.returnShippingCost, base.returnShippingCost),
    discardRate: asNumber(parsed.discardRate, base.discardRate),
    targetMarginRate: asNumber(parsed.targetMarginRate, base.targetMarginRate),
    monthlyUnits: asNumber(parsed.monthlyUnits, base.monthlyUnits),
    monthlyFixedCost: asNumber(parsed.monthlyFixedCost, base.monthlyFixedCost),
    targetMonthlyProfit: asNumber(parsed.targetMonthlyProfit, base.targetMonthlyProfit),
    targetUnitProfit: asNumber(parsed.targetUnitProfit, base.targetUnitProfit),
    productName: typeof parsed.productName === 'string' ? parsed.productName.slice(0, 80) : fallback.productName,
    channel: typeof channel === 'string' && CHANNELS.includes(channel as ChannelCode) ? (channel as ChannelCode) : fallback.channel,
    customSalesFeeRate:
      parsed.customSalesFeeRate === null
        ? null
        : typeof parsed.customSalesFeeRate === 'number'
          ? parsed.customSalesFeeRate
          : base.customSalesFeeRate,
    customPaymentFeeRate:
      parsed.customPaymentFeeRate === null
        ? null
        : typeof parsed.customPaymentFeeRate === 'number'
          ? parsed.customPaymentFeeRate
          : base.customPaymentFeeRate,
  }
}

export function loadMarginInput(fallback: MarginInput): MarginInput {
  if (typeof localStorage === 'undefined') return fallback
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return fallback
    const parsed: unknown = JSON.parse(raw)
    if (!isRecord(parsed)) return fallback
    return sanitizeMarginInput(parsed, fallback)
  } catch {
    return fallback
  }
}

export function saveMarginInput(input: MarginInput): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(input))
  } catch {
    // quota exceeded or private mode — ignore
  }
}

export function clearMarginInput(): void {
  if (typeof localStorage === 'undefined') return
  localStorage.removeItem(STORAGE_KEY)
}
