import { emptyInput, type ChannelCode } from '../engine'
import { encodeSharePayload } from '../share/inputShare'

export type MarginLinkOptions = {
  productCost: number
  productName: string
  listPrice?: number
  channel?: ChannelCode
  shippingCost?: number
}

/** 마진 계산기로 이동 — productCost 등 URL hash 프리필 */
export function buildMarginCalculatorUrl(opts: MarginLinkOptions): string {
  if (typeof window === 'undefined') return '/'
  const input = {
    ...emptyInput(),
    productName: opts.productName,
    productCost: opts.productCost,
    listPrice: opts.listPrice ?? 11880,
    shippingCost: opts.shippingCost ?? 3000,
    channel: opts.channel ?? 'NAVER_SMARTSTORE',
  }
  const encoded = encodeSharePayload({ input })
  return `${window.location.origin}/#s=${encoded}`
}

export function openMarginCalculator(opts: MarginLinkOptions): void {
  window.location.href = buildMarginCalculatorUrl(opts)
}
