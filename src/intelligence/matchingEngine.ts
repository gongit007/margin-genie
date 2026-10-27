import { buildProductDna } from './productDna'
import { normalizeManufacturer } from './normalizer'
import type { MatchEvidence, MatchStatus, ProductEntity, ProductMatchResult, RawListingInput } from './types'

export const MATCH_ENGINE_VERSION = '1.0.0'

const MANUFACTURER_ALIASES: Record<string, string> = {
  touchlife: 'touchlife',
  터치라이프: 'touchlife',
}

function normManufacturer(value: string | null | undefined): string | null {
  if (!value) return null
  const key = normalizeManufacturer(value).toLowerCase()
  return MANUFACTURER_ALIASES[key] ?? key.replace(/\s+/g, '')
}

function compareString(attribute: string, anchor: string | null, candidate: string | null): MatchEvidence {
  if (!anchor || !candidate) {
    return { attribute, anchorValue: anchor, candidateValue: candidate, comparisonResult: 'MISSING', similarityScore: null }
  }
  if (anchor === candidate) {
    return { attribute, anchorValue: anchor, candidateValue: candidate, comparisonResult: 'EXACT', similarityScore: 1 }
  }
  return { attribute, anchorValue: anchor, candidateValue: candidate, comparisonResult: 'DIFFERENT', similarityScore: 0 }
}

function compareQuantity(anchor: number | null, candidate: number | null): MatchEvidence {
  if (anchor === null || candidate === null) {
    return {
      attribute: 'quantity',
      anchorValue: anchor !== null ? String(anchor) : null,
      candidateValue: candidate !== null ? String(candidate) : null,
      comparisonResult: 'MISSING',
      similarityScore: null,
    }
  }
  return {
    attribute: 'quantity',
    anchorValue: String(anchor),
    candidateValue: String(candidate),
    comparisonResult: anchor === candidate ? 'EXACT' : 'DIFFERENT',
    similarityScore: anchor === candidate ? 1 : 0,
  }
}

function titleSimilarity(a: string | null, b: string | null): number {
  if (!a || !b) return 0
  const ta = new Set(a.split(/\s+/).filter((t) => t.length > 1))
  const tb = new Set(b.split(/\s+/).filter((t) => t.length > 1))
  if (!ta.size || !tb.size) return 0
  let overlap = 0
  for (const t of ta) if (tb.has(t)) overlap++
  return overlap / Math.max(ta.size, tb.size)
}

function decideStatus(evidence: MatchEvidence[]): { status: MatchStatus; confidence: number } {
  const by = Object.fromEntries(evidence.map((e) => [e.attribute, e]))
  if (by.model?.comparisonResult === 'DIFFERENT') return { status: 'NOT_MATCH', confidence: 0.92 }
  if (by.model?.comparisonResult === 'EXACT' && by.quantity?.comparisonResult === 'EXACT' && by.color?.comparisonResult === 'EXACT') {
    return { status: 'EXACT_MATCH', confidence: by.manufacturer?.comparisonResult === 'EXACT' ? 0.95 : 0.85 }
  }
  if (by.model?.comparisonResult === 'EXACT' && by.quantity?.comparisonResult === 'DIFFERENT') {
    return { status: 'SAME_BASE_DIFFERENT_PACKAGE', confidence: 0.88 }
  }
  if (by.model?.comparisonResult === 'EXACT' && by.color?.comparisonResult === 'DIFFERENT') {
    return { status: 'VARIANT_MATCH', confidence: 0.82 }
  }
  if (by.model?.comparisonResult === 'EXACT') return { status: 'PROBABLE_MATCH', confidence: 0.7 }
  if ((by.title?.similarityScore ?? 0) >= 0.5) return { status: 'POSSIBLE_MATCH', confidence: 0.45 }
  return { status: 'UNKNOWN', confidence: 0.2 }
}

export function matchListing(anchor: ProductEntity, candidate: RawListingInput, listingId: string): ProductMatchResult {
  const c = buildProductDna(candidate)
  const a = anchor.dna
  const evidence: MatchEvidence[] = [
    compareString('manufacturer', normManufacturer(a.manufacturer.normalized), normManufacturer(c.manufacturer.normalized)),
    compareString('model', a.model.normalized, c.model.normalized),
    compareQuantity(a.quantity.normalized, c.quantity.normalized),
    compareString('color', a.color.normalized, c.color.normalized),
    compareString('dimension', a.dimension.normalized, c.dimension.normalized),
    {
      attribute: 'title',
      anchorValue: a.normalizedTitle.normalized,
      candidateValue: c.normalizedTitle.normalized,
      comparisonResult: titleSimilarity(a.normalizedTitle.normalized, c.normalizedTitle.normalized) >= 0.4 ? 'SIMILAR' : 'DIFFERENT',
      similarityScore: titleSimilarity(a.normalizedTitle.normalized, c.normalizedTitle.normalized),
    },
  ]
  const { status, confidence } = decideStatus(evidence)
  return { listingId, matchStatus: status, confidence, matchVersion: MATCH_ENGINE_VERSION, evidence, matchedAt: new Date().toISOString() }
}

export function matchStatusLabel(status: MatchStatus): string {
  const labels: Record<MatchStatus, string> = {
    EXACT_MATCH: '동일상품',
    VARIANT_MATCH: '색상 변형',
    SAME_BASE_DIFFERENT_PACKAGE: '수량·구성 다름',
    PROBABLE_MATCH: '동일 가능성 높음',
    POSSIBLE_MATCH: '유사 (확인 필요)',
    NOT_MATCH: '다른 상품',
    UNKNOWN: '판정 불가',
  }
  return labels[status]
}

export function isCompetitiveMatch(status: MatchStatus): boolean {
  return ['EXACT_MATCH', 'PROBABLE_MATCH', 'POSSIBLE_MATCH'].includes(status)
}
