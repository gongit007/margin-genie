export type ProAccount = {
  id: string
  email: string
  displayName: string
  proEnabled: boolean
  createdAt: string
}

export type ProSession = {
  account: ProAccount
  signedInAt: string
}

const SESSION_KEY = 'margin-genie:pro:session:v1'
const ACCOUNTS_KEY = 'margin-genie:pro:accounts:v1'

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function readAccounts(): ProAccount[] {
  if (typeof localStorage === 'undefined') return []
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (item): item is ProAccount =>
        isRecord(item) &&
        typeof item.id === 'string' &&
        typeof item.email === 'string' &&
        typeof item.displayName === 'string' &&
        typeof item.proEnabled === 'boolean',
    )
  } catch {
    return []
  }
}

function writeAccounts(accounts: ProAccount[]): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts))
  } catch {
    // ignore quota errors
  }
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

function createAccountId(email: string): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `acct-${normalizeEmail(email).replace(/[^a-z0-9]/g, '')}-${Date.now()}`
}

export function getSession(): ProSession | null {
  if (typeof localStorage === 'undefined') return null
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (!isRecord(parsed) || !isRecord(parsed.account)) return null
    const account = parsed.account
    if (
      typeof account.id !== 'string' ||
      typeof account.email !== 'string' ||
      typeof account.displayName !== 'string' ||
      typeof account.proEnabled !== 'boolean'
    ) {
      return null
    }
    return {
      account: {
        id: account.id,
        email: account.email,
        displayName: account.displayName,
        proEnabled: account.proEnabled,
        createdAt: typeof account.createdAt === 'string' ? account.createdAt : new Date().toISOString(),
      },
      signedInAt: typeof parsed.signedInAt === 'string' ? parsed.signedInAt : new Date().toISOString(),
    }
  } catch {
    return null
  }
}

export function isProActive(session: ProSession | null): boolean {
  return session?.account.proEnabled === true
}

export function signIn(email: string, displayName: string, options?: { enablePro?: boolean }): ProSession | null {
  const normalizedEmail = normalizeEmail(email)
  const trimmedName = displayName.trim()
  if (!normalizedEmail.includes('@') || !trimmedName) return null

  const accounts = readAccounts()
  let account = accounts.find((item) => normalizeEmail(item.email) === normalizedEmail) ?? null
  if (!account) {
    account = {
      id: createAccountId(normalizedEmail),
      email: normalizedEmail,
      displayName: trimmedName,
      proEnabled: options?.enablePro ?? true,
      createdAt: new Date().toISOString(),
    }
    writeAccounts([account, ...accounts])
  } else if (options?.enablePro) {
    account = { ...account, proEnabled: true, displayName: trimmedName }
    writeAccounts(accounts.map((item) => (item.id === account!.id ? account! : item)))
  }

  const session: ProSession = { account, signedInAt: new Date().toISOString() }
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  }
  return session
}

export function signOut(): void {
  if (typeof localStorage === 'undefined') return
  localStorage.removeItem(SESSION_KEY)
}

export function enableProTrial(session: ProSession): ProSession {
  const accounts = readAccounts()
  const updated: ProAccount = { ...session.account, proEnabled: true }
  writeAccounts(accounts.map((item) => (item.id === updated.id ? updated : item)))
  const next: ProSession = { ...session, account: updated }
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(SESSION_KEY, JSON.stringify(next))
  }
  return next
}

export function getAccountById(accountId: string): ProAccount | null {
  return readAccounts().find((item) => item.id === accountId) ?? null
}
