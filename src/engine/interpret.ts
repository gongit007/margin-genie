import { calculateMargin } from './marginEngine'
import type { MarginInput, MarginResult, RiskLevel } from './types'

export function interpret(result: MarginResult, input: MarginInput): {
  headline: string
  body: string
  actions: string[]
} {
  const marginPct = result.marginRate === null ? null : result.marginRate * 100
  const targetPct = input.targetMarginRate * 100
  const topCosts = [...result.costLines].sort((a, b) => b.amount - a.amount).slice(0, 3)

  if (result.risk === 'LOSS') {
    return {
      headline: '현재 조건에서는 팔수록 손해가 납니다.',
      body: `개당 약 ${Math.abs(result.contributionProfit).toLocaleString('ko-KR')}원 손실입니다. 판매가 ${input.listPrice.toLocaleString('ko-KR')}원으로는 변동비를 못 덮습니다.`,
      actions: compact([
        result.breakEvenPrice ? `손익분기 판매가는 약 ${result.breakEvenPrice.toLocaleString('ko-KR')}원입니다.` : '',
        result.targetMarginPrice ? `목표 마진 ${targetPct.toFixed(0)}%라면 약 ${result.targetMarginPrice.toLocaleString('ko-KR')}원을 검토하세요.` : '',
        topCosts[0] ? `가장 큰 비용은 ${topCosts[0].label}입니다.` : '',
      ]),
    }
  }

  if (result.risk === 'DANGER') {
    return {
      headline: '마진 여유가 거의 없습니다.',
      body: `실마진율 ${fmt(marginPct)}로 목표 ${targetPct.toFixed(0)}%에 크게 못 미칩니다. 할인·광고·무료배송을 겹치면 바로 적자로 갈 수 있습니다.`,
      actions: compact([
        result.targetMarginPrice ? `목표 마진 가격 후보: ${result.targetMarginPrice.toLocaleString('ko-KR')}원` : '',
        '광고비 상한을 먼저 정하고 시나리오를 비교하세요.',
      ]),
    }
  }

  if (result.risk === 'CAUTION') {
    return {
      headline: '판매는 가능하지만 목표 마진에는 못 미칩니다.',
      body: `예상 실마진율 ${fmt(marginPct)} · 목표 ${targetPct.toFixed(0)}%보다 ${(targetPct - (marginPct ?? 0)).toFixed(1)}%p 낮습니다.`,
      actions: compact([
        result.targetMarginPrice ? `판매가를 ${result.targetMarginPrice.toLocaleString('ko-KR')}원 근처로 올려 보세요.` : '',
        topCosts[1] ? `그다음 비용은 ${topCosts[1].label}입니다.` : '',
      ]),
    }
  }

  return {
    headline: '현재 조건에서는 수익성이 양호합니다.',
    body: `예상 실마진율 ${fmt(marginPct)}로 목표 ${targetPct.toFixed(0)}%보다 ${((marginPct ?? 0) - targetPct).toFixed(1)}%p 높습니다. 다만 수수료는 정산 조건에 따라 달라질 수 있습니다.`,
    actions: compact([
      result.advertisingCost > 0 && result.breakEvenRoas
        ? `손익분기 ROAS는 약 ${result.breakEvenRoas.toFixed(2)}배입니다.`
        : '광고비를 넣으면 손익분기 ROAS를 같이 볼 수 있습니다.',
      topCosts[0] ? `비용 1위는 ${topCosts[0].label}입니다.` : '',
    ]),
  }
}

function fmt(n: number | null): string {
  if (n === null) return '—'
  return `${n.toFixed(1)}%`
}

function compact(items: string[]): string[] {
  return items.filter(Boolean)
}

export function riskLabel(level: RiskLevel): { text: string; className: string } {
  switch (level) {
    case 'SAFE':
      return { text: '판매 가능', className: 'bg-[#EAF8E6] text-[#1B5E20]' }
    case 'CAUTION':
      return { text: '주의', className: 'bg-[#FFF4CC] text-[#7A5B00]' }
    case 'DANGER':
      return { text: '위험', className: 'bg-[#FFE4C4] text-[#9A3B00]' }
    case 'LOSS':
      return { text: '역마진', className: 'bg-[#FDE8E8] text-[#9B1C1C]' }
  }
}
