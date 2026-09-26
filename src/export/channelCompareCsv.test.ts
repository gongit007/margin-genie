import { describe, expect, it } from 'vitest'
import { compareChannels, emptyInput } from '../engine'
import { buildChannelCompareCsv } from './channelCompareCsv'

describe('channelCompareCsv', () => {
  it('builds compare table with BOM', () => {
    const input = { ...emptyInput(), listPrice: 50000, productCost: 20000 }
    const rows = compareChannels(input, ['NAVER_SMARTSTORE', 'COUPANG', 'ELEVEN_ST'])
    const csv = buildChannelCompareCsv(rows)
    expect(csv.startsWith('\uFEFF')).toBe(true)
    expect(csv).toContain('스마트스토어')
    expect(csv).toContain('쿠팡')
    expect(csv).toContain('11번가')
  })
})
