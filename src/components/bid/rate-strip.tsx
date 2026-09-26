import { MODEL_COLOR, MODELS } from "@/lib/models"
import type { Bid } from "@/lib/types"
import { cn } from "@/lib/utils"
import { bestModelsOf } from "@/lib/metrics"

/** 복수예가 산정 범위 위에 모델 예측·실제 예가율·기준값을 한 축으로 보여주는 도트 플롯 */
export function RateStrip({ bid }: { bid: Bid }) {
  const values = [...bid.predictions, bid.baseline, ...(bid.actual != null ? [bid.actual] : [])]
  const lo = Math.min(99, Math.floor((Math.min(...values) - 0.3) * 2) / 2)
  const hi = Math.max(101, Math.ceil((Math.max(...values) + 0.3) * 2) / 2)
  const x = (v: number) => `${((v - lo) / (hi - lo)) * 100}%`
  const ticks: number[] = []
  for (let t = Math.ceil(lo * 2) / 2; t <= hi + 1e-9; t += 0.5) ticks.push(Math.round(t * 10) / 10)
  const best = bestModelsOf(bid)

  return (
    <div className="space-y-2">
      <div className="relative ml-16 h-[136px]">
        {/* grid */}
        {ticks.map((t) => (
          <div key={t} className="absolute top-0 bottom-5 border-l border-dashed" style={{ left: x(t) }} />
        ))}
        {/* 복수예가 (범위 내) */}
        {bid.drawnIndices && bid.reservePrices.map((p, i) =>
          p >= lo && p <= hi ? (
            <div
              key={i}
              className={cn(
                "absolute top-0 h-2 w-0.5 -translate-x-1/2 rounded-full",
                bid.drawnIndices!.includes(i) ? "bg-foreground" : "bg-muted-foreground/30",
              )}
              style={{ left: x(p) }}
              title={`복수예가 #${i + 1} ${p.toFixed(3)}%`}
            />
          ) : null,
        )}
        {/* 기준값 */}
        <div className="border-muted-foreground absolute top-3 bottom-5 border-l-2 border-dotted" style={{ left: x(bid.baseline) }} />
        {/* 실제 */}
        {bid.actual != null && (
          <div className="bg-foreground absolute top-3 bottom-5 w-0.5 -translate-x-1/2" style={{ left: x(bid.actual) }}>
            <span className="bg-foreground text-background absolute -top-0.5 left-1/2 -translate-x-1/2 -translate-y-full rounded px-1.5 py-0.5 text-[10px] font-semibold whitespace-nowrap">
              실제 {bid.actual.toFixed(2)}%
            </span>
          </div>
        )}
        {/* 모델 lanes */}
        {MODELS.map((m, lane) => (
          <div key={m.id} className="absolute inset-x-0" style={{ top: 22 + lane * 24 }}>
            <span className="text-muted-foreground absolute -left-16 w-14 text-right text-xs leading-4">{m.name}</span>
            <div
              className={cn(
                "absolute top-0 size-4 -translate-x-1/2 rounded-full border-2 border-white shadow dark:border-zinc-900",
                MODEL_COLOR[m.id],
                best.includes(m.id) && "ring-best ring-2 ring-offset-1",
              )}
              style={{ left: x(bid.predictions[m.id]) }}
              title={`${m.name} ${bid.predictions[m.id].toFixed(2)}%`}
            />
          </div>
        ))}
        {/* axis */}
        <div className="absolute inset-x-0 bottom-0 h-5">
          {ticks.map((t) => (
            <span key={t} className="text-muted-foreground absolute -translate-x-1/2 text-[10px] tabular-nums" style={{ left: x(t) }}>
              {t.toFixed(1)}
            </span>
          ))}
        </div>
      </div>
      <div className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 pl-16 text-[11px]">
        <span className="inline-flex items-center gap-1.5">
          <span className="border-muted-foreground h-3 border-l-2 border-dotted" />
          기준값 (발주처·공종 평균 {bid.baseline.toFixed(2)}%)
        </span>
        {bid.actual != null && (
          <span className="inline-flex items-center gap-1.5">
            <span className="bg-foreground h-3 w-0.5" />
            실제 예가율
          </span>
        )}
        {bid.drawnIndices && (
          <span className="inline-flex items-center gap-1.5">
            <span className="bg-muted-foreground/40 h-2 w-0.5" />
            복수예가 (진한 선 = 추첨됨)
          </span>
        )}
      </div>
    </div>
  )
}
