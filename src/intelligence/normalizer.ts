const QUANTITY_PATTERNS = [/(\d+)\s*(?:개(?:입)?|입|P|p|pcs?)/i, /(\d+)\s*개/]
const MODEL_PATTERNS = [/\b(T\d{2,3}(?:-\d+)?)\b/i, /\b([A-Z]{1,3}\d{2,4}(?:-\d+)?)\b/]
const DIMENSION_PATTERNS = [/(\d+(?:\.\d+)?)\s*(?:cm|CM|㎝)/, /(\d+(?:\.\d+)?)\s*(?:mm|MM)/]

export function collapseWhitespace(text: string): string {
  return text.replace(/\s+/g, ' ').trim()
}

export function normalizeTitle(title: string): string {
  return collapseWhitespace(title.toLowerCase().replace(/[^\p{L}\p{N}\s.\-]/gu, ' '))
}

export function tokenizeTitle(normalized: string): string[] {
  return normalized.split(/\s+/).filter((t) => t.length > 0)
}

export function extractQuantityFromText(text: string): number | null {
  for (const pattern of QUANTITY_PATTERNS) {
    const match = text.match(pattern)
    if (match) {
      const n = parseInt(match[1], 10)
      if (Number.isFinite(n) && n > 0) return n
    }
  }
  return null
}

export function extractModelFromText(text: string): string | null {
  for (const pattern of MODEL_PATTERNS) {
    const match = text.match(pattern)
    if (match) return match[1].toUpperCase()
  }
  return null
}

export function extractDimensionFromText(text: string): string | null {
  for (const pattern of DIMENSION_PATTERNS) {
    const match = text.match(pattern)
    if (match) return `${match[1]}${/mm|MM/.test(match[0]) ? 'mm' : 'cm'}`
  }
  return null
}

export function normalizeModel(model: string): string {
  return model.trim().toUpperCase().replace(/\s+/g, '')
}

export function normalizeColor(color: string): string {
  const c = color.trim().toLowerCase()
  const map: Record<string, string> = { 블랙: 'black', black: 'black', 화이트: 'white', white: 'white' }
  return map[c] ?? c
}

export function normalizeManufacturer(name: string): string {
  return collapseWhitespace(name)
}
