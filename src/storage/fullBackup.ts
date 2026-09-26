import { emptyInput, type ChannelCode, type MarginInput } from '../engine'
import { loadCompareChannels, saveCompareChannels } from './compareChannelStorage'
import { sanitizeMarginInput } from './marginInputStorage'
import { clearScenarios, exportScenariosJson, importScenariosJson, type SavedScenario } from './scenarioStorage'

export const FULL_BACKUP_VERSION = 1 as const

const COMPARE_CHANNELS: ChannelCode[] = [
  'NAVER_SMARTSTORE',
  'COUPANG',
  'ELEVEN_ST',
  'GMARKET',
  'AUCTION',
  'KAKAO',
  'LOTTEON',
  'OWN_STORE',
]

export type FullBackup = {
  version: typeof FULL_BACKUP_VERSION
  exportedAt: string
  input: MarginInput
  scenarios: SavedScenario[]
  compareChannels: ChannelCode[]
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function parseCompareChannels(value: unknown): ChannelCode[] {
  if (!Array.isArray(value)) return loadCompareChannels()
  const channels = value.filter(
    (c): c is ChannelCode => typeof c === 'string' && COMPARE_CHANNELS.includes(c as ChannelCode),
  )
  return channels.length ? channels : loadCompareChannels()
}

export function exportFullBackupJson(input: MarginInput, compareChannels: ChannelCode[]): string {
  const payload: FullBackup = {
    version: FULL_BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    input,
    scenarios: JSON.parse(exportScenariosJson()) as SavedScenario[],
    compareChannels,
  }
  return JSON.stringify(payload, null, 2)
}

export function importFullBackupJson(json: string): {
  input: MarginInput
  scenarioCount: number
  compareChannels: ChannelCode[]
} {
  const parsed: unknown = JSON.parse(json)
  if (!isRecord(parsed)) throw new Error('백업 JSON 형식이 올바르지 않습니다.')

  const input = sanitizeMarginInput(parsed.input, emptyInput())
  let scenarioCount = 0
  if (Array.isArray(parsed.scenarios)) {
    clearScenarios()
    scenarioCount = importScenariosJson(JSON.stringify(parsed.scenarios))
  }
  const compareChannels = parseCompareChannels(parsed.compareChannels)
  saveCompareChannels(compareChannels)

  return { input, scenarioCount, compareChannels }
}

export function downloadFullBackup(input: MarginInput, compareChannels: ChannelCode[]): void {
  const blob = new Blob([exportFullBackupJson(input, compareChannels)], { type: 'application/json;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'margin-genie-backup.json'
  a.click()
  URL.revokeObjectURL(url)
}
