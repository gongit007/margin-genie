import { describe, expect, it } from 'vitest'
import { parseDomeggookHtml } from './parseDomeggookHtml'

const FIXTURE = `
<meta property="og:title" content="[도매꾹] 플라스틱 너트 브라켓 1.7cm볼 고정 조임링10개입 T45-10" />
<h1>플라스틱 너트 브라켓 1.7cm볼 고정 조임링10개입 T45-10</h1>
<div id="lInfoSellerId"><b>터치라이프</b></div>
baseAmtDome : 1300,
<table id="lBaseAmtTbl"><tbody><tr data-idx="1"><th>4 ~</th><td>1,300</td></tr></tbody></table>
<div class="rankInfoPopLayerPointTotal">5,932</div>
<label class="lTblCell lTblCellLabel">제조사</label><div class="lTblCell">TouchLife</div>
택배 3,000원 / 주문시결제
itemNo=63253617
`

describe('parseDomeggookHtml', () => {
  it('extracts listing fields from product HTML', () => {
    const parsed = parseDomeggookHtml(FIXTURE, '63253617')
    expect(parsed).not.toBeNull()
    expect(parsed!.title).toContain('T45-10')
    expect(parsed!.supplierName).toBe('터치라이프')
    expect(parsed!.wholesalePrice).toBe(1300)
    expect(parsed!.rankingScore).toBe(5932)
    expect(parsed!.shippingFee).toBe(3000)
    expect(parsed!.manufacturer).toBe('TouchLife')
    expect(parsed!.model).toBe('T45-10')
    expect(parsed!.quantity).toBe(10)
  })

  it('returns null when item code missing from page', () => {
    expect(parseDomeggookHtml('<html></html>', '63253617')).toBeNull()
  })
})
