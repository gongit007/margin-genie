import { useEffect, useMemo, useState, type HTMLAttributes, type ReactNode } from 'react'
import { ChannelComparePanel } from './components/ChannelComparePanel'
import { AiExplainPanel } from './components/AiExplainPanel'
import { ChannelInsightPanel } from './components/ChannelInsightPanel'
import { FeeRateSlider } from './components/FeeRateSlider'
import { MoneyField } from './components/MoneyField'
import { ProAccountPanel } from './components/ProAccountPanel'
import { ScenarioComparePanel } from './components/ScenarioComparePanel'
import { ScenarioPanel } from './components/ScenarioPanel'
import { SensitivityPanel } from './components/SensitivityPanel'
import { SeoHead, FAQ_ITEMS } from './components/SeoHead'
import { ValidationNotes } from './components/ValidationNotes'
import { downloadChannelCompareCsv } from './export/channelCompareCsv'
import { downloadMarginCsv } from './export/marginCsv'
import { printMarginReport } from './export/marginReport'
import {
  calculateMargin,
  channelLabel,
  compareChannels,
  COUPANG_CATEGORY_PRESETS,
  emptyInput,
  ENGINE_VERSION,
  interpret,
  krw,
  pct,
  POLICY_VERSION,
  priceLadder,
  riskLabel,
  validateInput,
  type AdMode,
  type ChannelCode,
  type MarginInput,
  type MarginResult,
  type PromoBearer,
  type ShippingPayer,
  type VatMode,
} from './engine'
import { copyShareUrl, readShareFromHash } from './share/inputShare'
import { defaultCompareChannels, loadCompareChannels, saveCompareChannels } from './storage/compareChannelStorage'
import { downloadFullBackup, importFullBackupJson } from './storage/fullBackup'
import { loadMarginInput, saveMarginInput } from './storage/marginInputStorage'
import { getSession, isProActive, type ProSession } from './pro/accountStorage'

const ALL_COMPARE_CHANNELS = defaultCompareChannels()

const DEMO: MarginInput = {
  ...emptyInput(),
  productName: '니트 가디건',
  listPrice: 89000,
  productCost: 32000,
  shippingCost: 3000,
  packagingCost: 1500,
  advertisingMode: 'PERCENT_OF_NET',
  advertisingRate: 0.06,
}

function loadInitialState(): { input: MarginInput; compareChannels: ChannelCode[] } {
  if (typeof window !== 'undefined') {
    const fromHash = readShareFromHash(window.location.hash)
    if (fromHash) {
      return {
        input: fromHash.input,
        compareChannels: fromHash.compareChannels ?? loadCompareChannels(ALL_COMPARE_CHANNELS),
      }
    }
  }
  return {
    input: loadMarginInput(DEMO),
    compareChannels: loadCompareChannels(ALL_COMPARE_CHANNELS),
  }
}

function matchingCoupangPresetId(rate: number): string {
  const match = COUPANG_CATEGORY_PRESETS.find((preset) => Math.abs(preset.rate - rate) < 0.0001)
  return match?.id ?? 'custom'
}

export default function App() {
  const initial = loadInitialState()
  const [menu, setMenu] = useState(false)
  const [input, setInput] = useState<MarginInput>(initial.input)
  const [shareMessage, setShareMessage] = useState('')
  const [selectedCompareChannels, setSelectedCompareChannels] = useState<ChannelCode[]>(initial.compareChannels)
  const [backupMessage, setBackupMessage] = useState('')
  const [proSession, setProSession] = useState<ProSession | null>(() => getSession())
  const patch = (partial: Partial<MarginInput>) => setInput((prev) => ({ ...prev, ...partial }))

  const handleShare = async () => {
    const ok = await copyShareUrl(input, selectedCompareChannels)
    setShareMessage(ok ? '계산·비교 채널 링크가 클립보드에 복사됐습니다.' : '링크 복사에 실패했습니다.')
  }

  useEffect(() => {
    saveMarginInput(input)
  }, [input])
  useEffect(() => {
    saveCompareChannels(selectedCompareChannels)
  }, [selectedCompareChannels])

  const toggleCompareChannel = (code: ChannelCode) => {
    setSelectedCompareChannels((prev) => {
      if (prev.includes(code)) {
        return prev.length <= 1 ? prev : prev.filter((c) => c !== code)
      }
      return [...prev, code]
    })
  }

  const result = useMemo(() => calculateMargin(input), [input])
  const rows = useMemo(() => compareChannels(input, selectedCompareChannels), [input, selectedCompareChannels])
  const best = rows.reduce((a, b) => (a.contributionProfit > b.contributionProfit ? a : b))

  return (
    <div className="min-h-screen">
      <SeoHead />
      <header className="sticky top-0 z-30 border-b border-line/80 bg-canvas/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <button type="button" className="text-lg" aria-label="메뉴" onClick={() => setMenu(true)}>
            ☰
          </button>
          <a href="#top" className="flex items-center gap-2 font-semibold">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand text-sm font-bold">G</span>
            마진지니
          </a>
          <a href="#calculator" className="rounded-full bg-ink px-4 py-2 text-sm text-white">
            {isProActive(proSession) ? 'Pro 사용 중' : '무료로 시작 →'}
          </a>
        </div>
      </header>

      {menu ? (
        <div className="fixed inset-0 z-40 bg-ink/40" onClick={() => setMenu(false)}>
          <nav
            className="h-full w-72 bg-paper p-6"
            aria-label="주요 메뉴"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="mb-6 text-sm text-black/50">메뉴</p>
            {[
              ['#problem', '01 문제'],
              ['#steps', '02 4단계'],
              ['#calculator', '03 계산기'],
              ['#pro', '04 Pro'],
              ['#pricing', '05 요금'],
              ['#faq', '06 FAQ'],
            ].map(([href, label]) => (
              <a
                key={href}
                href={href}
                className="block border-b border-line py-3"
                onClick={() => setMenu(false)}
              >
                {label}
              </a>
            ))}
          </nav>
        </div>
      ) : null}

      <main id="top">
        <section className="relative overflow-hidden" aria-labelledby="hero-title">
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand/50 blur-3xl" />
          <div className="mx-auto max-w-6xl px-4 pb-10 pt-16 md:pt-24">
            <p className="mb-4 inline-flex items-center rounded-full border border-line bg-paper px-3 py-1 text-xs">
              계산 엔진과 AI 설명을 분리 · 수수료 출처 표시
            </p>
            <h1 id="hero-title" className="max-w-3xl text-4xl font-semibold leading-tight md:text-6xl">
              팔기 전에 계산하는
              <br />
              <span className="mark-yellow">온라인 셀러 마진·실마진</span> 계산기
            </h1>
            <p className="mt-5 max-w-xl text-lg text-black/65">
              스마트스토어·쿠팡·11번가·G마켓·옥션·카카오·롯데ON·자사몰 8채널 수수료, 광고비, 할인까지 반영해 공헌이익과
              손익분기를 즉시 계산합니다. 숫자는 AI가 아닌 Margin Engine이 만듭니다.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <a href="#calculator" className="rounded-full bg-brand px-6 py-3 text-sm font-semibold text-brandink">
                무료로 시작하기 →
              </a>
              <a href="#steps" className="text-sm font-medium underline underline-offset-4">
                4단계 구조 보기
              </a>
            </div>
            <div className="mt-14 grid gap-8 border-t border-line pt-8 sm:grid-cols-3">
              <Stat n="Engine" l="숫자가 LLM이 아님" />
              <Stat n="8+" l="주요 오픈마켓 + 자사몰" />
              <Stat n="출처" l="VERIFIED / ESTIMATED 구분" />
            </div>

            <div className="mt-12 rounded-3xl border border-line bg-paper p-5 shadow-[0_20px_60px_rgba(0,0,0,0.04)] md:p-8">
              <p className="text-xs font-semibold tracking-[0.16em] text-black/40">CHANNEL MARGIN · LIVE</p>
              <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold">{input.productName.trim() || '샘플 상품'}</p>
                  <p className="text-3xl font-semibold tabular-nums">{krw(input.listPrice)}</p>
                  <p className="text-sm text-black/50">원가 {krw(input.productCost)}</p>
                  <a
                    href="#calculator"
                    className="mt-2 inline-block text-sm text-black/45 underline underline-offset-2 hover:text-ink"
                  >
                    계산기에서 판매가·원가 수정 →
                  </a>
                </div>
                <p className="text-sm text-black/55">
                  아래 채널 마진은 위 숫자와 <strong>같은 계산 엔진</strong>으로 실시간 갱신됩니다.
                </p>
              </div>
              <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {rows.map((row) => {
                  const win = row.feePolicy.channel === best.feePolicy.channel
                  return (
                    <div
                      key={row.feePolicy.channel}
                      className={`rounded-2xl border p-4 ${win ? 'border-ink bg-ink text-white' : 'border-line'}`}
                    >
                      <p className="text-sm font-medium">{row.feePolicy.name}</p>
                      <p className={`mt-1 text-xs ${win ? 'text-white/60' : 'text-black/45'}`}>
                        수수료 {pct(row.salesFee / Math.max(1, row.netSales))} · 광고 {pct(input.advertisingRate)}
                      </p>
                      <p className="mt-4 font-serif text-3xl">{pct(row.marginRate)}</p>
                      <p className="mt-1 text-sm tabular-nums">{krw(row.contributionProfit)}</p>
                    </div>
                  )
                })}
              </div>
              <p className="mt-4 text-sm text-black/60">
                {best.feePolicy.name}가 현재 입력에서 공헌이익이 가장 높습니다.
                {rows.some((r) => r.risk === 'LOSS') ? ' 적자 채널은 진입을 보류하세요.' : ''}
              </p>
              <button
                type="button"
                className="mt-3 text-sm font-medium underline"
                onClick={() => downloadChannelCompareCsv(rows)}
              >
                채널 비교 CSV 내보내기
              </button>
            </div>
          </div>
        </section>

        <section id="problem" className="border-t border-line bg-paper py-20">
          <div className="mx-auto max-w-6xl px-4">
            <p className="text-xs font-semibold tracking-[0.16em] text-black/40">01 THE PROBLEM</p>
            <h2 className="mt-3 max-w-3xl text-3xl font-semibold md:text-4xl">
              매출은 나는데, 남는 게 왜 없는지
              <br />
              모르는 사장님들.
            </h2>
            <div className="mt-10 grid gap-4 md:grid-cols-2">
              {[
                ['채널 수수료 구조가 다름', '같은 상품도 스마트스토어와 쿠팡의 실마진이 갈립니다.'],
                ['광고 빼고 나면 숫자가 바뀜', 'ROAS만 보면 남는 줄 알다가, 공헌이익은 빠질 수 있습니다.'],
                ['할인·쿠폰 후 적자', '행사 전에 시뮬하지 않으면 팔수록 손해인 조건을 놓칩니다.'],
                ['반품·배송까지 넣으면 더 복잡', '원가 하나가 아니라 변동비 전체가 가격 결정의 기준입니다.'],
              ].map(([t, d]) => (
                <article key={t} className="rounded-2xl border border-line p-5">
                  <h3 className="font-semibold">{t}</h3>
                  <p className="mt-2 text-sm text-black/60">{d}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="steps" className="py-20">
          <div className="mx-auto max-w-6xl px-4">
            <p className="text-xs font-semibold tracking-[0.16em] text-black/40">02 HOW IT WORKS</p>
            <h2 className="mt-3 max-w-3xl text-3xl font-semibold md:text-4xl">
              감에 의존하던 판매를
              <br />
              데이터 결정으로 바꾸는 4단계
            </h2>
            <div className="mt-10 grid gap-4 md:grid-cols-4">
              {[
                ['01', '원가 입력', '원가·포장·배송을 분리해 손익 기준을 만듭니다.'],
                ['02', '채널 선택', '판매수수료와 결제수수료를 정책 객체로 붙입니다.'],
                ['03', '시뮬레이션', '할인·광고·무료배송을 넣어 실마진과 BEP를 봅니다.'],
                ['04', '실행 결정', '팔아도 되는지, 어디서 팔지, 얼마에 팔지를 고릅니다.'],
              ].map(([n, t, d]) => (
                <article key={n} className="rounded-2xl bg-paper p-5">
                  <p className="font-serif text-2xl text-black/30">{n}</p>
                  <h3 className="mt-3 font-semibold">{t}</h3>
                  <p className="mt-2 text-sm text-black/60">{d}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <Calculator
          input={input}
          patch={patch}
          result={result}
          channelRows={rows}
          onLoad={setInput}
          onShare={handleShare}
          shareMessage={shareMessage}
          onReset={() => setInput({ ...DEMO })}
          selectedCompareChannels={selectedCompareChannels}
          allCompareChannels={ALL_COMPARE_CHANNELS}
          onToggleCompareChannel={toggleCompareChannel}
          backupMessage={backupMessage}
          onFullBackup={() => downloadFullBackup(input, selectedCompareChannels)}
          onFullImport={async (file) => {
            try {
              const text = await file.text()
              const restored = importFullBackupJson(text)
              setInput(restored.input)
              setSelectedCompareChannels(restored.compareChannels)
              setBackupMessage(`백업 복원 완료 · 시나리오 ${restored.scenarioCount}개`)
            } catch {
              setBackupMessage('백업 파일을 읽지 못했습니다.')
            }
          }}
          proSession={proSession}
          onProSessionChange={setProSession}
          onCloudRestore={({ input: restoredInput, compareChannels, scenarioCount }) => {
            setInput(restoredInput)
            setSelectedCompareChannels(compareChannels)
            setBackupMessage(`클라우드 복원 완료 · 시나리오 ${scenarioCount}개`)
          }}
        />

        <section className="border-t border-line bg-paper py-20">
          <div className="mx-auto max-w-6xl px-4">
            <p className="text-xs font-semibold tracking-[0.16em] text-black/40">03 WHO</p>
            <h2 className="mt-3 text-3xl font-semibold">각자의 질문에 맞춰 씁니다</h2>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {[
                ['예비창업자', '얼마에 팔아야 손해가 없나요?', '최소 판매가와 목표 마진 가격을 먼저 역산합니다.'],
                ['초기 셀러', '쿠팡이랑 네이버 어디가 더 남나요?', '동일 조건 채널 비교로 개당 공헌이익을 봅니다.'],
                ['브랜드 운영', '이번 할인해도 될까요?', '프로모션 시나리오를 한 화면에서 겹쳐 봅니다.'],
              ].map(([t, q, a]) => (
                <article key={t} className="rounded-2xl border border-line p-5">
                  <p className="text-xs text-black/40">{t}</p>
                  <h3 className="mt-2 font-semibold">{q}</h3>
                  <p className="mt-2 text-sm text-black/60">{a}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="pricing" className="py-20">
          <div className="mx-auto max-w-6xl px-4">
            <p className="text-xs font-semibold tracking-[0.16em] text-black/40">04 PRICING</p>
            <h2 className="mt-3 text-3xl font-semibold">지금은 계산기를 먼저 완벽하게</h2>
            <p className="mt-2 text-black/55">UTON식 대형 SaaS 구독을 처음부터 받지 않습니다. 엔진 신뢰가 제품입니다.</p>
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <article className="rounded-3xl bg-paper p-6">
                <p className="text-sm">Free</p>
                <p className="mt-2 font-serif text-4xl">₩0</p>
                <ul className="mt-4 space-y-2 text-sm text-black/65">
                  <li>빠른 마진 계산</li>
                  <li>8채널 비교 · 채널 추천 · 역산 · 시나리오</li>
                  <li>CSV · PDF/인쇄 · 링크 공유 · 전체 백업</li>
                  <li>수수료 출처 표시</li>
                </ul>
                <a href="#calculator" className="mt-6 inline-block rounded-full bg-brand px-5 py-2 text-sm font-semibold">
                  지금 계산하기
                </a>
              </article>
              <article className="rounded-3xl border border-ink bg-ink p-6 text-white">
                <p className="text-sm text-white/70">Pro · 체험 가능</p>
                <p className="mt-2 font-serif text-4xl">₩9,900</p>
                <ul className="mt-4 space-y-2 text-sm text-white/70">
                  <li>클라우드 동기화 · 팀 공유 코드</li>
                  <li>엔진 결과 AI 설명 레이어</li>
                  <li>결제 · 구독 관리 (준비 중)</li>
                </ul>
                <a href="#pro" className="mt-6 inline-block rounded-full bg-brand px-5 py-2 text-sm font-semibold text-brandink">
                  Pro 체험 시작
                </a>
              </article>
            </div>
          </div>
        </section>

        <section id="faq" className="border-t border-line bg-paper py-20" itemScope itemType="https://schema.org/FAQPage">
          <div className="mx-auto max-w-3xl px-4">
            <h2 className="text-3xl font-semibold">자주 묻는 질문</h2>
            {FAQ_ITEMS.map((item: (typeof FAQ_ITEMS)[number]) => (
              <Faq key={item.question} q={item.question}>
                {item.answer}
              </Faq>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-line px-4 py-10 text-center text-xs text-black/45">
        <p>마진지니 · 세무·투자 자문이 아닙니다. 최종 정산은 각 판매자센터를 확인하세요.</p>
        <p className="mt-1">
          엔진 {ENGINE_VERSION} · 정책 {POLICY_VERSION}
        </p>
        <p className="mt-2">
          <a href="/llms.txt" className="underline underline-offset-2">
            llms.txt
          </a>
          {' · '}
          <a href="/sitemap.xml" className="underline underline-offset-2">
            sitemap
          </a>
        </p>
      </footer>
    </div>
  )
}

function Stat({ n, l }: { n: string; l: string }) {
  return (
    <div>
      <p className="font-serif text-4xl">{n}</p>
      <p className="mt-1 text-sm text-black/50">{l}</p>
    </div>
  )
}

function Faq({ q, children }: { q: string; children: ReactNode }) {
  return (
    <details
      className="mt-4 border-b border-line py-4"
      itemScope
      itemProp="mainEntity"
      itemType="https://schema.org/Question"
    >
      <summary className="cursor-pointer font-medium" itemProp="name">
        {q}
      </summary>
      <div itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
        <p className="mt-2 text-sm text-black/60" itemProp="text">
          {children}
        </p>
      </div>
    </details>
  )
}

function Calculator({
  input,
  patch,
  result,
  channelRows,
  onLoad,
  onShare,
  shareMessage,
  onReset,
  selectedCompareChannels,
  allCompareChannels,
  onToggleCompareChannel,
  backupMessage,
  onFullBackup,
  onFullImport,
  proSession,
  onProSessionChange,
  onCloudRestore,
}: {
  input: MarginInput
  patch: (p: Partial<MarginInput>) => void
  result: ReturnType<typeof calculateMargin>
  channelRows: MarginResult[]
  onLoad: (input: MarginInput) => void
  onShare: () => void
  shareMessage: string
  onReset: () => void
  selectedCompareChannels: ChannelCode[]
  allCompareChannels: ChannelCode[]
  onToggleCompareChannel: (code: ChannelCode) => void
  backupMessage: string
  onFullBackup: () => void
  onFullImport: (file: File) => void | Promise<void>
  proSession: ProSession | null
  onProSessionChange: (session: ProSession | null) => void
  onCloudRestore: (payload: {
    input: MarginInput
    compareChannels: ChannelCode[]
    scenarioCount: number
  }) => void
}) {
  const insight = interpret(result, input)
  const risk = riskLabel(result.risk)
  const inputErrors = useMemo(() => validateInput(input), [input])
  const [advanced, setAdvanced] = useState(false)
  const [scenarioRefreshKey, setScenarioRefreshKey] = useState(0)
  const [feeOverride, setFeeOverride] = useState(
    () => input.customSalesFeeRate != null || input.customPaymentFeeRate != null,
  )
  const isMarketplace =
    input.channel === 'NAVER_SMARTSTORE' ||
    input.channel === 'COUPANG' ||
    input.channel === 'ELEVEN_ST' ||
    input.channel === 'GMARKET' ||
    input.channel === 'AUCTION' ||
    input.channel === 'KAKAO' ||
    input.channel === 'LOTTEON'
  const ladder = useMemo(() => {
    const mid = input.listPrice
    const prices = [mid - 20000, mid - 8000, mid, mid + 10000, mid + 20000].filter((p) => p >= 1000)
    return priceLadder(input, prices)
  }, [input])
  const promoRows = useMemo(() => {
    const scenarios: { name: string; next: Partial<MarginInput> }[] = [
      { name: '정상', next: { discountRate: 0 } },
      { name: '10% 할인', next: { discountRate: 0.1 } },
      { name: '15% + 무료배송', next: { discountRate: 0.15, shippingPayer: 'FREE' } },
      { name: '20% + 광고 10%', next: { discountRate: 0.2, advertisingMode: 'PERCENT_OF_NET', advertisingRate: 0.1 } },
    ]
    return scenarios.map((s) => ({ name: s.name, result: calculateMargin({ ...input, ...s.next }) }))
  }, [input])
  const channels: ChannelCode[] = [
    'NAVER_SMARTSTORE',
    'COUPANG',
    'ELEVEN_ST',
    'GMARKET',
    'AUCTION',
    'KAKAO',
    'LOTTEON',
    'OWN_STORE',
    'CUSTOM',
  ]

  const handleChannelChange = (channel: ChannelCode) => {
    if (channel === 'OWN_STORE') {
      patch({
        channel,
        customSalesFeeRate: input.customSalesFeeRate ?? 0,
        customPaymentFeeRate: input.customPaymentFeeRate ?? 0.033,
      })
      return
    }
    if (channel === 'CUSTOM') {
      patch({ channel })
      return
    }
    setFeeOverride(false)
    patch({ channel, customSalesFeeRate: null, customPaymentFeeRate: null })
  }

  return (
    <section id="calculator" className="border-t border-line bg-canvas py-20">
      <div className="mx-auto max-w-6xl px-4">
        <p className="text-xs font-semibold tracking-[0.16em] text-black/40">LIVE CALCULATOR</p>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-3xl font-semibold">내 상품, 얼마에 팔아야 남을까?</h2>
            <p className="mt-2 text-black/55">입력 4개로 시작하고, 상세 설정은 필요할 때만 엽니다.</p>
          </div>
          <button type="button" className="text-sm text-black/50 underline underline-offset-2 hover:text-ink" onClick={onReset}>
            입력 초기화
          </button>
        </div>
        <ValidationNotes errors={inputErrors} warnings={result.warnings} />

        <div className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.15fr)]">
          <div className="rounded-3xl border border-line bg-paper p-6">
            <h3 className="font-semibold">빠른 계산</h3>
            <div className="mt-4 grid gap-3">
              <label className="block">
                <span className="text-sm font-medium">상품명 (선택)</span>
                <input
                  className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2.5"
                  value={input.productName}
                  placeholder="예: 니트 가디건"
                  maxLength={80}
                  onChange={(e) => patch({ productName: e.target.value })}
                />
              </label>
              <MoneyField label="판매가" value={input.listPrice} onChange={(listPrice) => patch({ listPrice })} />
              <MoneyField label="상품 원가" value={input.productCost} onChange={(productCost) => patch({ productCost })} />
              <MoneyField label="배송비" value={input.shippingCost} onChange={(shippingCost) => patch({ shippingCost })} />
              <label className="block">
                <span className="text-sm font-medium">배송비 부담</span>
                <select
                  className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2.5"
                  value={input.shippingPayer}
                  onChange={(e) => patch({ shippingPayer: e.target.value as ShippingPayer })}
                >
                  <option value="SELLER">판매자 부담</option>
                  <option value="CUSTOMER">고객 부담 (별도)</option>
                  <option value="FREE">무료배송 (판매자)</option>
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-medium">판매 채널</span>
                <select
                  className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2.5"
                  value={input.channel}
                  onChange={(e) => handleChannelChange(e.target.value as ChannelCode)}
                >
                  {channels.map((c) => (
                    <option key={c} value={c}>
                      {channelLabel(c)}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <button type="button" className="mt-4 text-sm font-medium underline" onClick={() => setAdvanced((v) => !v)}>
              {advanced ? '상세 설정 접기' : '상세 설정 펼치기'}
            </button>
            {advanced ? (
              <div className="mt-4 grid gap-3 border-t border-line pt-4 sm:grid-cols-2">
                <MoneyField label="포장비" value={input.packagingCost} onChange={(packagingCost) => patch({ packagingCost })} />
                <MoneyField label="기타 변동비" value={input.otherCost} onChange={(otherCost) => patch({ otherCost })} />
                <MoneyField label="월 고정비" value={input.monthlyFixedCost} onChange={(monthlyFixedCost) => patch({ monthlyFixedCost })} />
                <label className="block sm:col-span-2">
                  <span className="text-sm font-medium">광고비 입력 방식</span>
                  <select
                    className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2.5"
                    value={input.advertisingMode}
                    onChange={(e) => patch({ advertisingMode: e.target.value as AdMode })}
                  >
                    <option value="PER_ORDER">개당 고정</option>
                    <option value="PERCENT_OF_NET">실매출 비율</option>
                    <option value="MONTHLY">월 예산 ÷ 판매량</option>
                  </select>
                </label>
                {input.advertisingMode === 'PER_ORDER' ? (
                  <MoneyField
                    label="개당 광고비"
                    value={input.advertisingPerOrder}
                    onChange={(advertisingPerOrder) => patch({ advertisingPerOrder })}
                  />
                ) : null}
                {input.advertisingMode === 'PERCENT_OF_NET' ? (
                  <FeeRateSlider
                    label="광고비율"
                    value={input.advertisingRate}
                    min={0}
                    max={40}
                    onChange={(advertisingRate) => patch({ advertisingRate })}
                  />
                ) : null}
                {input.advertisingMode === 'MONTHLY' ? (
                  <>
                    <MoneyField
                      label="월 광고 예산"
                      value={input.monthlyAdBudget}
                      onChange={(monthlyAdBudget) => patch({ monthlyAdBudget })}
                    />
                    <MoneyField
                      label="예상 월 판매량"
                      value={input.expectedMonthlyUnits}
                      onChange={(expectedMonthlyUnits) => patch({ expectedMonthlyUnits })}
                    />
                  </>
                ) : null}
                {input.channel === 'NAVER_SMARTSTORE' ? (
                  <>
                    <label className="block sm:col-span-2">
                      <span className="text-sm font-medium">판매수수료 유입 경로</span>
                      <select
                        className="mt-1 w-full rounded-xl border border-line px-3 py-2.5"
                        value={input.smartstoreInflow}
                        onChange={(e) =>
                          patch({ smartstoreInflow: e.target.value as MarginInput['smartstoreInflow'] })
                        }
                      >
                        <option value="DEFAULT">일반 유입 3% (VAT 포함)</option>
                        <option value="MARKETING">판매자 마케팅 유입 1% (VAT 포함)</option>
                      </select>
                    </label>
                    <label className="block sm:col-span-2">
                      <span className="text-sm font-medium">Npay 등급</span>
                      <select
                        className="mt-1 w-full rounded-xl border border-line px-3 py-2.5"
                        value={input.npayGrade}
                        onChange={(e) => patch({ npayGrade: e.target.value as MarginInput['npayGrade'] })}
                      >
                        <option value="MICRO">영세 1.947%</option>
                        <option value="SME1">중소1 2.563%</option>
                        <option value="SME2">중소2 2.728%</option>
                        <option value="SME3">중소3 3.003%</option>
                        <option value="GENERAL">일반 3.630%</option>
                      </select>
                    </label>
                  </>
                ) : null}
                {input.channel === 'COUPANG' ? (
                  <>
                    <label className="block sm:col-span-2">
                      <span className="text-sm font-medium">쿠팡 카테고리 프리셋</span>
                      <select
                        className="mt-1 w-full rounded-xl border border-line px-3 py-2.5"
                        value={matchingCoupangPresetId(input.coupangCategoryRate)}
                        onChange={(e) => {
                          const preset = COUPANG_CATEGORY_PRESETS.find((item) => item.id === e.target.value)
                          if (preset) patch({ coupangCategoryRate: preset.rate })
                        }}
                      >
                        {COUPANG_CATEGORY_PRESETS.map((preset) => (
                          <option key={preset.id} value={preset.id}>
                            {preset.label}
                          </option>
                        ))}
                        <option value="custom">직접 조정 (슬라이더)</option>
                      </select>
                    </label>
                    <FeeRateSlider
                      label="쿠팡 수수료 추정"
                      value={input.coupangCategoryRate}
                      min={4}
                      max={10.8}
                      onChange={(coupangCategoryRate) => patch({ coupangCategoryRate })}
                    />
                  </>
                ) : null}
                {input.channel === 'ELEVEN_ST' ? (
                  <FeeRateSlider
                    label="11번가 수수료 추정"
                    value={input.elevenstRate}
                    min={5}
                    max={15}
                    onChange={(elevenstRate) => patch({ elevenstRate })}
                  />
                ) : null}
                {input.channel === 'GMARKET' ? (
                  <FeeRateSlider
                    label="G마켓 수수료 추정"
                    value={input.gmarketRate}
                    min={8}
                    max={18}
                    onChange={(gmarketRate) => patch({ gmarketRate })}
                  />
                ) : null}
                {input.channel === 'AUCTION' ? (
                  <FeeRateSlider
                    label="옥션 수수료 추정"
                    value={input.auctionRate}
                    min={8}
                    max={18}
                    onChange={(auctionRate) => patch({ auctionRate })}
                  />
                ) : null}
                {input.channel === 'KAKAO' ? (
                  <FeeRateSlider
                    label="카카오쇼핑 수수료 추정"
                    value={input.kakaoRate}
                    min={5}
                    max={15}
                    onChange={(kakaoRate) => patch({ kakaoRate })}
                  />
                ) : null}
                {input.channel === 'LOTTEON' ? (
                  <FeeRateSlider
                    label="롯데ON 수수료 추정"
                    value={input.lotteonRate}
                    min={6}
                    max={16}
                    onChange={(lotteonRate) => patch({ lotteonRate })}
                  />
                ) : null}
                <label className="block">
                  <span className="text-sm font-medium">판매가·원가 VAT</span>
                  <select
                    className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2.5"
                    value={input.priceVatMode}
                    onChange={(e) => patch({ priceVatMode: e.target.value as VatMode })}
                  >
                    <option value="INCLUDED">VAT 포함 (소비자가 기준)</option>
                    <option value="EXCLUDED">VAT 별도 (공급가 기준)</option>
                    <option value="IGNORE">VAT 미적용</option>
                  </select>
                </label>
                <label className="block">
                  <span className="text-sm font-medium">수수료 VAT 해석</span>
                  <select
                    className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2.5"
                    value={input.feeVatMode}
                    onChange={(e) => patch({ feeVatMode: e.target.value as VatMode })}
                  >
                    <option value="IGNORE">채널 정책 따름 (권장)</option>
                    <option value="INCLUDED">전체 VAT 포함율</option>
                    <option value="EXCLUDED">전체 VAT 10% 가산</option>
                  </select>
                </label>
                {input.channel === 'OWN_STORE' || input.channel === 'CUSTOM' ? (
                  <>
                    <FeeRateSlider
                      label={input.channel === 'OWN_STORE' ? '플랫폼 수수료' : '판매수수료 (직접)'}
                      value={input.customSalesFeeRate ?? 0}
                      min={0}
                      max={30}
                      onChange={(customSalesFeeRate) => patch({ customSalesFeeRate })}
                    />
                    <FeeRateSlider
                      label={input.channel === 'OWN_STORE' ? 'PG 결제수수료' : '결제수수료 (직접)'}
                      value={input.customPaymentFeeRate ?? (input.channel === 'OWN_STORE' ? 0.033 : 0)}
                      min={0}
                      max={10}
                      onChange={(customPaymentFeeRate) => patch({ customPaymentFeeRate })}
                    />
                  </>
                ) : null}
                {isMarketplace ? (
                  <div className="sm:col-span-2 space-y-3 rounded-xl bg-canvas p-3">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={feeOverride}
                        onChange={(e) => {
                          const on = e.target.checked
                          setFeeOverride(on)
                          if (!on) patch({ customSalesFeeRate: null, customPaymentFeeRate: null })
                        }}
                      />
                      판매자센터 확정 수수료로 덮어쓰기
                    </label>
                    {feeOverride ? (
                      <div className="grid gap-3 sm:grid-cols-2">
                        <FeeRateSlider
                          label="판매수수료 (덮어쓰기)"
                          value={input.customSalesFeeRate ?? 0}
                          min={0}
                          max={30}
                          onChange={(customSalesFeeRate) => patch({ customSalesFeeRate })}
                        />
                        <FeeRateSlider
                          label="결제수수료 (덮어쓰기)"
                          value={input.customPaymentFeeRate ?? 0}
                          min={0}
                          max={10}
                          onChange={(customPaymentFeeRate) => patch({ customPaymentFeeRate })}
                        />
                      </div>
                    ) : null}
                  </div>
                ) : null}
                <label className="block sm:col-span-2 text-sm">
                  목표 실마진 {(input.targetMarginRate * 100).toFixed(0)}%
                  <input
                    type="range"
                    min={5}
                    max={60}
                    value={input.targetMarginRate * 100}
                    onChange={(e) => patch({ targetMarginRate: Number(e.target.value) / 100 })}
                  />
                </label>
                <MoneyField
                  label="월 목표 이익"
                  value={input.targetMonthlyProfit}
                  onChange={(targetMonthlyProfit) => patch({ targetMonthlyProfit })}
                />
                <MoneyField label="월 판매량" value={input.monthlyUnits} onChange={(monthlyUnits) => patch({ monthlyUnits })} />
                <label className="block sm:col-span-2">
                  <span className="text-sm font-medium">쿠폰 부담</span>
                  <select
                    className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2.5"
                    value={input.couponBearer}
                    onChange={(e) => patch({ couponBearer: e.target.value as PromoBearer })}
                  >
                    <option value="SELLER">판매자 전액</option>
                    <option value="PLATFORM">플랫폼 전액 (매출 차감 없음)</option>
                    <option value="SHARED">공동 부담</option>
                  </select>
                </label>
                <MoneyField label="쿠폰 금액" value={input.couponAmount} onChange={(couponAmount) => patch({ couponAmount })} />
                {input.couponBearer === 'SHARED' ? (
                  <label className="block sm:col-span-2 text-sm">
                    판매자 부담 {(input.couponSellerShare * 100).toFixed(0)}%
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={input.couponSellerShare * 100}
                      onChange={(e) => patch({ couponSellerShare: Number(e.target.value) / 100 })}
                    />
                  </label>
                ) : null}
                <FeeRateSlider
                  label="할인율"
                  value={input.discountRate}
                  min={0}
                  max={40}
                  onChange={(discountRate) => patch({ discountRate })}
                />
                <label className="block sm:col-span-2 text-sm">
                  반품률 {(input.returnRate * 100).toFixed(0)}%
                  <input
                    type="range"
                    min={0}
                    max={30}
                    value={input.returnRate * 100}
                    onChange={(e) => patch({ returnRate: Number(e.target.value) / 100 })}
                  />
                </label>
                {input.returnRate > 0 ? (
                  <>
                    <MoneyField
                      label="반품 배송비 (건당)"
                      value={input.returnShippingCost}
                      onChange={(returnShippingCost) => patch({ returnShippingCost })}
                    />
                    <label className="block sm:col-span-2 text-sm">
                      폐기율 {(input.discardRate * 100).toFixed(0)}%
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={input.discardRate * 100}
                        onChange={(e) => patch({ discardRate: Number(e.target.value) / 100 })}
                      />
                    </label>
                  </>
                ) : null}
                <MoneyField
                  label="목표 개당 이익 (역산)"
                  value={input.targetUnitProfit}
                  onChange={(targetUnitProfit) => patch({ targetUnitProfit })}
                />
              </div>
            ) : null}
          </div>

          <div className="space-y-4">
            <div className={`rounded-3xl p-6 ${risk.className}`}>
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">이 가격으로 팔아도 될까요?</p>
                <span className="rounded-full bg-white/70 px-2.5 py-0.5 text-xs">{risk.text}</span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <Metric label="공헌이익" value={krw(result.contributionProfit)} data-testid="margin-result-profit" />
                <Metric label="실마진율" value={pct(result.marginRate)} />
                <Metric label="손익분기" value={result.breakEvenPrice ? krw(result.breakEvenPrice) : '—'} />
                <Metric
                  label="목표 마진 가격"
                  value={result.targetMarginPrice ? krw(result.targetMarginPrice) : '—'}
                />
                {result.grossListPrice != null ? (
                  <Metric label="VAT 포함 판매가" value={krw(result.grossListPrice)} />
                ) : null}
                {result.priceVatAmount != null ? (
                  <Metric label="판매가 VAT (10%)" value={krw(result.priceVatAmount)} />
                ) : null}
              </div>
              <p className="mt-4 font-medium">{insight.headline}</p>
              <p className="mt-1 text-sm opacity-90">{insight.body}</p>
              {insight.actions.length ? (
                <ul className="mt-2 space-y-1 text-sm opacity-90">
                  {insight.actions.map((action) => (
                    <li key={action}>· {action}</li>
                  ))}
                </ul>
              ) : null}
            </div>
            <RoasPanel result={result} />
            <div className="rounded-3xl border border-line bg-paper p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-semibold">비용 구조</h3>
                <div className="flex flex-wrap gap-2">
                  <ExportButton label="CSV" onClick={() => downloadMarginCsv(input, result)} />
                  <ExportButton
                    label="PDF/인쇄"
                    onClick={() => printMarginReport(input, result, insight, channelRows)}
                  />
                  <ExportButton label="링크 복사" onClick={onShare} />
                </div>
              </div>
              {shareMessage ? <p className="mt-2 text-xs text-black/55">{shareMessage}</p> : null}
              <dl className="mt-3 space-y-1.5 text-sm">
                <Row k="판매가" v={krw(result.listPrice)} />
                {result.costLines.map((line) => (
                  <Row key={line.key} k={line.label} v={`−${krw(line.amount)}`} note={line.provenance?.status} />
                ))}
                <Row k="공헌이익" v={krw(result.contributionProfit)} strong />
              </dl>
              <div className="mt-4 space-y-2 rounded-xl bg-canvas p-3 text-xs text-black/55">
                {result.feePolicy.components.map((c) => (
                  <p key={c.code}>
                    <strong className="text-ink">{c.label}</strong> {(c.rate * 100).toFixed(3)}% · {c.verificationStatus}
                    <br />
                    {c.sourceReference}
                    {c.sourceUrl ? (
                      <>
                        {' '}
                        <a className="underline" href={c.sourceUrl} target="_blank" rel="noreferrer">
                          출처
                        </a>
                      </>
                    ) : null}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>

        <ChannelComparePanel
          rows={compareChannels(input, selectedCompareChannels)}
          allChannels={allCompareChannels}
          selectedChannels={selectedCompareChannels}
          onToggleChannel={onToggleCompareChannel}
        />
        <ChannelInsightPanel rows={compareChannels(input, selectedCompareChannels)} activeChannel={input.channel} />

        <div className="mt-8 rounded-3xl border border-line bg-paper p-6">
          <h3 className="font-semibold">가격을 바꿔보세요</h3>
          <input
            className="mt-4"
            type="range"
            min={Math.max(1000, Math.round(input.listPrice * 0.5))}
            max={Math.round(input.listPrice * 1.6)}
            step={100}
            value={input.listPrice}
            onChange={(e) => patch({ listPrice: Number(e.target.value) })}
          />
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead className="text-black/45">
                <tr>
                  <th className="py-2">판매가</th>
                  <th>공헌이익</th>
                  <th>실마진</th>
                  <th>판정</th>
                </tr>
              </thead>
              <tbody>
                {ladder.map((row) => (
                  <tr key={row.listPrice} className={row.listPrice === input.listPrice ? 'bg-brand/40' : ''}>
                    <td className="py-2 tabular-nums">{krw(row.listPrice)}</td>
                    <td className="tabular-nums">{krw(row.contributionProfit)}</td>
                    <td>{pct(row.marginRate)}</td>
                    <td>{riskLabel(row.risk).text}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <SensitivityPanel input={input} />

        <div className="mt-8">
          <ScenarioPanel input={input} onLoad={onLoad} onMutate={() => setScenarioRefreshKey((k) => k + 1)} />
          <ScenarioComparePanel refreshKey={scenarioRefreshKey} />
          <div className="mt-4 rounded-3xl border border-line bg-paper p-6">
            <h3 className="font-semibold">전체 백업</h3>
            <p className="mt-1 text-xs text-black/50">현재 입력·시나리오·비교 채널 설정을 한 JSON 파일로 저장합니다.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded-full border border-line px-3 py-1 text-xs font-medium hover:bg-canvas"
                onClick={onFullBackup}
              >
                전체 백업
              </button>
              <label className="cursor-pointer rounded-full border border-line px-3 py-1 text-xs font-medium hover:bg-canvas">
                전체 복원
                <input
                  type="file"
                  accept="application/json,.json"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) void onFullImport(file)
                    e.target.value = ''
                  }}
                />
              </label>
            </div>
            {backupMessage ? <p className="mt-2 text-xs text-black/55">{backupMessage}</p> : null}
          </div>
          <ProAccountPanel
            input={input}
            compareChannels={selectedCompareChannels}
            onRestore={(payload) => {
              onCloudRestore(payload)
              setScenarioRefreshKey((k) => k + 1)
            }}
            onSessionChange={onProSessionChange}
          />
          <AiExplainPanel
            session={proSession}
            input={input}
            result={result}
            channelRows={channelRows}
            activeChannel={input.channel}
          />
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-line bg-paper p-6">
            <h3 className="font-semibold">프로모션 시뮬</h3>
            <label className="mt-4 block text-sm">
              할인 {(input.discountRate * 100).toFixed(0)}%
              <input
                type="range"
                min={0}
                max={40}
                value={input.discountRate * 100}
                onChange={(e) => patch({ discountRate: Number(e.target.value) / 100 })}
              />
            </label>
            <table className="mt-3 w-full text-left text-sm">
              <tbody>
                {promoRows.map((row) => (
                  <tr key={row.name} className="border-t border-line">
                    <td className="py-2">{row.name}</td>
                    <td className="tabular-nums">{krw(row.result.contributionProfit)}</td>
                    <td>{pct(row.result.marginRate)}</td>
                    <td>{riskLabel(row.result.risk).text}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="rounded-3xl border border-line bg-paper p-6">
            <h3 className="font-semibold">역산</h3>
            <div className="mt-4 grid gap-3">
              <Metric label="목표 마진 판매가" value={result.targetMarginPrice ? krw(result.targetMarginPrice) : '불가'} />
              <Metric
                label="목표 개당이익 판매가"
                value={result.targetProfitPrice ? krw(result.targetProfitPrice) : '불가'}
              />
              <Metric
                label={`월 ${krw(input.targetMonthlyProfit)} 필요 판매량`}
                value={
                  result.unitsForTargetMonthly
                    ? `월 ${result.unitsForTargetMonthly.toLocaleString('ko-KR')}개 · 일 ${result.dailyUnitsForTarget?.toFixed(1)}개`
                    : '개당 이익이 없어 역산 불가'
                }
              />
              {input.monthlyFixedCost > 0 ? (
                <Metric label="월 영업이익 (고정비 차감)" value={krw(result.monthlyOperatingProfit)} />
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function ExportButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      className="rounded-full border border-line px-3 py-1 text-xs font-medium hover:bg-canvas"
      onClick={onClick}
    >
      {label}
    </button>
  )
}

function formatRoas(n: number | null): string {
  if (n === null) return '—'
  return `${n.toFixed(2)}배`
}

function RoasPanel({ result }: { result: ReturnType<typeof calculateMargin> }) {
  if (result.breakEvenRoas === null && result.impliedRoas === null) return null

  return (
    <div className="rounded-3xl border border-line bg-paper p-6">
      <h3 className="text-sm font-semibold">광고 ROAS</h3>
      <p className="mt-1 text-xs text-black/50">광고비 포함 전 마진 기준 손익분기 ROAS · 현재 입력 기준 추정 ROAS</p>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <Metric label="손익분기 ROAS" value={formatRoas(result.breakEvenRoas)} />
        <Metric label="현재 ROAS" value={formatRoas(result.impliedRoas)} />
      </div>
      {result.breakEvenRoas !== null && result.impliedRoas !== null ? (
        <p className="mt-3 text-xs text-black/55">
          {result.impliedRoas >= result.breakEvenRoas
            ? `현재 ROAS(${formatRoas(result.impliedRoas)})가 손익분기(${formatRoas(result.breakEvenRoas)}) 이상입니다.`
            : `현재 ROAS(${formatRoas(result.impliedRoas)})가 손익분기(${formatRoas(result.breakEvenRoas)}) 미만입니다.`}
        </p>
      ) : null}
    </div>
  )
}

function Metric({ label, value, ...rest }: { label: string; value: string } & HTMLAttributes<HTMLDivElement>) {
  return (
    <div {...rest}>
      <p className="text-xs opacity-70">{label}</p>
      <p className="text-xl font-semibold tabular-nums">{value}</p>
    </div>
  )
}

function Row({ k, v, note, strong }: { k: string; v: string; note?: string; strong?: boolean }) {
  return (
    <div className={`flex justify-between gap-3 ${strong ? 'font-semibold' : ''}`}>
      <dt className="text-black/60">
        {k}
        {note ? <span className="ml-2 text-[10px] uppercase text-black/35">{note}</span> : null}
      </dt>
      <dd className="tabular-nums">{v}</dd>
    </div>
  )
}
