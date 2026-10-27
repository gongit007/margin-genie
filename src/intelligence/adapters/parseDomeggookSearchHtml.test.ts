import { describe, expect, it } from 'vitest'
import { parseDomeggookSearchHtml } from './parseDomeggookSearchHtml'

const FIXTURE = `
<li id="li63253617" class="col2 ">
  <a href="/63253617?from=lstGen" class="title">플라스틱 너트 브라켓 1.7cm볼 고정 조임링10개입 T45-10</a>
  <div class="amtqty"><div class="amt"><b>1,300</b>원</div><div class="infoDeli">주문시결제 <b>3,000</b>원</div></div>
  <div class="seller"><div class="nick"><a href="?sw=spr73">터치라이프</a></div></div>
</li>
<li id="li12345678" class="col2 ">
  <a class="title">T45 브라켓 10개</a>
  <div class="amt"><b>2,800</b>원</div>
  <div class="seller"><a href="?sw=other">다른셀러</a></div>
</li>
`

describe('parseDomeggookSearchHtml', () => {
  it('parses item blocks from search HTML', () => {
    const hits = parseDomeggookSearchHtml(FIXTURE)
    expect(hits).toHaveLength(2)
    expect(hits[0].itemCode).toBe('63253617')
    expect(hits[0].title).toContain('T45-10')
    expect(hits[0].supplierName).toBe('터치라이프')
    expect(hits[0].wholesalePrice).toBe(1300)
    expect(hits[0].shippingFee).toBe(3000)
    expect(hits[1].itemCode).toBe('12345678')
  })
})
