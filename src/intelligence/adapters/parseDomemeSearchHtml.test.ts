import { describe, expect, it } from 'vitest'
import { parseDomemeSearchHtml } from './parseDomemeSearchHtml'

const SNIPPET = `
<div onClick="itemInfo(63253617);">overlay</div>
<div onClick="itemInfo(63253617);">
<div class="main_cont_text1 b itemName cur " onClick="domeggookGo(63253617);">
플라스틱 너트 브라켓 T45-10
</div>
<a title="터치라이프(spr73)">터치라이프(spr73)</a>
<div class="main_cont_text3 t10 txtFlow2">&nbsp;선결제&nbsp;3,000원</div>
`

describe('parseDomemeSearchHtml', () => {
  it('parses supply list blocks', () => {
    const hits = parseDomemeSearchHtml(SNIPPET)
    expect(hits).toHaveLength(1)
    expect(hits[0].itemCode).toBe('63253617')
    expect(hits[0].title).toContain('T45')
    expect(hits[0].supplierName).toBe('터치라이프')
    expect(hits[0].shippingFee).toBe(3000)
  })
})
