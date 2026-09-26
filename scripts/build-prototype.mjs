// dist/ 빌드 결과(JS·CSS)를 하나의 HTML 파일로 합쳐 prototype/index.html 로 저장합니다.
// 서버 없이 브라우저에서 바로 열어 볼 수 있는 프로토타입용입니다.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs"
import path from "node:path"

const dist = path.resolve("dist")
const read = (p) => readFileSync(path.join(dist, p), "utf8")
let html = read("index.html")
const scripts = []

html = html.replace(/<link rel="stylesheet"[^>]*href="(\/assets\/[^"]+\.css)"[^>]*>/g, (_, href) => `<style>\n${read(href)}\n</style>`)
html = html.replace(/<script type="module"[^>]*src="(\/assets\/[^"]+\.js)"[^>]*><\/script>/g, (_, src) => {
  // #root 이후 실행되도록 body 끝으로 이동
  scripts.push(`<script type="module">\n${read(src).replace(/<\/script/gi, "<\\/script")}\n</script>`)
  return ""
})
html = html.replace("</body>", () => `${scripts.join("\n")}\n</body>`)

mkdirSync("prototype", { recursive: true })
writeFileSync("prototype/index.html", html)
console.log(`prototype/index.html (${(html.length / 1024).toFixed(0)} KB)`)
