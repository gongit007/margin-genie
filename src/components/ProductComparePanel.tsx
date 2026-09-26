import { useMemo, useState } from 'react'
import { buildProductCompareRows, type ProductCompareMode } from '../engine/productCompare'
import { krw, pct, riskLabel, type ChannelCode, type MarginInput } from '../engine'
import { downloadProductCompareCsv } from '../export/productCompareCsv'
import { addProduct, listProducts, removeProduct, type SavedProduct } from '../storage/productCompareStorage'

type ProductComparePanelProps = {
  input: MarginInput
  compareChannels: ChannelCode[]
  onLoadProduct: (input: MarginInput) => void
}

export function ProductComparePanel({ input, compareChannels, onLoadProduct }: ProductComparePanelProps) {
  const [products, setProducts] = useState<SavedProduct[]>(() => listProducts())
  const [mode, setMode] = useState<ProductCompareMode>('primary')
  const [message, setMessage] = useState('')

  const rows = useMemo(
    () => buildProductCompareRows(products.map((p) => ({ id: p.id, input: p.input })), mode, compareChannels),
    [products, mode, compareChannels],
  )

  const refresh = () => setProducts(listProducts())

  const handleAdd = () => {
    const saved = addProduct(input)
    refresh()
    setMessage(`"${saved.input.productName.trim() || '이름 없음'}" 추가됨`)
  }

  const handleRemove = (id: string) => {
    removeProduct(id)
    refresh()
    setMessage('삭제됨')
  }

  const handleLoad = (product: SavedProduct) => {
    onLoadProduct(product.input)
    setMessage(`"${product.input.productName.trim() || '이름 없음'}" 불러옴`)
  }

  return (
    <div className="mt-8 rounded-3xl border border-line bg-paper p-6" data-testid="product-compare-panel">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold">다상품 비교</h3>
          <p className="mt-1 text-xs text-black/50">
            현재 입력을 상품으로 추가하고, 공헌이익·마크업·월 공헌을 한 테이블에서 비교합니다.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-full bg-brand px-3 py-1 text-xs font-semibold"
            onClick={handleAdd}
          >
            현재 상품 추가
          </button>
          {rows.length ? (
            <button
              type="button"
              className="rounded-full border border-line px-3 py-1 text-xs font-medium hover:bg-canvas"
              onClick={() => downloadProductCompareCsv(rows)}
            >
              CSV
            </button>
          ) : null}
        </div>
      </div>

      <label className="mt-4 flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={mode === 'all_channels'}
          onChange={(e) => setMode(e.target.checked ? 'all_channels' : 'primary')}
        />
        비교 채널 전체로 펼치기 ({compareChannels.length}개)
      </label>

      {message ? <p className="mt-2 text-xs text-black/55">{message}</p> : null}

      {!products.length ? (
        <p className="mt-4 text-sm text-black/45">추가된 상품이 없습니다. 계산 후 「현재 상품 추가」를 눌러 보세요.</p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="text-black/45">
              <tr>
                <th className="py-2">상품</th>
                <th>채널</th>
                <th>판매가</th>
                <th>공헌이익</th>
                <th>실마진</th>
                <th>마크업</th>
                <th>월 공헌</th>
                <th>판정</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={`${row.productId}-${row.channel}`} className="border-t border-line">
                  <td className="py-2 font-medium">{row.productName}</td>
                  <td>{row.channelLabel}</td>
                  <td className="tabular-nums">{krw(row.listPrice)}</td>
                  <td className="tabular-nums">{krw(row.contributionProfit)}</td>
                  <td>{pct(row.marginRate)}</td>
                  <td>{pct(row.markupRate)}</td>
                  <td className="tabular-nums">{krw(row.monthlyContribution)}</td>
                  <td>{riskLabel(row.risk).text}</td>
                  <td className="text-right">
                    <button
                      type="button"
                      className="mr-2 text-xs underline"
                      onClick={() => {
                        const product = products.find((p) => p.id === row.productId)
                        if (product) handleLoad(product)
                      }}
                    >
                      불러오기
                    </button>
                    {mode === 'primary' ? (
                      <button type="button" className="text-xs text-red-700 underline" onClick={() => handleRemove(row.productId)}>
                        삭제
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
