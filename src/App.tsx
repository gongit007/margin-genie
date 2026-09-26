import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { MoneyField } from './components/MoneyField'
import {
  calculateMargin,
  channelLabel,
  compareChannels,
  emptyInput,
  interpret,
  krw,
  pct,
  priceLadder,
  riskLabel,
  type ChannelCode,
  type MarginInput,
} from './engine'
import { loadMarginInput, saveMarginInput } from './storage/marginInputStorage'

const DEMO: MarginInput = {
  ...emptyInput(),
  listPrice: 89000,
  productCost: 32000,
  shippingCost: 3000,
  packagingCost: 1500,
  advertisingMode: 'PERCENT_OF_NET',
  advertisingRate: 0.06,
}

export default function App() {
  const [menu, setMenu] = useState(false)
  const [input, setInput] = useState<MarginInput>(() => loadMarginInput(DEMO))
  const patch = (partial: Partial<MarginInput>) => setInput((prev) => ({ ...prev, ...partial }))

  useEffect(() => {
    saveMarginInput(input)
  }, [input])
  const result = useMemo(() => calculateMargin(input), [input])
  const rows = useMemo(() => compareChannels(input, ['NAVER_SMARTSTORE', 'COUPANG', 'ELEVEN_ST']), [input])
  const best = rows.reduce((a, b) => (a.contributionProfit > b.contributionProfit ? a : b))

  return (
    <div className="min-h-screen">
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
            무료로 시작 →
          </a>
        </div>
      </header>

      {menu ? (
        <div className="fixed inset-0 z-40 bg-ink/40" onClick={() => setMenu(false)}>
          <nav
            className="h-full w-72 bg-paper p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="mb-6 text-sm text-black/50">메뉴</p>
            {[
              ['#problem', '01 문제'],
              ['#steps', '02 4단계'],
              ['#calculator', '03 계산기'],
              ['#pricing', '04 요금'],
              ['#faq', '05 FAQ'],
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
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand/50 blur-3xl" />
          <div className="mx-auto max-w-6xl px-4 pb-10 pt-16 md:pt-24">
            <p className="mb-4 inline-flex items-center rounded-full border border-line bg-paper px-3 py-1 text-xs">
              계산 엔진과 AI 설명을 분리 · 수수료 출처 표시
            </p>
            <h1 className="max-w-3xl text-4xl font-semibold leading-tight md:text-6xl">
              팔기 전에 계산하는
              <br />
              <span className="mark-yellow">원가/마진 수익성</span> 엔진
            </h1>
            <p className="mt-5 max-w-xl text-lg text-black/65">
              채널 수수료, 광고비, 할인까지. 복잡한 실마진 계산을 엔진이 즉시 끝내고, 화면은 “팔아도 되는지”만 알려줍니다.
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
              <Stat n="3+" l="스마트스토어 · 쿠팡 · 11번가" />
              <Stat n="출처" l="VERIFIED / ESTIMATED 구분" />
            </div>

            <div className="mt-12 rounded-3xl border border-line bg-paper p-5 shadow-[0_20px_60px_rgba(0,0,0,0.04)] md:p-8">
              <p className="text-xs font-semibold tracking-[0.16em] text-black/40">CHANNEL MARGIN · LIVE</p>
              <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold">샘플 니트 가디건</p>
                  <p className="text-3xl font-semibold tabular-nums">{krw(input.listPrice)}</p>
                  <p className="text-sm text-black/50">원가 {krw(input.productCost)}</p>
                </div>
                <p className="text-sm text-black/55">
                  아래 숫자는 목업이 아닙니다. <strong>같은 계산 엔진</strong>이 실시간으로 돌립니다.
                </p>
              </div>
              <div className="mt-6 grid gap-3 md:grid-cols-3">
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

        <Calculator input={input} patch={patch} result={result} />

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
                  <li>채널 비교 · 역산 · 시나리오</li>
                  <li>수수료 출처 표시</li>
                </ul>
                <a href="#calculator" className="mt-6 inline-block rounded-full bg-brand px-5 py-2 text-sm font-semibold">
                  지금 계산하기
                </a>
              </article>
              <article className="rounded-3xl border border-ink bg-ink p-6 text-white">
                <p className="text-sm text-white/70">Pro · 준비 중</p>
                <p className="mt-2 font-serif text-4xl">₩9,900</p>
                <ul className="mt-4 space-y-2 text-sm text-white/70">
                  <li>상품·시나리오 저장</li>
                  <li>엑셀 · PDF</li>
                  <li>엔진 결과를 해석하는 AI 설명</li>
                </ul>
              </article>
            </div>
          </div>
        </section>

        <section id="faq" className="border-t border-line bg-paper py-20">
          <div className="mx-auto max-w-3xl px-4">
            <h2 className="text-3xl font-semibold">자주 묻는 질문</h2>
            <Faq q="UTON을 그대로 복사한 건가요?">
              아닙니다. 랜딩의 정보 구조(문제 → 4단계 → 채널 비교 → 계산)를 벤치했고, 수수료 출처·공헌이익 용어·결정론 엔진은 마진지니의 차별점입니다.
            </Faq>
            <Faq q="수수료가 공식 확정값인가요?">
              스마트스토어 판매수수료·Npay는 고객센터 FAQ 기준으로 VERIFIED입니다. 쿠팡·11번가는 ESTIMATED이며 판매자센터 값으로 덮어쓰세요.
            </Faq>
            <Faq q="AI가 마진을 계산하나요?">
              하지 않습니다. Margin Engine이 계산하고, 설명 레이어는 그 결과만 읽습니다.
            </Faq>
          </div>
        </section>
      </main>

      <footer className="border-t border-line px-4 py-10 text-center text-xs text-black/45">
        마진지니 · 세무·투자 자문이 아닙니다. 최종 정산은 각 판매자센터를 확인하세요.
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
    <details className="mt-4 border-b border-line py-4">
      <summary className="cursor-pointer font-medium">{q}</summary>
      <p className="mt-2 text-sm text-black/60">{children}</p>
    </details>
  )
}

function Calculator({
  input,
  patch,
  result,
}: {
  input: MarginInput
  patch: (p: Partial<MarginInput>) => void
  result: ReturnType<typeof calculateMargin>
}) {
  const insight = interpret(result, input)
  const risk = riskLabel(result.risk)
  const [advanced, setAdvanced] = useState(false)
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
  const channels: ChannelCode[] = ['NAVER_SMARTSTORE', 'COUPANG', 'ELEVEN_ST', 'CUSTOM']

  return (
    <section id="calculator" className="border-t border-line bg-canvas py-20">
      <div className="mx-auto max-w-6xl px-4">
        <p className="text-xs font-semibold tracking-[0.16em] text-black/40">LIVE CALCULATOR</p>
        <h2 className="mt-3 text-3xl font-semibold">내 상품, 얼마에 팔아야 남을까?</h2>
        <p className="mt-2 text-black/55">입력 4개로 시작하고, 상세 설정은 필요할 때만 엽니다.</p>

        <div className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.15fr)]">
          <div className="rounded-3xl border border-line bg-paper p-6">
            <h3 className="font-semibold">빠른 계산</h3>
            <div className="mt-4 grid gap-3">
              <MoneyField label="판매가" value={input.listPrice} onChange={(listPrice) => patch({ listPrice })} />
              <MoneyField label="상품 원가" value={input.productCost} onChange={(productCost) => patch({ productCost })} />
              <MoneyField label="배송비" value={input.shippingCost} onChange={(shippingCost) => patch({ shippingCost })} />
              <label className="block">
                <span className="text-sm font-medium">판매 채널</span>
                <select
                  className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2.5"
                  value={input.channel}
                  onChange={(e) => patch({ channel: e.target.value as ChannelCode })}
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
                <MoneyField
                  label="개당 광고비"
                  value={input.advertisingPerOrder}
                  onChange={(advertisingPerOrder) => patch({ advertisingMode: 'PER_ORDER', advertisingPerOrder, advertisingRate: 0 })}
                />
                {input.channel === 'NAVER_SMARTSTORE' ? (
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
                ) : null}
                {input.channel === 'COUPANG' ? (
                  <label className="block sm:col-span-2 text-sm">
                    쿠팡 수수료 추정 {(input.coupangCategoryRate * 100).toFixed(1)}%
                    <input
                      type="range"
                      min={4}
                      max={10.8}
                      step={0.1}
                      value={input.coupangCategoryRate * 100}
                      onChange={(e) => patch({ coupangCategoryRate: Number(e.target.value) / 100 })}
                    />
                  </label>
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
                <Metric label="공헌이익" value={krw(result.contributionProfit)} />
                <Metric label="실마진율" value={pct(result.marginRate)} />
                <Metric label="손익분기" value={result.breakEvenPrice ? krw(result.breakEvenPrice) : '—'} />
                <Metric
                  label="목표 마진 가격"
                  value={result.targetMarginPrice ? krw(result.targetMarginPrice) : '—'}
                />
              </div>
              <p className="mt-4 font-medium">{insight.headline}</p>
              <p className="mt-1 text-sm opacity-90">{insight.body}</p>
            </div>
            <div className="rounded-3xl border border-line bg-paper p-6">
              <h3 className="text-sm font-semibold">비용 구조</h3>
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
                label={`월 ${krw(input.targetMonthlyProfit)} 필요 판매량`}
                value={
                  result.unitsForTargetMonthly
                    ? `월 ${result.unitsForTargetMonthly.toLocaleString('ko-KR')}개 · 일 ${result.dailyUnitsForTarget?.toFixed(1)}개`
                    : '개당 이익이 없어 역산 불가'
                }
              />
            </div>
            {result.warnings.map((w) => (
              <p key={w} className="mt-2 text-xs text-amber-800">
                {w}
              </p>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
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
