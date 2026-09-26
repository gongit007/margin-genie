import { useState } from 'react'
import type { MarginInput } from '../engine'
import { deleteScenario, listScenarios, saveScenario, type SavedScenario } from '../storage/scenarioStorage'

type ScenarioPanelProps = {
  input: MarginInput
  onLoad: (input: MarginInput) => void
}

export function ScenarioPanel({ input, onLoad }: ScenarioPanelProps) {
  const [name, setName] = useState('')
  const [scenarios, setScenarios] = useState<SavedScenario[]>(() => listScenarios())
  const [message, setMessage] = useState('')

  const refresh = () => setScenarios(listScenarios())

  const handleSave = () => {
    const saved = saveScenario(name, input)
    if (!saved) {
      setMessage('시나리오 이름을 입력하세요.')
      return
    }
    setName('')
    setMessage(`"${saved.name}" 저장됨`)
    refresh()
  }

  const handleLoad = (scenario: SavedScenario) => {
    onLoad(scenario.input)
    setMessage(`"${scenario.name}" 불러옴`)
  }

  const handleDelete = (id: string) => {
    deleteScenario(id)
    refresh()
    setMessage('삭제됨')
  }

  return (
    <div className="rounded-3xl border border-line bg-paper p-6">
      <h3 className="font-semibold">시나리오 저장</h3>
      <p className="mt-1 text-xs text-black/50">현재 입력값을 이름 붙여 저장하고 나중에 다시 불러옵니다.</p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <input
          type="text"
          placeholder="예: 니트 가디건 · 쿠팡"
          className="flex-1 rounded-xl border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-ink"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave()
          }}
        />
        <button
          type="button"
          className="rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-white"
          onClick={handleSave}
        >
          저장
        </button>
      </div>
      {message ? <p className="mt-2 text-xs text-black/55">{message}</p> : null}
      {scenarios.length ? (
        <ul className="mt-4 space-y-2">
          {scenarios.map((s) => (
            <li key={s.id} className="flex items-center justify-between gap-3 rounded-xl border border-line px-3 py-2 text-sm">
              <div className="min-w-0">
                <p className="truncate font-medium">{s.name}</p>
                <p className="text-xs text-black/45">{new Date(s.savedAt).toLocaleString('ko-KR')}</p>
              </div>
              <div className="flex shrink-0 gap-2">
                <button type="button" className="text-xs underline" onClick={() => handleLoad(s)}>
                  불러오기
                </button>
                <button type="button" className="text-xs text-red-700 underline" onClick={() => handleDelete(s.id)}>
                  삭제
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-black/45">저장된 시나리오가 없습니다.</p>
      )}
    </div>
  )
}
