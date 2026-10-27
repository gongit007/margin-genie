import type { MarketplaceCode } from './types'

export const MARKETPLACE_LABELS: Record<MarketplaceCode, string> = {
  NAVER_SMARTSTORE: '네이버 스마트스토어',
  COUPANG: '쿠팡',
  ELEVEN_ST: '11번가',
  GMARKET: 'G마켓',
  AUCTION: '옥션',
  KAKAO: '카카오쇼핑',
}

export const MARKETPLACE_CODES: MarketplaceCode[] = [
  'NAVER_SMARTSTORE',
  'COUPANG',
  'ELEVEN_ST',
  'GMARKET',
  'AUCTION',
  'KAKAO',
]

/** Intelligence — 경쟁 셀러 조회 대상 마켓 */
export const RETAIL_FOCUS_MARKETPLACES: MarketplaceCode[] = ['NAVER_SMARTSTORE', 'COUPANG']
