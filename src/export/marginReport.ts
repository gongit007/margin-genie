import { channelLabel, krw, pct, riskLabel, type MarginInput, type MarginResult } from '../engine'

function escHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

type ReportInsight = { headline: string; body: string }

export function buildMarginReportHtml(
  input: MarginInput,
  result: MarginResult,
  insight: ReportInsight,
  channelRows?: MarginResult[],
): string {
  const risk = riskLabel(result.risk)
  const channelTable =
    channelRows && channelRows.length
      ? `<h2>채널 비교</h2><table><thead><tr><th>채널</th><th>공헌이익</th><th>실마진</th><th>판정</th></tr></thead><tbody>${channelRows
          .map(
            (row) =>
              `<tr><td>${escHtml(row.feePolicy.name)}</td><td>${escHtml(krw(row.contributionProfit))}</td><td>${escHtml(pct(row.marginRate))}</td><td>${escHtml(riskLabel(row.risk).text)}</td></tr>`,
          )
          .join('')}</tbody></table>`
      : ''

  const costRows = result.costLines
    .map((line) => `<tr><td>${escHtml(line.label)}</td><td>−${escHtml(krw(line.amount))}</td></tr>`)
    .join('')

  return `<!doctype html><html lang="ko"><head><meta charset="utf-8"/><title>마진지니 리포트</title>
<style>
  body{font-family:system-ui,sans-serif;color:#111;max-width:720px;margin:32px auto;line-height:1.5}
  h1{font-size:22px;margin:0 0 8px} h2{font-size:16px;margin:24px 0 8px;border-top:1px solid #ddd;padding-top:16px}
  .meta{color:#666;font-size:13px;margin-bottom:20px}
  .badge{display:inline-block;padding:4px 10px;border-radius:999px;font-size:12px;background:#f3f3f3}
  table{width:100%;border-collapse:collapse;font-size:14px;margin-top:8px}
  th,td{border-bottom:1px solid #eee;padding:8px 4px;text-align:left}
  th{color:#666;font-weight:600}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
  .card{border:1px solid #eee;border-radius:12px;padding:12px}
  .label{font-size:12px;color:#666}.value{font-size:18px;font-weight:600}
  footer{margin-top:32px;font-size:11px;color:#888}
  @media print{body{margin:16px}}
</style></head><body>
  <h1>마진지니 계산 리포트</h1>
  <p class="meta">${escHtml(new Date().toLocaleString('ko-KR'))} · 엔진 ${escHtml(result.engineVersion)} · ${escHtml(channelLabel(input.channel))}</p>
  <p><span class="badge">${escHtml(risk.text)}</span></p>
  <p><strong>${escHtml(insight.headline)}</strong><br/>${escHtml(insight.body)}</p>
  <div class="grid">
    <div class="card"><div class="label">판매가</div><div class="value">${escHtml(krw(result.listPrice))}</div></div>
    <div class="card"><div class="label">공헌이익</div><div class="value">${escHtml(krw(result.contributionProfit))}</div></div>
    <div class="card"><div class="label">실마진율</div><div class="value">${escHtml(pct(result.marginRate))}</div></div>
    <div class="card"><div class="label">손익분기</div><div class="value">${escHtml(result.breakEvenPrice ? krw(result.breakEvenPrice) : '—')}</div></div>
  </div>
  <h2>비용 구조</h2>
  <table><tbody><tr><td>판매가</td><td>${escHtml(krw(result.listPrice))}</td></tr>${costRows}<tr><td><strong>공헌이익</strong></td><td><strong>${escHtml(krw(result.contributionProfit))}</strong></td></tr></tbody></table>
  ${channelTable}
  ${result.warnings.length ? `<h2>경고</h2><ul>${result.warnings.map((w) => `<li>${escHtml(w)}</li>`).join('')}</ul>` : ''}
  <footer>마진지니 · 세무·투자 자문이 아닙니다. 최종 정산은 각 판매자센터를 확인하세요.</footer>
</body></html>`
}

export function printMarginReport(
  input: MarginInput,
  result: MarginResult,
  insight: ReportInsight,
  channelRows?: MarginResult[],
): void {
  const html = buildMarginReportHtml(input, result, insight, channelRows)
  const win = window.open('', '_blank', 'noopener,noreferrer')
  if (!win) return
  win.document.open()
  win.document.write(html)
  win.document.close()
  win.focus()
  win.print()
}
