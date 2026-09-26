import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { emptyInput } from '../engine'
import { defaultCompareChannels } from './compareChannelStorage'
import { exportFullBackupJson, importFullBackupJson } from './fullBackup'
import { clearScenarios, saveScenario } from './scenarioStorage'

const store = new Map<string, string>()

beforeEach(() => {
  store.clear()
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => store.set(key, value),
    removeItem: (key: string) => store.delete(key),
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('fullBackup', () => {
  it('exports and restores input scenarios and compare channels', () => {
    const input = { ...emptyInput(), productName: '테스트 상품', listPrice: 55000 }
    saveScenario('A', { ...emptyInput(), listPrice: 11111 })
    const channels = ['NAVER_SMARTSTORE', 'COUPANG', 'OWN_STORE'] as const
    const json = exportFullBackupJson(input, [...channels])
    clearScenarios()
    const restored = importFullBackupJson(json)
    expect(restored.input.productName).toBe('테스트 상품')
    expect(restored.input.listPrice).toBe(55000)
    expect(restored.scenarioCount).toBe(1)
    expect(restored.compareChannels).toEqual([...channels])
  })

  it('falls back to default compare channels when missing', () => {
    const json = exportFullBackupJson(emptyInput(), defaultCompareChannels())
    const parsed = JSON.parse(json) as Record<string, unknown>
    delete parsed.compareChannels
    const restored = importFullBackupJson(JSON.stringify(parsed))
    expect(restored.compareChannels.length).toBeGreaterThan(0)
  })
})
