import { buildProductCompareRows, type ProductCompareMode, type ProductCompareRow } from '../engine/productCompare'
import type { SavedProduct } from '../storage/productCompareStorage'
import { riskLabel, type ChannelCode } from '../engine'

function esc(v: string | number | null | undefined): string {
  const s = v === null || v === undefined ? '' : String(v)
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

function row(cells: (string | number | null | undefined)[]): string {
  return cells.map(esc).join(',')
}

export function buildProductCompareCsv(rows: ProductCompareRow[]): string {
  const lines: string[] = []
  lines.push(row(['마진지니 다상품 비교']))
  lines.push(row(['상품', '채널', '판매가', '원가', '월판매량', '공헌이익', '실마진', '마크업', '월공헌', '손익분기', '판정']))
  for (const item of rows) {
    lines.push(
      row([
        item.productName,
        item.channelLabel,
        item.listPrice,
        item.productCost,
        item.monthlyUnits,
        item.contributionProfit,
        item.marginRate === null ? '' : `${(item.marginRate * 100).toFixed(1)}%`,
        item.markupRate === null ? '' : `${(item.markupRate * 100).toFixed(1)}%`,
        item.monthlyContribution,
        item.breakEvenPrice ?? '',
        riskLabel(item.risk).text,
      ]),
    )
  }
  return `\uFEFF${lines.join('\n')}`
}

export function downloadProductCompareCsv(rows: ProductCompareRow[]): void {
  const csv = buildProductCompareCsv(rows)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'margin-genie-products.csv'
  a.click()
  URL.revokeObjectURL(url)
}

export function rowsFromSavedProducts(
  products: SavedProduct[],
  mode: ProductCompareMode,
  channels: ChannelCode[],
): ProductCompareRow[] {
  return buildProductCompareRows(
    products.map((p) => ({ id: p.id, input: p.input })),
    mode,
    channels,
  )
}
