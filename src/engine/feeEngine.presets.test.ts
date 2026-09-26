import { describe, expect, it } from 'vitest'
import { ELEVEN_ST_CATEGORY_PRESETS, GMARKET_CATEGORY_PRESETS, matchingCategoryPresetId } from './feeEngine'

describe('category presets', () => {
  it('matches elevenst default preset', () => {
    expect(matchingCategoryPresetId(ELEVEN_ST_CATEGORY_PRESETS, 0.11)).toBe('default')
  })

  it('matches gmarket fashion preset', () => {
    expect(matchingCategoryPresetId(GMARKET_CATEGORY_PRESETS, 0.12)).toBe('fashion')
  })

  it('returns custom for unknown rates', () => {
    expect(matchingCategoryPresetId(GMARKET_CATEGORY_PRESETS, 0.115)).toBe('custom')
  })
})
