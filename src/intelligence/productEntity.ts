import { buildProductDna, dnaIdentityConfidence } from './productDna'
import type { ProductEntity, ProductDna, RawListingInput } from './types'

function newEntityId(): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `pe_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

function canonicalNameFromDna(dna: ProductDna): string {
  const parts: string[] = []
  if (dna.manufacturer.normalized) parts.push(dna.manufacturer.normalized)
  if (dna.model.normalized) parts.push(dna.model.normalized)
  if (dna.quantity.normalized) parts.push(`${dna.quantity.normalized}개`)
  if (dna.color.normalized) parts.push(dna.color.normalized)
  return parts.length ? parts.join(' · ') : (dna.title.raw ?? 'Unnamed')
}

export function createProductEntity(input: RawListingInput): ProductEntity {
  const dna = buildProductDna(input)
  const now = new Date().toISOString()
  return {
    id: newEntityId(),
    version: 1,
    canonicalName: canonicalNameFromDna(dna),
    dna,
    identityConfidence: dnaIdentityConfidence(dna),
    createdAt: now,
    updatedAt: now,
  }
}
