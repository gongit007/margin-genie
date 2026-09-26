import { describe, expect, it } from 'vitest'
import { emptyInput } from '../engine'
import { decodeMarginInput, encodeMarginInput, readShareInputFromHash } from './inputShare'

describe('inputShare', () => {
  it('round-trips margin input', () => {
    const input = { ...emptyInput(), listPrice: 77000, productCost: 28000, channel: 'COUPANG' as const }
    const encoded = encodeMarginInput(input)
    const decoded = decodeMarginInput(encoded)
    expect(decoded?.listPrice).toBe(77000)
    expect(decoded?.productCost).toBe(28000)
    expect(decoded?.channel).toBe('COUPANG')
  })

  it('reads from hash', () => {
    const encoded = encodeMarginInput({ ...emptyInput(), listPrice: 12345 })
    expect(readShareInputFromHash(`#s=${encoded}`)?.listPrice).toBe(12345)
  })

  it('returns null for invalid hash', () => {
    expect(readShareInputFromHash('#s=not-valid')).toBeNull()
    expect(readShareInputFromHash('#other=1')).toBeNull()
  })
})
