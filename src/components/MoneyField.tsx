import { useState } from 'react'

function parseWon(raw: string): number {
  const n = Number(raw.replace(/[^\d]/g, ''))
  return Number.isFinite(n) ? n : 0
}

function formatWon(n: number): string {
  return n > 0 ? n.toLocaleString('ko-KR') : ''
}

type MoneyFieldProps = {
  label: string
  value: number
  onChange: (n: number) => void
}

export function MoneyField({ label, value, onChange }: MoneyFieldProps) {
  const [focused, setFocused] = useState(false)
  const [draft, setDraft] = useState('')

  const shown = focused ? draft : formatWon(value)

  return (
    <label className="block">
      <span className="field-label">{label}</span>
      <div className="relative mt-1.5">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-subtle">₩</span>
        <input
          type="text"
          inputMode="numeric"
          autoComplete="off"
          placeholder="0"
          aria-label={label}
          className="input-money"
          value={shown}
          onFocus={() => {
            setFocused(true)
            setDraft(value > 0 ? String(Math.round(value)) : '')
          }}
          onBlur={() => {
            setFocused(false)
            onChange(parseWon(draft))
          }}
          onChange={(e) => {
            const raw = e.target.value.replace(/[^\d]/g, '')
            setDraft(raw)
            onChange(parseWon(raw))
          }}
        />
      </div>
    </label>
  )
}
