import { Search } from "lucide-react"
import { cn } from "@/lib/utils"
import type { AdminBid } from "../types"
import { openAtLabel, won } from "../format"
import { CATEGORY_TONE, Chip } from "./chip"

export function BidList({
  bids,
  total,
  query,
  onQuery,
  selectedId,
  onSelect,
}: {
  bids: AdminBid[]
  total: number
  query: string
  onQuery: (q: string) => void
  selectedId: string | null
  onSelect: (id: string) => void
}) {
  return (
    <section className="bg-card flex min-h-0 flex-col overflow-hidden rounded-2xl">
      <header className="space-y-3 px-5 pt-5 pb-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-[17px] font-bold">개찰 전 공고</h2>
          <span className="text-grey-600 text-[13px] tabular-nums">
            {bids.length === total ? `${total}건` : `${bids.length} / ${total}건`}
          </span>
        </div>
        <div className="bg-grey-100 focus-within:ring-blue-500/30 flex h-11 items-center gap-2 rounded-xl px-3.5 focus-within:ring-2">
          <Search className="text-grey-500 size-[18px]" />
          <input
            id="bid-search"
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder="공고명, 공고번호로 검색"
            className="placeholder:text-grey-500 h-full w-full bg-transparent text-[15px] outline-none"
          />
        </div>
      </header>

      <ul className="toss-scroll min-h-0 flex-1 space-y-1 overflow-y-auto px-2 pb-3">
        {bids.length === 0 && <li className="text-grey-500 py-16 text-center text-[14px]">검색 결과가 없어요</li>}
        {bids.map((b) => {
          const active = b.id === selectedId
          return (
            <li key={b.id}>
              <button
                type="button"
                onClick={() => onSelect(b.id)}
                aria-current={active}
                className={cn(
                  "w-full space-y-1.5 rounded-xl px-3.5 py-3 text-left transition-colors",
                  active ? "bg-blue-50" : "hover:bg-grey-50",
                )}
              >
                <div className={cn("line-clamp-2 text-[15px] leading-snug font-semibold", active ? "text-blue-600" : "text-grey-900")}>
                  {b.title}
                </div>
                <div className="text-grey-600 text-[13px] leading-snug tabular-nums">
                  {openAtLabel(b.openAt)} · 기초 {won(b.baseAmount)} · 하한율 {b.lowerRate}%
                </div>
                <div className="flex flex-wrap gap-1 pt-0.5">
                  <Chip tone={CATEGORY_TONE[b.category] ?? "grey"}>{b.category}</Chip>
                  <Chip>{b.region}</Chip>
                  <Chip tone={b.reserveRange === 3 ? "orange" : "green"}>
                    범위 −{b.reserveRange} ~ +{b.reserveRange}
                  </Chip>
                  {b.missingRegionIndustry && <Chip tone="red">지역·업종 미수집</Chip>}
                </div>
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
