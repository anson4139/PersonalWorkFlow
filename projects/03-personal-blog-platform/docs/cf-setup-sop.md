# Cloudflare 設定 SOP

首次從零建立此專案所需的 CF 資源設定步驟。

<details>
<summary>## 1. D1 Database</summary>

```bash
# 建立 D1
npx wrangler d1 create personal-blog-platform-db

# 套用 schema（在 src/web/ 執行）
npx wrangler d1 execute personal-blog-platform-db --remote --file=./schema.sql
```

> DB ID 填入 `wrangler.jsonc` 的 `database_id`。

</details>

<details>
<summary>## 2. R2 Bucket</summary>

### 2-1 建立 Bucket

CF Dashboard → R2 Object Storage → **Create bucket**

- Name: `personal-blog-images`
- Location: Asia-Pacific (APAC)

### 2-2 開啟 Public Development URL

Bucket → Settings → **Public Development URL** → **Enable** → 輸入 `allow` → **Allow**

取得 Public URL：

```
https://pub-1161d90f426043f8b3fe23ab2ed9b61c.r2.dev
```

> 注意：Public Development URL 有 rate limit，生產環境建議綁自定網域。

### 2-3 加入 wrangler.jsonc Binding

Bindings 透過 `wrangler.jsonc` 管理（Dashboard 的 + Add 按鈕無效，因為已有 wrangler 設定）：

```jsonc
"r2_buckets": [
  {
    "binding": "BLOG_IMAGES",
    "bucket_name": "personal-blog-images"
  }
]
```

重新 deploy 後 binding 生效。

</details>

<details>
<summary>## 3. Queue（AI 生圖背景任務）</summary>

AI 封面圖與解析圖使用 Cloudflare Queue 作為 production background job substrate。

```powershell
cd "D:\Anson\PersonalWorkFlow\projects\03-personal-blog-platform\src\web"
npx wrangler queues create blog-ai-image-jobs
```

Pages 專案作為 producer，設定在 `wrangler.jsonc`：

```jsonc
"queues": {
  "producers": [
    {
      "binding": "AI_IMAGE_QUEUE",
      "queue": "blog-ai-image-jobs"
    }
  ]
}
```

AI image Worker 作為 consumer，設定在 `wrangler.ai-image-worker.jsonc`：

```jsonc
"queues": {
  "consumers": [
    {
      "queue": "blog-ai-image-jobs",
      "max_batch_size": 1,
      "max_batch_timeout": 5,
      "max_retries": 0
    }
  ]
}
```

> Cloudflare Pages Functions 可送出 Queue message，但不能消費 Queue event；consumer 必須部署為獨立 Worker。

</details>

<details>
<summary>## 4. Pages Project</summary>

### 4-1 首次 Deploy（建立 Pages 專案）

```powershell
cd "D:\Anson\PersonalWorkFlow\projects\03-personal-blog-platform\src\web"
npx vite build
npm run cf:deploy
```

### 4-2 設定 Secrets（必須，AI 功能需要）

CF Dashboard → Workers & Pages → personal-blog-platform → Settings → Variables and Secrets → **+ Add**

| Name             | Value                   |
| ---------------- | ----------------------- |
| `ADMIN_SECRET`   | `<your-admin-secret>`   |
| `OPENAI_API_KEY` | `<your-openai-api-key>` |

### 4-3 Compatibility Date

Runtime → Compatibility date → `2026-05-10`（與 `wrangler.jsonc` 一致）

</details>

<details>
<summary>## 5. D1 Migration</summary>

D1 migration 檔案位於 `src/web/migrations/`。AI 生圖背景任務需要 `0007_ai_image_jobs.sql` 建立 `ai_image_jobs`。

### 5-1 本機套用

```powershell
cd "D:\Anson\PersonalWorkFlow\projects\03-personal-blog-platform\src\web"
npm run db:migrate:local
```

### 5-2 遠端套用

```powershell
cd "D:\Anson\PersonalWorkFlow\projects\03-personal-blog-platform\src\web"
npm run db:migrate
```

</details>

<details>
<summary>## 6. AI Image Worker Deploy</summary>

AI image Worker 負責消費 `blog-ai-image-jobs`，並執行封面圖與解析圖的 `gpt-image-2` render。

### 6-1 設定 Worker Secret

Worker 需要能讀取 `OPENAI_API_KEY`。正式部署前需在 `personal-blog-platform-ai-image-worker` 設定同名 secret。

```powershell
cd "D:\Anson\PersonalWorkFlow\projects\03-personal-blog-platform\src\web"
npx wrangler secret put OPENAI_API_KEY -c wrangler.ai-image-worker.jsonc
```

### 6-2 Dry-run 驗證

```powershell
cd "D:\Anson\PersonalWorkFlow\projects\03-personal-blog-platform\src\web"
npx wrangler deploy -c wrangler.ai-image-worker.jsonc --dry-run
```

### 6-3 正式部署

```powershell
cd "D:\Anson\PersonalWorkFlow\projects\03-personal-blog-platform\src\web"
npm run cf:deploy:image-worker
```

</details>

<details>
<summary>## 7. 日常 Deploy 流程</summary>

```powershell
cd "D:\Anson\PersonalWorkFlow\projects\03-personal-blog-platform\src\web"
npx vite build 2>&1 | Select-Object -Last 3
npm run db:migrate 2>&1 | Select-Object -Last 5
npm run cf:deploy:image-worker 2>&1 | Select-Object -Last 5
npm run cf:deploy 2>&1 | Select-Object -Last 5
```

</details>

<details>
<summary>## 8. 已知限制與注意事項</summary>

- **Binding 管理**: `wrangler.jsonc` 有 `r2_buckets` 設定後，CF Dashboard 的 Bindings **+ Add** 按鈕會顯示 tooltip 說「由 wrangler.toml 管理」，需在程式碼修改。
- **Queue producer / consumer 分離**: Pages Functions 只能作 producer，不能作 Queue consumer；AI 生圖必須由 `wrangler.ai-image-worker.jsonc` 的獨立 Worker 消費。
- **R2 Public URL**: rate-limited，不適合大流量。如需生產等級，在 bucket Settings → Custom Domains 加入自定網域。
- **gpt-image-2 參數**: 只接受 `output_format`（不接受 `response_format: "url"`），`size` 固定 `1024x1024`。
- **gpt-5.5 參數**: 不支援 `temperature` 和 `max_tokens`，使用 `max_completion_tokens`。
- **生圖狀態追蹤**: 封面圖與解析圖不應回到同步 request-bound render；應以 `ai_image_jobs` 的 `queued / processing / ready / failed` 做前端輪詢與錯誤呈現。

</details>
