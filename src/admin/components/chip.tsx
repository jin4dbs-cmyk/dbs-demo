import { cn } from "@/lib/utils"

const TONES = {
  blue: "bg-blue-50 text-blue-600",
  grey: "bg-grey-100 text-grey-700",
  red: "bg-red-50 text-red-500",
  orange: "bg-orange-50 text-orange-500",
  green: "bg-green-50 text-green-500",
  teal: "bg-teal-50 text-teal-500",
} as const

export type ChipTone = keyof typeof TONES

/** 토스 스타일의 연한 배경 태그 */
export function Chip({ tone = "grey", className, children }: { tone?: ChipTone; className?: string; children: React.ReactNode }) {
  return (
    <span className={cn("inline-flex h-5 items-center rounded-[6px] px-1.5 text-[12px] leading-none font-medium whitespace-nowrap", TONES[tone], className)}>
      {children}
    </span>
  )
}

export const CATEGORY_TONE: Record<string, ChipTone> = { 전기감리: "blue", 소방감리: "red", 통신감리: "teal" }
