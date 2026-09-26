import { describe, expect, it } from 'vitest'
import { calculateMargin, compareChannels, emptyInput } from './index'
import { interpretChannels } from './interpret'

describe('interpretChannels', () => {
  it('recommends best channel when active channel differs', () => {
    const input = {
      ...emptyInput(),
      listPrice: 89000,
      productCost: 32000,
      shippingCost: 3000,
      packagingCost: 1500,
      advertisingMode: 'PERCENT_OF_NET' as const,
      advertisingRate: 0.06,
      channel: 'COUPANG' as const,
    }
    const compared = compareChannels(input, ['NAVER_SMARTSTORE', 'COUPANG', 'OWN_STORE'])
    const insight = interpretChannels(compared, input.channel)
    expect(insight).not.toBeNull()
    expect(insight!.headline.length).toBeGreaterThan(0)
  })

  it('confirms when active channel is best', () => {
    const input = emptyInput()
    const customBest = calculateMargin({ ...input, channel: 'CUSTOM', customSalesFeeRate: 0 })
    const rows2 = [calculateMargin(input), customBest]
    const insight = interpretChannels(rows2, 'CUSTOM')
    expect(insight?.headline).toContain('유리')
  })
})
