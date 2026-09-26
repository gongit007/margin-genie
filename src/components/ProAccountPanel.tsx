import { useMemo, useState } from 'react'
import type { ChannelCode, MarginInput } from '../engine'
import {
  enableProTrial,
  getSession,
  isProActive,
  signIn,
  signOut,
  type ProSession,
} from '../pro/accountStorage'
import { getAccountSyncMeta, pullAccountSync, pushAccountSync } from '../pro/syncService'

type ProAccountPanelProps = {
  input: MarginInput
  compareChannels: ChannelCode[]
  onRestore: (payload: { input: MarginInput; compareChannels: ChannelCode[]; scenarioCount: number }) => void
  onSessionChange: (session: ProSession | null) => void
}

export function ProAccountPanel({ input, compareChannels, onRestore, onSessionChange }: ProAccountPanelProps) {
  const [session, setSession] = useState<ProSession | null>(() => getSession())
  const [email, setEmail] = useState(session?.account.email ?? '')
  const [displayName, setDisplayName] = useState(session?.account.displayName ?? '')
  const [message, setMessage] = useState('')
  const [teamCode, setTeamCode] = useState(session?.account.id ?? '')

  const syncMeta = useMemo(
    () => (session ? getAccountSyncMeta(session.account.id) : null),
    [session, message],
  )
  const proActive = isProActive(session)

  const updateSession = (next: ProSession | null) => {
    setSession(next)
    onSessionChange(next)
  }

  const handleSignIn = () => {
    const next = signIn(email, displayName, { enablePro: true })
    if (!next) {
      setMessage('이메일과 이름을 입력하세요.')
      return
    }
    updateSession(next)
    setTeamCode(next.account.id)
    setMessage(`${next.account.displayName}님, Pro 체험 계정으로 로그인했습니다.`)
  }

  const handleSignOut = () => {
    signOut()
    updateSession(null)
    setMessage('로그아웃했습니다.')
  }

  const handleEnableTrial = () => {
    if (!session) return
    const next = enableProTrial(session)
    updateSession(next)
    setMessage('Pro 기능이 활성화되었습니다.')
  }

  const handlePush = () => {
    if (!session) return
    try {
      const meta = pushAccountSync(session.account.id, input, compareChannels)
      setMessage(`클라우드 업로드 완료 · rev ${meta.revision}`)
    } catch {
      setMessage('클라우드 업로드에 실패했습니다.')
    }
  }

  const handlePull = () => {
    if (!session) return
    const restored = pullAccountSync(session.account.id)
    if (!restored) {
      setMessage('클라우드에 저장된 데이터가 없습니다. 먼저 업로드하세요.')
      return
    }
    onRestore({
      input: restored.input,
      compareChannels: restored.compareChannels,
      scenarioCount: restored.scenarioCount,
    })
    setMessage(`클라우드 복원 완료 · rev ${restored.revision} · 시나리오 ${restored.scenarioCount}개`)
  }

  const handleTeamPull = () => {
    const accountId = teamCode.trim()
    if (!accountId) {
      setMessage('팀 공유 코드(계정 ID)를 입력하세요.')
      return
    }
    const restored = pullAccountSync(accountId)
    if (!restored) {
      setMessage('해당 코드의 클라우드 데이터를 찾지 못했습니다.')
      return
    }
    onRestore({
      input: restored.input,
      compareChannels: restored.compareChannels,
      scenarioCount: restored.scenarioCount,
    })
    setMessage(`팀 워크스페이스 불러옴 · 시나리오 ${restored.scenarioCount}개`)
  }

  return (
    <div id="pro" className="mt-4 rounded-3xl border border-ink bg-ink p-6 text-white" data-testid="pro-account-panel">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs tracking-[0.16em] text-white/50">PRO</p>
          <h3 className="mt-1 text-lg font-semibold">계정 · 클라우드 동기화</h3>
          <p className="mt-1 text-sm text-white/65">입력·시나리오·비교 채널을 계정 클라우드에 저장하고 다른 기기/팀과 공유합니다.</p>
        </div>
        {proActive ? (
          <span className="rounded-full bg-brand px-3 py-1 text-xs font-semibold text-brandink">Pro 활성</span>
        ) : (
          <span className="rounded-full border border-white/20 px-3 py-1 text-xs text-white/70">Pro 필요</span>
        )}
      </div>

      {!session ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="text-sm text-white/70">이메일</span>
            <input
              className="mt-1 w-full rounded-xl border border-white/15 bg-white/10 px-3 py-2.5 text-white placeholder:text-white/35"
              value={email}
              placeholder="you@shop.com"
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="text-sm text-white/70">이름</span>
            <input
              className="mt-1 w-full rounded-xl border border-white/15 bg-white/10 px-3 py-2.5 text-white placeholder:text-white/35"
              value={displayName}
              placeholder="예: Gong"
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </label>
          <button
            type="button"
            className="rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-brandink sm:col-span-2"
            onClick={handleSignIn}
          >
            Pro 체험 시작
          </button>
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          <p className="text-sm text-white/75">
            {session.account.displayName} · {session.account.email}
          </p>
          {!proActive ? (
            <button type="button" className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-brandink" onClick={handleEnableTrial}>
              Pro 체험 활성화
            </button>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <button type="button" className="rounded-full border border-white/20 px-3 py-1 text-xs hover:bg-white/10" onClick={handlePush}>
              클라우드 업로드
            </button>
            <button type="button" className="rounded-full border border-white/20 px-3 py-1 text-xs hover:bg-white/10" onClick={handlePull}>
              클라우드 복원
            </button>
            <button type="button" className="rounded-full border border-white/20 px-3 py-1 text-xs hover:bg-white/10" onClick={handleSignOut}>
              로그아웃
            </button>
          </div>
          {syncMeta ? (
            <p className="text-xs text-white/50">
              마지막 동기화 {new Date(syncMeta.syncedAt).toLocaleString('ko-KR')} · rev {syncMeta.revision}
            </p>
          ) : null}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm font-medium">팀 공유 코드</p>
            <p className="mt-1 break-all text-xs text-white/55">{session.account.id}</p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <input
                className="flex-1 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/35"
                value={teamCode}
                placeholder="팀원 계정 ID 붙여넣기"
                onChange={(e) => setTeamCode(e.target.value)}
              />
              <button type="button" className="rounded-full border border-white/20 px-3 py-2 text-xs hover:bg-white/10" onClick={handleTeamPull}>
                팀 데이터 불러오기
              </button>
            </div>
          </div>
        </div>
      )}
      {message ? <p className="mt-3 text-xs text-white/60">{message}</p> : null}
    </div>
  )
}
