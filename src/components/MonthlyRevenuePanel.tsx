import type { HTMLAttributes } from 'react'
import { krw, pct, type MarginInput, type MarginResult } from '../engine'

type MonthlyRevenuePanelProps = {
  input: MarginInput
  result: MarginResult
  channelRows?: MarginResult[]
  onMonthlyUnitsChange: (monthlyUnits: number) => void
}

export function MonthlyRevenuePanel({
  input,
  result,
  channelRows,
  onMonthlyUnitsChange,
}: MonthlyRevenuePanelProps) {
  const units = Math.max(0, input.monthlyUnits)

  return (
    <div className="rounded-3xl border border-line bg-paper p-6" data-testid="monthly-revenue-panel">
      <h3 className="text-sm font-semibold">월 수익 시뮬</h3>
      <p className="mt-1 text-xs text-black/50">
        개당 공헌이익 × 월 판매량으로 월 실매출·공헌이익을 추정합니다.
      </p>
      <label className="mt-4 block text-sm">
        <span className="font-medium">월 판매량 (개)</span>
        <input
          type="number"
          min={0}
          step={1}
          className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2.5 tabular-nums"
          value={units}
          onChange={(e) => onMonthlyUnitsChange(Math.max(0, Number(e.target.value) || 0))}
        />
      </label>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <Metric label="월 실매출" value={krw(result.monthlyRevenue)} />
        <Metric label="월 공헌이익" value={krw(result.monthlyContribution)} data-testid="monthly-contribution" />
        <Metric label="실마진율" value={pct(result.marginRate)} />
        <Metric label="마크업율 (원가 대비)" value={pct(result.markupRate)} data-testid="markup-rate" />
        {input.monthlyFixedCost > 0 ? (
          <Metric label="월 영업이익" value={krw(result.monthlyOperatingProfit)} />
        ) : null}
      </div>
      {channelRows && channelRows.length > 1 && units > 0 ? (
        <div className="mt-4 overflow-x-auto">
          <p className="mb-2 text-xs text-black/45">채널별 월 공헌이익 (동일 판매량 {units.toLocaleString('ko-KR')}개)</p>
          <table className="w-full min-w-[420px] text-left text-sm">
            <thead className="text-black/45">
              <tr>
                <th className="py-2">채널</th>
                <th>개당 공헌</th>
                <th>월 공헌</th>
                <th>실마진</th>
              </tr>
            </thead>
            <tbody>
              {[...channelRows]
                .sort((a, b) => b.monthlyContribution - a.monthlyContribution)
                .map((row) => (
                  <tr key={row.feePolicy.channel} className="border-t border-line">
                    <td className="py-2">{row.feePolicy.name}</td>
                    <td className="tabular-nums">{krw(row.contributionProfit)}</td>
                    <td className="tabular-nums">{krw(row.monthlyContribution)}</td>
                    <td>{pct(row.marginRate)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      ) : null}
      {input.advertisingMode === 'MONTHLY' && input.expectedMonthlyUnits !== units ? (
        <p className="mt-3 text-xs text-black/45">
          광고비(월 예산 ÷ 판매량)는 예상 월 판매량 {input.expectedMonthlyUnits.toLocaleString('ko-KR')}개 기준입니다.
        </p>
      ) : null}
    </div>
  )
}

function Metric({
  label,
  value,
  ...rest
}: { label: string; value: string } & HTMLAttributes<HTMLDivElement>) {
  return (
    <div {...rest}>
      <p className="text-xs opacity-70">{label}</p>
      <p className="text-xl font-semibold tabular-nums">{value}</p>
    </div>
  )
}