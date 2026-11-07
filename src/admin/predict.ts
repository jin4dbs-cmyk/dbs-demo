/**
 * 선택한 feature 로 예가율 분포를 근사 계산하는 목업 예측기.
 * 실제 연동 시 (bid, selectedKeys) → 모델 API 호출로 교체하세요. 반환 형태(Prediction)만 유지하면 UI 는 그대로 동작합니다.
 * 해제한 feature 는 '모름'으로 넣는다고 가정: 중심 이동에서 빠지고, 중요도만큼 분포가 넓어집니다.
 */
import { DATASET_META, FEATURES } from "./data"
import type { AdminBid } from "./types"

export interface Bin {
  /** 구간 시작 예가율 (%) */
  from: number
  /** 구간 끝 예가율 (%) */
  to: number
  /** 보정된 확률 (0~1) */
  p: number
}

export interface Prediction {
  center: number
  sigma: number
  q25: number
  q75: number
  confidence: "높음" | "보통" | "낮음"
  usedCount: number
  top01: Bin[]
  top001: Bin[]
  top01Sum: number
  top001Sum: number
}

const TOTAL_IMPORTANCE = FEATURES.reduce((s, f) => s + f.importance, 0)

function hashNoise(seed: string, i: number) {
  let h = 2166136261
  const s = `${seed}:${i}`
  for (let k = 0; k < s.length; k++) h = Math.imul(h ^ s.charCodeAt(k), 16777619)
  return ((h >>> 0) % 10000) / 10000 - 0.5
}

const erf = (x: number) => {
  const t = 1 / (1 + 0.3275911 * Math.abs(x))
  const y = 1 - (((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496735) * t + 0.254829592) * t) * Math.exp(-x * x)
  return x >= 0 ? y : -y
}
const cdf = (x: number, mu: number, s: number) => 0.5 * (1 + erf((x - mu) / (s * Math.SQRT2)))

export function predict(bid: AdminBid, selected: Set<string>): Prediction {
  let center = bid.prior
  let unknown = 0
  let usedCount = 0
  for (const f of FEATURES) {
    const v = bid.features[f.key]
    if (selected.has(f.key) && v.display != null) {
      center += v.effect
      usedCount++
    } else {
      unknown += f.importance
    }
  }
  const base = bid.reserveRange === 3 ? 0.55 : 0.4
  const sigma = base * (1 + (0.9 * unknown) / TOTAL_IMPORTANCE)

  // 0.01%p 구간 확률 (공고별 고정 노이즈로 실제 분포처럼 들쭉날쭉하게)
  const lo = 100 - bid.reserveRange
  const n = Math.round(bid.reserveRange * 2 * 100)
  const raw: number[] = []
  for (let i = 0; i < n; i++) {
    const a = lo + i / 100
    const mass = cdf(a + 0.01, center, sigma) - cdf(a, center, sigma)
    raw.push(Math.max(0, mass * (1 + 0.9 * hashNoise(bid.id, i))))
  }
  const total = raw.reduce((s, x) => s + x, 0) || 1
  const fine = raw.map((x, i) => ({ from: lo + i / 100, to: lo + (i + 1) / 100, p: x / total }))

  // 분위수
  let acc = 0
  let q25 = lo
  let q75 = lo
  for (const b of fine) {
    const prev = acc
    acc += b.p
    if (prev < 0.25 && acc >= 0.25) q25 = b.from
    if (prev < 0.75 && acc >= 0.75) q75 = b.to
  }

  const coarse: Bin[] = []
  for (let i = 0; i < fine.length; i += 10) {
    const chunk = fine.slice(i, i + 10)
    coarse.push({ from: chunk[0].from, to: chunk[chunk.length - 1].to, p: chunk.reduce((s, b) => s + b.p, 0) })
  }

  const k = DATASET_META.calibration
  const top = (bins: Bin[]) =>
    [...bins].sort((a, b) => b.p - a.p).slice(0, 5).map((b) => ({ ...b, p: b.p * k }))
  const top01 = top(coarse)
  const top001 = top(fine)

  return {
    center,
    sigma,
    q25,
    q75,
    confidence: sigma < 0.5 ? "높음" : sigma < 0.7 ? "보통" : "낮음",
    usedCount,
    top01,
    top001,
    top01Sum: top01.reduce((s, b) => s + b.p, 0),
    top001Sum: top001.reduce((s, b) => s + b.p, 0),
  }
}

/** 예가율 → 예정가격 (원) */
export const plannedPrice = (bid: AdminBid, rate: number) => Math.floor((bid.baseAmount * rate) / 100)
/** 예정가격 × 낙찰하한율 → 낙찰하한가 (원) */
export const floorPrice = (bid: AdminBid, rate: number) => Math.floor((plannedPrice(bid, rate) * bid.lowerRate) / 100)
