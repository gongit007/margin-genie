import { useEffect, useMemo, useState } from 'react'
import { MyProductListPanel } from '../components/MyProductListPanel'
import { TableScroll } from '../components/TableScroll'
import {
  INTELLIGENCE_VERSION,
  MARKETPLACE_LABELS,
  RETAIL_FOCUS_MARKETPLACES,
  WHOLESALE_PLATFORM_LABELS,
  loadMyProducts,
  matchStatusLabel,
  myWholesalePlatforms,
  openMarginCalculator,
  searchRetailListingsForProduct,
  searchWholesaleCompetitorsForProduct,
  retailCompetitorRows,
  retailMyListingRows,
  type MatchStatus,
  type MyProduct,
  type RetailCompetitionRow,
  type RetailSearchResult,
  type WholesaleCompetitionRow,
  type WholesaleSearchResult,
} from '../intelligence'

type IntelTab = 'wholesale' | 'retail'

function krw(n: number | null): string {
  if (n === null) return '—'
  return `₩${n.toLocaleString('ko-KR')}`
}

function matchBadge(status: MatchStatus | null | undefined) {
  if (!status) return <span className="rounded px-2 py-0.5 text-xs bg-neutral-100 text-neutral-500">—</span>
  const cls: Record<MatchStatus, string> = {
    EXACT_MATCH: 'bg-emerald-100 text-emerald-800',
    VARIANT_MATCH: 'bg-sky-100 text-sky-800',
    SAME_BASE_DIFFERENT_PACKAGE: 'bg-amber-100 text-amber-900',
    PROBABLE_MATCH: 'bg-blue-100 text-blue-800',
    POSSIBLE_MATCH: 'bg-violet-100 text-violet-800',
    NOT_MATCH: 'bg-red-100 text-red-800',
    UNKNOWN: 'bg-neutral-100 text-neutral-600',
  }
  return <span className={`rounded px-2 py-0.5 text-xs font-medium ${cls[status]}`}>{matchStatusLabel(status)}</span>
}

function EvidenceCell({
  listingId,
  match,
  expandedId,
  onToggle,
}: {
  listingId: string
  match: WholesaleCompetitionRow['match'] | RetailCompetitionRow['match']
  expandedId: string | null
  onToggle: (id: string) => void
}) {
  if (!match) return <>—</>
  return (
    <>
      <button
        type="button"
        className="text-xs text-muted underline underline-offset-2"
        onClick={() => onToggle(listingId)}
      >
        {expandedId === listingId ? '닫기' : '보기'}
      </button>
      {expandedId === listingId && (
        <ul className="mt-2 space-y-0.5 text-2xs text-muted max-w-[180px]">
          {match.evidence.map((e) => (
            <li key={e.attribute}>
              {e.attribute}: {e.comparisonResult}
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

function WholesaleTable({
  rows,
  expandedId,
  onToggleEvidence,
}: {
  rows: WholesaleCompetitionRow[]
  expandedId: string | null
  onToggleEvidence: (id: string) => void
}) {
  return (
    <TableScroll>
      <table className="w-full min-w-[960px] text-left text-sm">
        <thead>
          <tr className="border-b border-line text-muted">
            <th className="py-2 pr-3 font-medium">도매처</th>
            <th className="py-2 pr-3 font-medium">상품번호</th>
            <th className="py-2 pr-3 font-medium">판매자</th>
            <th className="py-2 pr-3 font-medium">동일상품</th>
            <th className="py-2 pr-3 font-medium">상품명</th>
            <th className="py-2 pr-3 font-medium text-right">도매가</th>
            <th className="py-2 pr-3 font-medium text-right">배송</th>
            <th className="py-2 pr-3 font-medium text-right">실효가</th>
            <th className="py-2 pr-3 font-medium">상세</th>
            <th className="py-2 font-medium">근거</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ listing, match }) => (
            <tr
              key={listing.id}
              className={`border-b border-line/60 align-top ${listing.isAnchor ? 'bg-accent/10' : ''}`}
            >
              <td className="py-3 pr-3 font-medium whitespace-nowrap">
                {WHOLESALE_PLATFORM_LABELS[listing.platform]}
                {listing.isAnchor && <span className="ml-1 text-2xs text-muted">(내 상품)</span>}
              </td>
              <td className="py-3 pr-3 font-mono text-xs">{listing.itemCode ?? '—'}</td>
              <td className="py-3 pr-3">{listing.sellerName ?? '—'}</td>
              <td className="py-3 pr-3 whitespace-nowrap">
                {matchBadge(match?.matchStatus)}
                {match && <div className="mt-0.5 text-2xs text-muted">{(match.confidence * 100).toFixed(0)}%</div>}
              </td>
              <td className="py-3 pr-3 max-w-[220px] break-all">{listing.title ?? '—'}</td>
              <td className="py-3 pr-3 text-right whitespace-nowrap">{krw(listing.wholesalePrice)}</td>
              <td className="py-3 pr-3 text-right whitespace-nowrap">
                {listing.shippingFee === 0 ? '무료' : krw(listing.shippingFee)}
              </td>
              <td className="py-3 pr-3 text-right font-medium whitespace-nowrap">{krw(listing.effectivePrice)}</td>
              <td className="py-3 pr-3">
                {listing.listingUrl ? (
                  <a
                    href={listing.listingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-medium text-accent underline underline-offset-2 whitespace-nowrap"
                  >
                    페이지 보기 ↗
                  </a>
                ) : (
                  '—'
                )}
              </td>
              <td className="py-3">
                <EvidenceCell
                  listingId={listing.id}
                  match={match}
                  expandedId={expandedId}
                  onToggle={onToggleEvidence}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableScroll>
  )
}

function RetailTable({
  rows,
  expandedId,
  onToggleEvidence,
}: {
  rows: RetailCompetitionRow[]
  expandedId: string | null
  onToggleEvidence: (id: string) => void
}) {
  return (
    <TableScroll>
      <table className="w-full min-w-[960px] text-left text-sm">
        <thead>
          <tr className="border-b border-line text-muted">
            <th className="py-2 pr-3 font-medium">마켓</th>
            <th className="py-2 pr-3 font-medium">상품번호</th>
            <th className="py-2 pr-3 font-medium">판매자</th>
            <th className="py-2 pr-3 font-medium">동일상품</th>
            <th className="py-2 pr-3 font-medium">상품명</th>
            <th className="py-2 pr-3 font-medium text-right">판매가</th>
            <th className="py-2 pr-3 font-medium text-right">배송</th>
            <th className="py-2 pr-3 font-medium text-right">실효가</th>
            <th className="py-2 pr-3 font-medium">상세</th>
            <th className="py-2 font-medium">근거</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ listing, match }) => (
            <tr
              key={listing.id}
              className={`border-b border-line/60 align-top ${listing.isMine ? 'bg-accent/10' : ''}`}
            >
              <td className="py-3 pr-3 font-medium whitespace-nowrap">
                {MARKETPLACE_LABELS[listing.marketplace]}
                {listing.isMine && <span className="ml-1 text-2xs text-muted">(내 Listing)</span>}
              </td>
              <td className="py-3 pr-3 font-mono text-xs">{listing.itemCode ?? '—'}</td>
              <td className="py-3 pr-3">{listing.sellerName ?? '—'}</td>
              <td className="py-3 pr-3 whitespace-nowrap">
                {matchBadge(match?.matchStatus)}
                {match && <div className="mt-0.5 text-2xs text-muted">{(match.confidence * 100).toFixed(0)}%</div>}
              </td>
              <td className="py-3 pr-3 max-w-[220px] break-all">{listing.title ?? '—'}</td>
              <td className="py-3 pr-3 text-right whitespace-nowrap">{krw(listing.listPrice)}</td>
              <td className="py-3 pr-3 text-right whitespace-nowrap">
                {listing.shippingFee === 0 ? '무료' : krw(listing.shippingFee)}
              </td>
              <td className="py-3 pr-3 text-right font-medium whitespace-nowrap">{krw(listing.effectivePrice)}</td>
              <td className="py-3 pr-3">
                {listing.listingUrl ? (
                  <a
                    href={listing.listingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-medium text-accent underline underline-offset-2 whitespace-nowrap"
                  >
                    페이지 보기 ↗
                  </a>
                ) : (
                  '—'
                )}
              </td>
              <td className="py-3">
                <EvidenceCell
                  listingId={listing.id}
                  match={match}
                  expandedId={expandedId}
                  onToggle={onToggleEvidence}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableScroll>
  )
}

export default function IntelligencePage() {
  const [products, setProducts] = useState<MyProduct[]>(() => loadMyProducts())
  const [selected, setSelected] = useState<MyProduct | null>(() => loadMyProducts()[0] ?? null)
  const [tab, setTab] = useState<IntelTab>('retail')
  const [searchQuery, setSearchQuery] = useState('')
  const [retailQuery, setRetailQuery] = useState('')
  const [result, setResult] = useState<WholesaleSearchResult | null>(null)
  const [retailResult, setRetailResult] = useState<RetailSearchResult | null>(null)
  const [retailLoading, setRetailLoading] = useState(false)
  const [retailError, setRetailError] = useState<string | null>(null)
  const [marketFilter, setMarketFilter] = useState<'ALL' | (typeof RETAIL_FOCUS_MARKETPLACES)[number]>('ALL')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const myPlatforms = useMemo(() => myWholesalePlatforms(products), [products])

  function analyzeWholesale(product: MyProduct, query?: string) {
    const data = searchWholesaleCompetitorsForProduct(product, query)
    setResult(data)
    if (!query) setSearchQuery(data.query)
  }

  async function analyzeRetail(product: MyProduct, query?: string) {
    setRetailLoading(true)
    setRetailError(null)
    try {
      const data = await searchRetailListingsForProduct(product, query)
      setRetailResult(data)
      if (!query) setRetailQuery(data.query)
      if (data.source === 'stub' && data.sourceNote) setRetailError(data.sourceNote)
    } catch {
      setRetailError('마켓 검색 중 오류가 발생했습니다.')
    } finally {
      setRetailLoading(false)
    }
  }

  function analyzeProduct(product: MyProduct) {
    setSelected(product)
    setExpandedId(null)
    setMarketFilter('ALL')
    analyzeWholesale(product)
    void analyzeRetail(product)
  }

  useEffect(() => {
    if (selected) analyzeProduct(selected)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initial load only
  }, [])

  const filteredWholesaleRows = useMemo(() => {
    if (!result || !selected) return []
    return result.rows.filter((r) => r.listing.platform === selected.platform)
  }, [result, selected])

  const filteredRetailCompetitors = useMemo(() => {
    if (!retailResult) return []
    const competitors = retailCompetitorRows(retailResult)
    if (marketFilter === 'ALL') return competitors
    return competitors.filter((r) => r.listing.marketplace === marketFilter)
  }, [retailResult, marketFilter])

  const myRetailListings = useMemo(
    () => (retailResult ? retailMyListingRows(retailResult) : []),
    [retailResult],
  )

  const competitiveMin = result?.stats.lowestEffective ?? null
  const retailCompetitiveMin = retailResult?.stats.lowestEffective ?? null

  function openMarginWithWholesaleCost(productCost: number, listPrice?: number, channel?: Parameters<typeof openMarginCalculator>[0]['channel']) {
    if (!selected) return
    openMarginCalculator({
      productCost,
      productName: selected.title,
      listPrice: listPrice ?? 11880,
      channel: channel ?? 'NAVER_SMARTSTORE',
    })
  }

  function handleTabChange(next: IntelTab) {
    setTab(next)
    setExpandedId(null)
    if (!selected) return
    if (next === 'wholesale' && !result) analyzeWholesale(selected)
    if (next === 'retail' && !retailResult && !retailLoading) void analyzeRetail(selected)
  }

  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="border-b border-line bg-paper/95 backdrop-blur sticky top-0 z-10">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted">도매매 구매 · 마켓 경쟁 · 마진</p>
            <h1 className="text-lg font-semibold sm:text-xl">마진지니 Intelligence</h1>
          </div>
          <a href="/" className="text-sm text-muted hover:text-ink">
            ← 마진 계산기
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(260px,320px)_1fr] lg:items-start">
          <MyProductListPanel
            products={products}
            selectedId={selected?.id ?? null}
            onSelect={(p) => analyzeProduct(p)}
            onProductsChange={setProducts}
          />

          <div className="space-y-6 min-w-0">
            {selected && (
              <>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleTabChange('retail')}
                    className={`rounded-full px-4 py-2 text-sm font-medium border ${
                      tab === 'retail' ? 'border-ink bg-ink text-paper' : 'border-line text-muted'
                    }`}
                  >
                    마켓 경쟁 셀러
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTabChange('wholesale')}
                    className={`rounded-full px-4 py-2 text-sm font-medium border ${
                      tab === 'wholesale' ? 'border-ink bg-ink text-paper' : 'border-line text-muted'
                    }`}
                  >
                    도매 경쟁가
                  </button>
                </div>

                <section className="panel-shell p-5 sm:p-6 border-l-4 border-l-accent">
                  <h2 className="panel-title">도매매 구매 상품 · {selected.supplierName}</h2>
                  <p className="mt-1 text-sm text-muted">
                    이 상품을 스마트스토어·쿠팡에 판매할 때, 다른 셀러의 판매가를 「마켓 경쟁 셀러」 탭에서
                    확인합니다.
                  </p>
                  <dl className="mt-4 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <dt className="text-muted">도매처</dt>
                      <dd className="font-semibold">{WHOLESALE_PLATFORM_LABELS[selected.platform]}</dd>
                    </div>
                    <div>
                      <dt className="text-muted">상품번호</dt>
                      <dd className="font-mono font-semibold">{selected.itemCode}</dd>
                    </div>
                    <div>
                      <dt className="text-muted">랭킹점수</dt>
                      <dd className="font-semibold">{selected.rankingScore?.toLocaleString('ko-KR') ?? '—'}점</dd>
                    </div>
                    <div>
                      <dt className="text-muted">내 도매가</dt>
                      <dd className="font-semibold">{krw(selected.wholesalePrice)}</dd>
                    </div>
                    <div className="sm:col-span-2 lg:col-span-4">
                      <dt className="text-muted">상품명</dt>
                      <dd className="font-medium leading-snug">{selected.title}</dd>
                    </div>
                  </dl>
                  {selected.sourceUrl && (
                    <p className="mt-3">
                      <a
                        href={selected.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-accent underline underline-offset-2"
                      >
                        내 도매 상품 페이지 ↗
                      </a>
                    </p>
                  )}
                </section>
              </>
            )}

            {tab === 'wholesale' && selected && (
              <>
                <section className="panel-shell p-5 sm:p-6">
                  <h2 className="panel-title">도매 경쟁 셀러 검색</h2>
                  <p className="mt-1 text-sm text-muted">
                    {selected
                      ? `${WHOLESALE_PLATFORM_LABELS[selected.platform]}에서 판매 중인 내 상품 기준으로 같은 Listing을 DNA 매칭합니다.`
                      : '내 상품이 등록된 도매처만 비교합니다.'}
                  </p>
                  <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
                    <label className="flex-1">
                      <span className="text-sm font-medium">검색어</span>
                      <input
                        className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => analyzeWholesale(selected, searchQuery)}
                      className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-ink shrink-0"
                    >
                      다시 검색
                    </button>
                  </div>
                </section>

                {result && (
                  <section className="panel-shell p-5 sm:p-6">
                    <div className="flex flex-wrap items-end justify-between gap-4">
                      <div>
                        <h2 className="panel-title">도매 경쟁가 비교</h2>
                        <p className="mt-1 text-sm text-muted">
                          {WHOLESALE_PLATFORM_LABELS[selected.platform]} · 「{result.query}」 · 후보{' '}
                          {result.stats.total}건 · 동일 {result.stats.exactMatch}건
                          {competitiveMin != null && (
                            <>
                              {' '}
                              · 경쟁 최저 <strong>{krw(competitiveMin)}</strong>
                            </>
                          )}
                        </p>
                      </div>
                      {myPlatforms.length > 1 && (
                        <p className="text-xs text-muted">
                          등록 도매처:{' '}
                          {myPlatforms.map((p) => WHOLESALE_PLATFORM_LABELS[p]).join(' · ')}
                        </p>
                      )}
                    </div>

                    <div className="mt-4">
                      {filteredWholesaleRows.length > 0 ? (
                        <WholesaleTable
                          rows={filteredWholesaleRows}
                          expandedId={expandedId}
                          onToggleEvidence={(id) => setExpandedId(expandedId === id ? null : id)}
                        />
                      ) : (
                        <p className="text-sm text-muted py-6 text-center">
                          {WHOLESALE_PLATFORM_LABELS[selected.platform]}에 등록된 내 상품이 없습니다.
                        </p>
                      )}
                    </div>

                    <div className="mt-6 flex flex-wrap gap-3 border-t border-line pt-5">
                      <button
                        type="button"
                        disabled={competitiveMin == null}
                        onClick={() => competitiveMin != null && openMarginWithWholesaleCost(competitiveMin)}
                        className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-paper disabled:opacity-40"
                      >
                        {competitiveMin != null
                          ? '경쟁 최저 도매가로 마진 보기'
                          : `${WHOLESALE_PLATFORM_LABELS[selected.platform]} 경쟁 셀러 없음`}
                      </button>
                      <button
                        type="button"
                        onClick={() => openMarginWithWholesaleCost(selected.wholesalePrice ?? 3500)}
                        className="rounded-full border border-line px-4 py-2.5 text-sm font-medium"
                      >
                        내 도매가로 마진 보기
                      </button>
                    </div>
                  </section>
                )}
              </>
            )}

            {tab === 'retail' && selected && (
              <>
                <section className="panel-shell p-5 sm:p-6">
                  <h2 className="panel-title">마켓 경쟁 셀러 검색</h2>
                  <p className="mt-1 text-sm text-muted">
                    도매매에서 구매한 이 상품과 같은 Listing을{' '}
                    <strong>스마트스토어·쿠팡</strong>에서 파는 <strong>다른 셀러</strong>를 네이버 쇼핑 검색으로
                    찾습니다.
                  </p>
                  {retailError && (
                    <p className="mt-2 text-sm text-amber-800">{retailError}</p>
                  )}
                  <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
                    <label className="flex-1">
                      <span className="text-sm font-medium">검색어</span>
                      <input
                        className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm"
                        value={retailQuery}
                        onChange={(e) => setRetailQuery(e.target.value)}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => void analyzeRetail(selected, retailQuery)}
                      disabled={retailLoading}
                      className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-ink shrink-0 disabled:opacity-50"
                    >
                      {retailLoading ? '검색 중…' : '다시 검색'}
                    </button>
                  </div>
                </section>

                {retailResult && (
                  <>
                    <section className="panel-shell p-5 sm:p-6">
                      <div className="flex flex-wrap items-end justify-between gap-4">
                        <div>
                          <h2 className="panel-title">다른 셀러 판매 현황</h2>
                          <p className="mt-1 text-sm text-muted">
                            {retailResult.source === 'live' ? (
                              <span className="mr-2 inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-2xs font-medium text-emerald-800">
                                실데이터
                              </span>
                            ) : (
                              <span className="mr-2 inline-flex rounded-full bg-neutral-200 px-2 py-0.5 text-2xs font-medium text-neutral-700">
                                예시 데이터
                              </span>
                            )}
                            「{retailResult.query}」 · 경쟁 셀러 {retailResult.stats.competitorCount}명 · 동일상품{' '}
                            {retailResult.stats.exactMatch}건
                            {retailCompetitiveMin != null && (
                              <>
                                {' '}
                                · 경쟁 최저 실효가 <strong>{krw(retailCompetitiveMin)}</strong>
                              </>
                            )}
                          </p>
                          {retailResult.sourceNote && retailResult.source === 'live' && (
                            <p className="mt-1 text-2xs text-muted">{retailResult.sourceNote}</p>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {RETAIL_FOCUS_MARKETPLACES.filter(
                            (m) => retailResult.stats.byMarketplaceCompetitors[m] > 0,
                          ).map((m) => (
                            <button
                              key={m}
                              type="button"
                              onClick={() => setMarketFilter(marketFilter === m ? 'ALL' : m)}
                              className={`rounded-full px-3 py-1 text-xs border ${
                                marketFilter === m ? 'border-ink bg-ink text-paper' : 'border-line text-muted'
                              }`}
                            >
                              {MARKETPLACE_LABELS[m].replace(' ', '')} (
                              {retailResult.stats.byMarketplaceCompetitors[m]})
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="mt-4">
                        {filteredRetailCompetitors.length > 0 ? (
                          <RetailTable
                            rows={filteredRetailCompetitors}
                            expandedId={expandedId}
                            onToggleEvidence={(id) => setExpandedId(expandedId === id ? null : id)}
                          />
                        ) : (
                          <p className="text-sm text-muted py-6 text-center">
                            {marketFilter === 'ALL'
                              ? '검색된 경쟁 셀러가 없습니다.'
                              : `${MARKETPLACE_LABELS[marketFilter]}에 경쟁 셀러가 없습니다.`}
                          </p>
                        )}
                      </div>

                      <div className="mt-6 flex flex-wrap gap-3 border-t border-line pt-5">
                        <button
                          type="button"
                          disabled={retailCompetitiveMin == null}
                          onClick={() => {
                            if (retailCompetitiveMin == null) return
                            openMarginWithWholesaleCost(
                              selected.wholesalePrice ?? 3500,
                              retailCompetitiveMin,
                              'COUPANG',
                            )
                          }}
                          className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-paper disabled:opacity-40"
                        >
                          {retailCompetitiveMin != null
                            ? '경쟁 최저가로 마진 보기'
                            : '경쟁 셀러 없음'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const mine = myRetailListings[0]?.listing.listPrice
                            openMarginWithWholesaleCost(
                              selected.wholesalePrice ?? 3500,
                              mine ?? 11880,
                              'NAVER_SMARTSTORE',
                            )
                          }}
                          className="rounded-full border border-line px-4 py-2.5 text-sm font-medium"
                        >
                          내 도매가 + 내 판매가로 마진 보기
                        </button>
                      </div>
                    </section>

                    {myRetailListings.length > 0 && (
                      <section className="panel-shell p-5 sm:p-6 bg-neutral-50/80">
                        <h2 className="panel-title text-base">내 Listing (참고)</h2>
                        <p className="mt-1 text-sm text-muted">
                          스마트스토어·쿠팡에 올린 내 상품 — 경쟁 셀러와 가격 비교용
                        </p>
                        <div className="mt-4">
                          <RetailTable
                            rows={myRetailListings}
                            expandedId={expandedId}
                            onToggleEvidence={(id) => setExpandedId(expandedId === id ? null : id)}
                          />
                        </div>
                      </section>
                    )}
                  </>
                )}
              </>
            )}

            {!selected && (
              <p className="text-sm text-muted text-center py-12">왼쪽에서 상품을 선택하거나 추가하세요.</p>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-muted mt-8 pb-6">
          intelligence@{INTELLIGENCE_VERSION} · 스마트스토어·쿠팡 · 네이버 쇼핑 검색 API
        </p>
      </main>
    </div>
  )
}
