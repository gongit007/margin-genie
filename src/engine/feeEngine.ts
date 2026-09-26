import { VAT_RATE } from './types'
import type {
  ChannelCode,
  ChannelFeePolicy,
  FeeComponent,
  MarginInput,
  NpayGrade,
  VerificationStatus,
  VatMode,
} from './types'

const NPAY_VAT_INCLUDED: Record<NpayGrade, number> = {
  MICRO: 0.01947,
  SME1: 0.02563,
  SME2: 0.02728,
  SME3: 0.03003,
  GENERAL: 0.0363,
}

const SMARTSTORE_SALES_FEE_VAT_INCLUDED = 0.03
const SMARTSTORE_SALES_FEE_MARKETING_VAT_INCLUDED = 0.01

export type CoupangCategoryPreset = {
  id: string
  label: string
  rate: number
}

export const COUPANG_CATEGORY_PRESETS: CoupangCategoryPreset[] = [
  { id: 'default', label: '일반 (기본 10.8%)', rate: 0.108 },
  { id: 'fashion', label: '패션·잡화 (약 8%)', rate: 0.08 },
  { id: 'digital', label: '디지털·가전 (약 7.8%)', rate: 0.078 },
  { id: 'food', label: '식품 (약 10.8%)', rate: 0.108 },
  { id: 'beauty', label: '뷰티 (약 10.8%)', rate: 0.108 },
  { id: 'home', label: '생활·주방 (약 10.8%)', rate: 0.108 },
]

export const ELEVEN_ST_CATEGORY_PRESETS: CoupangCategoryPreset[] = [
  { id: 'default', label: '일반 (기본 11%)', rate: 0.11 },
  { id: 'fashion', label: '패션·잡화 (약 9%)', rate: 0.09 },
  { id: 'digital', label: '디지털·가전 (약 7.5%)', rate: 0.075 },
  { id: 'food', label: '식품 (약 12%)', rate: 0.12 },
  { id: 'beauty', label: '뷰티 (약 11%)', rate: 0.11 },
  { id: 'home', label: '생활·주방 (약 11%)', rate: 0.11 },
]

export const GMARKET_CATEGORY_PRESETS: CoupangCategoryPreset[] = [
  { id: 'default', label: '일반 (기본 13%)', rate: 0.13 },
  { id: 'fashion', label: '패션·잡화 (약 12%)', rate: 0.12 },
  { id: 'digital', label: '디지털·가전 (약 10%)', rate: 0.1 },
  { id: 'food', label: '식품 (약 14%)', rate: 0.14 },
  { id: 'beauty', label: '뷰티 (약 13%)', rate: 0.13 },
  { id: 'home', label: '생활·주방 (약 13%)', rate: 0.13 },
]

export function matchingCategoryPresetId(
  presets: CoupangCategoryPreset[],
  rate: number,
): string {
  const match = presets.find((preset) => Math.abs(preset.rate - rate) < 0.0001)
  return match?.id ?? 'custom'
}

function component(partial: Omit<FeeComponent, 'fixedFee' | 'vatMode'> & Partial<FeeComponent>): FeeComponent {
  return {
    fixedFee: 0,
    vatMode: 'INCLUDED',
    ...partial,
  }
}

export function resolveFeePolicy(input: MarginInput): ChannelFeePolicy {
  if (input.channel === 'NAVER_SMARTSTORE') {
    const defaultSalesRate =
      input.smartstoreInflow === 'MARKETING'
        ? SMARTSTORE_SALES_FEE_MARKETING_VAT_INCLUDED
        : SMARTSTORE_SALES_FEE_VAT_INCLUDED
    const salesRate = input.customSalesFeeRate ?? defaultSalesRate
    const paymentRate = input.customPaymentFeeRate ?? NPAY_VAT_INCLUDED[input.npayGrade]
    const salesStatus: VerificationStatus = input.customSalesFeeRate == null ? 'VERIFIED' : 'USER_DEFINED'
    const payStatus: VerificationStatus = input.customPaymentFeeRate == null ? 'VERIFIED' : 'USER_DEFINED'
    const inflowLabel =
      input.smartstoreInflow === 'MARKETING'
        ? '판매자 마케팅 유입 1%(VAT 포함)'
        : '일반 유입 3%(VAT 포함)'
    return {
      channel: 'NAVER_SMARTSTORE',
      name: '스마트스토어',
      channelType: 'marketplace',
      category: input.smartstoreInflow === 'MARKETING' ? 'marketing_inflow' : 'default_inflow',
      lastVerified: '2026-09-08',
      disclaimer: '유입 경로·버티컬 수수료·솔루션 사용료는 주문마다 달라질 수 있습니다. 판매자센터 정산을 확인하세요.',
      components: [
        component({
          code: 'sales_fee',
          label: '판매수수료 (VAT 포함)',
          rate: salesRate,
          verificationStatus: salesStatus,
          sourceType: 'official_help',
          sourceUrl: 'https://help.sell.smartstore.naver.com/faq/content.help?faqId=15759',
          sourceReference: `스마트스토어 고객센터 FAQ 15759 · 2025-06-02 결제건부터 · ${inflowLabel}`,
          effectiveFrom: '2025-06-02',
          notes:
            input.smartstoreInflow === 'MARKETING'
              ? '판매자가 유입시킨 주문에 적용되는 마케팅 유입 요율입니다.'
              : '판매자 마케팅 유입 시 1%(VAT 포함)로 낮아질 수 있습니다.',
        }),
        component({
          code: 'npay',
          label: 'Npay 수수료 (VAT 포함)',
          rate: paymentRate,
          verificationStatus: payStatus,
          sourceType: 'official_help',
          sourceUrl: 'https://help.sell.smartstore.naver.com/faq/content.help?faqId=3713',
          sourceReference: '스마트스토어 고객센터 FAQ 3713 · 2025-10-01 결제건부터 · 국세청 매출 등급별',
          effectiveFrom: '2025-10-01',
          notes: '기본값은 일반 등급 3.630%. 영세·중소는 등급을 바꾸세요.',
        }),
      ],
    }
  }

  if (input.channel === 'COUPANG') {
    const salesRate = input.customSalesFeeRate ?? input.coupangCategoryRate
    return {
      channel: 'COUPANG',
      name: '쿠팡 마켓플레이스',
      channelType: 'marketplace',
      category: 'user_or_estimated',
      lastVerified: '2026-09-08',
      disclaimer: '카테고리·로켓그로스·월 서비스이용료에 따라 달라집니다. 쿠팡 윙 수수료 정책을 확인하세요.',
      components: [
        component({
          code: 'sales_fee',
          label: '판매수수료 (추정/입력, VAT 별도)',
          rate: salesRate,
          vatMode: 'EXCLUDED',
          verificationStatus: input.customSalesFeeRate == null ? 'ESTIMATED' : 'USER_DEFINED',
          sourceType: 'estimated_range',
          sourceReference: '공개 카테고리 요율 범위 약 4~10.8% · 공식 1차 표가 아님',
          effectiveFrom: '2026-01-01',
          notes: '결제수수료가 별도인지는 계정·시점에 따라 다릅니다. 필요하면 직접 입력하세요.',
        }),
        ...(input.customPaymentFeeRate
          ? [
              component({
                code: 'payment_fee',
                label: '추가 결제수수료 (사용자 입력)',
                rate: input.customPaymentFeeRate,
                verificationStatus: 'USER_DEFINED',
                sourceType: 'user',
                sourceReference: '사용자 입력',
                effectiveFrom: 'user',
                notes: '',
              }),
            ]
          : []),
      ],
    }
  }

  if (input.channel === 'ELEVEN_ST') {
    const salesRate = input.customSalesFeeRate ?? input.elevenstRate
    return {
      channel: 'ELEVEN_ST',
      name: '11번가',
      channelType: 'marketplace',
      category: 'user_or_estimated',
      lastVerified: '2026-09-08',
      disclaimer: '카테고리·행사 요율이 공개 표와 다를 수 있습니다. 판매자센터에서 확인하세요.',
      components: [
        component({
          code: 'sales_fee',
          label: '판매수수료 (추정/입력, VAT 별도)',
          rate: salesRate,
          vatMode: 'EXCLUDED',
          verificationStatus: input.customSalesFeeRate == null ? 'ESTIMATED' : 'USER_DEFINED',
          sourceType: 'estimated',
          sourceReference: '기본 11%는 추정치입니다. 공식값으로 표시하지 않습니다.',
          effectiveFrom: '2026-01-01',
          notes: '',
        }),
      ],
    }
  }

  if (input.channel === 'GMARKET') {
    const salesRate = input.customSalesFeeRate ?? input.gmarketRate
    return {
      channel: 'GMARKET',
      name: 'G마켓 (ESM)',
      channelType: 'marketplace',
      category: 'user_or_estimated',
      lastVerified: '2026-11-01',
      disclaimer: '카테고리·프로모션·ESM PLUS 요율이 다를 수 있습니다. 판매자센터 정산을 확인하세요.',
      components: [
        component({
          code: 'sales_fee',
          label: '판매수수료 (추정/입력, VAT 별도)',
          rate: salesRate,
          vatMode: 'EXCLUDED',
          verificationStatus: input.customSalesFeeRate == null ? 'ESTIMATED' : 'USER_DEFINED',
          sourceType: 'estimated',
          sourceReference: '일반 카테고리 약 10~15% · VAT 별도 · 기본 13%',
          effectiveFrom: '2026-11-01',
          notes: '옥션·G마켓 통합 ESM 계정 기준 추정치입니다.',
        }),
      ],
    }
  }

  if (input.channel === 'AUCTION') {
    const salesRate = input.customSalesFeeRate ?? input.auctionRate
    return {
      channel: 'AUCTION',
      name: '옥션 (ESM)',
      channelType: 'marketplace',
      category: 'user_or_estimated',
      lastVerified: '2026-12-01',
      disclaimer: '카테고리·프로모션·ESM PLUS 요율이 다를 수 있습니다. 판매자센터 정산을 확인하세요.',
      components: [
        component({
          code: 'sales_fee',
          label: '판매수수료 (추정/입력, VAT 별도)',
          rate: salesRate,
          vatMode: 'EXCLUDED',
          verificationStatus: input.customSalesFeeRate == null ? 'ESTIMATED' : 'USER_DEFINED',
          sourceType: 'estimated',
          sourceReference: '일반 카테고리 약 10~15% · VAT 별도 · 기본 13%',
          effectiveFrom: '2026-12-01',
          notes: 'G마켓·옥션 통합 ESM 계정 기준 추정치입니다.',
        }),
      ],
    }
  }

  if (input.channel === 'KAKAO') {
    const salesRate = input.customSalesFeeRate ?? input.kakaoRate
    return {
      channel: 'KAKAO',
      name: '카카오쇼핑',
      channelType: 'marketplace',
      category: 'user_or_estimated',
      lastVerified: '2026-11-01',
      disclaimer: '카카오쇼핑·선물하기·톡딜 등 판매 형태에 따라 요율이 다릅니다.',
      components: [
        component({
          code: 'sales_fee',
          label: '판매수수료 (추정/입력, VAT 별도)',
          rate: salesRate,
          vatMode: 'EXCLUDED',
          verificationStatus: input.customSalesFeeRate == null ? 'ESTIMATED' : 'USER_DEFINED',
          sourceType: 'estimated',
          sourceReference: '일반 카테고리 약 8~12% · VAT 별도 · 기본 10%',
          effectiveFrom: '2026-11-01',
          notes: '결제·정산 수수료는 판매자센터 약관을 확인하세요.',
        }),
      ],
    }
  }

  if (input.channel === 'LOTTEON') {
    const salesRate = input.customSalesFeeRate ?? input.lotteonRate
    return {
      channel: 'LOTTEON',
      name: '롯데ON',
      channelType: 'marketplace',
      category: 'user_or_estimated',
      lastVerified: '2026-12-01',
      disclaimer: '카테고리·입점 유형·프로모션에 따라 요율이 다릅니다. 롯데ON 판매자센터를 확인하세요.',
      components: [
        component({
          code: 'sales_fee',
          label: '판매수수료 (추정/입력, VAT 별도)',
          rate: salesRate,
          vatMode: 'EXCLUDED',
          verificationStatus: input.customSalesFeeRate == null ? 'ESTIMATED' : 'USER_DEFINED',
          sourceType: 'estimated',
          sourceReference: '일반 카테고리 약 8~13% · VAT 별도 · 기본 11%',
          effectiveFrom: '2026-12-01',
          notes: '롯데백화점·마트 연동 등 입점 형태에 따라 달라질 수 있습니다.',
        }),
      ],
    }
  }

  if (input.channel === 'OWN_STORE') {
    const salesRate = input.customSalesFeeRate ?? 0
    const paymentRate = input.customPaymentFeeRate ?? 0.033
    return {
      channel: 'OWN_STORE',
      name: '자사몰 (D2C)',
      channelType: 'd2c',
      category: 'pg_estimated',
      lastVerified: '2026-10-01',
      disclaimer: 'PG·호스팅·앱 수수료는 결제사·플랫폼마다 다릅니다. 실제 정산서로 확인하세요.',
      components: [
        component({
          code: 'sales_fee',
          label: '플랫폼 판매수수료',
          rate: salesRate,
          verificationStatus: 'USER_DEFINED',
          sourceType: 'user',
          sourceReference: '기본 0% · 자사몰은 보통 판매수수료 없음',
          effectiveFrom: 'user',
          notes: '카페24·고도몰 등 월 이용료는 고정비(월 고정비)로 넣으세요.',
        }),
        component({
          code: 'payment_fee',
          label: 'PG 결제수수료 (추정, VAT 별도)',
          rate: paymentRate,
          vatMode: 'EXCLUDED',
          verificationStatus: input.customPaymentFeeRate == null ? 'ESTIMATED' : 'USER_DEFINED',
          sourceType: 'estimated',
          sourceReference: '국내 PG 일반 구간 약 2.5~3.5% · 기본 3.3%',
          effectiveFrom: '2026-10-01',
          notes: '할부·해외카드는 별도 요율입니다.',
        }),
      ],
    }
  }

  const salesRate = input.customSalesFeeRate ?? 0
  const paymentRate = input.customPaymentFeeRate ?? 0
  return {
    channel: 'CUSTOM',
    name: '직접 입력 채널',
    channelType: 'custom',
    category: 'user',
    lastVerified: new Date().toISOString().slice(0, 10),
    disclaimer: '사용자 입력 요율만 사용합니다.',
    components: [
      component({
        code: 'sales_fee',
        label: '판매수수료 (사용자 입력)',
        rate: salesRate,
        verificationStatus: 'USER_DEFINED',
        sourceType: 'user',
        sourceReference: '사용자 입력',
        effectiveFrom: 'user',
        notes: '',
      }),
      ...(paymentRate
        ? [
            component({
              code: 'payment_fee',
              label: '결제수수료 (사용자 입력)',
              rate: paymentRate,
              verificationStatus: 'USER_DEFINED',
              sourceType: 'user',
              sourceReference: '사용자 입력',
              effectiveFrom: 'user',
              notes: '',
            }),
          ]
        : []),
    ],
  }
}

function componentVatMode(componentMode: VatMode, userMode: VatMode): VatMode {
  if (userMode !== 'IGNORE') return userMode
  return componentMode
}

export function effectiveRate(rate: number, vatMode: VatMode): number {
  if (vatMode === 'EXCLUDED') return rate * (1 + VAT_RATE)
  return rate
}

export function feeRates(
  policy: ChannelFeePolicy,
  feeVatMode: VatMode = 'IGNORE',
): { sales: number; payment: number; fixed: number } {
  let sales = 0
  let payment = 0
  let fixed = 0
  for (const c of policy.components) {
    fixed += c.fixedFee
    const rate = effectiveRate(c.rate, componentVatMode(c.vatMode, feeVatMode))
    if (c.code === 'npay' || c.code === 'payment_fee') payment += rate
    else sales += rate
  }
  return { sales, payment, fixed }
}

export function channelLabel(code: ChannelCode): string {
  switch (code) {
    case 'NAVER_SMARTSTORE':
      return '스마트스토어'
    case 'COUPANG':
      return '쿠팡'
    case 'ELEVEN_ST':
      return '11번가'
    case 'GMARKET':
      return 'G마켓 (ESM)'
    case 'AUCTION':
      return '옥션 (ESM)'
    case 'KAKAO':
      return '카카오쇼핑'
    case 'LOTTEON':
      return '롯데ON'
    case 'OWN_STORE':
      return '자사몰 (D2C)'
    default:
      return '직접 입력'
  }
}
