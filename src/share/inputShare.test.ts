import { describe, expect, it } from 'vitest'
import { emptyInput } from '../engine'
import {
  decodeMarginInput,
  decodeSharePayload,
  encodeMarginInput,
  encodeSharePayload,
  readShareFromHash,
} from './inputShare'

describe('inputShare', () => {
  it('round-trips margin input', () => {
    const input = { ...emptyInput(), listPrice: 77000, productCost: 28000, channel: 'COUPANG' as const }
    const encoded = encodeMarginInput(input)
    const decoded = decodeMarginInput(encoded)
    expect(decoded?.listPrice).toBe(77000)
    expect(decoded?.productCost).toBe(28000)
    expect(decoded?.channel).toBe('COUPANG')
  })

  it('round-trips compare channels in share payload', () => {
    const input = { ...emptyInput(), listPrice: 55000 }
    const compareChannels = ['NAVER_SMARTSTORE', 'COUPANG', 'OWN_STORE'] as const
    const encoded = encodeSharePayload({ input, compareChannels: [...compareChannels] })
    const decoded = decodeSharePayload(encoded)
    expect(decoded?.input.listPrice).toBe(55000)
    expect(decoded?.compareChannels).toEqual([...compareChannels])
  })

  it('reads legacy input-only hash', () => {
    const encoded = encodeMarginInput({ ...emptyInput(), listPrice: 12345 })
    expect(readShareFromHash(`#s=${encoded}`)?.input.listPrice).toBe(12345)
    expect(readShareFromHash(`#s=${encoded}`)?.compareChannels).toBeUndefined()
  })

  it('reads compare channels from hash', () => {
    const encoded = encodeSharePayload({
      input: { ...emptyInput(), listPrice: 99000 },
      compareChannels: ['KAKAO', 'LOTTEON'],
    })
    const payload = readShareFromHash(`#s=${encoded}`)
    expect(payload?.input.listPrice).toBe(99000)
    expect(payload?.compareChannels).toEqual(['KAKAO', 'LOTTEON'])
  })

  it('returns null for invalid hash', () => {
    expect(readShareFromHash('#s=not-valid')).toBeNull()
    expect(readShareFromHash('#other=1')).toBeNull()
  })
})
