import type { ChannelCode } from '../engine'

const STORAGE_KEY = 'margin-genie:compare-channels:v1'

const ALL_CHANNELS: ChannelCode[] = [
  'NAVER_SMARTSTORE',
  'COUPANG',
  'ELEVEN_ST',
  'GMARKET',
  'AUCTION',
  'KAKAO',
  'LOTTEON',
  'OWN_STORE',
]

function isChannelCode(v: unknown): v is ChannelCode {
  return typeof v === 'string' && ALL_CHANNELS.includes(v as ChannelCode)
}

export function defaultCompareChannels(): ChannelCode[] {
  return [...ALL_CHANNELS]
}

export function loadCompareChannels(fallback: ChannelCode[] = defaultCompareChannels()): ChannelCode[] {
  if (typeof localStorage === 'undefined') return fallback
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return fallback
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return fallback
    const channels = parsed.filter(isChannelCode)
    return channels.length ? channels : fallback
  } catch {
    return fallback
  }
}

export function saveCompareChannels(channels: ChannelCode[]): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(channels))
  } catch {
    // ignore quota / private mode
  }
}
