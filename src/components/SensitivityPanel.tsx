import { krw, pct, riskLabel, sensitivityAnalysis, type MarginInput } from '../engine'

type SensitivityPanelProps = {
  input: MarginInput
}

export function SensitivityPanel({ input }: SensitivityPanelProps) {
  const rows = sensitivityAnalysis(input)
  if (!rows.length) return null

  return (
    <div className="mt-8 rounded-3xl border border-line bg-paper p-6" data-testid="sensitivity-panel">
      <h3 className="font-semibold">민감도 · What-if</h3>
      <p className="mt-1 text-xs text-black/50">현재 입력 기준으로 변수 하나씩 바꿨을 때 공헌이익 변화입니다.</p>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="text-black/45">
            <tr>
              <th className="py-2">시나리오</th>
              <th>공헌이익</th>
              <th>변화</th>
              <th>실마진</th>
              <th>판정</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-line">
                <td className="py-2">
                  <p className="font-medium">{row.label}</p>
                  <p className="text-xs text-black/45">{row.description}</p>
                </td>
                <td className="tabular-nums">{krw(row.contributionProfit)}</td>
                <td className={`tabular-nums ${row.delta < 0 ? 'text-red-700' : row.delta > 0 ? 'text-emerald-700' : ''}`}>
                  {row.delta > 0 ? '+' : ''}
                  {krw(row.delta)}
                </td>
                <td>{pct(row.marginRate)}</td>
                <td>{riskLabel(row.risk).text}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
