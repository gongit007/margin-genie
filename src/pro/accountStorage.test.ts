import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest'
import { getSession, isProActive, signIn, signOut } from './accountStorage'

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

describe('accountStorage', () => {
  beforeEach(() => {
    store.clear()
    mockLocalStorage()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('signs in and restores session', () => {
    const session = signIn('seller@shop.com', 'Gong')
    expect(session).not.toBeNull()
    expect(isProActive(session)).toBe(true)
    expect(getSession()?.account.email).toBe('seller@shop.com')
  })

  it('signs out and clears session', () => {
    signIn('seller@shop.com', 'Gong')
    signOut()
    expect(getSession()).toBeNull()
  })

  it('rejects invalid sign in', () => {
    expect(signIn('invalid', 'Gong')).toBeNull()
    expect(signIn('a@b.com', '  ')).toBeNull()
  })
})
