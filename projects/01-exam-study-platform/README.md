# exam-study-platform

手機優先的考題學習平台，整合金融科技力、AI 應用規劃師與財務管理題庫，並支援依登入身份顯示可見題庫。v2 另加入管理者可控的題庫授權功能。

## 考試分類

| 分類 | 科目 |
|---|---|
| 金融科技力 | 金融科技力 |
| AI應用規劃師（中級） | AI規劃師 第一科 / 第二科 / 第三科 |
| 電子商務課程 / 校內考試 | 113電子商務財務管理(期中考) |

## 題庫

| 科目 | 來源 |
|---|---|
| 台灣金融科技力知識檢定（第10–21屆） | `data/subjects/fintech.json` |
| AI應用規劃師 第一科 | `data/subjects/ai-planning.json` |
| AI應用規劃師 第二科 | `data/subjects/big-data.json` |
| AI應用規劃師 第三科 | `data/subjects/machine-learning.json` |
| 113電子商務財務管理(期中考) | `data/subjects/ecommerce-finance-midterm-113.json` |

## 身份辨識與授權

- 使用 Cloudflare Access + Google Login 辨識身份。
- Cloudflare Pages / Functions 設定 `ANSON_EMAIL` 後，該 email 對應的登入者為第一位管理者。
- 若未另外設定，Functions 會預設用 `https://buclaw.cloudflareaccess.com` 作為 Access team domain；若你的 team domain 改名，需同步設定 `TEAM_DOMAIN`。
- 未被單獨授權的登入者，預設只會看到財務管理題庫。
- 私有題庫 JSON 路徑由 `src/web/functions/data/subjects/_middleware.ts` 依 `allowedSubjects` 保護。
- `/api/session` 會回傳目前登入者的 `isAdmin` 與 `allowedSubjects`。
- 管理者可進入 `/admin/access` 維護 Gmail 使用者的題庫授權。
- 本機開發可另外設定 `VITE_ADMIN_EMAIL`、`VITE_DEV_VIEWER_EMAIL`、`VITE_DEV_IS_ADMIN` 與 `VITE_DEV_ALLOWED_SUBJECTS` 模擬登入與授權。

常用授權組合範例：
- 證券商業務員（初業）110–115：`securities-broker-law-110`、`securities-broker-law-111`、`securities-broker-law-112`、`securities-broker-law-113`、`securities-broker-law-114`、`securities-broker-law-115`、`securities-broker-finance-110`、`securities-broker-finance-111`、`securities-broker-finance-112`、`securities-broker-finance-113`、`securities-broker-finance-114`、`securities-broker-finance-115`

## v2 授權資料庫

- Cloudflare D1 database：`exam-study-platform-access`
- Wrangler binding：`ACCESS_DB`
- migration 檔案：`src/web/migrations/0001_user_access.sql`

資料表欄位：
- `email`：使用者 Gmail，主鍵
- `is_admin`：是否管理者
- `allowed_subjects`：JSON 陣列，存放可見的 `subject key`
- `note`：備註
- `updated_at`：最後更新時間

## Cloudflare 設定

1. 在 Cloudflare Zero Trust 建立一個 Access Application，保護此 Pages 網站。
2. 將 Identity Provider 設為 Google。
3. Access policy 設定為「所有需要使用的人都必須先登入 Google 才能進站」。
4. 在 Cloudflare Pages 專案的 Variables and Secrets 設定 `ANSON_EMAIL=anson4139@gmail.com`。
5. 若未來 Cloudflare Access team domain 不再是 `buclaw.cloudflareaccess.com`，再額外設定 `TEAM_DOMAIN=https://<your-team>.cloudflareaccess.com`。
6. 建立並綁定 D1 database `exam-study-platform-access` 至 `ACCESS_DB`。
7. 執行 `src/web/migrations/0001_user_access.sql` 建立 `user_access` 表。
8. 部署後確認 `/api/session` 可正確回傳目前登入者 email、`isAdmin` 與 `allowedSubjects`。

## 本機模擬

1. 在 `src/web/` 目錄建立 `.env.local`。
2. 以 [src/web/.env.example](src/web/.env.example) 為範本填入測試值。
3. 要模擬管理者視角時，讓 `VITE_DEV_VIEWER_EMAIL` 與 `VITE_ADMIN_EMAIL` 相同，並設定 `VITE_DEV_IS_ADMIN=true`。
4. 要模擬一般授權使用者時，設定 `VITE_DEV_VIEWER_EMAIL` 與 `VITE_DEV_ALLOWED_SUBJECTS`。
5. 重新執行 `npm run dev` 或 `npm run build` 讓 Vite 重新讀取環境變數。

## 驗證方式

1. 管理者視角：首頁應顯示三類題庫，且可進入 `/admin/access`。
2. 一般使用者視角：首頁只顯示其 `allowedSubjects` 對應的題庫，直接請求未授權 JSON 時應回傳 `403`。
3. 部署後：進入 `/api/session` 時應看得到目前登入 email、`isAdmin` 與 `allowedSubjects`。

## 專案結構

```
src/
  web/        ← React + Vite (TypeScript) 前端
  scripts/    ← Python：.md 題庫轉 JSON
data/
  subjects/   ← 轉換後的 JSON 題庫
specs/        ← 行為規格、資料 Schema
tests/        ← 單元測試 / E2E
docs/
  decisions/  ← ADR
```

## 快速開始

```powershell
# 1. 轉換題庫
cd src/scripts
python convert.py

# 2. 啟動前端（開發）
cd src/web
npm install
npm run dev

# 3. 預覽（本機正式版）
npm run build
npm run preview
```

## 提案文件

[docs/proposals/02-active/04-v2-exam-study-platform.md](../../docs/proposals/02-active/04-v2-exam-study-platform.md)
