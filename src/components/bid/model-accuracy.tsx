import { Trophy } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { MODEL_COLOR, MODELS } from "@/lib/models"
import { HIT_THRESHOLD, type ModelStats } from "@/lib/metrics"
import type { ModelId } from "@/lib/types"
import { cn } from "@/lib/utils"

/** 요약 카드 안에 들어가는 컴팩트한 모델별 정확도 타일 */
export function ModelAccuracy({ stats, best }: { stats: ModelStats[]; best: ModelId | null }) {
  return (
    <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
      {stats.map((s) => {
        const isBest = s.id === best
        const model = MODELS[s.id]
        return (
          <Tooltip key={s.id}>
            <TooltipTrigger asChild>
              <div
                className={cn(
                  "flex flex-col gap-1.5 rounded-lg border border-transparent px-3 py-2.5",
                  isBest ? "border-best bg-best-soft/60" : "bg-muted/50",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 text-sm font-semibold whitespace-nowrap">
                    <span className={cn("size-2 rounded-full", MODEL_COLOR[s.id])} />
                    {model.name}
                  </span>
                  {isBest && (
                    <span className="bg-best text-best-foreground inline-flex items-center gap-1 rounded-full px-1.5 py-px text-[10px] font-semibold whitespace-nowrap">
                      <Trophy className="size-2.5" />
                      최고
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
                  <span className={cn("text-lg leading-none font-bold tabular-nums", isBest && "text-best")}>
                    {s.mae == null ? "-" : s.mae.toFixed(3)}
                    <span className="text-muted-foreground ml-0.5 text-[11px] font-medium">%p</span>
                  </span>
                  <span className="text-muted-foreground text-[11px] whitespace-nowrap tabular-nums">
                    적중 {s.hitRate == null ? "-" : `${Math.round(s.hitRate * 100)}%`} · 최근접 {s.wins}건
                  </span>
                </div>
                <Progress
                  value={(s.hitRate ?? 0) * 100}
                  className="h-1"
                  indicatorClassName={isBest ? "bg-best" : MODEL_COLOR[s.id]}
                />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              {model.description} · 평균 오차(MAE), ±{HIT_THRESHOLD}%p 이내 적중률, 실제값 최근접 횟수 ({s.n}건 기준)
            </TooltipContent>
          </Tooltip>
        )
      })}
    </div>
  )
}
