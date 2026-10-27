import {
  extractDimensionFromText,
  extractModelFromText,
  extractQuantityFromText,
  normalizeColor,
  normalizeManufacturer,
  normalizeModel,
  normalizeTitle,
} from './normalizer'
import type { DnaField, ProductDna, ProductIdentifier, RawListingInput } from './types'

function fieldFromInput(value: string | undefined): DnaField<string> {
  if (!value?.trim()) return { raw: null, normalized: null, status: 'NOT_VISIBLE', source: 'INPUT' }
  const raw = value.trim()
  return { raw, normalized: raw, status: 'KNOWN', source: 'INPUT' }
}

function fieldFromExtracted(raw: string, normalized: string): DnaField<string> {
  return { raw, normalized, status: 'KNOWN', source: 'EXTRACTED' }
}

function quantityField(input: RawListingInput, title: string): DnaField<number> {
  if (input.quantity !== undefined && input.quantity > 0) {
    return { raw: String(input.quantity), normalized: input.quantity, status: 'KNOWN', source: 'INPUT' }
  }
  const extracted = extractQuantityFromText(title)
  if (extracted !== null) {
    return { raw: title, normalized: extracted, status: 'KNOWN', source: 'EXTRACTED' }
  }
  return { raw: null, normalized: null, status: 'UNKNOWN', source: 'NORMALIZED' }
}

function modelField(input: RawListingInput, title: string): DnaField<string> {
  if (input.model?.trim()) {
    const raw = input.model.trim()
    return { raw, normalized: normalizeModel(raw), status: 'KNOWN', source: 'INPUT' }
  }
  const extracted = extractModelFromText(title)
  if (extracted) return fieldFromExtracted(title, normalizeModel(extracted))
  return { raw: null, normalized: null, status: 'UNKNOWN', source: 'NORMALIZED' }
}

function colorField(input: RawListingInput, title: string): DnaField<string> {
  if (input.color?.trim()) {
    const raw = input.color.trim()
    return { raw, normalized: normalizeColor(raw), status: 'KNOWN', source: 'INPUT' }
  }
  const lower = title.toLowerCase()
  if (/블랙|black/.test(lower)) return fieldFromExtracted(title, 'black')
  if (/화이트|white/.test(lower)) return fieldFromExtracted(title, 'white')
  return { raw: null, normalized: null, status: 'UNKNOWN', source: 'NORMALIZED' }
}

function buildIdentifiers(input: RawListingInput, model: DnaField<string>): ProductIdentifier[] {
  const ids: ProductIdentifier[] = []
  if (input.supplierItemCode?.trim()) {
    ids.push({ type: 'supplier_item_code', value: input.supplierItemCode.trim(), sourceType: 'supplier', confidence: 1 })
  }
  if (model.normalized && input.manufacturer?.trim()) {
    ids.push({
      type: 'manufacturer_model',
      value: `${normalizeManufacturer(input.manufacturer)}:${model.normalized}`,
      sourceType: 'supplier',
      confidence: 0.9,
    })
  }
  return ids
}

export function buildProductDna(input: RawListingInput): ProductDna {
  const titleRaw = input.title.trim()
  const model = modelField(input, titleRaw)
  const manufacturer = input.manufacturer?.trim()
    ? {
        raw: input.manufacturer.trim(),
        normalized: normalizeManufacturer(input.manufacturer),
        status: 'KNOWN' as const,
        source: 'INPUT' as const,
      }
    : { raw: null, normalized: null, status: 'UNKNOWN' as const, source: 'NORMALIZED' as const }

  return {
    version: 1,
    title: fieldFromInput(titleRaw),
    normalizedTitle: fieldFromExtracted(titleRaw, normalizeTitle(titleRaw)),
    brand: fieldFromInput(input.brand),
    manufacturer,
    model,
    sku: fieldFromInput(input.sku),
    barcode: fieldFromInput(input.barcode),
    material: fieldFromInput(input.material),
    color: colorField(input, titleRaw),
    dimension: input.dimension?.trim()
      ? fieldFromInput(input.dimension)
      : extractDimensionFromText(titleRaw)
        ? fieldFromExtracted(titleRaw, extractDimensionFromText(titleRaw)!)
        : { raw: null, normalized: null, status: 'UNKNOWN', source: 'NORMALIZED' },
    weight: fieldFromInput(undefined),
    quantity: quantityField(input, titleRaw),
    packageUnit: fieldFromInput(input.packageUnit),
    origin: fieldFromInput(input.origin),
    description: fieldFromInput(input.description),
    images: [],
    identifiers: buildIdentifiers(input, model),
    extractedAt: new Date().toISOString(),
  }
}

export function dnaIdentityConfidence(dna: ProductDna): number {
  const fields = [dna.model, dna.quantity, dna.manufacturer]
  const known = fields.filter((f) => f.status === 'KNOWN').length
  return Math.min(1, known / fields.length + (dna.identifiers.length ? 0.15 : 0))
}
