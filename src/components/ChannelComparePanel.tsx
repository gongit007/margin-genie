import { channelLabel, krw, pct, riskLabel, type ChannelCode, type MarginResult } from '../engine'
import { downloadChannelCompareCsv } from '../export/channelCompareCsv'

type ChannelComparePanelProps = {
  rows: MarginResult[]
  allChannels?: ChannelCode[]
  selectedChannels?: ChannelCode[]
  onToggleChannel?: (code: ChannelCode) => void
}

export function ChannelComparePanel({ rows, allChannels, selectedChannels, onToggleChannel }: ChannelComparePanelProps) {
  if (!rows.length) return null
  const best = rows.reduce((a, b) => (a.contributionProfit > b.contributionProfit ? a : b))
  const showToggles = allChannels && selectedChannels && onToggleChannel

  return (
    <div className="mt-8 rounded-3xl border border-line bg-paper p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold">채널별 비교</h3>
          <p className="mt-1 text-xs text-black/50">동일 원가·판매가 조건에서 채널 수수료만 다릅니다.</p>
        </div>
        <button
          type="button"
          className="rounded-full border border-line px-3 py-1 text-xs font-medium hover:bg-canvas"
          onClick={() => downloadChannelCompareCsv(rows)}
        >
          CSV 내보내기
        </button>
      </div>
      {showToggles ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {allChannels.map((code) => {
            const on = selectedChannels.includes(code)
            return (
              <button
                key={code}
                type="button"
                className={`rounded-full border px-3 py-1 text-xs font-medium ${
                  on ? 'border-ink bg-ink text-white' : 'border-line text-black/45 hover:bg-canvas'
                }`}
                onClick={() => onToggleChannel(code)}
              >
                {channelLabel(code)}
              </button>
            )
          })}
        </div>
      ) : null}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="text-black/45">
            <tr>
              <th className="py-2">채널</th>
              <th>공헌이익</th>
              <th>실마진</th>
              <th>판매수수료</th>
              <th>손익분기</th>
              <th>판정</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const win = row.feePolicy.channel === best.feePolicy.channel
              return (
                <tr key={row.feePolicy.channel} className={win ? 'bg-brand/30 font-medium' : ''}>
                  <td className="py-2">
                    {row.feePolicy.name}
                    {win ? <span className="ml-2 text-xs text-black/45">최고</span> : null}
                  </td>
                  <td className="tabular-nums">{krw(row.contributionProfit)}</td>
                  <td>{pct(row.marginRate)}</td>
                  <td className="tabular-nums">{krw(row.salesFee + row.paymentFee)}</td>
                  <td className="tabular-nums">{row.breakEvenPrice ? krw(row.breakEvenPrice) : '—'}</td>
                  <td>{riskLabel(row.risk).text}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
