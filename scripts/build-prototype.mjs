// vite 빌드 결과(JS·CSS)를 하나의 HTML 파일로 합칩니다. 서버 없이 브라우저에서 바로 열 수 있습니다.
// 사용: node scripts/build-prototype.mjs [distDir=dist] [entry=index.html] [out=prototype/index.html]
import { mkdirSync, readFileSync, writeFileSync } from "node:fs"
import path from "node:path"

const [distDir = "dist", entry = "index.html", out = "prototype/index.html"] = process.argv.slice(2)
const dist = path.resolve(distDir)
const read = (p) => readFileSync(path.join(dist, p), "utf8")
let html = read(entry)
const scripts = []

html = html.replace(/<link rel="stylesheet"[^>]*href="(\/assets\/[^"]+\.css)"[^>]*>/g, (_, href) => `<style>\n${read(href)}\n</style>`)
html = html.replace(/<script type="module"[^>]*src="(\/assets\/[^"]+\.js)"[^>]*><\/script>/g, (_, src) => {
  // #root 이후 실행되도록 body 끝으로 이동
  scripts.push(`<script type="module">\n${read(src).replace(/<\/script/gi, "<\\/script")}\n</script>`)
  return ""
})
html = html.replace("</body>", () => `${scripts.join("\n")}\n</body>`)

mkdirSync(path.dirname(out), { recursive: true })
writeFileSync(out, html)
console.log(`${out} (${(html.length / 1024).toFixed(0)} KB)`)
