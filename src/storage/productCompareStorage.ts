import { emptyInput, type MarginInput } from '../engine'
import { sanitizeMarginInput } from './marginInputStorage'

const STORAGE_KEY = 'margin-genie:product-compare:v1'
const MAX_PRODUCTS = 12

export type SavedProduct = {
  id: string
  input: MarginInput
  addedAt: string
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function readAll(): SavedProduct[] {
  if (typeof localStorage === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((item): item is SavedProduct => isRecord(item) && typeof item.id === 'string')
      .map((item) => ({
        id: item.id,
        addedAt: typeof item.addedAt === 'string' ? item.addedAt : new Date().toISOString(),
        input: sanitizeMarginInput(item.input, emptyInput()),
      }))
      .slice(0, MAX_PRODUCTS)
  } catch {
    return []
  }
}

function writeAll(products: SavedProduct[]): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products.slice(0, MAX_PRODUCTS)))
  } catch {
    // ignore quota errors
  }
}

export function listProducts(): SavedProduct[] {
  return readAll().sort((a, b) => b.addedAt.localeCompare(a.addedAt))
}

export function addProduct(input: MarginInput): SavedProduct {
  const product: SavedProduct = {
    id: typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `pd-${Date.now()}`,
    input: sanitizeMarginInput(input, emptyInput()),
    addedAt: new Date().toISOString(),
  }
  writeAll([product, ...readAll()])
  return product
}

export function removeProduct(id: string): void {
  writeAll(readAll().filter((p) => p.id !== id))
}

export function clearProducts(): void {
  if (typeof localStorage === 'undefined') return
  localStorage.removeItem(STORAGE_KEY)
}

export function getProduct(id: string): SavedProduct | null {
  return readAll().find((p) => p.id === id) ?? null
}
