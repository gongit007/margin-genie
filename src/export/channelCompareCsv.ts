import { type MarginResult } from '../engine'

function esc(v: string | number | null | undefined): string {
  const s = v === null || v === undefined ? '' : String(v)
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

function row(cells: (string | number | null | undefined)[]): string {
  return cells.map(esc).join(',')
}

export function buildChannelCompareCsv(rows: MarginResult[]): string {
  const lines: string[] = [
    row(['채널', '판매가', '실매출', '공헌이익', '실마진율', '손익분기', '판정']),
    ...rows.map((r) =>
      row([
        r.feePolicy.name,
        r.listPrice,
        r.netSales,
        r.contributionProfit,
        r.marginRate === null ? '' : `${(r.marginRate * 100).toFixed(1)}%`,
        r.breakEvenPrice ?? '',
        r.risk,
      ]),
    ),
  ]
  return `\uFEFF${lines.join('\n')}`
}

export function downloadChannelCompareCsv(rows: MarginResult[], filename = 'margin-genie-channels.csv'): void {
  const csv = buildChannelCompareCsv(rows)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
