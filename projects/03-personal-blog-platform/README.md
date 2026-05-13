# 03 Personal Blog Platform

個人部落格平台 — 後台管理系統 + AI 生文 + Cloudflare 全端部署。

## 技術棧

| 層次       | 技術                                                   |
| ---------- | ------------------------------------------------------ |
| 前端       | Vite 8 + React 19 + TypeScript + Tailwind CSS v4       |
| 路由       | React Router v6                                        |
| 編輯器     | TipTap                                                 |
| 後端       | Cloudflare Pages Functions (`functions/api/`) + Worker |
| 資料庫     | Cloudflare D1 (`personal-blog-platform-db`)            |
| 圖片儲存   | Cloudflare R2 (`personal-blog-images`)                 |
| 非同步任務 | Cloudflare Queues (`blog-ai-image-jobs`)               |
| AI         | OpenAI gpt-5.5（生文）、gpt-image-2（封面圖與解析圖）  |
| 網頁擷取   | Jina.ai（有 fallback）                                 |

## 目錄結構

```
projects/03-personal-blog-platform/
  src/web/          # Vite 前端 + CF Pages Functions
    functions/      # API 路由（CF Pages Functions）
    workers/        # Queue consumer Worker + RSS 自動發文 Cron Worker
    src/            # React 前端
    migrations/     # D1 migrations
    wrangler.jsonc  # Pages 設定（D1 + R2 + Queue producer）
    wrangler.ai-image-worker.jsonc # AI image Worker 設定（Queue consumer）
    workers/auto-pipeline/wrangler.toml # RSS 自動發文 Cron Worker 設定
  scripts/          # 本機工具腳本
    pull_ai_content.py
  data/
    ai-output/      # pull 腳本輸出（.gitkeep 追蹤）
      articles/
      images/
  docs/             # 架構文件 & SOP
```

## 重要端點 / 認證

- **生產網址**: `https://blog.buclaw.org`
- **Admin 認證**: Header `X-Admin-Secret: <ADMIN_SECRET>`（生產，透過 Cloudflare Secret 設定）
- **本機開發**: Header `X-Dev-Admin: true`（自動 bypass）

## 快速指令

### Deploy

```powershell
cd "D:\Anson\PersonalWorkFlow\projects\03-personal-blog-platform\src\web"
npx vite build 2>&1 | Select-Object -Last 3
npm run cf:deploy 2>&1 | Select-Object -Last 5
```

### AI 生圖 Worker / D1 Migration

```powershell
cd "D:\Anson\PersonalWorkFlow\projects\03-personal-blog-platform\src\web"
npm run db:migrate
npm run cf:deploy:image-worker
```

> `blog-ai-image-jobs` Queue 已建立；新環境若重建 Cloudflare 資源，需先執行 `npx wrangler queues create blog-ai-image-jobs`。

### RSS 自動發文 Pipeline Worker

```powershell
cd "D:\Anson\PersonalWorkFlow\projects\03-personal-blog-platform\src\web"
npm run cf:deploy:auto-pipeline
```

部署前需先建立 KV namespace `PIPELINE_DEDUP`，並把 `workers/auto-pipeline/wrangler.toml` 內的 KV `id` 換成實際值。Cloudflare Secrets 需設定 `PIPELINE_SECRET`、`LINE_CHANNEL_ACCESS_TOKEN`；Pages Functions 也需設定相同的 `PIPELINE_SECRET`。

### 本機 pull AI 生文

```powershell
cd "D:\Anson\PersonalWorkFlow\projects\03-personal-blog-platform\scripts"
C:\Users\rdpuser\miniconda3\python.exe pull_ai_content.py --limit 10
C:\Users\rdpuser\miniconda3\python.exe pull_ai_content.py --since 2026-05-01
```

## Cloudflare 資源

| 資源          | 名稱                                   | ID                                                    |
| ------------- | -------------------------------------- | ----------------------------------------------------- |
| D1 Database   | personal-blog-platform-db              | `a0d545a4-2767-4c89-80d3-a9794fc8c830`                |
| R2 Bucket     | personal-blog-images                   | —                                                     |
| R2 Public URL | —                                      | `https://pub-1161d90f426043f8b3fe23ab2ed9b61c.r2.dev` |
| Queue         | blog-ai-image-jobs                     | AI 封面圖 / 解析圖背景任務                            |
| Pages Project | personal-blog-platform                 | —                                                     |
| Worker        | personal-blog-platform-ai-image-worker | Queue consumer，處理 `ai_image_jobs`                  |
| Worker        | personal-blog-platform-auto-pipeline   | Cron，每天 07:00 UTC+8 自動 RSS 生文與 LINE 通知      |
| KV Namespace  | PIPELINE_DEDUP                         | Pipeline URL 去重與每日執行鎖                         |

> Binding 透過 `wrangler.jsonc` 管理，不可在 Dashboard 手動新增。

<details>
<summary>## AI 生成維護規則</summary>

AI 生文、封面圖與解析圖是此平台的核心功能，後續修改不得任意降級、移除或重新合併造成 timeout 回歸。

| 功能     | 端點 / 檔案                                                          | 必須保留的行為                                                                                                            |
| -------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| AI 生文  | `functions/api/admin/ai-generate.ts`                                 | `gpt-5.5` 作為文章生成第一順位；固定「FB PO文」；生成標題、摘要、HTML 內文、建議分類與標籤                                |
| 封面圖   | `functions/api/admin/ai-cover.ts`                                    | 獨立 Stage 2 手動觸發；建立 `ai_image_jobs`；送入 Queue；Worker 使用 `gpt-image-2` 產圖後寫入 R2 並更新 `posts.cover_url` |
| 解析圖   | `functions/api/admin/ai-illustrate.ts`                               | `POST` 準備 prompt、`PUT` 建立背景 job、`GET` 查狀態；Worker 使用 `gpt-image-2` 產圖後插入文章末尾                        |
| 任務狀態 | `functions/api/admin/ai-image-jobs.ts`、`workers/ai-image-worker.ts` | `queued / processing / ready / failed` 狀態需可查；失敗原因寫回 `ai_image_jobs.error_message`                             |
| 前端操作 | `src/pages/admin/AiGeneratePage.tsx`、`src/lib/adminApi.ts`          | 文章生成、封面圖、解析圖必須維持分段按鈕、背景輪詢與可讀的錯誤訊息                                                        |

不可回歸規則：

- 不得把 `gpt-5.5` 生文主流程降級；fallback 只能用於例外狀況。
- 不得移除封面圖或解析圖功能，也不得合併回 `/api/admin/ai-generate` 同一個長請求。
- 生圖模型必須使用 `gpt-image-2`，不得回退到 `dall-e-3`。
- OpenAI image API 必須維持合法參數：`size: "1024x1024"`、`output_format: "webp"`。
- 生圖 timeout 必須保留約 90 秒；production 實測常需 40 到 55 秒，不能再改回 28 到 30 秒 abort。
- background render 必須以 Cloudflare Queue + 獨立 Worker consumer 為 production 主路徑；Pages Functions 的 `waitUntil()` 只能當本機或缺 binding fallback，不可視為可靠的長時間生圖承載方案。
- `ai_image_jobs` schema、`AI_IMAGE_QUEUE` producer binding、`wrangler.ai-image-worker.jsonc` consumer 設定需同步維護，不能只改其中一邊。
- AI 生文產出的分類與標籤必須持續寫入 D1 關聯表，並在前端結果區顯示。

驗收時至少要確認：

1. Stage 1 能生成文章，並顯示分類與標籤。
2. Stage 2 封面圖按鈕能建立 job，前端輪詢至 `ready` 後顯示圖片，並確認 R2 / `posts.cover_url` 已更新。
3. Stage 2 解析圖按鈕能建立 job，前端輪詢至 `ready` 後顯示圖片，並確認圖文已插入文章末尾。
4. Worker deployment 前需確認 `OPENAI_API_KEY` 同時存在於 Pages 專案與 AI image Worker 的 secrets。

</details>

## 相關文件

- [CF 設定 SOP](docs/cf-setup-sop.md)
- [架構概覽](docs/architecture.md)
- [Blog AI 生成系統升級結案提案](../../docs/proposals/03-closed/15_03_blog-ai-upgrade.html)
- [Blog AI 生圖非同步任務化提案](../../docs/proposals/02-active/16_03_blog-ai-image-async-jobs.html)
