import path from "node:path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// 관리자 프로토타입 전용 빌드: admin.html 단일 엔트리, 폰트까지 인라인해 한 파일로 묶기 쉽게 함
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  build: {
    outDir: "dist-admin",
    assetsInlineLimit: 10 * 1024 * 1024,
    rollupOptions: { input: path.resolve(__dirname, "admin.html") },
  },
})
