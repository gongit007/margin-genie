import { describe, expect, it } from 'vitest'
import { parseDometopiaSearchHtml } from './parseDometopiaSearchHtml'

const SNIPPET = `
<dl class="goodsDisplayItemWrap">
  <a href="/goods/view?no=11223344&code="></a>
  <h6>볼 고정 조임링 T45-10 10P</h6>
  <td class="price_txt">도매가</td>
  <td class="price_num">3,400원</td>
</dl>
`

describe('parseDometopiaSearchHtml', () => {
  it('parses goods list blocks', () => {
    const hits = parseDometopiaSearchHtml(SNIPPET)
    expect(hits).toHaveLength(1)
    expect(hits[0].itemCode).toBe('11223344')
    expect(hits[0].title).toContain('T45')
    expect(hits[0].wholesalePrice).toBe(3400)
    expect(hits[0].listingUrl).toContain('11223344')
  })

  it('returns empty on search-void pages without items', () => {
    expect(parseDometopiaSearchHtml('<div class="sch_void">카테고리를 선택</div>')).toEqual([])
  })
})
