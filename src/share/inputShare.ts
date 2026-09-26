import { emptyInput, type MarginInput } from '../engine'
import { sanitizeMarginInput } from '../storage/marginInputStorage'

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

export function encodeMarginInput(input: MarginInput): string {
  return toBase64Url(JSON.stringify(input))
}

export function decodeMarginInput(encoded: string): MarginInput | null {
  try {
    const parsed: unknown = JSON.parse(fromBase64Url(encoded))
    return sanitizeMarginInput(parsed, emptyInput())
  } catch {
    return null
  }
}

export function readShareInputFromHash(hash: string): MarginInput | null {
  const match = hash.match(/^#s=([^&]+)/)
  if (!match) return null
  return decodeMarginInput(match[1])
}

export function buildShareUrl(input: MarginInput): string {
  if (typeof window === 'undefined') return ''
  return `${window.location.origin}${window.location.pathname}#s=${encodeMarginInput(input)}`
}

export async function copyShareUrl(input: MarginInput): Promise<boolean> {
  const url = buildShareUrl(input)
  if (!url) return false
  try {
    await navigator.clipboard.writeText(url)
    return true
  } catch {
    return false
  }
}
