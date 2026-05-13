# 架構概覽

## 整體架構

```
Browser
  └── Cloudflare Pages (personal-blog-platform.pages.dev)
        ├── /                     → React SPA (dist/)
        ├── /api/admin/*          → CF Pages Functions (需 X-Admin-Secret)
        ├── /api/posts/*          → CF Pages Functions (公開)
        └── /images/*             → R2 圖片代理 (functions/images/[[path]].ts)

AI image background path
  ├── Pages Function 建立 ai_image_jobs row
  ├── AI_IMAGE_QUEUE producer → blog-ai-image-jobs
  └── personal-blog-platform-ai-image-worker queue consumer
        ├── 呼叫 gpt-image-2
        ├── 寫入 R2: covers/* 或 illustrations/*
        ├── 更新 posts.cover_url 或 posts.content
        └── 更新 ai_image_jobs status / result_url / error_message
```

## Pages Functions 路由

| 路由                       | 檔案                                   | 說明                                                |
| -------------------------- | -------------------------------------- | --------------------------------------------------- |
| `/api/admin/ai-generate`   | `functions/api/admin/ai-generate.ts`   | AI 生文、分類與標籤建議                             |
| `/api/admin/ai-cover`      | `functions/api/admin/ai-cover.ts`      | 建立封面圖背景 job                                  |
| `/api/admin/ai-illustrate` | `functions/api/admin/ai-illustrate.ts` | 準備解析圖 prompt、建立背景 job、查詢最新解析圖狀態 |
| `/api/admin/ai-image-jobs` | `functions/api/admin/ai-image-jobs.ts` | 依 `job_id` 查詢生圖 job 狀態                       |
| `/api/admin/posts`         | `functions/api/admin/posts.ts`         | 貼文 CRUD                                           |
| `/api/admin/categories`    | `functions/api/admin/categories.ts`    | 分類 CRUD                                           |
| `/api/admin/tags`          | `functions/api/admin/tags.ts`          | 標籤 CRUD                                           |
| `/api/admin/upload`        | `functions/api/admin/upload.ts`        | 手動圖片上傳到 R2                                   |
| `/api/admin/settings`      | `functions/api/admin/settings.ts`      | 站台設定                                            |
| `/api/admin/stats`         | `functions/api/admin/stats.ts`         | Dashboard 統計                                      |
| `/api/posts`               | `functions/api/posts.ts`               | 公開貼文列表                                        |
| `/images/[[path]]`         | `functions/images/[[path]].ts`         | 從 R2 讀取圖片                                      |

## AI 生文流程

```
1. 輸入 URL 或手動貼文（manualContent >= 50 字）
2. 若 URL → Jina.ai 抓內容（失敗則讓 AI 根據 URL 推測）
3. gpt-5.5 → 改寫為繁體中文文章 + 標題 + 摘要
4. 寫入 posts、post_categories、post_tags、ai_generate_log
5. 回傳文章結果與建議分類 / 標籤
```

## AI 生圖背景任務流程

```text
封面圖：
1. 前端呼叫 POST /api/admin/ai-cover
2. Pages Function 建立 ai_image_jobs(kind='cover', status='queued')
3. Pages Function 送出 { job_id } 到 AI_IMAGE_QUEUE
4. Worker queue consumer 執行 processImageJobById(job_id)
5. gpt-image-2 → 生成 1024x1024 webp
6. 圖片寫入 R2: covers/{timestamp}.webp
7. Worker 更新 posts.cover_url 與 ai_image_jobs.status='ready'
8. 前端輪詢 /api/admin/ai-image-jobs?job_id=... 直到 ready / failed

解析圖：
1. 前端呼叫 POST /api/admin/ai-illustrate 準備 prompt
2. 前端呼叫 PUT /api/admin/ai-illustrate 建立 ai_image_jobs(kind='illustration')
3. Worker 產圖後寫入 R2: illustrations/{timestamp}.webp
4. Worker 將 <figure class="post-illustration"> 插入 posts.content 末尾
5. 前端輪詢 job status，ready 後顯示 image_url
```

### ai_image_jobs 狀態

| 狀態         | 說明                                                |
| ------------ | --------------------------------------------------- |
| `queued`     | Pages Function 已建立任務，等待 Queue consumer      |
| `processing` | Worker 已開始處理，`attempts` 會遞增                |
| `ready`      | 圖片已產生並寫入 R2 / D1，`result_url` 可供前端使用 |
| `failed`     | 任務失敗，`error_message` 保留錯誤摘要              |

## 認證機制

```
Request
  └── functions/api/admin/_middleware.ts
        ├── Header X-Admin-Secret === env.ADMIN_SECRET  → 允許
        ├── Header X-Dev-Admin === "true"               → 允許（本機）
        └── 其他                                         → 401
```

## Cloudflare Bindings（wrangler.jsonc）

```jsonc
{
  "d1_databases": [{ "binding": "BLOG_DB", ... }],
  "r2_buckets":   [{ "binding": "BLOG_IMAGES", ... }],
  "queues": {
    "producers": [
      { "binding": "AI_IMAGE_QUEUE", "queue": "blog-ai-image-jobs" }
    ]
  }
}
```

## AI Image Worker Bindings（wrangler.ai-image-worker.jsonc）

```jsonc
{
  "d1_databases": [{ "binding": "BLOG_DB", ... }],
  "r2_buckets": [{ "binding": "BLOG_IMAGES", ... }],
  "queues": {
    "consumers": [{ "queue": "blog-ai-image-jobs" }]
  }
}
```

> Pages Functions 只能作 Queue producer；Queue consumer 必須由獨立 Worker 提供。

Secrets（CF Dashboard → Variables and Secrets）：

- `ADMIN_SECRET` = `<set in Cloudflare Secret>`
- `OPENAI_API_KEY` = `<set in Cloudflare Secret>`

> `OPENAI_API_KEY` 需要同時設定在 Pages 專案與 `personal-blog-platform-ai-image-worker` Worker，否則生圖 job 會進入 `failed`。

## 本機 Pull 腳本

`scripts/pull_ai_content.py` 透過 `wrangler d1 execute --remote` 查詢 D1，
將 AI 生文輸出為：

- `data/ai-output/articles/YYYYMMDD_slug.md`（YAML frontmatter + Markdown）
- `data/ai-output/images/slug.webp`（封面圖，自動下載）
