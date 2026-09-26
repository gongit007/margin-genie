import type {
  ChannelCode,
  ChannelFeePolicy,
  FeeComponent,
  MarginInput,
  NpayGrade,
  VerificationStatus,
} from './types'

const NPAY_VAT_INCLUDED: Record<NpayGrade, number> = {
  MICRO: 0.01947,
  SME1: 0.02563,
  SME2: 0.02728,
  SME3: 0.03003,
  GENERAL: 0.0363,
}

const SMARTSTORE_SALES_FEE_VAT_INCLUDED = 0.03

function component(partial: Omit<FeeComponent, 'fixedFee' | 'vatMode'> & Partial<FeeComponent>): FeeComponent {
  return {
    fixedFee: 0,
    vatMode: 'INCLUDED',
    ...partial,
  }
}

export function resolveFeePolicy(input: MarginInput): ChannelFeePolicy {
  if (input.channel === 'NAVER_SMARTSTORE') {
    const salesRate = input.customSalesFeeRate ?? SMARTSTORE_SALES_FEE_VAT_INCLUDED
    const paymentRate = input.customPaymentFeeRate ?? NPAY_VAT_INCLUDED[input.npayGrade]
    const salesStatus: VerificationStatus = input.customSalesFeeRate == null ? 'VERIFIED' : 'USER_DEFINED'
    const payStatus: VerificationStatus = input.customPaymentFeeRate == null ? 'VERIFIED' : 'USER_DEFINED'
    return {
      channel: 'NAVER_SMARTSTORE',
      name: '스마트스토어',
      channelType: 'marketplace',
      category: 'default_inflow',
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
          sourceReference: '스마트스토어 고객센터 FAQ 15759 · 2025-06-02 결제건부터 · 일반 유입 3%(VAT 포함)',
          effectiveFrom: '2025-06-02',
          notes: '판매자 마케팅 유입 시 1%(VAT 포함)로 낮아질 수 있습니다.',
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
          label: '판매수수료 (추정/입력)',
          rate: salesRate,
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
          label: '판매수수료 (추정/입력)',
          rate: salesRate,
          verificationStatus: input.customSalesFeeRate == null ? 'ESTIMATED' : 'USER_DEFINED',
          sourceType: 'estimated',
          sourceReference: '기본 11%는 추정치입니다. 공식값으로 표시하지 않습니다.',
          effectiveFrom: '2026-01-01',
          notes: '',
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
          label: 'PG 결제수수료 (추정)',
          rate: paymentRate,
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

export function feeRates(policy: ChannelFeePolicy): { sales: number; payment: number; fixed: number } {
  let sales = 0
  let payment = 0
  let fixed = 0
  for (const c of policy.components) {
    fixed += c.fixedFee
    if (c.code === 'npay' || c.code === 'payment_fee') payment += c.rate
    else sales += c.rate
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
    case 'OWN_STORE':
      return '자사몰 (D2C)'
    default:
      return '직접 입력'
  }
}
