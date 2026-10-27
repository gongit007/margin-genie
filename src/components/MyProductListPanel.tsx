import { useState } from 'react'
import {
  WHOLESALE_PLATFORM_LABELS,
  WHOLESALE_PLATFORMS,
  addMyProduct,
  fetchWholesaleListing,
  removeMyProduct,
  type MyProduct,
  type WholesalePlatformCode,
} from '../intelligence'

function krw(n: number | null): string {
  if (n === null) return '—'
  return `₩${n.toLocaleString('ko-KR')}`
}

type Props = {
  products: MyProduct[]
  selectedId: string | null
  onSelect: (product: MyProduct) => void
  onProductsChange: (products: MyProduct[]) => void
}

export function MyProductListPanel({ products, selectedId, onSelect, onProductsChange }: Props) {
  const [showForm, setShowForm] = useState(false)
  const [platform, setPlatform] = useState<WholesalePlatformCode>('DOMAEMAE')
  const [itemCode, setItemCode] = useState('')
  const [supplierName, setSupplierName] = useState('')
  const [title, setTitle] = useState('')
  const [rankingScore, setRankingScore] = useState('')
  const [wholesalePrice, setWholesalePrice] = useState('')
  const [model, setModel] = useState('')
  const [fetching, setFetching] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [fetchNote, setFetchNote] = useState<string | null>(null)

  function resetForm() {
    setItemCode('')
    setSupplierName('')
    setTitle('')
    setRankingScore('')
    setWholesalePrice('')
    setModel('')
    setFetchError(null)
    setFetchNote(null)
  }

  async function handleFetchListing() {
    if (platform !== 'DOMAEMAE' || !itemCode.trim()) return
    setFetching(true)
    setFetchError(null)
    setFetchNote(null)
    const result = await fetchWholesaleListing(platform, itemCode.trim())
    setFetching(false)
    if (!result.ok) {
      setFetchError(result.error)
      return
    }
    const d = result.data
    setTitle(d.title)
    setSupplierName(d.supplierName)
    if (d.rankingScore != null) setRankingScore(String(d.rankingScore))
    if (d.wholesalePrice != null) setWholesalePrice(String(d.wholesalePrice))
    if (d.model) setModel(d.model)
    setFetchNote(
      d.wholesalePrice != null
        ? `도매꾹에서 불러왔습니다 · 도매가 ₩${d.wholesalePrice.toLocaleString('ko-KR')}`
        : '도매꾹에서 불러왔습니다 · 도매가는 페이지에서 확인해 주세요',
    )
  }

  function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!itemCode.trim() || !title.trim()) return
    const added = addMyProduct({
      platform,
      itemCode: itemCode.trim(),
      supplierName: supplierName.trim() || '미입력',
      title: title.trim(),
      rankingScore: rankingScore ? Number(rankingScore) : null,
      wholesalePrice: wholesalePrice ? Number(wholesalePrice) : null,
      shippingFee: 0,
      sourceUrl: platform === 'DOMAEMAE' ? `https://domeggook.com/${itemCode.trim()}` : null,
      model: model.trim() || undefined,
    })
    onProductsChange([added, ...products.filter((p) => p.id !== added.id)])
    onSelect(added)
    resetForm()
    setShowForm(false)
  }

  function handleRemove(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    if (!confirm('이 상품을 목록에서 삭제할까요?')) return
    const next = removeMyProduct(id)
    onProductsChange(next)
    if (selectedId === id && next[0]) onSelect(next[0])
  }

  return (
    <section className="panel-shell p-4 sm:p-5 h-fit lg:sticky lg:top-20">
      <div className="flex items-center justify-between gap-2">
        <h2 className="panel-title text-base">내 상품 목록</h2>
        <span className="text-xs text-muted">{products.length}개</span>
      </div>
      <p className="mt-1 text-2xs sm:text-xs text-muted">도매매에서 구매·등록한 상품 — 마켓 경쟁 분석의 기준 상품입니다.</p>

      <ul className="mt-3 space-y-2 max-h-[320px] overflow-y-auto">
        {products.map((p) => (
          <li key={p.id}>
            <button
              type="button"
              onClick={() => onSelect(p)}
              className={`w-full rounded-lg border px-3 py-2.5 text-left transition-colors ${
                selectedId === p.id ? 'border-ink bg-accent/20' : 'border-line bg-white hover:border-ink/30'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-2xs font-medium text-muted">
                    {WHOLESALE_PLATFORM_LABELS[p.platform]} · {p.itemCode}
                  </p>
                  <p className="mt-0.5 text-sm font-medium line-clamp-2">{p.title}</p>
                  <p className="mt-1 text-2xs text-muted">
                    {p.supplierName} · {krw(p.wholesalePrice)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={(e) => handleRemove(p.id, e)}
                  className="shrink-0 text-2xs text-muted hover:text-red-700 px-1"
                  aria-label="삭제"
                >
                  ✕
                </button>
              </div>
            </button>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={() => setShowForm((v) => !v)}
        className="mt-3 w-full rounded-lg border border-dashed border-line py-2 text-sm text-muted hover:text-ink hover:border-ink/40"
      >
        {showForm ? '입력 닫기' : '+ 상품 추가'}
      </button>

      {showForm && (
        <form onSubmit={handleAdd} className="mt-3 space-y-2 border-t border-line pt-3">
          <label className="block">
            <span className="text-2xs font-medium">도매처</span>
            <select
              className="mt-0.5 w-full rounded border border-line px-2 py-1.5 text-sm"
              value={platform}
              onChange={(e) => {
                setPlatform(e.target.value as WholesalePlatformCode)
                setFetchError(null)
                setFetchNote(null)
              }}
            >
              {WHOLESALE_PLATFORMS.map((p) => (
                <option key={p} value={p}>
                  {WHOLESALE_PLATFORM_LABELS[p]}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-2xs font-medium">상품번호 *</span>
            <div className="mt-0.5 flex gap-1.5">
              <input
                className="min-w-0 flex-1 rounded border border-line px-2 py-1.5 text-sm font-mono"
                value={itemCode}
                onChange={(e) => {
                  setItemCode(e.target.value)
                  setFetchError(null)
                }}
                required
                placeholder="63253617"
              />
              {platform === 'DOMAEMAE' && (
                <button
                  type="button"
                  disabled={fetching || !itemCode.trim()}
                  onClick={handleFetchListing}
                  className="shrink-0 rounded border border-line px-2 py-1.5 text-2xs font-medium whitespace-nowrap disabled:opacity-40"
                >
                  {fetching ? '…' : '불러오기'}
                </button>
              )}
            </div>
          </label>
          {fetchError && <p className="text-2xs text-red-700">{fetchError}</p>}
          {fetchNote && <p className="text-2xs text-emerald-800">{fetchNote}</p>}
          <label className="block">
            <span className="text-2xs font-medium">상품명 *</span>
            <input
              className="mt-0.5 w-full rounded border border-line px-2 py-1.5 text-sm"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </label>
          <label className="block">
            <span className="text-2xs font-medium">공급업체</span>
            <input
              className="mt-0.5 w-full rounded border border-line px-2 py-1.5 text-sm"
              value={supplierName}
              onChange={(e) => setSupplierName(e.target.value)}
            />
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <span className="text-2xs font-medium">랭킹</span>
              <input
                className="mt-0.5 w-full rounded border border-line px-2 py-1.5 text-sm"
                value={rankingScore}
                onChange={(e) => setRankingScore(e.target.value)}
              />
            </label>
            <label className="block">
              <span className="text-2xs font-medium">도매가</span>
              <input
                className="mt-0.5 w-full rounded border border-line px-2 py-1.5 text-sm"
                value={wholesalePrice}
                onChange={(e) => setWholesalePrice(e.target.value)}
              />
            </label>
          </div>
          <label className="block">
            <span className="text-2xs font-medium">모델 (검색용)</span>
            <input
              className="mt-0.5 w-full rounded border border-line px-2 py-1.5 text-sm"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="T45"
            />
          </label>
          <button
            type="submit"
            className="w-full rounded-full bg-ink py-2 text-sm font-medium text-paper"
          >
            목록에 저장
          </button>
        </form>
      )}
    </section>
  )
}
