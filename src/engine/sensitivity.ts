import { feeRates, resolveFeePolicy } from './feeEngine'
import { calculateMargin } from './marginEngine'
import { clamp, won } from './money'
import type { MarginInput, MarginResult, RiskLevel } from './types'

export type SensitivityRow = {
  id: string
  label: string
  description: string
  contributionProfit: number
  delta: number
  marginRate: number | null
  risk: RiskLevel
}

type Scenario = {
  id: string
  label: string
  description: string
  apply: (input: MarginInput, baseline: MarginResult) => MarginInput
}

function feeBumpInput(input: MarginInput): MarginInput {
  const rates = feeRates(resolveFeePolicy(input), input.feeVatMode)
  return {
    ...input,
    customSalesFeeRate: rates.sales + 0.01,
    customPaymentFeeRate: input.customPaymentFeeRate ?? rates.payment,
  }
}

function buildScenarios(input: MarginInput): Scenario[] {
  const scenarios: Scenario[] = [
    {
      id: 'fee_plus_1pp',
      label: '수수료 +1%p',
      description: '판매·결제 수수료율을 1%p 올렸을 때',
      apply: (base) => feeBumpInput(base),
    },
    {
      id: 'discount_plus_5pp',
      label: '할인 +5%p',
      description: '할인율을 5%p 올렸을 때',
      apply: (base) => ({ ...base, discountRate: clamp(base.discountRate + 0.05, 0, 1) }),
    },
    {
      id: 'price_minus_5pp',
      label: '판매가 -5%',
      description: '판매가를 5% 낮췄을 때',
      apply: (base) => ({ ...base, listPrice: won(base.listPrice * 0.95) }),
    },
    {
      id: 'cost_plus_10pp',
      label: '원가 +10%',
      description: '상품 원가를 10% 올렸을 때',
      apply: (base) => ({ ...base, productCost: won(base.productCost * 1.1) }),
    },
  ]

  if (input.advertisingMode === 'PERCENT_OF_NET') {
    scenarios.push({
      id: 'ad_plus_5pp',
      label: '광고비 +5%p',
      description: '실매출 대비 광고비율을 5%p 올렸을 때',
      apply: (base) => ({ ...base, advertisingRate: clamp(base.advertisingRate + 0.05, 0, 1) }),
    })
  } else if (input.advertisingMode === 'PER_ORDER' && input.advertisingPerOrder > 0) {
    scenarios.push({
      id: 'ad_plus_1000',
      label: '개당 광고비 +₩1,000',
      description: '건당 광고비를 1,000원 올렸을 때',
      apply: (base) => ({ ...base, advertisingPerOrder: base.advertisingPerOrder + 1000 }),
    })
  }

  return scenarios
}

export function sensitivityAnalysis(input: MarginInput): SensitivityRow[] {
  const baseline = calculateMargin(input)
  return buildScenarios(input).map((scenario) => {
    const next = scenario.apply(input, baseline)
    const result = calculateMargin(next)
    return {
      id: scenario.id,
      label: scenario.label,
      description: scenario.description,
      contributionProfit: result.contributionProfit,
      delta: result.contributionProfit - baseline.contributionProfit,
      marginRate: result.marginRate,
      risk: result.risk,
    }
  })
}
