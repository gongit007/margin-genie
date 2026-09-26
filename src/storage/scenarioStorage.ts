import { emptyInput, type MarginInput } from '../engine'
import { sanitizeMarginInput } from './marginInputStorage'

const STORAGE_KEY = 'margin-genie:scenarios:v1'
const MAX_SCENARIOS = 20

export type SavedScenario = {
  id: string
  name: string
  input: MarginInput
  savedAt: string
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function readAll(): SavedScenario[] {
  if (typeof localStorage === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((item): item is SavedScenario => isRecord(item) && typeof item.id === 'string' && typeof item.name === 'string')
      .map((item) => ({
        id: item.id,
        name: item.name,
        savedAt: typeof item.savedAt === 'string' ? item.savedAt : new Date().toISOString(),
        input: sanitizeMarginInput(item.input, emptyInput()),
      }))
      .slice(0, MAX_SCENARIOS)
  } catch {
    return []
  }
}

function writeAll(scenarios: SavedScenario[]): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(scenarios.slice(0, MAX_SCENARIOS)))
  } catch {
    // ignore quota errors
  }
}

export function listScenarios(): SavedScenario[] {
  return readAll().sort((a, b) => b.savedAt.localeCompare(a.savedAt))
}

export function saveScenario(name: string, input: MarginInput): SavedScenario | null {
  const trimmed = name.trim()
  if (!trimmed) return null
  const scenario: SavedScenario = {
    id: typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `sc-${Date.now()}`,
    name: trimmed,
    input: sanitizeMarginInput(input, emptyInput()),
    savedAt: new Date().toISOString(),
  }
  writeAll([scenario, ...readAll()])
  return scenario
}

export function deleteScenario(id: string): void {
  writeAll(readAll().filter((s) => s.id !== id))
}

export function getScenario(id: string): SavedScenario | null {
  return readAll().find((s) => s.id === id) ?? null
}

export function clearScenarios(): void {
  if (typeof localStorage === 'undefined') return
  localStorage.removeItem(STORAGE_KEY)
}
