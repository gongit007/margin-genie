import { compareChannels } from './marginEngine'
import { channelLabel } from './feeEngine'
import type { ChannelCode, MarginInput, MarginResult, RiskLevel } from './types'
import { calculateMargin } from './marginEngine'

export type ProductCompareMode = 'primary' | 'all_channels'

export type ProductCompareRow = {
  productId: string
  productName: string
  channel: ChannelCode
  channelLabel: string
  listPrice: number
  productCost: number
  monthlyUnits: number
  contributionProfit: number
  marginRate: number | null
  markupRate: number | null
  monthlyContribution: number
  breakEvenPrice: number | null
  risk: RiskLevel
}

export function buildProductCompareRows(
  products: { id: string; input: MarginInput }[],
  mode: ProductCompareMode,
  channels: ChannelCode[],
): ProductCompareRow[] {
  const rows: ProductCompareRow[] = []

  for (const product of products) {
    const name = product.input.productName.trim() || '이름 없음'

    if (mode === 'all_channels' && channels.length > 0) {
      for (const result of compareChannels(product.input, channels)) {
        rows.push(toRow(product.id, name, product.input, result))
      }
      continue
    }

    rows.push(toRow(product.id, name, product.input, calculateMargin(product.input)))
  }

  return rows.sort((a, b) => b.contributionProfit - a.contributionProfit)
}

function toRow(
  productId: string,
  productName: string,
  input: MarginInput,
  result: MarginResult,
): ProductCompareRow {
  return {
    productId,
    productName,
    channel: result.feePolicy.channel,
    channelLabel: channelLabel(result.feePolicy.channel),
    listPrice: result.listPrice,
    productCost: input.productCost,
    monthlyUnits: input.monthlyUnits,
    contributionProfit: result.contributionProfit,
    marginRate: result.marginRate,
    markupRate: result.markupRate,
    monthlyContribution: result.monthlyContribution,
    breakEvenPrice: result.breakEvenPrice,
    risk: result.risk,
  }
}
