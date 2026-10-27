import type { WholesaleListing, WholesalePlatformCode } from './types'

function eff(price: number, ship: number): number {
  return price + ship
}

/** 경쟁 셀러 stub — 플랫폼별 (앵커·내 상품은 search에서 MyProduct로 생성) */
export function stubWholesaleCompetitors(platform: WholesalePlatformCode): WholesaleListing[] {
  const now = new Date().toISOString()

  if (platform === 'DOMAEMAE') {
    // domeggook.com 실조회: 63253617(터치라이프) 외 T45 경쟁 셀러 없음
    return []
  }

  if (platform === 'DOMEGGOOK') {
    return [
      {
        id: 'ws-ggook-a',
        platform: 'DOMEGGOOK',
        discoveryStatus: 'FOUND',
        sellerName: '볼트킹',
        itemCode: '4455667',
        title: '스노벨 플라스틱 너트 브라켓 T45 10개',
        wholesalePrice: 3300,
        shippingFee: 0,
        effectivePrice: eff(3300, 0),
        listingUrl: 'https://domeme.domeggook.com/s/4455667',
        capturedAt: now,
        raw: { title: '스노벨 플라스틱 너트 브라켓 T45 10개', model: 'T45', quantity: 10, color: 'Black' },
      },
      {
        id: 'ws-ggook-b',
        platform: 'DOMEGGOOK',
        discoveryStatus: 'FOUND',
        sellerName: '공구나라',
        itemCode: '9988776',
        title: 'T50 플라스틱 브라켓 10개 (다른 모델)',
        wholesalePrice: 3100,
        shippingFee: 0,
        effectivePrice: eff(3100, 0),
        listingUrl: 'https://domeme.domeggook.com/s/9988776',
        capturedAt: now,
        raw: { title: 'T50 플라스틱 브라켓 10개', model: 'T50', quantity: 10 },
      },
    ]
  }

  if (platform === 'DOMETOPIA') {
    return [
      {
        id: 'ws-topia-a',
        platform: 'DOMETOPIA',
        discoveryStatus: 'FOUND',
        sellerName: '토피아하드웨어',
        itemCode: '11223344',
        title: '볼 고정 조임링 T45-10 10P 1.7cm',
        wholesalePrice: 3400,
        shippingFee: 300,
        effectivePrice: eff(3400, 300),
        listingUrl: 'https://www.dometopia.com/goods/view?no=11223344',
        capturedAt: now,
        raw: { title: '볼 고정 조임링 T45-10 10P 1.7cm', model: 'T45', quantity: 10, dimension: '1.7cm' },
      },
      {
        id: 'ws-topia-b',
        platform: 'DOMETOPIA',
        discoveryStatus: 'FOUND',
        sellerName: '셀러C',
        itemCode: '55667788',
        title: 'T45 화이트 10개입',
        wholesalePrice: 3350,
        shippingFee: 0,
        effectivePrice: eff(3350, 0),
        listingUrl: 'https://www.dometopia.com/goods/view?no=55667788',
        capturedAt: now,
        raw: { title: 'T45 화이트 10개입', model: 'T45', quantity: 10, color: 'White' },
      },
    ]
  }

  return []
}

/** @deprecated searchWholesaleCompetitors(platform) 사용 */
export function stubWholesaleSearchResults(): WholesaleListing[] {
  return ['DOMAEMAE', 'DOMEGGOOK', 'DOMETOPIA'].flatMap((p) =>
    stubWholesaleCompetitors(p as WholesalePlatformCode),
  )
}
