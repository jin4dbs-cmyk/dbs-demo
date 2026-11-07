export const won = (n: number) => `${n.toLocaleString("ko-KR")}원`
export const pct = (n: number, d = 2) => `${n.toFixed(d)}%`
export const pctp = (n: number, d = 2) => `${n > 0 ? "+" : n < 0 ? "−" : ""}${Math.abs(n).toFixed(d)}%p`
/** 2026-11-09 11:00 → 11월 9일 (월) 11:00 */
export function openAtLabel(openAt: string) {
  const [date, time] = openAt.split(" ")
  const d = new Date(`${date}T00:00:00`)
  const wd = "일월화수목금토"[d.getDay()]
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${wd}) ${time}`
}
