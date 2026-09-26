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
export { sensitivityAnalysis, type SensitivityRow } from './sensitivity'
export { channelLabel, COUPANG_CATEGORY_PRESETS, ELEVEN_ST_CATEGORY_PRESETS, GMARKET_CATEGORY_PRESETS, matchingCategoryPresetId, resolveFeePolicy, type CoupangCategoryPreset } from './feeEngine'
export { interpret, interpretChannels, riskLabel } from './interpret'
export { buildProductCompareRows, type ProductCompareMode, type ProductCompareRow } from './productCompare'
export { krw, pct, won } from './money'
