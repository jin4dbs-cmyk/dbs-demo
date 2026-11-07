import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import { FEATURE_GROUPS, FEATURES } from "../data"
import type { AdminBid, FeatureGroupId } from "../types"

const PRESETS = [
  { id: "all", label: "전부", keys: () => FEATURES.map((f) => f.key) },
  { id: "notice", label: "공고 정보만", keys: () => FEATURES.filter((f) => f.group === "notice").map((f) => f.key) },
  {
    id: "market",
    label: "시장 통계만",
    keys: () => FEATURES.filter((f) => FEATURE_GROUPS.find((g) => g.id === f.group)!.kind === "market").map((f) => f.key),
  },
  { id: "none", label: "전부 해제", keys: () => [] as string[] },
]

const sameSet = (a: Set<string>, b: string[]) => a.size === b.length && b.every((k) => a.has(k))

export function FeaturePanel({
  bid,
  selected,
  onChange,
}: {
  bid: AdminBid | null
  selected: Set<string>
  onChange: (next: Set<string>) => void
}) {
  const [collapsed, setCollapsed] = useState<Set<FeatureGroupId>>(new Set())

  const toggle = (keys: string[], on: boolean) => {
    const next = new Set(selected)
    keys.forEach((k) => (on ? next.add(k) : next.delete(k)))
    onChange(next)
  }

  return (
    <section className="bg-card flex min-h-0 flex-col overflow-hidden rounded-2xl">
      <header className="space-y-3 px-5 pt-5 pb-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-[17px] font-bold">예측에 쓸 feature</h2>
          <span className="text-grey-600 text-[13px] tabular-nums">
            <b className="text-blue-500">{selected.size}</b> / {FEATURES.length}개
          </span>
        </div>
        <div className="bg-grey-100 grid grid-cols-4 gap-1 rounded-xl p-1" role="group" aria-label="feature 프리셋">
          {PRESETS.map((p) => {
            const active = sameSet(selected, p.keys())
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => onChange(new Set(p.keys()))}
                className={cn(
                  "h-8 rounded-lg px-1 text-[13px] font-semibold whitespace-nowrap transition-colors",
                  active ? "text-grey-900 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08)]" : "text-grey-600 hover:text-grey-800",
                )}
              >
                {p.label}
              </button>
            )
          })}
        </div>
      </header>

      <div className="toss-scroll min-h-0 flex-1 overflow-y-auto px-2 pb-4">
        {FEATURE_GROUPS.map((g) => {
          const defs = FEATURES.filter((f) => f.group === g.id)
          const keys = defs.map((f) => f.key)
          const on = keys.filter((k) => selected.has(k)).length
          const state = on === 0 ? false : on === keys.length ? true : "indeterminate"
          const isCollapsed = collapsed.has(g.id)
          return (
            <div key={g.id} className="mb-1">
              <div className="sticky top-0 z-10 flex items-center gap-3 rounded-xl bg-white px-3 py-2.5">
                <Checkbox
                  id={`group-${g.id}`}
                  checked={state}
                  onCheckedChange={() => toggle(keys, state !== true)}
                  className="size-[18px] rounded-[6px]"
                />
                <label htmlFor={`group-${g.id}`} className="flex-1 cursor-pointer text-[15px] font-bold">
                  {g.label}
                </label>
                <span className="text-grey-500 text-[13px] tabular-nums">
                  {on}/{keys.length}
                </span>
                <button
                  type="button"
                  aria-label={isCollapsed ? "펼치기" : "접기"}
                  onClick={() => {
                    const next = new Set(collapsed)
                    if (isCollapsed) next.delete(g.id)
                    else next.add(g.id)
                    setCollapsed(next)
                  }}
                  className="text-grey-500 hover:bg-grey-100 grid size-7 place-items-center rounded-lg"
                >
                  <ChevronDown className={cn("size-4 transition-transform", isCollapsed && "-rotate-90")} />
                </button>
              </div>

              {!isCollapsed &&
                defs.map((f) => {
                  const checked = selected.has(f.key)
                  const value = bid?.features[f.key].display
                  const missing = bid != null && value == null
                  return (
                    <label
                      key={f.key}
                      htmlFor={`f-${f.key}`}
                      className="hover:bg-grey-50 grid cursor-pointer grid-cols-[18px_minmax(0,1fr)] gap-x-3 rounded-xl px-3 py-2.5"
                    >
                      <Checkbox
                        id={`f-${f.key}`}
                        checked={checked}
                        onCheckedChange={(v) => toggle([f.key], v === true)}
                        className="mt-0.5 size-[18px] rounded-[6px]"
                      />
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-baseline justify-between gap-3">
                          <span className={cn("truncate text-[14px] font-semibold", !checked && "text-grey-400")}>
                            {f.label}
                          </span>
                          <span
                            className={cn(
                              "max-w-[55%] truncate text-right text-[13px] font-medium tabular-nums",
                              missing ? "text-orange-500" : checked ? "text-blue-500" : "text-grey-400",
                            )}
                            title={value ?? undefined}
                          >
                            {bid == null ? "" : missing ? "미수집" : value}
                          </span>
                        </div>
                        <p className={cn("text-[12px] leading-snug", checked ? "text-grey-500" : "text-grey-400")}>
                          {f.description}
                        </p>
                        <div className="bg-grey-100 h-[3px] overflow-hidden rounded-full" title={`중요도 ${Math.round(f.importance * 100)}`}>
                          <div
                            className={cn("h-full rounded-full", checked ? "bg-blue-300" : "bg-grey-300")}
                            style={{ width: `${f.importance * 100}%` }}
                          />
                        </div>
                      </div>
                    </label>
                  )
                })}
            </div>
          )
        })}
      </div>
    </section>
  )
}
