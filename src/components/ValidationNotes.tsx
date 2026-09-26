type ValidationNotesProps = {
  errors: string[]
  warnings: string[]
}

export function ValidationNotes({ errors, warnings }: ValidationNotesProps) {
  if (!errors.length && !warnings.length) return null

  return (
    <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
      {errors.length ? (
        <div>
          <p className="font-medium">입력 확인</p>
          <ul className="mt-1 list-disc pl-5">
            {errors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {warnings.length ? (
        <div className={errors.length ? 'mt-3' : ''}>
          <p className="font-medium">계산 참고</p>
          <ul className="mt-1 list-disc pl-5">
            {warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}
