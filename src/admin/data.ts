/**
 * 관리자 프로토타입용 샘플 데이터 (결정적 seed).
 * 실제 연동 시 BigQuery 등에서 받은 개찰 전 공고와 feature 값/기여도를 AdminBid[] 로 매핑해 교체하세요.
 */
import type { AdminBid, FeatureDef, FeatureGroup, FeatureValue } from "./types"

function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const rand = mulberry32(20261107)
const uniform = (a: number, b: number) => a + (b - a) * rand()
const pick = <T,>(arr: readonly T[]) => arr[Math.floor(rand() * arr.length)]
const gauss = () => Math.sqrt(-2 * Math.log(1 - rand())) * Math.cos(2 * Math.PI * rand())
const signed = (n: number, d = 3) => `${n >= 0 ? "+" : ""}${n.toFixed(d)}`

export const FEATURE_GROUPS: FeatureGroup[] = [
  { id: "notice", label: "공고 정보", kind: "notice" },
  { id: "market_all", label: "시장 통계 · 전체 공고", kind: "market" },
  { id: "market_agency", label: "시장 통계 · 같은 발주처", kind: "market" },
  { id: "market_category", label: "시장 통계 · 같은 공종", kind: "market" },
]

type Def = [key: string, label: string, description: string, importance: number]

const NOTICE: Def[] = [
  ["log_base", "log_기초금액", "기초금액의 log10", 0.55],
  ["lower_rate", "낙찰하한율", "낙찰하한율 (87.745, 88, 90 등)", 0.35],
  ["round_n", "차수_n", "공고 차수 (재공고면 1 이상)", 0.2],
  ["industry_cnt", "업종수", "투찰 가능 업종 수", 0.15],
  ["region_cnt", "지역수", "참가 가능 지역 수", 0.12],
  ["has_sigungu", "시군구있음", "시군구까지 지역을 제한했는지 (1/0)", 0.1],
  ["year", "연도", "개찰 연도", 0.25],
  ["month", "월", "개찰 월", 0.3],
  ["weekday", "요일", "개찰 요일 (0=월)", 0.1],
  ["hour", "시각", "개찰 시각 (시)", 0.12],
  ["cls_l", "대분류", "용역 대분류", 0.05],
  ["cls_m", "중분류", "용역 중분류", 0.1],
  ["cls_s", "세부분류", "용역 세부분류 (예: 전력시설물공사감리)", 0.4],
  ["sido", "시도", "참가 가능 지역 첫 번째의 시도", 0.3],
  ["industry", "업종_정리", "투찰 가능 업종 조합 (반복 제거 후 정렬)", 0.35],
]

function marketDefs(prefix: string, name: string, windows: [number, number, number], extra: Def[]): Def[] {
  const [a, b, c] = windows
  return [
    [`${prefix}_sma${a}`, `${name}_sma${a}`, `${name} 최근 ${a}건 예가율 단순 이동평균 (100 대비 %p)`, 0.8],
    [`${prefix}_sma${b}`, `${name}_sma${b}`, `${name} 최근 ${b}건 단순 이동평균`, 0.7],
    [`${prefix}_sma${c}`, `${name}_sma${c}`, `${name} 최근 ${c}건 단순 이동평균`, 0.5],
    [`${prefix}_std${a}`, `${name}_std${a}`, `${name} 최근 ${a}건 표준편차`, 0.6],
    [`${prefix}_std${b}`, `${name}_std${b}`, `${name} 최근 ${b}건 표준편차`, 0.55],
    [`${prefix}_ema${a}`, `${name}_ema${a}`, `${name} 최근 ${a}건 지수 이동평균`, 0.75],
    [`${prefix}_mom${a}`, `${name}_mom${a}`, `sma${a} − sma${b} (최근 흐름)`, 0.5],
    [`${prefix}_last1`, `${name}_last1`, `${name} 직전 공고 예가율`, 0.45],
    [`${prefix}_min${b}`, `${name}_min${b}`, `${name} 최근 ${b}건 최솟값`, 0.2],
    [`${prefix}_max${b}`, `${name}_max${b}`, `${name} 최근 ${b}건 최댓값`, 0.2],
    [`${prefix}_q25_${b}`, `${name}_q25_${b}`, `${name} 최근 ${b}건 25% 분위`, 0.3],
    [`${prefix}_q75_${b}`, `${name}_q75_${b}`, `${name} 최근 ${b}건 75% 분위`, 0.3],
    ...extra,
  ]
}

const MARKET_ALL = marketDefs("all", "전체", [20, 60, 250], [
  ["all_std250", "전체_std250", "전체 공고 최근 250건 표준편차", 0.3],
  ["all_ema60", "전체_ema60", "전체 공고 최근 60건 지수 이동평균", 0.6],
  ["all_z20", "전체_z20", "직전 예가율의 20건 기준 z-score", 0.4],
  ["all_skew60", "전체_skew60", "최근 60건 왜도", 0.25],
  ["all_cnt30d", "전체_cnt30d", "최근 30일 개찰 공고 수", 0.2],
  ["all_up20", "전체_up20", "최근 20건 중 100% 초과 비율", 0.35],
  ["all_last5", "전체_last5", "직전 5건 평균", 0.55],
])
const MARKET_AGENCY = marketDefs("ag", "발주처", [10, 30, 100], [
  ["ag_cnt90d", "발주처_cnt90d", "같은 발주처 최근 90일 공고 수", 0.25],
  ["ag_last3", "발주처_last3", "같은 발주처 직전 3건 평균", 0.6],
  ["ag_gap", "발주처_편차", "발주처 평균 − 전체 평균", 0.65],
  ["ag_skew30", "발주처_skew30", "같은 발주처 최근 30건 왜도", 0.2],
  ["ag_reissue", "발주처_재공고율", "같은 발주처 재공고 비율", 0.15],
])
const MARKET_CATEGORY = marketDefs("cat", "공종", [10, 30, 100], [
  ["cat_cnt90d", "공종_cnt90d", "같은 공종 최근 90일 공고 수", 0.2],
  ["cat_last3", "공종_last3", "같은 공종 직전 3건 평균", 0.5],
  ["cat_gap", "공종_편차", "공종 평균 − 전체 평균", 0.55],
  ["cat_bidders", "공종_참여사평균", "같은 공종 평균 참여업체 수", 0.3],
])

export const FEATURES: FeatureDef[] = [
  ...NOTICE.map(([key, label, description, importance]) => ({ key, label, description, importance, group: "notice" as const })),
  ...MARKET_ALL.map(([key, label, description, importance]) => ({ key, label, description, importance, group: "market_all" as const })),
  ...MARKET_AGENCY.map(([key, label, description, importance]) => ({ key, label, description, importance, group: "market_agency" as const })),
  ...MARKET_CATEGORY.map(([key, label, description, importance]) => ({ key, label, description, importance, group: "market_category" as const })),
]

/** 이미지 기준 기본 선택: 공고 정보 + 전체 공고 통계 (34개) */
export const DEFAULT_SELECTED = FEATURES.filter((f) => f.group === "notice" || f.group === "market_all").map((f) => f.key)

const AGENCIES: { name: string; short: string; lower: number; sites: [string, string][] }[] = [
  { name: "한국토지주택공사", short: "LH", lower: 87.745, sites: [["화성동탄2 A-62BL", "경기도"], ["고양창릉 S-3BL", "경기도"], ["남양주왕숙 A-15BL", "경기도"], ["인천계양 A-9BL", "인천광역시"], ["하남교산 A-4BL", "경기도"], ["세종 5-1생활권 L3BL", "세종특별자치시"]] },
  { name: "국가철도공단", short: "철도", lower: 88, sites: [["수서역세권 A-3BL 공공주택", "서울특별시"], ["대전역 쪽방촌 공공주택", "대전광역시"]] },
  { name: "인천국제공항공사", short: "공항", lower: 89.995, sites: [["영종 제2국제업무지구 공동주택", "인천광역시"]] },
  { name: "서울교통공사", short: "교통공사", lower: 86.745, sites: [["신내차량기지 복합개발 공동주택", "서울특별시"], ["창동차량기지 역세권 공동주택", "서울특별시"]] },
  { name: "한국전력공사", short: "한전", lower: 90, sites: [["나주 혁신도시 사원 공동주택", "전라남도"]] },
  { name: "한국수자원공사", short: "수자원", lower: 87.745, sites: [["부산에코델타시티 18BL 공동주택", "부산광역시"], ["시화MTV 공동주택", "경기도"]] },
]

const CATEGORIES = [
  { name: "전기감리", cls: "전력시설물공사감리", industry: "전력기술관리업 · 종합감리" },
  { name: "소방감리", cls: "소방공사감리", industry: "소방공사감리업" },
  { name: "통신감리", cls: "정보통신공사감리", industry: "정보통신공사감리업" },
] as const

const HOURS = [10, 11, 14, 15, 16]

function makeFeatures(
  bid: Omit<AdminBid, "features" | "prior">,
  meta: { cls: string; industry: string; roundN: number; industryCnt: number; regionCnt: number; sigungu: number; weekday: number; hour: number },
): Record<string, FeatureValue> {
  const out: Record<string, FeatureValue> = {}
  const missing = new Set(bid.missingRegionIndustry ? ["sido", "industry", "region_cnt", "industry_cnt"] : [])
  const notice: Record<string, string> = {
    log_base: Math.log10(bid.baseAmount).toFixed(3),
    lower_rate: String(bid.lowerRate),
    round_n: String(meta.roundN),
    industry_cnt: String(meta.industryCnt),
    region_cnt: String(meta.regionCnt),
    has_sigungu: String(meta.sigungu),
    year: bid.openAt.slice(0, 4),
    month: String(Number(bid.openAt.slice(5, 7))),
    weekday: String(meta.weekday),
    hour: String(meta.hour),
    cls_l: "기술용역",
    cls_m: "건설사업관리",
    cls_s: meta.cls,
    sido: bid.region,
    industry: meta.industry,
  }
  for (const f of FEATURES) {
    let display: string
    if (f.group === "notice") display = notice[f.key]
    else if (/_std|_skew/.test(f.key)) display = (f.key.includes("skew") ? gauss() * 0.4 : uniform(0.45, 1.1)).toFixed(3)
    else if (/_cnt|_bidders/.test(f.key)) display = String(Math.round(uniform(f.key.includes("bidders") ? 120 : 8, f.key.includes("all") ? 420 : 160)))
    else if (/_up20|_reissue/.test(f.key)) display = uniform(0.3, 0.7).toFixed(3)
    else if (/_z20/.test(f.key)) display = signed(gauss() * 0.9)
    else display = signed(gauss() * 0.28)
    out[f.key] = {
      display: missing.has(f.key) ? null : display,
      effect: Math.round(f.importance * gauss() * 0.06 * 1000) / 1000,
    }
  }
  return out
}

function generate(count = 42): AdminBid[] {
  const bids: AdminBid[] = []
  const start = new Date("2026-11-09")
  for (let i = 0; i < count; i++) {
    const agency = pick(AGENCIES)
    const [site, region] = pick(agency.sites)
    const cat = pick(CATEGORIES)
    const d = new Date(start)
    d.setDate(d.getDate() + Math.floor(i / 3) + (rand() < 0.3 ? 1 : 0))
    if (d.getDay() === 0) d.setDate(d.getDate() + 1)
    if (d.getDay() === 6) d.setDate(d.getDate() + 2)
    const hour = pick(HOURS)
    const openAt = `${d.toISOString().slice(0, 10)} ${String(hour).padStart(2, "0")}:00`
    const roundN = rand() < 0.15 ? 1 : 0
    const base: Omit<AdminBid, "features" | "prior"> = {
      id: `R26BK${String(Math.floor(uniform(10000000, 99999999)))}-${roundN === 0 ? "000" : "001"}`,
      title: `${site}${/주택/.test(site) ? "" : " 공동주택"} 건설공사 ${cat.name} 용역${roundN ? " (재공고)" : ""}`,
      agency: agency.name,
      region,
      category: cat.name,
      openAt,
      baseAmount: Math.round(uniform(30_000_000, 900_000_000) / 1000) * 1000,
      lowerRate: agency.lower,
      reserveRange: agency.short === "공항" || agency.short === "교통공사" ? 3 : 2,
      missingRegionIndustry: rand() < 0.15,
    }
    bids.push({
      ...base,
      prior: 100 + gauss() * 0.06,
      features: makeFeatures(base, {
        cls: cat.cls,
        industry: cat.industry,
        roundN,
        industryCnt: 1 + Math.floor(rand() * 2),
        regionCnt: 1 + Math.floor(rand() * 2),
        sigungu: rand() < 0.3 ? 1 : 0,
        weekday: (d.getDay() + 6) % 7,
        hour,
      }),
    })
  }
  return bids.sort((a, b) => a.openAt.localeCompare(b.openAt))
}

export const ADMIN_BIDS: AdminBid[] = generate()
export const DATASET_META = {
  source: "BigQuery",
  totalPending: 644,
  trainPeriod: "2016 ~ 2025",
  evalPeriod: "2024-07 ~ 2025-12",
  calibration: 0.841,
  statsAsOf: "2025-12-31",
}
