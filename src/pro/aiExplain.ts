import { ENGINE_VERSION, POLICY_VERSION, riskLabel, type ChannelCode, type MarginInput, type MarginResult } from '../engine'
import { interpret, interpretChannels } from '../engine/interpret'
import type { SensitivityRow } from '../engine/sensitivity'

export type AiExplainSection = {
  title: string
  paragraphs: string[]
  bullets: string[]
}

export type AiExplanation = {
  generatedAt: string
  engineVersion: typeof ENGINE_VERSION
  policyVersion: typeof POLICY_VERSION
  summary: string
  sections: AiExplainSection[]
  followUps: string[]
  disclaimer: string
}

type ExplainContext = {
  input: MarginInput
  result: MarginResult
  channelRows: MarginResult[]
  activeChannel: ChannelCode
  sensitivityRows: SensitivityRow[]
}

function pct(n: number | null): string {
  if (n === null || !Number.isFinite(n)) return '—'
  return `${(n * 100).toFixed(1)}%`
}

function won(n: number): string {
  return `${n.toLocaleString('ko-KR')}원`
}

export function buildAiExplanation(ctx: ExplainContext): AiExplanation {
  const { input, result, channelRows, activeChannel, sensitivityRows } = ctx
  const base = interpret(result, input)
  const channelInsight = channelRows.length >= 2 ? interpretChannels(channelRows, activeChannel) : null
  const topCosts = [...result.costLines].sort((a, b) => b.amount - a.amount).slice(0, 3)
  const worstSensitivity = [...sensitivityRows].sort((a, b) => a.delta - b.delta)[0] ?? null
  const bestChannel = channelRows.length
    ? [...channelRows].sort((a, b) => b.contributionProfit - a.contributionProfit)[0]
    : null

  const summaryParts = [base.headline]
  if (channelInsight && bestChannel && bestChannel.feePolicy.channel !== activeChannel) {
    summaryParts.push(`${bestChannel.feePolicy.name} 채널이 더 유리합니다.`)
  }
  if (worstSensitivity && worstSensitivity.delta < 0) {
    summaryParts.push(`${worstSensitivity.label} 시나리오에서 ${won(Math.abs(worstSensitivity.delta))} 악화됩니다.`)
  }

  const sections: AiExplainSection[] = [
    {
      title: '마진 판정',
      paragraphs: [base.body],
      bullets: base.actions,
    },
    {
      title: '비용 구조',
      paragraphs: [
        `판매가 ${won(result.listPrice)} 기준 실매출은 ${won(result.netSales)}이며, 변동비 합계는 ${won(result.totalVariableCost)}입니다.`,
      ],
      bullets: topCosts.map(
        (line) => `${line.label} ${won(line.amount)} · 매출 대비 ${(line.shareOfList * 100).toFixed(1)}%`,
      ),
    },
  ]

  if (channelInsight) {
    sections.push({
      title: '채널 전략',
      paragraphs: [channelInsight.body],
      bullets: channelInsight.actions,
    })
  }

  if (result.advertisingCost > 0 || result.breakEvenRoas !== null) {
    sections.push({
      title: '광고·ROAS',
      paragraphs: [
        result.breakEvenRoas
          ? `광고비 포함 기준 손익분기 ROAS는 ${result.breakEvenRoas.toFixed(2)}배입니다.`
          : '광고비를 넣으면 손익분기 ROAS를 함께 확인할 수 있습니다.',
      ],
      bullets: compact([
        result.impliedRoas ? `현재 추정 ROAS ${result.impliedRoas.toFixed(2)}배` : '',
        result.advertisingCost > 0 ? `개당 광고비 ${won(result.advertisingCost)}` : '',
      ]),
    })
  }

  if (worstSensitivity) {
    sections.push({
      title: '민감도 What-if',
      paragraphs: [`가장 불리한 변수는 "${worstSensitivity.label}"입니다.`],
      bullets: sensitivityRows.slice(0, 4).map(
        (row) => `${row.label}: 공헌이익 ${won(row.contributionProfit)} (${row.delta >= 0 ? '+' : ''}${won(row.delta)})`,
      ),
    })
  }

  sections.push({
    title: '엔진 근거',
    paragraphs: [
      `판정 ${riskLabel(result.risk).text} · 실마진 ${pct(result.marginRate)} · 목표 ${(input.targetMarginRate * 100).toFixed(0)}%`,
      `수수료 출처: ${result.feePolicy.components.map((c) => `${c.label}(${c.verificationStatus})`).join(', ')}`,
    ],
    bullets: result.warnings.slice(0, 3),
  })

  const followUps = compact([
    result.targetMarginPrice ? `목표 마진 가격 ${won(result.targetMarginPrice)} 검토` : '',
    result.breakEvenPrice ? `손익분기 ${won(result.breakEvenPrice)} 이상 유지` : '',
    bestChannel && bestChannel.feePolicy.channel !== activeChannel
      ? `${bestChannel.feePolicy.name} 채널 시나리오 저장`
      : '',
    '할인·쿠폰 겹침은 프로모션 시뮬에서 확인',
  ])

  return {
    generatedAt: new Date().toISOString(),
    engineVersion: ENGINE_VERSION,
    policyVersion: POLICY_VERSION,
    summary: summaryParts.join(' '),
    sections,
    followUps,
    disclaimer: 'AI 설명은 엔진 계산 결과를 해석한 것이며, 세무·투자·정산 확정값이 아닙니다.',
  }
}

function compact(items: string[]): string[] {
  return items.filter(Boolean)
}

export function previewAiExplanation(ctx: ExplainContext): Pick<AiExplanation, 'summary' | 'sections'> {
  const full = buildAiExplanation(ctx)
  return {
    summary: full.summary,
    sections: full.sections.slice(0, 1),
  }
}
