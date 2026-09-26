import { ENGINE_VERSION, POLICY_VERSION } from '../engine'
import { FAQ_ITEMS, SITE_DESCRIPTION, SITE_NAME, SITE_NAME_EN, SITE_TAGLINE, SITE_URL, SUPPORTED_CHANNELS } from './siteMeta'

export function buildOrganizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    alternateName: SITE_NAME_EN,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
  }
}

export function buildWebSiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    alternateName: SITE_NAME_EN,
    url: SITE_URL,
    inLanguage: 'ko-KR',
    description: SITE_DESCRIPTION,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE_URL}/#calculator`,
      'query-input': 'required name=search_term_string',
    },
  }
}

export function buildSoftwareApplicationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: SITE_NAME,
    alternateName: SITE_NAME_EN,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web Browser',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'KRW',
    },
    description: SITE_DESCRIPTION,
    featureList: [
      '8채널 마진 비교',
      '공헌이익·실마진·손익분기 계산',
      'ROAS·역산·시나리오 저장',
      '수수료 출처 VERIFIED/ESTIMATED 표시',
      '결정론 Margin Engine',
    ],
    softwareVersion: ENGINE_VERSION,
    releaseNotes: `Policy ${POLICY_VERSION}`,
    url: SITE_URL,
  }
}

export function buildFaqPageJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ_ITEMS.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  }
}

export function buildWebPageJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: `${SITE_NAME} | ${SITE_TAGLINE}`,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    inLanguage: 'ko-KR',
    about: SUPPORTED_CHANNELS.map((name) => ({
      '@type': 'Thing',
      name,
    })),
    isPartOf: {
      '@type': 'WebSite',
      name: SITE_NAME,
      url: SITE_URL,
    },
  }
}

export function buildJsonLdGraph() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      buildOrganizationJsonLd(),
      buildWebSiteJsonLd(),
      buildSoftwareApplicationJsonLd(),
      buildWebPageJsonLd(),
      buildFaqPageJsonLd(),
    ],
  }
}
