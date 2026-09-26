import { useEffect } from 'react'
import { buildJsonLdGraph } from '../seo/jsonLd'
import {
  FAQ_ITEMS,
  OG_IMAGE_URL,
  SITE_DESCRIPTION,
  SITE_KEYWORDS,
  SITE_NAME,
  SITE_TAGLINE,
  SITE_URL,
} from '../seo/siteMeta'

function upsertMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function upsertLink(rel: string, href: string) {
  let el = document.head.querySelector(`link[rel="${rel}"]`)
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', rel)
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}

export function SeoHead() {
  useEffect(() => {
    document.title = `${SITE_NAME} | ${SITE_TAGLINE}`
    document.documentElement.lang = 'ko'

    upsertMeta('name', 'description', SITE_DESCRIPTION)
    upsertMeta('name', 'keywords', SITE_KEYWORDS.join(', '))
    upsertMeta('name', 'author', SITE_NAME)
    upsertMeta('name', 'robots', 'index, follow, max-image-preview:large')
    upsertMeta('name', 'googlebot', 'index, follow')
    upsertMeta('name', 'application-name', SITE_NAME)

    upsertLink('canonical', SITE_URL)
    upsertLink('alternate', `${SITE_URL}/llms.txt`)

    upsertMeta('property', 'og:type', 'website')
    upsertMeta('property', 'og:site_name', SITE_NAME)
    upsertMeta('property', 'og:locale', 'ko_KR')
    upsertMeta('property', 'og:title', `${SITE_NAME} | ${SITE_TAGLINE}`)
    upsertMeta('property', 'og:description', SITE_DESCRIPTION)
    upsertMeta('property', 'og:url', SITE_URL)
    upsertMeta('property', 'og:image', OG_IMAGE_URL)
    upsertMeta('property', 'og:image:alt', `${SITE_NAME} - 8채널 실마진 계산기`)

    upsertMeta('name', 'twitter:card', 'summary_large_image')
    upsertMeta('name', 'twitter:title', `${SITE_NAME} | ${SITE_TAGLINE}`)
    upsertMeta('name', 'twitter:description', SITE_DESCRIPTION)
    upsertMeta('name', 'twitter:image', OG_IMAGE_URL)

    const scriptId = 'margin-genie-jsonld'
    let script = document.getElementById(scriptId) as HTMLScriptElement | null
    if (!script) {
      script = document.createElement('script')
      script.id = scriptId
      script.type = 'application/ld+json'
      document.head.appendChild(script)
    }
    script.textContent = JSON.stringify(buildJsonLdGraph())
  }, [])

  return null
}

export { FAQ_ITEMS }
