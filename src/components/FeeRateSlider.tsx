type FeeRateSliderProps = {
  label: string
  value: number
  min: number
  max: number
  step?: number
  onChange: (rate: number) => void
}

export function FeeRateSlider({ label, value, min, max, step = 0.1, onChange }: FeeRateSliderProps) {
  return (
    <label className="block sm:col-span-2 text-sm">
      {label} {(value * 100).toFixed(1)}%
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value * 100}
        onChange={(e) => onChange(Number(e.target.value) / 100)}
      />
    </label>
  )
}
