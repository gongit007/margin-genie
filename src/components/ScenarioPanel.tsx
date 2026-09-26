import { useState } from 'react'
import type { MarginInput } from '../engine'
import {
  deleteScenario,
  downloadScenariosBackup,
  importScenariosJson,
  listScenarios,
  saveScenario,
  type SavedScenario,
} from '../storage/scenarioStorage'

type ScenarioPanelProps = {
  input: MarginInput
  onLoad: (input: MarginInput) => void
  onMutate?: () => void
}

export function ScenarioPanel({ input, onLoad, onMutate }: ScenarioPanelProps) {
  const [name, setName] = useState('')
  const [scenarios, setScenarios] = useState<SavedScenario[]>(() => listScenarios())
  const [message, setMessage] = useState('')

  const refresh = () => {
    setScenarios(listScenarios())
    onMutate?.()
  }

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
      <h3 className="panel-title">시나리오 저장</h3>
      <p className="mt-1 text-help">현재 입력값을 이름 붙여 저장하고 나중에 다시 불러옵니다.</p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <input
          type="text"
          placeholder="예: 니트 가디건 · 쿠팡"
          className="input-field flex-1 text-sm"
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
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          className="rounded-full border border-line px-3 py-1 text-xs font-medium hover:bg-canvas"
          onClick={() => downloadScenariosBackup()}
        >
          JSON 백업
        </button>
        <label className="cursor-pointer rounded-full border border-line px-3 py-1 text-xs font-medium hover:bg-canvas">
          JSON 불러오기
          <input
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0]
              if (!file) return
              try {
                const text = await file.text()
                const count = importScenariosJson(text)
                setMessage(`${count}개 시나리오를 불러왔습니다.`)
                refresh()
              } catch {
                setMessage('JSON 파일을 읽지 못했습니다.')
              }
              e.target.value = ''
            }}
          />
        </label>
      </div>
      {message ? <p className="mt-2 text-help">{message}</p> : null}
      {scenarios.length ? (
        <ul className="mt-4 space-y-2">
          {scenarios.map((s) => (
            <li key={s.id} className="flex items-center justify-between gap-3 rounded-xl border border-line px-3 py-2 text-sm">
              <div className="min-w-0">
                <p className="truncate font-medium">{s.name}</p>
                <p className="text-help">{new Date(s.savedAt).toLocaleString('ko-KR')}</p>
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
        <p className="mt-4 text-help">저장된 시나리오가 없습니다.</p>
      )}
    </div>
  )
}
