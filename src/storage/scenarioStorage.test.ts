import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { emptyInput } from '../engine'
import { clearScenarios, deleteScenario, getScenario, listScenarios, saveScenario } from './scenarioStorage'

const store = new Map<string, string>()

function mockLocalStorage() {
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => {
      store.set(k, v)
    },
    removeItem: (k: string) => {
      store.delete(k)
    },
  })
}

describe('scenarioStorage', () => {
  beforeEach(() => {
    store.clear()
    mockLocalStorage()
    clearScenarios()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('saves and lists scenarios', () => {
    const input = { ...emptyInput(), listPrice: 55000 }
    const saved = saveScenario('테스트 상품', input)
    expect(saved).not.toBeNull()
    expect(listScenarios()).toHaveLength(1)
    expect(listScenarios()[0].name).toBe('테스트 상품')
    expect(listScenarios()[0].input.listPrice).toBe(55000)
  })

  it('rejects empty name', () => {
    expect(saveScenario('  ', emptyInput())).toBeNull()
  })

  it('loads and deletes scenario', () => {
    const saved = saveScenario('삭제 테스트', { ...emptyInput(), productCost: 12000 })!
    expect(getScenario(saved.id)?.input.productCost).toBe(12000)
    deleteScenario(saved.id)
    expect(getScenario(saved.id)).toBeNull()
  })
})
