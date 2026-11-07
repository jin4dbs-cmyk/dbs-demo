import { cn } from "@/lib/utils"
import { DATASET_META, FEATURES } from "../data"
import { openAtLabel, pct, pctp, won } from "../format"
import { floorPrice, plannedPrice, type Bin, type Prediction } from "../predict"
import type { AdminBid } from "../types"
import { CATEGORY_TONE, Chip } from "./chip"

export function BidDetail({ bid, prediction }: { bid: AdminBid | null; prediction: Prediction | null }) {
  if (!bid || !prediction) {
    return (
      <section className="bg-card text-grey-500 grid min-h-0 place-items-center rounded-2xl text-[15px]">
        왼쪽에서 공고를 골라주세요
      </section>
    )
  }
  const p = prediction
  const confTone = p.confidence === "높음" ? "text-green-500" : p.confidence === "보통" ? "text-grey-900" : "text-orange-500"

  return (
    <section className="bg-card flex min-h-0 flex-col overflow-hidden rounded-2xl">
      <div className="toss-scroll @container min-h-0 flex-1 space-y-8 overflow-y-auto px-5 pt-6 pb-8 lg:px-8">
        {/* 공고 헤더 */}
        <header className="space-y-2">
          <div className="flex flex-wrap gap-1">
            <Chip tone={CATEGORY_TONE[bid.category] ?? "grey"}>{bid.category}</Chip>
            <Chip>{bid.agency}</Chip>
            {bid.missingRegionIndustry && <Chip tone="red">지역·업종 미수집</Chip>}
          </div>
          <h1 className="text-[22px] leading-snug font-bold text-balance">{bid.title}</h1>
          <p className="text-grey-600 text-[14px] leading-relaxed tabular-nums">
            {bid.id} · {bid.region} · 개찰 {openAtLabel(bid.openAt)}
            <br />
            기초금액 {won(bid.baseAmount)} · 낙찰하한율 {bid.lowerRate}% · 예비가격 범위 −{bid.reserveRange} ~ +{bid.reserveRange}%
          </p>
        </header>

        {/* 핵심 수치 */}
        <div className="grid grid-cols-1 gap-2 @md:grid-cols-2 @5xl:grid-cols-4">
          <Stat
            label="예상 예가율"
            value={pct(p.center, 3)}
            valueClass="text-blue-500"
            sub={`예정가격 약 ${won(plannedPrice(bid, p.center))}`}
          />
          <Stat
            label="예상 낙찰하한가"
            value={won(floorPrice(bid, p.center))}
            sub={`예정가격 × 하한율 ${bid.lowerRate}%`}
          />
          <Stat
            label="절반은 이 안에서 정해져요"
            value={`${pct(p.q25)} ~ ${pct(p.q75)}`}
            sub={`하한가 ${won(floorPrice(bid, p.q25))} ~ ${won(floorPrice(bid, p.q75))}`}
          />
          <Stat
            label="신뢰도"
            value={p.confidence}
            valueClass={confTone}
            sub={`분포 폭 ±${p.sigma.toFixed(2)}%p · ±${bid.reserveRange}% 공고 기준`}
          />
        </div>

        <BinTable
          title="0.1%p 구간 top 5"
          sum={p.top01Sum}
          bins={p.top01}
          bid={bid}
          barClass="bg-blue-500"
          digits={1}
        />
        <BinTable
          title="0.01%p 구간 top 5"
          sum={p.top001Sum}
          bins={p.top001}
          bid={bid}
          barClass="bg-teal-500"
          digits={2}
        />

        <footer className="text-grey-500 border-grey-100 space-y-1 border-t pt-5 text-[13px] leading-relaxed">
          <p>
            체크한 feature {p.usedCount}개로 계산했어요. 해제했거나 수집되지 않은 feature {FEATURES.length - p.usedCount}개는 '모름'으로 넣었어요.
          </p>
          <p>
            확률은 평가 기간({DATASET_META.evalPeriod}) 실제 적중률에 맞춰 보정한 값이에요 (보정 계수 {DATASET_META.calibration}).
          </p>
          <p>시장 통계는 {DATASET_META.statsAsOf}까지 개찰된 공고로 계산했어요. 이후 결과는 아직 반영하지 않았어요.</p>
        </footer>
      </div>
    </section>
  )
}

function Stat({ label, value, sub, valueClass }: { label: string; value: string; sub: string; valueClass?: string }) {
  return (
    <div className="bg-grey-50 flex flex-col gap-1 rounded-2xl px-5 py-4">
      <span className="text-grey-600 text-[13px] font-medium">{label}</span>
      <span className={cn("text-[20px] leading-tight font-bold tracking-tight tabular-nums", valueClass)}>{value}</span>
      <span className="text-grey-500 text-[12px] tabular-nums">{sub}</span>
    </div>
  )
}

function BinTable({
  title,
  sum,
  bins,
  bid,
  barClass,
  digits,
}: {
  title: string
  sum: number
  bins: Bin[]
  bid: AdminBid
  barClass: string
  digits: number
}) {
  const max = Math.max(...bins.map((b) => b.p))
  // 0.1%p 구간은 다음 구간과 겹치지 않도록 끝값을 0.01 아래로 표시 (100.10 ~ 100.19%)
  const endTrim = digits === 1 ? 0.01 : 0
  const range = (b: Bin) => `${b.from.toFixed(2)} ~ ${(b.to - endTrim).toFixed(2)}%`
  return (
    <div className="space-y-3">
      <div className="flex items-baseline gap-2">
        <h3 className="text-[17px] font-bold">{title}</h3>
        <span className="text-grey-500 text-[13px] tabular-nums">5개 합 {(sum * 100).toFixed(1)}%</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-[14px] tabular-nums">
          <thead>
            <tr className="text-grey-500 border-grey-100 border-b text-left text-[13px]">
              <th className="w-12 py-2.5 pl-1 font-medium">순위</th>
              <th className="py-2.5 font-medium">예가율 구간</th>
              <th className="py-2.5 text-right font-medium">예정가격 / 낙찰하한가</th>
              <th className="w-[36%] py-2.5 pr-1 pl-8 font-medium">확률</th>
            </tr>
          </thead>
          <tbody>
            {bins.map((b, i) => (
              <tr key={b.from} className="border-grey-100 border-b whitespace-nowrap last:border-0">
                <td className="py-3 pl-1">
                  <span
                    className={cn(
                      "grid size-6 place-items-center rounded-full text-[12px] font-bold",
                      i === 0 ? "bg-blue-500 text-white" : "bg-grey-100 text-grey-600",
                    )}
                  >
                    {i + 1}
                  </span>
                </td>
                <td className="py-3">
                  <div className="font-semibold">{range(b)}</div>
                  <div className="text-grey-500 text-[12px]">
                    100% 대비 {pctp(b.from - 100)} ~ {pctp(b.to - 100 - endTrim)}
                  </div>
                </td>
                <td className="py-3 text-right">
                  <div>
                    {plannedPrice(bid, b.from).toLocaleString("ko-KR")} ~ {(plannedPrice(bid, b.to) - 1).toLocaleString("ko-KR")}원
                  </div>
                  <div className="text-grey-500 text-[12px]">
                    {floorPrice(bid, b.from).toLocaleString("ko-KR")} ~ {(floorPrice(bid, b.to) - 1).toLocaleString("ko-KR")}원
                  </div>
                </td>
                <td className="py-3 pr-1 pl-8">
                  <div className="flex items-center gap-2.5">
                    <div className="bg-grey-100 h-2 flex-1 overflow-hidden rounded-full">
                      <div className={cn("h-full rounded-full", barClass)} style={{ width: `${(b.p / max) * 100}%` }} />
                    </div>
                    <span className="w-12 text-right font-semibold">{(b.p * 100).toFixed(2)}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
