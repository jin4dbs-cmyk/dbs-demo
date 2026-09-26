import { RotateCcw, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { AGENCIES, CATEGORIES } from "@/lib/types"

export interface FilterState {
  category: string
  agency: string
  status: string
  query: string
}

export const DEFAULT_FILTERS: FilterState = { category: "all", agency: "all", status: "all", query: "" }

export function Filters({
  value,
  onChange,
}: {
  value: FilterState
  onChange: (next: FilterState) => void
}) {
  const set = (patch: Partial<FilterState>) => onChange({ ...value, ...patch })
  const dirty = JSON.stringify(value) !== JSON.stringify(DEFAULT_FILTERS)

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
      <div className="flex flex-wrap items-center gap-2">
        <Select value={value.category} onValueChange={(v) => set({ category: v })}>
          <SelectTrigger className="min-w-36 rounded-full" aria-label="공종">
            <span className="text-muted-foreground">공종</span>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체</SelectItem>
            {CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={value.agency} onValueChange={(v) => set({ agency: v })}>
          <SelectTrigger className="min-w-36 rounded-full" aria-label="발주처">
            <span className="text-muted-foreground">발주처</span>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체</SelectItem>
            {AGENCIES.map((a) => (
              <SelectItem key={a} value={a}>
                {a}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          value={value.status}
          onValueChange={(v) => v && set({ status: v })}
          className="bg-card rounded-full p-0.5 shadow-xs"
        >
          {[
            ["all", "전체"],
            ["opened", "개찰 완료"],
            ["pending", "개찰 전"],
          ].map(([v, label]) => (
            <ToggleGroupItem
              key={v}
              value={v}
              className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground rounded-full border-0 px-3 shadow-none"
            >
              {label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      <div className="flex flex-1 items-center gap-2">
        <div className="relative w-full lg:max-w-sm">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            value={value.query}
            onChange={(e) => set({ query: e.target.value })}
            placeholder="공고번호 또는 용역명 검색"
            className="rounded-full pl-9"
          />
        </div>
        {dirty && (
          <Button variant="ghost" size="sm" onClick={() => onChange(DEFAULT_FILTERS)} className="text-muted-foreground">
            <RotateCcw />
            초기화
          </Button>
        )}
      </div>
    </div>
  )
}
