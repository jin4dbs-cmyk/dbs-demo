# 예가율 예측 모니터

The site crawls apartment (공동주택) supervision bid notices from 나라장터 and compares the predicted 예가율 from our four models with the actual 예가율 after each bid is opened.

- **Stack**: Vite, React 19, TypeScript, Tailwind CSS v4, shadcn/ui (new-york, Radix)
- **Run**: `npm install` → `npm run dev` (http://localhost:5173)
- **Build**: `npm run build`
- **Single-file prototype**: `npm run build:prototype` → `prototype/index.html` (opens directly in a browser, no server needed)
- **Admin prototype**: `npm run dev:admin` (dev server) / `npm run build:admin` → `prototype/admin.html` (single file, opens in a browser)
- **Version snapshots**: `prototype/archive/v1-user-dashboard.html` — user dashboard v1 (commit `8cd773e`, before admin mode)

## Features

| Area | Description |
| --- | --- |
| Collection status | Total number of crawled bids, plus how many are opened and how many are still pending |
| Model accuracy | MAE, hit rate within ±0.3%p, and closest-prediction count for models 1–4. The model with the lowest MAE under the current filter gets the **최고 정확도** highlight |
| Filters | 공종 (전기/소방/통신감리) · 발주처 (LH/철도/공항/교통공사/한전/수자원) · 개찰 상태 · search by notice number or service name |
| List | For each model: the predicted 예가율, and after opening, its error against the actual value. The model closest to the actual value in each row gets a green highlight; the column of the overall best model is shaded |
| [근거] modal | Key summary · predictions vs actual dot plot · factor contributions (per model) · 15-price draw of 복수예비가격 · model comparison (MAE for the same 발주처 and 공종) · similar past bids |

## Data integration

`src/lib/mock-data.ts` is seeded mock data. For real integration, only this module needs replacing, with code that maps the crawler/model API response to `Bid[]` (`src/lib/types.ts`).

- `predictions`: predicted 예가율 from models 1–4
- `actual` / `reservePrices` / `drawnIndices`: filled in after opening
- `baseline` + `factors[m]`: the model's per-factor contributions (e.g. SHAP values). `baseline + Σcontribution = predictions[m]`
- `similar`: similar past bids

Change the model names and descriptions in `src/lib/models.ts`.

## Components

The shadcn/ui components are in `src/components/ui`. Add new ones with `npx shadcn@latest add <component>` (see `components.json`).

## Admin prototype (`admin.html`)

A 3-column layout for checking predictions while changing which features are used. The styling maps the Toss design tokens (TDS palette, Pretendard) onto the shadcn tokens (`src/admin/admin.css`).

| Column | Content |
| --- | --- |
| 1. Feature selection | 67 features in 4 groups (notice info, market stats for all bids / same agency / same category). Presets: 전부, 공고 정보만, 시장 통계만, 전부 해제. Shows the selected bid's value and each feature's importance |
| 2. Bid list | Bids not yet opened, with search, and tags for category, region, reserve price range and missing data |
| 3. Prediction | Predicted 예가율, predicted 낙찰하한가, middle 50% range, confidence, and the top 5 bins at 0.1%p and 0.01%p (with 예정가격 and 낙찰하한가 amounts) |

Data integration:
- `src/admin/data.ts`: sample bids and feature values. Replace with the BigQuery response mapped to `AdminBid[]` (`src/admin/types.ts`).
- `src/admin/predict.ts`: approximate distribution from the selected features. Replace with a call to the model API that returns the same `Prediction` shape.
