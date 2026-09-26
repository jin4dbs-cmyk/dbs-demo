import { Check, FileSearch, Trophy } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { bestModelsOf, errorOf, fmtDelta, fmtRate, fmtWon } from "@/lib/metrics"
import { MODEL_COLOR, MODELS } from "@/lib/models"
import type { Bid, ModelId } from "@/lib/types"
import { cn } from "@/lib/utils"

const CATEGORY_STYLE: Record<string, string> = {
  전기감리: "bg-chart-1/10 text-chart-1 border-chart-1/20",
  소방감리: "bg-negative/10 text-negative border-negative/20",
  통신감리: "bg-chart-2/10 text-chart-2 border-chart-2/25",
}

export function BidTable({
  bids,
  overallBest,
  onEvidence,
}: {
  bids: Bid[]
  overallBest: ModelId | null
  onEvidence: (bid: Bid) => void
}) {
  return (
    <div className="bg-card overflow-hidden rounded-xl border shadow-sm">
      <Table className="min-w-[1120px]">
        <TableHeader className="bg-muted/50">
          <TableRow className="hover:bg-transparent">
            <TableHead rowSpan={2} className="w-32 pl-5">
              공고번호
            </TableHead>
            <TableHead rowSpan={2}>용역명</TableHead>
            <TableHead rowSpan={2} className="text-right">
              기초금액
            </TableHead>
            <TableHead colSpan={4} className="h-9 border-x text-center">
              모델별 예측 예가율
            </TableHead>
            <TableHead rowSpan={2} className="text-right">
              실제 예가율
            </TableHead>
            <TableHead rowSpan={2} className="text-center">
              개찰일
            </TableHead>
            <TableHead rowSpan={2} className="pr-5 text-center">
              근거
            </TableHead>
          </TableRow>
          <TableRow className="hover:bg-transparent">
            {MODELS.map((m) => (
              <TableHead
                key={m.id}
                className={cn(
                  "h-9 w-24 text-right first:border-l last:border-r",
                  m.id === 0 && "border-l",
                  m.id === 3 && "border-r",
                  m.id === overallBest && "bg-best-soft text-best font-semibold",
                )}
              >
                <span className="inline-flex items-center gap-1.5">
                  {m.id === overallBest ? (
                    <Trophy className="size-3.5" />
                  ) : (
                    <span className={cn("size-2 rounded-full", MODEL_COLOR[m.id])} />
                  )}
                  {m.name}
                </span>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {bids.length === 0 && (
            <TableRow>
              <TableCell colSpan={10} className="text-muted-foreground h-40 text-center">
                조건에 맞는 공고가 없습니다.
              </TableCell>
            </TableRow>
          )}
          {bids.map((bid) => {
            const best = bestModelsOf(bid)
            return (
              <TableRow key={bid.id} className="group">
                <TableCell className="text-muted-foreground pl-5 font-mono text-xs">{bid.id}</TableCell>
                <TableCell className="max-w-[340px] whitespace-normal">
                  <div className="flex items-center gap-1.5">
                    <Badge variant="outline" className={cn("px-1.5 py-0 text-[11px]", CATEGORY_STYLE[bid.category])}>
                      {bid.category}
                    </Badge>
                    <span className="truncate font-medium" title={bid.title}>
                      {bid.title}
                    </span>
                  </div>
                  <div className="text-muted-foreground mt-0.5 text-xs">
                    {bid.agencyFull} · {bid.region}
                  </div>
                </TableCell>
                <TableCell className="text-right tabular-nums">{fmtWon(bid.baseAmount)}</TableCell>
                {MODELS.map((m) => {
                  const err = errorOf(bid, m.id)
                  const isBest = best.includes(m.id)
                  return (
                    <TableCell
                      key={m.id}
                      className={cn(
                        "relative text-right tabular-nums",
                        m.id === overallBest && "bg-best-soft/35",
                      )}
                    >
                      <div
                        className={cn(
                          "ml-auto inline-flex w-full flex-col items-end rounded-md px-2 py-1",
                          isBest && "bg-best text-best-foreground shadow-sm",
                        )}
                      >
                        <span className={cn("inline-flex items-center gap-1", isBest && "font-semibold")}>
                          {isBest && <Check className="size-3.5" strokeWidth={3} />}
                          {fmtRate(bid.predictions[m.id])}
                        </span>
                        {err != null && (
                          <span
                            className={cn("text-[11px]", isBest ? "text-best-foreground/85" : "text-muted-foreground")}
                          >
                            {fmtDelta(err)}
                          </span>
                        )}
                      </div>
                    </TableCell>
                  )
                })}
                <TableCell className="text-right font-semibold tabular-nums">
                  {bid.actual == null ? <span className="text-muted-foreground font-normal">-</span> : fmtRate(bid.actual)}
                </TableCell>
                <TableCell className="text-center">
                  <div className="text-sm tabular-nums">{bid.openDate}</div>
                  <Badge
                    variant={bid.status === "opened" ? "secondary" : "outline"}
                    className={cn(
                      "mt-1 rounded-full px-2 py-0 text-[11px]",
                      bid.status === "pending" && "border-primary/30 text-primary",
                    )}
                  >
                    {bid.status === "opened" ? "개찰 완료" : "개찰 전"}
                  </Badge>
                </TableCell>
                <TableCell className="pr-5 text-center">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="sm" onClick={() => onEvidence(bid)}>
                        <FileSearch />
                        근거
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {bid.status === "opened" ? "예측과 실제 결과의 차이 분석" : "예측에 영향을 준 요인 보기"}
                    </TooltipContent>
                  </Tooltip>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
