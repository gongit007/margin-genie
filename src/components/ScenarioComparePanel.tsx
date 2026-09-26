import { useMemo, useState } from 'react'
import { calculateMargin, krw, pct, riskLabel } from '../engine'
import { getScenario, listScenarios } from '../storage/scenarioStorage'

type ScenarioComparePanelProps = {
  refreshKey?: number
}

export function ScenarioComparePanel({ refreshKey = 0 }: ScenarioComparePanelProps) {
  const scenarios = listScenarios()
  const [aId, setAId] = useState(scenarios[0]?.id ?? '')
  const [bId, setBId] = useState(scenarios[1]?.id ?? '')

  const comparison = useMemo(() => {
    const a = aId ? getScenario(aId) : null
    const b = bId ? getScenario(bId) : null
    if (!a || !b) return null
    return {
      a: { name: a.name, result: calculateMargin(a.input) },
      b: { name: b.name, result: calculateMargin(b.input) },
    }
  }, [aId, bId, refreshKey])

  if (scenarios.length < 2) {
    return (
      <div className="mt-6 rounded-3xl border border-dashed border-line bg-paper p-6">
        <h3 className="panel-title">시나리오 비교</h3>
        <p className="mt-2 text-help">저장된 시나리오가 2개 이상이면 나란히 비교할 수 있습니다.</p>
      </div>
    )
  }

  const rows: { label: string; a: string; b: string }[] = comparison
    ? [
        { label: '판매가', a: krw(comparison.a.result.listPrice), b: krw(comparison.b.result.listPrice) },
        { label: '공헌이익', a: krw(comparison.a.result.contributionProfit), b: krw(comparison.b.result.contributionProfit) },
        { label: '실마진', a: pct(comparison.a.result.marginRate), b: pct(comparison.b.result.marginRate) },
        { label: '손익분기', a: comparison.a.result.breakEvenPrice ? krw(comparison.a.result.breakEvenPrice) : '—', b: comparison.b.result.breakEvenPrice ? krw(comparison.b.result.breakEvenPrice) : '—' },
        { label: '판정', a: riskLabel(comparison.a.result.risk).text, b: riskLabel(comparison.b.result.risk).text },
      ]
    : []

  return (
    <div className="mt-6 rounded-3xl border border-line bg-paper p-6">
      <h3 className="panel-title">시나리오 비교</h3>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <ScenarioSelect label="시나리오 A" value={aId} scenarios={scenarios} onChange={setAId} />
        <ScenarioSelect label="시나리오 B" value={bId} scenarios={scenarios} onChange={setBId} />
      </div>
      {comparison && aId !== bId ? (
        <table className="data-table mt-4">
          <thead>
            <tr>
              <th>항목</th>
              <th>{comparison.a.name}</th>
              <th>{comparison.b.name}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label}>
                <td className="text-muted">{row.label}</td>
                <td className="tabular-nums">{row.a}</td>
                <td className="tabular-nums">{row.b}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="mt-4 text-help">서로 다른 시나리오 2개를 선택하세요.</p>
      )}
    </div>
  )
}

function ScenarioSelect({
  label,
  value,
  scenarios,
  onChange,
}: {
  label: string
  value: string
  scenarios: ReturnType<typeof listScenarios>
  onChange: (id: string) => void
}) {
  return (
    <label className="block text-sm">
      <span className="field-label">{label}</span>
      <select className="input-field mt-1.5" value={value} onChange={(e) => onChange(e.target.value)}>
        {scenarios.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>
    </label>
  )
}
