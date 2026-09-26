import { emptyInput, type ChannelCode, type MarginInput } from '../engine'
import { defaultCompareChannels } from '../storage/compareChannelStorage'
import { sanitizeMarginInput } from '../storage/marginInputStorage'

export type SharePayload = {
  input: MarginInput
  compareChannels?: ChannelCode[]
}

function toBase64Url(json: string): string {
  const bytes = new TextEncoder().encode(json)
  let binary = ''
  for (const b of bytes) binary += String.fromCharCode(b)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(encoded: string): string {
  const padded = encoded.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(encoded.length / 4) * 4, '=')
  const binary = atob(padded)
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function isLegacyMarginInput(parsed: Record<string, unknown>): boolean {
  return typeof parsed.listPrice === 'number' && !('input' in parsed)
}

function parseCompareChannels(value: unknown): ChannelCode[] | undefined {
  if (!Array.isArray(value)) return undefined
  const allowed = defaultCompareChannels()
  const channels = value.filter((c): c is ChannelCode => typeof c === 'string' && allowed.includes(c as ChannelCode))
  return channels.length ? channels : undefined
}

export function encodeSharePayload(payload: SharePayload): string {
  return toBase64Url(JSON.stringify(payload))
}

export function decodeSharePayload(encoded: string): SharePayload | null {
  try {
    const parsed: unknown = JSON.parse(fromBase64Url(encoded))
    if (!isRecord(parsed)) return null
    if (isLegacyMarginInput(parsed)) {
      return { input: sanitizeMarginInput(parsed, emptyInput()) }
    }
    if (!('input' in parsed)) return null
    return {
      input: sanitizeMarginInput(parsed.input, emptyInput()),
      compareChannels: parseCompareChannels(parsed.compareChannels),
    }
  } catch {
    return null
  }
}

export function encodeMarginInput(input: MarginInput): string {
  return encodeSharePayload({ input })
}

export function decodeMarginInput(encoded: string): MarginInput | null {
  return decodeSharePayload(encoded)?.input ?? null
}

export function readShareFromHash(hash: string): SharePayload | null {
  const match = hash.match(/^#s=([^&]+)/)
  if (!match) return null
  return decodeSharePayload(match[1])
}

export function readShareInputFromHash(hash: string): MarginInput | null {
  return readShareFromHash(hash)?.input ?? null
}

export function buildShareUrl(input: MarginInput, compareChannels?: ChannelCode[]): string {
  if (typeof window === 'undefined') return ''
  const payload: SharePayload = compareChannels?.length ? { input, compareChannels } : { input }
  return `${window.location.origin}${window.location.pathname}#s=${encodeSharePayload(payload)}`
}

export async function copyShareUrl(input: MarginInput, compareChannels?: ChannelCode[]): Promise<boolean> {
  const url = buildShareUrl(input, compareChannels)
  if (!url) return false
  try {
    await navigator.clipboard.writeText(url)
    return true
  } catch {
    return false
  }
}
