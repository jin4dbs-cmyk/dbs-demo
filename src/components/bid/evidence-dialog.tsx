import { useMemo, useState } from "react"
import { Building2, CalendarDays, Coins, Lightbulb, Sparkles, Trophy, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { bestModelsOf, computeModelStats, fmtDelta, fmtRate, fmtWon, overallBest } from "@/lib/metrics"
import { MODEL_COLOR, MODELS } from "@/lib/models"
import { BIDS } from "@/lib/mock-data"
import type { Bid, ModelId } from "@/lib/types"
import { cn } from "@/lib/utils"
import { RateStrip } from "./rate-strip"

export function EvidenceDialog({ bid, onOpenChange }: { bid: Bid | null; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={!!bid} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] gap-0 overflow-y-auto p-0 sm:max-w-4xl">
        {bid && <EvidenceBody bid={bid} />}
      </DialogContent>
    </Dialog>
  )
}

function EvidenceBody({ bid }: { bid: Bid }) {
  // 동일 발주처·공종의 과거 개찰 실적으로 "이 유형에서 믿을 만한 모델"을 계산
  const peerStats = useMemo(
    () => computeModelStats(BIDS.filter((b) => b.agency === bid.agency && b.category === bid.category && b.id !== bid.id)),
    [bid],
  )
  const trusted = overallBest(peerStats) ?? 3
  const best = bestModelsOf(bid)
  const [model, setModel] = useState<ModelId>(best[0] ?? trusted)

  return (
    <>
      <DialogHeader className="bg-muted/40 border-b px-6 pt-6 pb-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-muted-foreground font-mono text-xs">{bid.id}</span>
          <Badge variant="outline">{bid.category}</Badge>
          <Badge variant={bid.status === "opened" ? "secondary" : "outline"} className="rounded-full">
            {bid.status === "opened" ? "개찰 완료" : "개찰 전"}
          </Badge>
        </div>
        <DialogTitle className="pr-8 text-xl leading-snug">{bid.title}</DialogTitle>
        <DialogDescription asChild>
          <div className="flex flex-wrap gap-x-5 gap-y-1">
            <Meta icon={Building2}>{bid.agencyFull} · {bid.region}</Meta>
            <Meta icon={Coins}>기초금액 {fmtWon(bid.baseAmount)}</Meta>
            <Meta icon={CalendarDays}>개찰일 {bid.openDate}</Meta>
            <Meta icon={Users}>예상 참여 {bid.participants}개사</Meta>
          </div>
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-6 px-6 py-5">
        <Insight bid={bid} trusted={trusted} />

        <section>
          <SectionTitle>예측 vs {bid.actual != null ? "실제" : "기준값"} 한눈에 보기</SectionTitle>
          <RateStrip bid={bid} />
        </section>

        <Tabs defaultValue="factors">
          <TabsList className="w-full sm:w-fit">
            <TabsTrigger value="factors">영향 요인</TabsTrigger>
            <TabsTrigger value="draw">복수예가 추첨</TabsTrigger>
            <TabsTrigger value="models">모델 비교</TabsTrigger>
            <TabsTrigger value="similar">유사 공고</TabsTrigger>
          </TabsList>

          <TabsContent value="factors" className="pt-3">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <p className="text-muted-foreground text-sm">
                기준값에서 출발해 각 요인이 예측 예가율을 얼마나 올리고(＋) 내렸는지(−) 보여줍니다.
              </p>
              <ToggleGroup
                type="single"
                variant="outline"
                size="sm"
                value={String(model)}
                onValueChange={(v) => v && setModel(Number(v) as ModelId)}
              >
                {MODELS.map((m) => (
                  <ToggleGroupItem key={m.id} value={String(m.id)} className="gap-1.5 px-2.5">
                    <span className={cn("size-2 rounded-full", MODEL_COLOR[m.id])} />
                    {m.short}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>
            <FactorWaterfall bid={bid} model={model} />
          </TabsContent>

          <TabsContent value="draw" className="pt-3">
            <ReserveDraw bid={bid} />
          </TabsContent>

          <TabsContent value="models" className="pt-3">
            <ModelCompare bid={bid} peerStats={peerStats} trusted={trusted} />
          </TabsContent>

          <TabsContent value="similar" className="pt-3">
            <SimilarList bid={bid} />
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}

function Meta({ icon: Icon, children }: { icon: typeof Building2; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm">
      <Icon className="size-3.5" />
      {children}
    </span>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="mb-3 text-sm font-semibold">{children}</h3>
}

/** 규칙 기반 자동 해석 문장 */
function Insight({ bid, trusted }: { bid: Bid; trusted: ModelId }) {
  const preds = bid.predictions
  const spread = Math.max(...preds) - Math.min(...preds)
  const consensus = preds.reduce((s, p) => s + p, 0) / 4
  const topFactor = bid.factors[trusted].find((f) => f.key !== "other") ?? bid.factors[trusted][0]
  const confidence = spread < 0.4 ? "높음" : spread < 0.8 ? "보통" : "낮음"

  const lines: React.ReactNode[] = []
  if (bid.actual != null) {
    const best = bestModelsOf(bid)
    const bestErr = preds[best[0]] - bid.actual
    const drawn = bid.drawnIndices!.map((i) => `#${i + 1}`).join(", ")
    lines.push(
      <>
        실제 예가율 <b>{fmtRate(bid.actual)}</b>는 추첨된 복수예가 {drawn}의 평균으로 결정되었습니다.
      </>,
      <>
        <b className="text-best">{best.map((m) => MODELS[m].name).join(", ")}</b>이(가) <b>{fmtDelta(bestErr)}</b> 차이로 가장
        근접했고, 4개 모델 평균은 {fmtDelta(consensus - bid.actual)} 빗나갔습니다.
      </>,
      <>
        실제값이 기준값({fmtRate(bid.baseline)}) 대비 {fmtDelta(bid.actual - bid.baseline)} 움직였으며, 가장 크게 작용한 요인은{" "}
        <b>'{topFactor.label}'</b>({fmtDelta(topFactor.contribution)})입니다.
      </>,
    )
  } else {
    lines.push(
      <>
        4개 모델의 예측 범위는 <b>{fmtRate(Math.min(...preds))} ~ {fmtRate(Math.max(...preds))}</b>(편차 {spread.toFixed(2)}%p)로 예측
        신뢰도는 <b>{confidence}</b>입니다.
      </>,
      <>
        {bid.agency}·{bid.category} 유형에서 과거 정확도가 가장 높았던 <b className="text-best">{MODELS[trusted].name}</b>의 예측{" "}
        <b>{fmtRate(preds[trusted])}</b>를 우선 참고하세요.
      </>,
      <>
        가장 큰 영향 요인은 <b>'{topFactor.label}'</b>({topFactor.value}, {fmtDelta(topFactor.contribution)})입니다.
      </>,
    )
  }

  return (
    <div className="border-primary/20 bg-primary/5 rounded-lg border p-4">
      <div className="text-primary mb-2 flex items-center gap-1.5 text-sm font-semibold">
        <Sparkles className="size-4" />
        핵심 요약
      </div>
      <ul className="space-y-1.5 text-sm leading-relaxed">
        {lines.map((l, i) => (
          <li key={i} className="flex gap-2">
            <span className="bg-primary/60 mt-2 size-1 shrink-0 rounded-full" />
            <span>{l}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function FactorWaterfall({ bid, model }: { bid: Bid; model: ModelId }) {
  const factors = bid.factors[model]
  const maxAbs = Math.max(0.05, ...factors.map((f) => Math.abs(f.contribution)))
  const total = factors.reduce((s, f) => s + f.contribution, 0)
  const pred = bid.predictions[model]

  return (
    <div className="rounded-lg border">
      <Row label="기준값" sub="발주처·공종 과거 평균 예가율" right={fmtRate(bid.baseline)} strong />
      {factors.map((f) => {
        const pct = (Math.abs(f.contribution) / maxAbs) * 50
        const pos = f.contribution >= 0
        return (
          <div key={f.key} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)_72px] items-center gap-3 border-t px-4 py-2.5">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-sm font-medium">
                {f.label}
                <span className="text-muted-foreground truncate text-xs font-normal">{f.value}</span>
              </div>
              <p className="text-muted-foreground line-clamp-2 text-xs">{f.description}</p>
            </div>
            <div className="relative h-5">
              <div className="bg-border absolute inset-y-0 left-1/2 w-px" />
              <div
                className={cn("absolute top-1 h-3 rounded-sm", pos ? "bg-positive" : "bg-negative")}
                style={pos ? { left: "50%", width: `${pct}%` } : { right: "50%", width: `${pct}%` }}
              />
            </div>
            <div className={cn("text-right text-sm font-medium tabular-nums", pos ? "text-positive" : "text-negative")}>
              {fmtDelta(f.contribution, 3)}
            </div>
          </div>
        )
      })}
      <Row
        label={`${MODELS[model].name} 예측`}
        sub={`기준값 ${fmtDelta(total, 3)}`}
        right={fmtRate(pred)}
        strong
        className="bg-muted/40"
      />
      {bid.actual != null && (
        <Row
          label="실제 예가율"
          sub={`예측 대비 ${fmtDelta(bid.actual - pred, 3)} — 모델이 설명하지 못한 추첨 변동`}
          right={fmtRate(bid.actual)}
          strong
        />
      )}
    </div>
  )
}

function Row({
  label,
  sub,
  right,
  strong,
  className,
}: {
  label: string
  sub?: string
  right: string
  strong?: boolean
  className?: string
}) {
  return (
    <div className={cn("flex items-center justify-between gap-3 border-t px-4 py-2.5 first:border-t-0", className)}>
      <div>
        <div className={cn("text-sm", strong && "font-semibold")}>{label}</div>
        {sub && <div className="text-muted-foreground text-xs">{sub}</div>}
      </div>
      <div className={cn("tabular-nums", strong && "font-semibold")}>{right}</div>
    </div>
  )
}

function ReserveDraw({ bid }: { bid: Bid }) {
  const opened = bid.drawnIndices != null
  const toWon = (rate: number) => Math.round((bid.baseAmount * rate) / 100)
  return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-sm">
        기초금액의 ±{bid.reserveRange}% 범위에서 복수예비가격 15개가 작성되고, 참여업체가 선택한 번호 중 최다 선택 4개의 평균이
        예정가격이 됩니다. <b className="text-foreground">예가율 = 예정가격 ÷ 기초금액</b>
      </p>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
        {bid.reservePrices.map((p, i) => {
          const drawn = bid.drawnIndices?.includes(i)
          return (
            <div
              key={i}
              className={cn(
                "rounded-lg border p-2.5 text-center",
                drawn && "border-foreground bg-foreground text-background",
                !opened && "bg-muted/40",
              )}
            >
              <div className={cn("text-[11px]", drawn ? "text-background/70" : "text-muted-foreground")}>#{i + 1}</div>
              {opened ? (
                <>
                  <div className="text-sm font-semibold tabular-nums">{p.toFixed(3)}%</div>
                  <div className={cn("text-[10px] tabular-nums", drawn ? "text-background/70" : "text-muted-foreground")}>
                    {toWon(p).toLocaleString("ko-KR")}
                  </div>
                </>
              ) : (
                <div className="text-muted-foreground py-1.5 text-sm">비공개</div>
              )}
            </div>
          )
        })}
      </div>
      {opened ? (
        <div className="bg-muted/40 flex flex-wrap items-center justify-between gap-2 rounded-lg px-4 py-3 text-sm">
          <span>
            추첨 번호 <b>{bid.drawnIndices!.map((i) => `#${i + 1}`).join(" · ")}</b> 평균
          </span>
          <span className="font-semibold tabular-nums">
            예정가격 {fmtWon(toWon(bid.actual!))} · 예가율 {fmtRate(bid.actual)}
          </span>
        </div>
      ) : (
        <div className="text-muted-foreground bg-muted/40 rounded-lg px-4 py-3 text-sm">
          복수예비가격은 개찰 시점에 공개됩니다. 개찰 후 자동으로 수집되어 예측과 비교됩니다.
        </div>
      )}
    </div>
  )
}

function ModelCompare({
  bid,
  peerStats,
  trusted,
}: {
  bid: Bid
  peerStats: ReturnType<typeof computeModelStats>
  trusted: ModelId
}) {
  const best = bestModelsOf(bid)
  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="pl-4">모델</TableHead>
              <TableHead className="text-right">예측 예가율</TableHead>
              <TableHead className="text-right">실제 대비</TableHead>
              <TableHead className="text-right">
                {bid.agency}·{bid.category} MAE
              </TableHead>
              <TableHead className="pr-4">주요 근거</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {MODELS.map((m) => {
              const s = peerStats[m.id]
              const top = bid.factors[m.id].find((f) => f.key !== "other")!
              const isBest = best.includes(m.id)
              return (
                <TableRow key={m.id} className={cn(isBest && "bg-best-soft/60 hover:bg-best-soft/70")}>
                  <TableCell className="pl-4">
                    <div className="flex items-center gap-2 font-medium">
                      <span className={cn("size-2.5 rounded-full", MODEL_COLOR[m.id])} />
                      {m.name}
                      {isBest && (
                        <Badge variant="best" className="rounded-full">
                          <Trophy />
                          최근접
                        </Badge>
                      )}
                      {m.id === trusted && (
                        <Badge variant="outline" className="rounded-full">
                          유형 최우수
                        </Badge>
                      )}
                    </div>
                    <div className="text-muted-foreground text-xs">{m.description}</div>
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums">{fmtRate(bid.predictions[m.id])}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {bid.actual == null ? "-" : fmtDelta(bid.predictions[m.id] - bid.actual)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {s.mae == null ? "-" : `${s.mae.toFixed(3)}%p`}
                    <div className="text-muted-foreground text-[11px]">{s.n}건 기준</div>
                  </TableCell>
                  <TableCell className="pr-4 text-sm">
                    {top.label} <span className="text-muted-foreground">{fmtDelta(top.contribution)}</span>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
      <p className="text-muted-foreground flex items-start gap-1.5 text-xs">
        <Lightbulb className="mt-0.5 size-3.5 shrink-0" />
        '유형 최우수'는 같은 발주처·공종의 과거 개찰 공고에서 평균 오차가 가장 작았던 모델입니다.
      </p>
    </div>
  )
}

function SimilarList({ bid }: { bid: Bid }) {
  const avg = bid.similar.reduce((s, x) => s + x.rate, 0) / bid.similar.length
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className="text-muted-foreground">발주처·공종·금액대가 유사한 과거 개찰 공고</span>
        <span>
          유사 공고 평균 예가율 <b className="tabular-nums">{fmtRate(avg)}</b>
        </span>
      </div>
      <div className="divide-y rounded-lg border">
        {bid.similar.map((s) => (
          <div key={s.id} className="grid grid-cols-[minmax(0,1fr)_120px_80px] items-center gap-4 px-4 py-3">
            <div className="min-w-0">
              <div className="truncate text-sm font-medium">{s.title}</div>
              <div className="text-muted-foreground font-mono text-xs">
                {s.id} · {s.openDate}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-muted-foreground flex justify-between text-[11px]">
                <span>유사도</span>
                <span className="text-foreground font-medium">{s.similarity}%</span>
              </div>
              <Progress value={s.similarity} className="h-1.5" />
            </div>
            <div className="text-right font-semibold tabular-nums">{fmtRate(s.rate)}</div>
          </div>
        ))}
      </div>
      <Separator />
      <p className="text-muted-foreground text-xs">
        유사도는 발주처, 공종, 기초금액 구간, 지역, 개찰 시기를 기준으로 산출됩니다.
      </p>
    </div>
  )
}
