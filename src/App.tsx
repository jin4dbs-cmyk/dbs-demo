import { useMemo, useState } from "react"
import { ChevronLeft, ChevronRight, Database, RefreshCw } from "lucide-react"
import { BidTable } from "@/components/bid/bid-table"
import { EvidenceDialog } from "@/components/bid/evidence-dialog"
import { DEFAULT_FILTERS, Filters, type FilterState } from "@/components/bid/filters"
import { ModelAccuracy } from "@/components/bid/model-accuracy"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { TooltipProvider } from "@/components/ui/tooltip"
import { computeModelStats, overallBest } from "@/lib/metrics"
import { MODELS } from "@/lib/models"
import { BIDS, LAST_CRAWLED_AT } from "@/lib/mock-data"
import type { Bid } from "@/lib/types"

const PAGE_SIZE = 15


export default function App() {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS)
  const [page, setPage] = useState(0)
  const [selected, setSelected] = useState<Bid | null>(null)

  // 상태 필터를 제외한 조건 — 모델 정확도는 개찰 완료 건 기준이므로 상태 필터와 무관하게 계산
  const scoped = useMemo(() => {
    const q = filters.query.trim().toLowerCase()
    return BIDS.filter(
      (b) =>
        (filters.category === "all" || b.category === filters.category) &&
        (filters.agency === "all" || b.agency === filters.agency) &&
        (!q || b.id.toLowerCase().includes(q) || b.title.toLowerCase().includes(q)),
    )
  }, [filters.category, filters.agency, filters.query])

  const filtered = useMemo(
    () => (filters.status === "all" ? scoped : scoped.filter((b) => b.status === filters.status)),
    [scoped, filters.status],
  )

  const stats = useMemo(() => computeModelStats(scoped), [scoped])
  const best = overallBest(stats)

  const openedCount = scoped.filter((b) => b.status === "opened").length
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const current = Math.min(page, pageCount - 1)
  const rows = filtered.slice(current * PAGE_SIZE, (current + 1) * PAGE_SIZE)

  const totalOpened = BIDS.filter((b) => b.status === "opened").length

  return (
    <TooltipProvider>
      <div className="min-h-screen">
        <header className="bg-background/80 sticky top-[env(safe-area-inset-top,0px)] z-40 border-b backdrop-blur">
          <div className="mx-auto flex h-14 max-w-[1400px] items-center justify-between gap-4 px-4 sm:px-6">
            <div className="flex items-center gap-2.5">
              <div className="bg-primary text-primary-foreground grid size-8 place-items-center rounded-lg text-sm font-bold">
                예
              </div>
              <div className="leading-tight">
                <div className="font-semibold">예가율 예측 모니터</div>
                <div className="text-muted-foreground text-[11px]">나라장터 공동주택 감리 용역</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground hidden items-center gap-1.5 text-xs sm:inline-flex">
                <RefreshCw className="size-3.5" />
                마지막 수집 {LAST_CRAWLED_AT}
              </span>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1400px] space-y-6 px-4 py-6 sm:px-6">
          {/* 수집 현황 + 모델 정확도 */}
          <section className="grid gap-3 xl:grid-cols-[260px_minmax(0,1fr)]">
            <Card className="justify-between gap-4 px-5 py-5">
              <div>
                <div className="text-muted-foreground flex items-center gap-1.5 text-sm">
                  <Database className="size-4" />
                  크롤링 총 입찰 건수
                </div>
                <div className="mt-1 text-4xl font-bold tracking-tight">
                  {BIDS.length.toLocaleString()}
                  <span className="text-muted-foreground ml-1 text-lg font-medium">건</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="bg-muted/60 rounded-lg px-3 py-2">
                  <div className="text-muted-foreground text-xs">개찰 완료</div>
                  <div className="font-semibold">{totalOpened}건</div>
                </div>
                <div className="bg-muted/60 rounded-lg px-3 py-2">
                  <div className="text-muted-foreground text-xs">개찰 전</div>
                  <div className="font-semibold">{BIDS.length - totalOpened}건</div>
                </div>
              </div>
            </Card>
            <div className="space-y-2">
              <div className="flex items-baseline justify-between">
                <h2 className="text-sm font-semibold">모델별 정확도</h2>
                <span className="text-muted-foreground text-xs">
                  현재 필터의 개찰 완료 {openedCount}건 기준
                </span>
              </div>
              <ModelAccuracy stats={stats} best={best} />
            </div>
          </section>

          {/* 필터 */}
          <Filters
            value={filters}
            onChange={(f) => {
              setFilters(f)
              setPage(0)
            }}
          />

          {/* 리스트 */}
          <section className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
              <div className="flex items-baseline gap-2">
                <h2 className="text-xl font-bold">총 {filtered.length}건</h2>
                <span className="text-muted-foreground text-sm">개찰 완료 {filtered.filter((b) => b.actual != null).length}건</span>
              </div>
              <div className="text-muted-foreground flex flex-wrap items-center gap-4 text-xs">
                <span className="inline-flex items-center gap-1.5">
                  <span className="bg-best size-3 rounded" />
                  공고별 실제 예가율과 가장 가까운 모델
                </span>
                {best != null && (
                  <span className="inline-flex items-center gap-1.5">
                    <span className="bg-best-soft border-best/40 size-3 rounded border" />
                    전체 최고 정확도 모델 ({MODELS[best].name})
                  </span>
                )}
              </div>
            </div>

            <BidTable bids={rows} overallBest={best} onEvidence={setSelected} />

            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">
                {filtered.length ? `${current * PAGE_SIZE + 1}–${Math.min((current + 1) * PAGE_SIZE, filtered.length)}` : 0} /{" "}
                {filtered.length}건
              </span>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="icon" disabled={current === 0} onClick={() => setPage(current - 1)} aria-label="이전">
                  <ChevronLeft />
                </Button>
                {Array.from({ length: pageCount }, (_, i) => (
                  <Button
                    key={i}
                    variant={i === current ? "default" : "ghost"}
                    size="icon"
                    className="size-9"
                    onClick={() => setPage(i)}
                  >
                    {i + 1}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  size="icon"
                  disabled={current >= pageCount - 1}
                  onClick={() => setPage(current + 1)}
                  aria-label="다음"
                >
                  <ChevronRight />
                </Button>
              </div>
            </div>
          </section>
        </main>

        <EvidenceDialog bid={selected} onOpenChange={(o) => !o && setSelected(null)} />
      </div>
    </TooltipProvider>
  )
}
