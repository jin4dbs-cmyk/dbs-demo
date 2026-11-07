export type FeatureGroupId = "notice" | "market_all" | "market_agency" | "market_category"

export interface FeatureGroup {
  id: FeatureGroupId
  label: string
  /** 프리셋 분류: 공고 자체 정보 vs 시장(시계열) 통계 */
  kind: "notice" | "market"
}

export interface FeatureDef {
  key: string
  label: string
  description: string
  group: FeatureGroupId
  /** 모델 전역 중요도 0~1 */
  importance: number
}

/** 공고 하나에 대한 feature 값과 모델 기여도 */
export interface FeatureValue {
  /** 화면 표시용 값, 수집 안 됨이면 null */
  display: string | null
  /** 이 feature 가 예가율 중심을 움직이는 정도 (%p) */
  effect: number
}

export interface AdminBid {
  id: string
  title: string
  agency: string
  region: string
  category: string
  /** 개찰 일시 YYYY-MM-DD HH:mm */
  openAt: string
  baseAmount: number
  /** 낙찰하한율 (%) */
  lowerRate: number
  /** 복수예비가격 범위 (±%) */
  reserveRange: 2 | 3
  /** 지역·업종 정보 수집 여부 */
  missingRegionIndustry: boolean
  /** feature 를 모두 모를 때의 기본 중심 (%) */
  prior: number
  features: Record<string, FeatureValue>
}
