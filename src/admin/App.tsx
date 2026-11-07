import { useMemo, useState } from "react"
import { ADMIN_BIDS, DATASET_META, DEFAULT_SELECTED, FEATURES } from "./data"
import { predict } from "./predict"
import { BidDetail } from "./components/bid-detail"
import { BidList } from "./components/bid-list"
import { FeaturePanel } from "./components/feature-panel"

export default function AdminApp() {
  const [selected, setSelected] = useState<Set<string>>(() => new Set(DEFAULT_SELECTED))
  const [query, setQuery] = useState("")
  const [bidId, setBidId] = useState<string | null>(ADMIN_BIDS[0]?.id ?? null)

  const bids = useMemo(() => {
    const q = query.trim().toLowerCase()
    return q ? ADMIN_BIDS.filter((b) => b.title.toLowerCase().includes(q) || b.id.toLowerCase().includes(q)) : ADMIN_BIDS
  }, [query])

  const bid = ADMIN_BIDS.find((b) => b.id === bidId) ?? null
  const prediction = useMemo(() => (bid ? predict(bid, selected) : null), [bid, selected])

  return (
    <div className="flex flex-col lg:h-full">
      <header className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 bg-white px-6 py-3.5">
        <div className="min-w-0">
          <h1 className="text-[18px] font-bold">예가율 예측 · 관리자</h1>
          <p className="text-grey-600 text-[13px]">
            {DATASET_META.source}에서 개찰 전 공고 {DATASET_META.totalPending.toLocaleString()}건 (샘플 {ADMIN_BIDS.length}건) · feature{" "}
            {FEATURES.length}개 · 모델: {DATASET_META.trainPeriod} 학습
          </p>
        </div>
        <span className="bg-orange-50 text-orange-500 rounded-full px-2.5 py-1 text-[12px] font-semibold">샘플 데이터</span>
      </header>

      <main className="grid grid-cols-1 gap-2 p-2 lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(300px,340px)_minmax(320px,380px)_minmax(0,1fr)] lg:overflow-hidden [&>section:not(:last-child)]:max-lg:h-[70vh]">
        <FeaturePanel bid={bid} selected={selected} onChange={setSelected} />
        <BidList bids={bids} total={ADMIN_BIDS.length} query={query} onQuery={setQuery} selectedId={bidId} onSelect={setBidId} />
        <BidDetail bid={bid} prediction={prediction} />
      </main>
    </div>
  )
}
