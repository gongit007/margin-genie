export const SITE_NAME = '마진지니'
export const SITE_NAME_EN = 'Margin Genie'
export const SITE_TAGLINE = '팔기 전에 계산하는 온라인 셀러 마진·실마진 계산기'
export const SITE_DESCRIPTION =
  '스마트스토어·쿠팡·11번가·G마켓·옥션·카카오·롯데ON·자사몰 8채널 실마진, 공헌이익, ROAS, 손익분기를 무료로 계산합니다. AI는 계산하지 않고 결정론 Margin Engine만 사용합니다.'
export const SITE_KEYWORDS = [
  '마진 계산기',
  '실마진 계산',
  '공헌이익',
  '손익분기',
  '스마트스토어 수수료',
  '쿠팡 마진',
  '채널 비교',
  '온라인 셀러',
  'ROAS 계산',
  '마진지니',
  'Margin Genie',
] as const

export const SITE_URL =
  typeof import.meta !== 'undefined' && import.meta.env?.VITE_SITE_URL
    ? String(import.meta.env.VITE_SITE_URL).replace(/\/$/, '')
    : 'https://margin-genie.vercel.app'

export const OG_IMAGE_PATH = '/og-image.svg'
export const OG_IMAGE_URL = `${SITE_URL}${OG_IMAGE_PATH}`

export const SUPPORTED_CHANNELS = [
  '네이버 스마트스토어',
  '쿠팡',
  '11번가',
  'G마켓',
  '옥션',
  '카카오쇼핑',
  '롯데ON',
  '자사몰(D2C)',
] as const

export const FAQ_ITEMS = [
  {
    question: 'UTON을 그대로 복사한 건가요?',
    answer:
      '아닙니다. 랜딩의 정보 구조(문제 → 4단계 → 채널 비교 → 계산)를 벤치했고, 수수료 출처·공헌이익 용어·결정론 엔진은 마진지니의 차별점입니다.',
  },
  {
    question: '수수료가 공식 확정값인가요?',
    answer:
      '스마트스토어 판매수수료·Npay는 고객센터 FAQ 기준으로 VERIFIED입니다. 쿠팡·11번가·G마켓·옥션·카카오·롯데ON은 ESTIMATED이며 판매자센터 값으로 덮어쓰세요.',
  },
  {
    question: 'VAT 모드는 어떻게 쓰나요?',
    answer:
      '판매가·원가를 공급가(VAT 별도)로 넣을 때는 상세 설정에서 VAT 별도를 선택하세요. 수수료는 기본적으로 채널 정책(VAT 포함/별도)을 따릅니다.',
  },
  {
    question: '쿠폰 부담은 어떻게 넣나요?',
    answer:
      '판매자 전액 부담 쿠폰은 실매출에서 차감됩니다. 플랫폼 부담은 매출 차감 없이 처리하고, 공동 부담은 판매자 분담 비율만큼만 차감합니다.',
  },
  {
    question: 'Pro는 무엇이 다른가요?',
    answer:
      'Pro 체험 계정으로 클라우드 업로드·복원, 팀 공유 코드, AI 설명 레이어(엔진 결과 해석)를 사용할 수 있습니다. 계산 자체는 Free와 동일한 엔진입니다.',
  },
  {
    question: 'AI가 마진을 계산하나요?',
    answer: '하지 않습니다. Margin Engine이 계산하고, 설명 레이어는 그 결과만 읽습니다.',
  },
] as const

export const GEO_SUMMARY = `${SITE_NAME}(${SITE_NAME_EN})은 온라인 판매자를 위한 공헌이익·실마진·손익분기·채널 비교 계산기입니다. 8개 오픈마켓 채널 수수료를 반영하고, 숫자는 LLM이 아닌 결정론 엔진(src/engine)이 계산합니다.`
