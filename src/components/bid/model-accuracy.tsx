import { Trophy } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { MODEL_COLOR, MODELS } from "@/lib/models"
import { HIT_THRESHOLD, type ModelStats } from "@/lib/metrics"
import type { ModelId } from "@/lib/types"
import { cn } from "@/lib/utils"

export function ModelAccuracy({ stats, best }: { stats: ModelStats[]; best: ModelId | null }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((s) => {
        const isBest = s.id === best
        const model = MODELS[s.id]
        return (
          <Card
            key={s.id}
            className={cn(
              "relative gap-3 overflow-hidden px-4 py-4 transition-shadow",
              isBest && "border-best ring-best/30 bg-best-soft/40 ring-4",
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className={cn("size-2.5 rounded-full", MODEL_COLOR[s.id])} />
                <span className="font-semibold whitespace-nowrap">{model.name}</span>
              </div>
              {isBest && (
                <span className="bg-best text-best-foreground inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap">
                  <Trophy className="size-3" />
                  최고 정확도
                </span>
              )}
            </div>
            <p className="text-muted-foreground -mt-1 line-clamp-1 text-xs">{model.description}</p>
            <div className="flex items-end justify-between gap-2">
              <div>
                <div className="text-muted-foreground text-[11px]">평균 오차 (MAE)</div>
                <div className={cn("text-2xl font-bold tracking-tight", isBest && "text-best")}>
                  {s.mae == null ? "-" : `${s.mae.toFixed(3)}`}
                  <span className="text-muted-foreground ml-0.5 text-sm font-medium">%p</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-muted-foreground text-[11px]">최근접 횟수</div>
                <div className="text-sm font-semibold">
                  {s.wins}
                  <span className="text-muted-foreground font-normal"> / {s.n}건</span>
                </div>
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-muted-foreground flex justify-between text-[11px]">
                <span>±{HIT_THRESHOLD}%p 적중률</span>
                <span className="text-foreground font-medium">
                  {s.hitRate == null ? "-" : `${Math.round(s.hitRate * 100)}%`}
                </span>
              </div>
              <Progress
                value={(s.hitRate ?? 0) * 100}
                className="h-1.5"
                indicatorClassName={isBest ? "bg-best" : MODEL_COLOR[s.id]}
              />
            </div>
          </Card>
        )
      })}
    </div>
  )
}
