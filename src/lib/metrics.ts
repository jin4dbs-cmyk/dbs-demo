import type { Bid, ModelId } from "./types"

export const errorOf = (bid: Bid, m: ModelId) => (bid.actual == null ? null : bid.predictions[m] - bid.actual)

/** 개찰된 공고에서 실제 예가율과 가장 가까운 모델 (동률이면 모두) */
export function bestModelsOf(bid: Bid): ModelId[] {
  if (bid.actual == null) return []
  const errs = bid.predictions.map((p) => Math.abs(p - bid.actual!))
  const min = Math.min(...errs)
  return errs.flatMap((e, i) => (Math.abs(e - min) < 1e-9 ? [i as ModelId] : []))
}

export interface ModelStats {
  id: ModelId
  mae: number | null
  /** ±0.3%p 이내 적중률 */
  hitRate: number | null
  /** 행 단위 최근접 횟수 */
  wins: number
  n: number
}

export const HIT_THRESHOLD = 0.3

export function computeModelStats(bids: Bid[]): ModelStats[] {
  const opened = bids.filter((b) => b.actual != null)
  return ([0, 1, 2, 3] as ModelId[]).map((m) => {
    if (!opened.length) return { id: m, mae: null, hitRate: null, wins: 0, n: 0 }
    const errs = opened.map((b) => Math.abs(b.predictions[m] - b.actual!))
    return {
      id: m,
      mae: errs.reduce((s, e) => s + e, 0) / errs.length,
      hitRate: errs.filter((e) => e <= HIT_THRESHOLD).length / errs.length,
      wins: opened.filter((b) => bestModelsOf(b).includes(m)).length,
      n: opened.length,
    }
  })
}

export function overallBest(stats: ModelStats[]): ModelId | null {
  const valid = stats.filter((s) => s.mae != null)
  if (!valid.length) return null
  return valid.reduce((a, b) => (b.mae! < a.mae! ? b : a)).id
}

export const fmtRate = (n: number | null | undefined, d = 2) => (n == null ? "-" : `${n.toFixed(d)}%`)
export const fmtDelta = (n: number, d = 2) => `${n > 0 ? "+" : n < 0 ? "−" : "±"}${Math.abs(n).toFixed(d)}%p`
export const fmtWon = (n: number) => `${n.toLocaleString("ko-KR")}원`
