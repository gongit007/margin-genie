import type { ChannelCode, MarginInput } from '../engine'
import { exportFullBackupJson, importFullBackupJson, type FullBackup } from '../storage/fullBackup'
import {
  buildCloudSnapshot,
  getCloudSyncMeta,
  nextRevision,
  pullCloudSnapshot,
  pushCloudSnapshot,
  type CloudSyncMeta,
} from './cloudSync'

export function pushAccountSync(
  accountId: string,
  input: MarginInput,
  compareChannels: ChannelCode[],
): CloudSyncMeta {
  const backup = JSON.parse(exportFullBackupJson(input, compareChannels)) as FullBackup
  const snapshot = buildCloudSnapshot(accountId, backup, nextRevision(accountId))
  return pushCloudSnapshot(snapshot)
}

export function pullAccountSync(accountId: string): {
  input: MarginInput
  compareChannels: ChannelCode[]
  scenarioCount: number
  revision: number
  syncedAt: string
} | null {
  const snapshot = pullCloudSnapshot(accountId)
  if (!snapshot) return null
  const restored = importFullBackupJson(
    JSON.stringify({
      version: snapshot.version,
      exportedAt: snapshot.exportedAt,
      input: snapshot.input,
      scenarios: snapshot.scenarios,
      compareChannels: snapshot.compareChannels,
    }),
  )
  return {
    ...restored,
    revision: snapshot.revision,
    syncedAt: snapshot.exportedAt,
  }
}

export function getAccountSyncMeta(accountId: string): CloudSyncMeta | null {
  return getCloudSyncMeta(accountId)
}
