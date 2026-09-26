/**
 * 나라장터 크롤링 + 모델 예측 결과를 흉내 내는 결정적(seeded) 목업 데이터.
 * 실제 연동 시 이 모듈을 API 응답을 Bid[] 로 매핑하는 코드로 교체하면 됩니다.
 */
import type { Agency, Bid, Category, Factor, SimilarBid } from "./types"
import { CATEGORIES } from "./types"

function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const rand = mulberry32(20260926)
const uniform = (a: number, b: number) => a + (b - a) * rand()
const pick = <T,>(arr: readonly T[]) => arr[Math.floor(rand() * arr.length)]
const gauss = () => {
  const u = 1 - rand()
  const v = rand()
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}
const round = (n: number, d = 3) => Math.round(n * 10 ** d) / 10 ** d

const AGENCY_META: Record<
  Agency,
  { full: string; bias: number; range: number; sites: { name: string; region: string }[] }
> = {
  LH: {
    full: "한국토지주택공사",
    bias: -0.18,
    range: 2,
    sites: [
      { name: "화성동탄2 A-62BL", region: "경기 화성시" },
      { name: "고양창릉 S-3BL", region: "경기 고양시" },
      { name: "남양주왕숙 A-15BL", region: "경기 남양주시" },
      { name: "인천계양 A-9BL", region: "인천 계양구" },
      { name: "하남교산 A-4BL", region: "경기 하남시" },
      { name: "부천대장 A-7BL", region: "경기 부천시" },
      { name: "과천지식정보타운 S-8BL", region: "경기 과천시" },
      { name: "양주회천 A-23BL", region: "경기 양주시" },
      { name: "세종 5-1생활권 L3BL", region: "세종특별자치시" },
    ],
  },
  철도: {
    full: "국가철도공단",
    bias: 0.12,
    range: 2,
    sites: [
      { name: "수서역세권 A-3BL 공공주택", region: "서울 강남구" },
      { name: "광명역세권 행복주택", region: "경기 광명시" },
      { name: "대전역 쪽방촌 공공주택", region: "대전 동구" },
    ],
  },
  공항: {
    full: "인천국제공항공사",
    bias: 0.25,
    range: 3,
    sites: [
      { name: "공항신도시 직원 공동주택", region: "인천 중구" },
      { name: "영종 제2국제업무지구 공동주택", region: "인천 중구" },
    ],
  },
  교통공사: {
    full: "서울교통공사",
    bias: 0.05,
    range: 3,
    sites: [
      { name: "신내차량기지 복합개발 공동주택", region: "서울 중랑구" },
      { name: "창동차량기지 역세권 공동주택", region: "서울 도봉구" },
      { name: "군자차량기지 복합개발 공동주택", region: "서울 광진구" },
    ],
  },
  한전: {
    full: "한국전력공사",
    bias: -0.06,
    range: 2,
    sites: [
      { name: "나주 혁신도시 사원 공동주택", region: "전남 나주시" },
      { name: "한전 서인천 사택 재건축", region: "인천 서구" },
    ],
  },
  수자원: {
    full: "한국수자원공사",
    bias: 0.08,
    range: 2,
    sites: [
      { name: "부산에코델타시티 18BL 공동주택", region: "부산 강서구" },
      { name: "시화MTV 공동주택", region: "경기 시흥시" },
      { name: "송산그린시티 공동주택", region: "경기 화성시" },
    ],
  },
}

const AGENCY_WEIGHTS: Agency[] = ["LH", "LH", "LH", "LH", "철도", "공항", "교통공사", "교통공사", "한전", "수자원", "수자원"]

/** 모델별 기본 오차(σ, %p)와 공종별 가중 — 필터에 따라 최우수 모델이 달라지도록 설계 */
const MODEL_SIGMA = [0.52, 0.4, 0.46, 0.36]
const CATEGORY_SIGMA: Record<Category, number[]> = {
  전기감리: [1.0, 0.85, 1.05, 1.0],
  소방감리: [0.8, 1.15, 1.0, 1.05],
  통신감리: [1.05, 1.1, 0.7, 1.0],
}

const TODAY = new Date("2026-09-26")
const addDays = (d: Date, n: number) => {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x.toISOString().slice(0, 10)
}

function makeFactors(
  bid: Pick<Bid, "agency" | "category" | "baseAmount" | "reserveRange" | "participants" | "openDate" | "region">,
  raw: Record<string, number>,
  modelWeights: number[],
  target: number,
): Factor[] {
  const eok = bid.baseAmount / 1e8
  const month = Number(bid.openDate.slice(5, 7))
  const defs: Omit<Factor, "contribution">[] = [
    {
      key: "trend",
      label: "발주처 최근 추세",
      value: `${raw.trend >= 0 ? "+" : ""}${raw.trend.toFixed(2)}%p/분기`,
      description: `${AGENCY_META[bid.agency].full}의 최근 3개월 개찰 예가율이 ${
        raw.trend >= 0 ? "상승" : "하락"
      } 흐름을 보여 예측값을 ${raw.trend >= 0 ? "끌어올렸" : "끌어내렸"}습니다.`,
    },
    {
      key: "amount",
      label: "기초금액 규모",
      value: `${eok.toFixed(1)}억`,
      description:
        eok >= 5
          ? "대형 용역일수록 복수예가 추첨이 중앙값으로 수렴하는 경향이 있어 변동폭을 줄였습니다."
          : "소규모 용역은 과거 개찰에서 예가율 분산이 커 불확실성이 반영되었습니다.",
    },
    {
      key: "participants",
      label: "예상 참여업체 수",
      value: `${bid.participants}개사`,
      description: `참여업체가 많을수록 복수예가 선택이 분산되어 평균에 가까워집니다. 이번 공고는 유사 공고 대비 ${
        bid.participants > 180 ? "참여가 많을" : "참여가 적을"
      } 것으로 예상됩니다.`,
    },
    {
      key: "category",
      label: "공종 특성",
      value: bid.category,
      description: `${bid.category} 공고는 과거 데이터에서 기준 대비 ${
        raw.category >= 0 ? "높은" : "낮은"
      } 예가율을 보여 왔습니다.`,
    },
    {
      key: "season",
      label: "개찰 시기",
      value: `${month}월${month % 3 === 0 ? " (분기말)" : ""}`,
      description:
        month % 3 === 0
          ? "분기말 집중 발주 시기에는 예가율이 소폭 낮게 형성되는 패턴이 관측됩니다."
          : "개찰 시기에 따른 계절성 영향은 크지 않습니다.",
    },
    {
      key: "range",
      label: "복수예가 산정 범위",
      value: `±${bid.reserveRange}%`,
      description:
        bid.reserveRange === 3
          ? "산정 범위가 ±3%로 넓어 추첨 결과의 변동성이 큽니다."
          : "산정 범위 ±2%로 표준적인 공고입니다.",
    },
    {
      key: "region",
      label: "지역",
      value: bid.region,
      description: `${bid.region} 소재 공고의 과거 예가율 편차가 소폭 반영되었습니다.`,
    },
  ]
  // 명시 요인이 차이의 대부분(≈85%)을 설명하고 나머지는 '기타 요인'으로 남도록 보정
  const weighted = defs.map((d, i) => raw[d.key] * modelWeights[i])
  const shift = (target * 0.85 - weighted.reduce((s, w) => s + w, 0)) / weighted.length
  const factors: Factor[] = defs.map((d, i) => ({ ...d, contribution: round(weighted[i] + shift, 3) }))
  const residual = round(target - factors.reduce((s, f) => s + f.contribution, 0), 3)
  factors.push({
    key: "other",
    label: "기타 요인",
    value: "-",
    contribution: residual,
    description: "위 항목으로 설명되지 않는 잔차입니다. 값이 클수록 모델이 포착하지 못한 변수가 있을 수 있습니다.",
  })
  return factors.sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution))
}

const MODEL_FACTOR_WEIGHTS = [
  [0.4, 0.5, 0.4, 1.3, 0.4, 0.6, 1.2], // 모델1: 통계 — 공종/지역 편향 중심
  [0.8, 1.3, 1.2, 0.9, 0.7, 1.0, 0.6], // 모델2: 속성 기반
  [1.6, 0.6, 0.8, 0.7, 1.3, 0.7, 0.5], // 모델3: 시계열 — 추세/시기 중심
  [1.0, 0.9, 0.9, 1.0, 0.8, 0.8, 0.8], // 모델4: 앙상블
]

function generate(count = 100, opened = 63): Bid[] {
  const bids: Bid[] = []
  const usedIds = new Set<string>()
  for (let i = 0; i < count; i++) {
    const agency = pick(AGENCY_WEIGHTS)
    const meta = AGENCY_META[agency]
    const site = pick(meta.sites)
    const category = pick(CATEGORIES)
    const isOpened = i < opened
    const openDate = isOpened
      ? addDays(TODAY, -Math.floor(uniform(1, 118)))
      : addDays(TODAY, Math.floor(uniform(3, 26)))
    let id: string
    do id = `R26BK${String(Math.floor(uniform(10000000, 99999999)))}`
    while (usedIds.has(id))
    usedIds.add(id)

    const baseAmount = Math.round(uniform(30_000_000, 900_000_000) / 1000) * 1000
    const reserveRange = meta.range
    const participants = Math.floor(uniform(60, 320))

    // 복수예비가격 15개: 산정 범위를 15개 구간으로 나눠 구간별 1개씩 생성
    const step = (reserveRange * 2) / 15
    const reservePrices = Array.from({ length: 15 }, (_, k) =>
      round(100 - reserveRange + step * k + uniform(0, step), 4),
    )
    // 참여업체가 2개씩 선택 → 최다 선택 4개 = 추첨 결과 (편향을 약간 부여)
    const votes = new Array(15).fill(0)
    for (let p = 0; p < participants * 2; p++) {
      const skew = meta.bias * 2
      let idx = Math.floor(rand() * 15 + skew * gauss() * 0.8)
      idx = Math.min(14, Math.max(0, idx))
      votes[idx]++
    }
    const drawn = votes
      .map((v, k) => ({ v: v + rand() * 6, k }))
      .sort((a, b) => b.v - a.v)
      .slice(0, 4)
      .map((x) => x.k)
      .sort((a, b) => a - b)
    const latent = round(drawn.reduce((s, k) => s + reservePrices[k], 0) / 4, 4)

    const baseline = round(100 + meta.bias * 0.6 + gauss() * 0.08, 3)
    const predictions = MODEL_SIGMA.map((s, m) => {
      const sigma = s * CATEGORY_SIGMA[category][m] * (agency === "LH" && m === 0 ? 0.75 : 1)
      return round(latent + gauss() * sigma * 0.75, 2)
    }) as Bid["predictions"]

    const raw: Record<string, number> = {
      trend: gauss() * 0.14,
      amount: gauss() * 0.1,
      participants: gauss() * 0.09,
      category: gauss() * 0.12,
      season: gauss() * 0.06,
      range: (reserveRange === 3 ? 0.08 : 0) + gauss() * 0.05,
      region: gauss() * 0.06,
    }

    const partial = { agency, category, baseAmount, reserveRange, participants, openDate, region: site.region }
    const factors = predictions.map((p, m) =>
      makeFactors(partial, raw, MODEL_FACTOR_WEIGHTS[m], round(p - baseline, 3)),
    ) as Bid["factors"]

    const similar: SimilarBid[] = Array.from({ length: 5 }, () => {
      const s = pick(meta.sites)
      return {
        id: `R25BK${String(Math.floor(uniform(10000000, 99999999)))}`,
        title: `${s.name}${/주택|재건축/.test(s.name) ? "" : " 공동주택"} ${category} 용역`,
        openDate: addDays(TODAY, -Math.floor(uniform(120, 700))),
        rate: round(baseline + gauss() * 0.45, 2),
        similarity: Math.round(uniform(71, 97)),
      }
    }).sort((a, b) => b.similarity - a.similarity)

    bids.push({
      id,
      title: `${site.name}${/주택|재건축/.test(site.name) ? "" : " 공동주택"} 건설공사 ${category} 용역`,
      agency,
      agencyFull: meta.full,
      category,
      region: site.region,
      baseAmount,
      openDate,
      status: isOpened ? "opened" : "pending",
      predictions,
      actual: isOpened ? round(latent, 2) : null,
      reserveRange,
      reservePrices,
      drawnIndices: isOpened ? drawn : null,
      baseline,
      factors,
      similar,
      participants,
    })
  }
  return bids.sort((a, b) => b.openDate.localeCompare(a.openDate))
}

export const BIDS: Bid[] = generate()
export const LAST_CRAWLED_AT = "2026-09-26 09:00"
