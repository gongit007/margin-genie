import { describe, expect, it } from 'vitest'
import { calculateMargin, compareChannels, emptyInput } from '../engine'
import { sensitivityAnalysis } from '../engine/sensitivity'
import { buildAiExplanation, previewAiExplanation } from './aiExplain'

describe('buildAiExplanation', () => {
  it('builds sections from engine results only', () => {
    const input = {
      ...emptyInput(),
      listPrice: 89000,
      productCost: 32000,
      shippingCost: 3000,
      channel: 'COUPANG' as const,
      advertisingMode: 'PERCENT_OF_NET' as const,
      advertisingRate: 0.06,
    }
    const result = calculateMargin(input)
    const channelRows = compareChannels(input, ['NAVER_SMARTSTORE', 'COUPANG', 'OWN_STORE'])
    const explanation = buildAiExplanation({
      input,
      result,
      channelRows,
      activeChannel: input.channel,
      sensitivityRows: sensitivityAnalysis(input),
    })

    expect(explanation.summary.length).toBeGreaterThan(0)
    expect(explanation.sections.length).toBeGreaterThan(2)
    expect(explanation.followUps.length).toBeGreaterThan(0)
    expect(explanation.disclaimer).toContain('엔진')
  })

  it('preview returns only first section', () => {
    const input = emptyInput()
    const result = calculateMargin(input)
    const preview = previewAiExplanation({
      input,
      result,
      channelRows: [],
      activeChannel: input.channel,
      sensitivityRows: [],
    })
    expect(preview.sections).toHaveLength(1)
  })
})
