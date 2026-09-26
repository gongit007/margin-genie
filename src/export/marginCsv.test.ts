import { describe, expect, it } from 'vitest'
import { calculateMargin, emptyInput } from '../engine'
import { buildMarginCsv } from './marginCsv'

describe('marginCsv', () => {
  it('includes summary and cost lines with BOM', () => {
    const input = { ...emptyInput(), listPrice: 50000, productCost: 20000 }
    const result = calculateMargin(input)
    const csv = buildMarginCsv(input, result)
    expect(csv.startsWith('\uFEFF')).toBe(true)
    expect(csv).toContain('마진지니 계산 결과')
    expect(csv).toContain('공헌이익')
    expect(csv).toContain('상품 원가')
  })
})
