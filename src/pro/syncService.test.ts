import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest'
import { emptyInput } from '../engine'
import { signIn } from './accountStorage'
import { getCloudSyncMeta, pullCloudSnapshot, pushCloudSnapshot, buildCloudSnapshot } from './cloudSync'
import { pushAccountSync, pullAccountSync } from './syncService'
import { FULL_BACKUP_VERSION } from '../storage/fullBackup'

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
  vi.stubGlobal('crypto', { randomUUID: () => 'uuid-test-device' })
}

describe('cloud sync', () => {
  beforeEach(() => {
    store.clear()
    mockLocalStorage()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('push and pull account sync round-trip', () => {
    const session = signIn('sync@shop.com', 'Sync User')
    expect(session).not.toBeNull()
    const input = { ...emptyInput(), listPrice: 88000, productName: '동기화 테스트' }
    const channels = ['NAVER_SMARTSTORE', 'COUPANG'] as const

    const meta = pushAccountSync(session!.account.id, input, [...channels])
    expect(meta.revision).toBe(1)

    const restored = pullAccountSync(session!.account.id)
    expect(restored?.input.listPrice).toBe(88000)
    expect(restored?.input.productName).toBe('동기화 테스트')
    expect(restored?.compareChannels).toEqual([...channels])
  })

  it('increments revision on repeated push', () => {
    const snapshot = buildCloudSnapshot(
      'acct-1',
      {
        version: FULL_BACKUP_VERSION,
        exportedAt: new Date().toISOString(),
        input: emptyInput(),
        scenarios: [],
        compareChannels: ['OWN_STORE'],
      },
      1,
    )
    pushCloudSnapshot(snapshot)
    pushCloudSnapshot({ ...snapshot, revision: 2, exportedAt: new Date().toISOString() })
    expect(getCloudSyncMeta('acct-1')?.revision).toBe(2)
    expect(pullCloudSnapshot('acct-1')?.revision).toBe(2)
  })
})
