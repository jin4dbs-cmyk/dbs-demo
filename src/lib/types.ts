export const CATEGORIES = ["전기감리", "소방감리", "통신감리"] as const
export type Category = (typeof CATEGORIES)[number]

export const AGENCIES = ["LH", "철도", "공항", "교통공사", "한전", "수자원"] as const
export type Agency = (typeof AGENCIES)[number]

export const MODEL_IDS = [0, 1, 2, 3] as const
export type ModelId = (typeof MODEL_IDS)[number]

export type BidStatus = "opened" | "pending"

/** 예측값에 영향을 준 요인 (SHAP 유사 기여도, 단위 %p) */
export interface Factor {
  key: string
  label: string
  /** 사람이 읽는 값 (예: "12개사", "3.2억") */
  value: string
  /** 기준값 대비 예측 예가율에 더해진 %p */
  contribution: number
  description: string
}

export interface SimilarBid {
  id: string
  title: string
  openDate: string
  rate: number
  similarity: number
}

export interface Bid {
  id: string
  title: string
  agency: Agency
  agencyFull: string
  category: Category
  region: string
  /** 기초금액 (원) */
  baseAmount: number
  /** 개찰일 YYYY-MM-DD */
  openDate: string
  status: BidStatus
  /** 모델 1~4 예측 예가율 (%) */
  predictions: [number, number, number, number]
  /** 실제 예가율 (%), 개찰 전이면 null */
  actual: number | null
  /** 복수예비가격 산정 범위 (±%) */
  reserveRange: number
  /** 복수예비가격 15개의 기초금액 대비 비율 (%) */
  reservePrices: number[]
  /** 추첨된 복수예비가격 인덱스 (개찰 후에만) */
  drawnIndices: number[] | null
  /** 발주처·공종 기준 과거 평균 예가율 (%) — 요인 분석의 출발점 */
  baseline: number
  /** 모델별 요인 기여도 */
  factors: [Factor[], Factor[], Factor[], Factor[]]
  similar: SimilarBid[]
  participants: number
}

export interface ModelInfo {
  id: ModelId
  name: string
  short: string
  description: string
}
