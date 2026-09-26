import type { ChannelCode, MarginInput } from '../engine'
import { FULL_BACKUP_VERSION, type FullBackup } from '../storage/fullBackup'

export type CloudSnapshot = FullBackup & {
  accountId: string
  revision: number
  deviceId: string
}

export type CloudSyncMeta = {
  accountId: string
  revision: number
  syncedAt: string
  deviceId: string
}

const DEVICE_KEY = 'margin-genie:pro:device-id:v1'

function cloudKey(accountId: string): string {
  return `margin-genie:cloud:${accountId}:v1`
}

function metaKey(accountId: string): string {
  return `margin-genie:cloud-meta:${accountId}:v1`
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

export function getDeviceId(): string {
  if (typeof localStorage === 'undefined') return 'server'
  try {
    const existing = localStorage.getItem(DEVICE_KEY)
    if (existing) return existing
    const id = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `dev-${Date.now()}`
    localStorage.setItem(DEVICE_KEY, id)
    return id
  } catch {
    return 'unknown'
  }
}

export function buildCloudSnapshot(
  accountId: string,
  backup: FullBackup,
  revision = 1,
): CloudSnapshot {
  return {
    ...backup,
    accountId,
    revision,
    deviceId: getDeviceId(),
  }
}

export function pushCloudSnapshot(snapshot: CloudSnapshot): CloudSyncMeta {
  if (typeof localStorage === 'undefined') {
    return {
      accountId: snapshot.accountId,
      revision: snapshot.revision,
      syncedAt: snapshot.exportedAt,
      deviceId: snapshot.deviceId,
    }
  }
  localStorage.setItem(cloudKey(snapshot.accountId), JSON.stringify(snapshot))
  const meta: CloudSyncMeta = {
    accountId: snapshot.accountId,
    revision: snapshot.revision,
    syncedAt: snapshot.exportedAt,
    deviceId: snapshot.deviceId,
  }
  localStorage.setItem(metaKey(snapshot.accountId), JSON.stringify(meta))
  return meta
}

export function pullCloudSnapshot(accountId: string): CloudSnapshot | null {
  if (typeof localStorage === 'undefined') return null
  try {
    const raw = localStorage.getItem(cloudKey(accountId))
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (!isRecord(parsed) || parsed.version !== FULL_BACKUP_VERSION) return null
    if (typeof parsed.accountId !== 'string' || parsed.accountId !== accountId) return null
    return parsed as CloudSnapshot
  } catch {
    return null
  }
}

export function getCloudSyncMeta(accountId: string): CloudSyncMeta | null {
  if (typeof localStorage === 'undefined') return null
  try {
    const raw = localStorage.getItem(metaKey(accountId))
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (!isRecord(parsed) || typeof parsed.accountId !== 'string') return null
    return {
      accountId: parsed.accountId,
      revision: typeof parsed.revision === 'number' ? parsed.revision : 0,
      syncedAt: typeof parsed.syncedAt === 'string' ? parsed.syncedAt : '',
      deviceId: typeof parsed.deviceId === 'string' ? parsed.deviceId : '',
    }
  } catch {
    return null
  }
}

export function nextRevision(accountId: string): number {
  return (getCloudSyncMeta(accountId)?.revision ?? 0) + 1
}

export async function pushCloudSnapshotRemote(
  snapshot: CloudSnapshot,
  endpoint: string,
): Promise<CloudSyncMeta> {
  const response = await fetch(`${endpoint.replace(/\/$/, '')}/sync/${snapshot.accountId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(snapshot),
  })
  if (!response.ok) throw new Error('클라우드 업로드에 실패했습니다.')
  return pushCloudSnapshot(snapshot)
}

export async function pullCloudSnapshotRemote(accountId: string, endpoint: string): Promise<CloudSnapshot | null> {
  const response = await fetch(`${endpoint.replace(/\/$/, '')}/sync/${accountId}`)
  if (response.status === 404) return pullCloudSnapshot(accountId)
  if (!response.ok) throw new Error('클라우드 다운로드에 실패했습니다.')
  const parsed: unknown = await response.json()
  if (!isRecord(parsed)) return null
  pushCloudSnapshot(parsed as CloudSnapshot)
  return parsed as CloudSnapshot
}

export type CloudRestorePayload = {
  input: MarginInput
  compareChannels: ChannelCode[]
  scenarioCount: number
  revision: number
  syncedAt: string
}

export function snapshotToRestorePayload(snapshot: CloudSnapshot): CloudRestorePayload {
  return {
    input: snapshot.input,
    compareChannels: snapshot.compareChannels,
    scenarioCount: snapshot.scenarios.length,
    revision: snapshot.revision,
    syncedAt: snapshot.exportedAt,
  }
}
