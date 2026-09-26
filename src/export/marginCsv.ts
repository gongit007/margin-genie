import { channelLabel, type MarginInput, type MarginResult } from '../engine'

function esc(v: string | number | null | undefined): string {
  const s = v === null || v === undefined ? '' : String(v)
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

function row(cells: (string | number | null | undefined)[]): string {
  return cells.map(esc).join(',')
}

export function buildMarginCsv(input: MarginInput, result: MarginResult): string {
  const lines: string[] = []
  lines.push(row(['마진지니 계산 결과']))
  lines.push(row(['엔진', result.engineVersion]))
  lines.push(row(['정책', result.policyVersion]))
  lines.push(row(['채널', channelLabel(input.channel)]))
  lines.push(row(['판매가', result.listPrice]))
  lines.push(row(['실매출', result.netSales]))
  lines.push(row(['공헌이익', result.contributionProfit]))
  lines.push(row(['실마진율', result.marginRate === null ? '' : `${(result.marginRate * 100).toFixed(1)}%`]))
  lines.push(row(['손익분기 판매가', result.breakEvenPrice ?? '']))
  lines.push(row(['목표 마진 판매가', result.targetMarginPrice ?? '']))
  lines.push(row(['손익분기 ROAS', result.breakEvenRoas === null ? '' : result.breakEvenRoas.toFixed(2)]))
  lines.push(row(['현재 ROAS', result.impliedRoas === null ? '' : result.impliedRoas.toFixed(2)]))
  lines.push(row([]))
  lines.push(row(['항목', '금액', '비고']))
  lines.push(row(['판매가', result.listPrice, '']))
  for (const line of result.costLines) {
    lines.push(row([line.label, -line.amount, line.provenance?.status ?? '']))
  }
  lines.push(row(['공헌이익', result.contributionProfit, result.risk]))
  if (result.warnings.length) {
    lines.push(row([]))
    lines.push(row(['경고']))
    for (const w of result.warnings) lines.push(row([w]))
  }
  return `\uFEFF${lines.join('\n')}`
}

export function downloadMarginCsv(input: MarginInput, result: MarginResult, filename = 'margin-genie.csv'): void {
  const csv = buildMarginCsv(input, result)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
