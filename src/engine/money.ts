/** KRW integer money. Rates are 0–1 decimals. */

export function won(n: number): number {
  if (!Number.isFinite(n)) return 0
  return Math.round(n)
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n))
}

export function ratio(part: number, whole: number): number {
  if (whole === 0) return 0
  return part / whole
}

export function pct(n: number | null, digits = 1): string {
  if (n === null || !Number.isFinite(n)) return '—'
  return `${(n * 100).toFixed(digits)}%`
}

export function krw(n: number): string {
  const sign = n < 0 ? '-' : ''
  return `${sign}₩${Math.abs(won(n)).toLocaleString('ko-KR')}`
}
