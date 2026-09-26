export { ENGINE_VERSION, POLICY_VERSION, emptyInput } from './types'
export type {
  AdMode,
  ChannelCode,
  MarginInput,
  MarginResult,
  PromoBearer,
  RiskLevel,
  ShippingPayer,
  SmartstoreInflow,
  VatMode,
  VerificationStatus,
} from './types'
export { calculateMargin, compareChannels, priceLadder, validateInput } from './marginEngine'
export { channelLabel, COUPANG_CATEGORY_PRESETS, resolveFeePolicy, type CoupangCategoryPreset } from './feeEngine'
export { interpret, interpretChannels, riskLabel } from './interpret'
export { krw, pct, won } from './money'
