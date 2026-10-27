import { describe, expect, it } from 'vitest'
import { detectMarketplace, parseNaverShopSearchResponse } from './naverShopSearch'
import type { NaverShopSearchResponse } from './naverShopSearch'

const FIXTURE: NaverShopSearchResponse = {
  lastBuildDate: '2026-10-02T00:00:00.000+09:00',
  total: 2,
  start: 1,
  display: 2,
  items: [
    {
      title: '터치라이프 T45-10 너트브라켓 10P',
      link: 'https://smartstore.naver.com/hwmarket/products/99102',
      image: '',
      lprice: '10900',
      hprice: '10900',
      mallName: '하드웨어마켓',
      productId: '99102',
      productType: '2',
      brand: 'TouchLife',
      maker: '터치라이프',
      category1: '생활',
      category2: '공구',
      category3: '',
      category4: '',
    },
    {
      title: '플라스틱 조임링 T45 10입',
      link: 'https://www.coupang.com/vp/products/77881',
      image: '',
      lprice: '9900',
      hprice: '9900',
      mallName: '쿠팡',
      productId: '77881',
      productType: '2',
      brand: '',
      maker: '',
      category1: '생활',
      category2: '',
      category3: '',
      category4: '',
    },
  ],
}

describe('naverShopSearch', () => {
  it('detects smartstore and coupang', () => {
    expect(detectMarketplace('https://smartstore.naver.com/x/products/1', '하드웨어마켓')).toBe(
      'NAVER_SMARTSTORE',
    )
    expect(detectMarketplace('https://www.coupang.com/vp/products/1', '쿠팡')).toBe('COUPANG')
  })

  it('parses shop response into focus marketplaces', () => {
    const rows = parseNaverShopSearchResponse(FIXTURE, ['NAVER_SMARTSTORE', 'COUPANG'])
    expect(rows).toHaveLength(2)
    expect(rows[0].marketplace).toBe('NAVER_SMARTSTORE')
    expect(rows[0].listPrice).toBe(10900)
    expect(rows[1].marketplace).toBe('COUPANG')
  })
})
