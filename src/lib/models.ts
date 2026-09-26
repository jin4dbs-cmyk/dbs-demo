import type { ModelInfo } from "./types"

/**
 * 팀 모델 메타데이터. 이름/설명은 실제 모델 정의에 맞게 수정하세요.
 * 색상은 index.css 의 --chart-1 ~ --chart-4 토큰과 매칭됩니다.
 */
export const MODELS: ModelInfo[] = [
  { id: 0, name: "모델 1", short: "M1", description: "발주처·공종별 과거 예가율 통계 기반" },
  { id: 1, name: "모델 2", short: "M2", description: "공고 속성 기반 그래디언트 부스팅" },
  { id: 2, name: "모델 3", short: "M3", description: "최근 개찰 추세 반영 시계열 모델" },
  { id: 3, name: "모델 4", short: "M4", description: "모델 1~3 가중 앙상블" },
]

export const MODEL_COLOR = ["bg-chart-1", "bg-chart-2", "bg-chart-3", "bg-chart-4"] as const
export const MODEL_TEXT = ["text-chart-1", "text-chart-2", "text-chart-3", "text-chart-4"] as const
