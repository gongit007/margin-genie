import { describe, expect, it } from 'vitest'
import { buildFaqPageJsonLd, buildJsonLdGraph, buildSoftwareApplicationJsonLd } from './jsonLd'
import { FAQ_ITEMS, SITE_NAME } from './siteMeta'

describe('seo jsonLd', () => {
  it('builds FAQ schema from shared items', () => {
    const faq = buildFaqPageJsonLd()
    expect(faq.mainEntity).toHaveLength(FAQ_ITEMS.length)
    expect(faq.mainEntity[0]).toMatchObject({
      '@type': 'Question',
      name: FAQ_ITEMS[0].question,
    })
  })

  it('builds graph with software application', () => {
    const graph = buildJsonLdGraph()
    expect(graph['@graph']).toHaveLength(5)
    const app = buildSoftwareApplicationJsonLd()
    expect(app.name).toBe(SITE_NAME)
    expect(app.offers.price).toBe('0')
  })
})
