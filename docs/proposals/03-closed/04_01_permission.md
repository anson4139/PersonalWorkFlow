# 考題學習平台 v2 權限管理提案

| 項目 | 內容 |
|---|---|
| 狀態 | `closed` |
| 建立日期 | 2026-05-03 |
| 最後更新 | 2026-05-03 |
| 結案日期 | 2026-05-03 |
| 對應專案 | `projects/01-exam-study-platform/` |

---

<details>
<summary>## 目標</summary>

將 v1 的「單一 privileged email + 一般使用者」模型，升級為真正可管理的題庫授權系統：Anson 以 `anson4139@gmail.com` 登入後，可自行新增或調整任意 Gmail 使用者的題庫可見範圍，讓每位使用者可被分別授權看到指定的考試分類或科目，而不必每次透過改程式或重部署來處理單一白名單例外。

</details>

<details>
<summary>## 範疇</summary>

**包含：**
- 建立管理者可用的授權管理頁面。
- 以 email 為主鍵，維護每位使用者可存取的考試分類或科目清單。
- `anson4139@gmail.com` 作為第一位系統管理者，可管理其他 Gmail 使用者的授權。
- 前端首頁依登入者授權顯示可見題庫。
- 題庫 JSON 路徑保護改為依使用者授權表判斷，而非單一 privileged 布林值。
- session API 回傳使用者授權資訊，供前端 UI 與題庫保護邏輯共用。
- 保留 Cloudflare Access + Google OAuth 作為登入與身份來源。

**排除：**
- 完整多層 RBAC 角色管理系統。
- 自助註冊、申請審核、Email 驗證流程。
- 非 Google 帳號登入來源。
- 管理員多層級分權。

</details>

<details>
<summary>## 設計</summary>

### v1 限制

v1 的權限模型只有兩種狀態：
1. `anson4139@gmail.com`：可見全部題庫。
2. 其他登入者：僅可見財務管理題庫。

這個模型不支援以下需求：
- 為某位 Gmail 使用者單獨開放 AI 三科。
- 為不同使用者開放不同題庫組合。
- 由管理者直接在站內調整授權，而不是改環境變數後重新部署。

### v2 核心方向

v2 改以「使用者授權表」作為權限來源，而不是 `isPrivileged` 布林值。

核心概念：
- 身份識別：Cloudflare Access + Google OAuth
- 授權來源：使用者授權資料表
- 授權單位：以 `subject key` 為最小控制單位，必要時可額外提供考試分類快捷勾選
- 管理者：先固定 `anson4139@gmail.com`

### 建議資料模型

建議資料表至少包含：

```ts
type UserAccess = {
  email: string
  isAdmin: boolean
  allowedSubjects: string[]
  note?: string
  updatedAt: string
}
```

第一版可先不做複雜正規化，重點是可維護性與快速落地。

### 建議儲存層

#### 採用方案：Cloudflare D1

理由：
1. v2 要支援管理頁 CRUD，不適合再用單一 secret 或硬編碼 JSON。
2. D1 對小型權限表已足夠，且與 Pages Functions 整合成本低。
3. 後續若要加備註、到期日、審計欄位，擴充性比 secret / KV 好。

#### 可接受替代：Cloudflare KV

若只想追求最快上線，也可先用 KV 儲存 email -> allowedSubjects JSON；但若未來要支援查詢、排序、管理介面列表或到期日，D1 會更合適。

目前已建立 D1 database：`exam-study-platform-access`，並於 `wrangler.jsonc` 以 `ACCESS_DB` 綁定。

Migration 檔案：

```sql
CREATE TABLE IF NOT EXISTS user_access (
  email TEXT PRIMARY KEY,
  is_admin INTEGER NOT NULL DEFAULT 0,
  allowed_subjects TEXT NOT NULL,
  note TEXT,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)
```

### 建議授權邏輯

登入後，系統先依 Access 身份取得 email，再從授權表查詢：

```json
{
  "email": "user2@gmail.com",
  "isAdmin": false,
  "allowedSubjects": [
    "ai-planning",
    "big-data",
    "machine-learning",
    "ecommerce-finance-midterm-113"
  ]
}
```

前端首頁只顯示該使用者可見的 exam groups / subjects。

題庫 JSON 路徑保護則依請求檔名對照 `allowedSubjects`：
- 若 subject 在清單內，允許讀取
- 若不在清單內，回傳 `403`

### 管理頁需求

管理頁只允許 `anson4139@gmail.com` 進入，第一版功能建議包含：

1. 顯示目前已授權使用者列表
2. 新增 Gmail 使用者
3. 編輯某位使用者的可見題庫
4. 移除使用者授權
5. 顯示每位使用者的更新時間與備註

目前實作規格：
- 路徑：`/admin/access`
- 頁面區塊：
  - 使用者列表
  - 授權編輯表單
  - 題庫勾選區
  - 考試分類快捷勾選

### 題庫授權單位

建議以 `subject key` 為最小單位：
- `fintech`
- `ai-planning`
- `big-data`
- `machine-learning`
- `ecommerce-finance-midterm-113`

理由：
1. 與現有 JSON 路徑保護最直接對應。
2. 可以自由組合，不被考試分類綁死。
3. 前端只需再由 subject 對應回 exam group 顯示即可。

若要提升管理便利性，可在 UI 補「整組全選」：
- 勾選 `AI應用規劃師（中級）` 時，自動勾選三科

### API 建議

#### 1. session API

`GET /api/session`

回傳：

```json
{
  "email": "anson4139@gmail.com",
  "isAdmin": true,
  "allowedSubjects": ["fintech", "ai-planning", "big-data", "machine-learning", "ecommerce-finance-midterm-113"]
}
```

#### 2. access list API

`GET /api/admin/access`

用途：管理頁讀取授權列表。

目前已實作。

#### 3. access upsert API

`POST /api/admin/access`

用途：新增或更新某位使用者的授權。

目前已實作。

#### 4. access delete API

`DELETE /api/admin/access?email=<gmail>`

用途：刪除授權。

目前已實作。

### 目前已完成的實作切片

1. D1 database 與 binding 建立完成。
2. `user_access` migration 檔案建立完成。
3. `GET /api/session` 已改為回傳 `isAdmin` 與 `allowedSubjects`。
4. 題庫 JSON 路徑保護已改為依 `allowedSubjects` 判斷。
5. `/api/admin/access` CRUD API 已建立。
6. `/admin/access` 管理頁已建立。
7. 首頁已可顯示管理入口，並依 `allowedSubjects` 顯示可見題庫。
8. remote D1 schema 已建立並完成基本資料驗證。
9. 一般授權測試帳號已建立，支援不同題庫組合驗證。
10. 最新版本已部署到 Cloudflare Pages，正式站可正常回應。

### 管理頁畫面記錄

目前已確認並希望納入文件的畫面類型：
1. 題庫權限管理頁總覽
2. 選取 finance-only 使用者後的編輯畫面
3. 新增授權表單空白狀態

建議截圖資產路徑：
- `docs/proposals/assets/04-v2-exam-study-platform/`

建議檔名：
- `admin-access-list.png`
- `admin-access-edit-finance-only.png`
- `admin-access-create-form.png`

圖片存放決策：
1. 這類提案文件截圖不需要放資料庫。
2. 最適合直接納入 repo，與提案文件一起版本控管。
3. 若未來是網站內容上傳、使用者頭像、題目附圖或大量媒體檔，再改放 Cloudflare R2，而不是 D1。
4. D1 適合存 metadata / 權限資料，不適合存圖片二進位內容。

本次結案文件不嵌入截圖，改以文字記錄管理頁畫面與操作狀態；若未來需要補圖，再依上述路徑與檔名規則追加即可。

### 風險與控制

1. 若只做前端隱藏、不做路徑保護，私有題庫仍可能被直接讀取。
2. 若管理頁未限制管理者身份，會形成嚴重越權問題。
3. 若授權資料更新後前端未同步刷新，使用者可能仍看到舊狀態。

因此 v2 必須同時做：
- 管理頁權限限制
- session API 權限回傳
- 題庫路徑保護

</details>

<details>
<summary>## 決策紀錄</summary>

| 日期 | 決定 | 原因 |
|---|---|---|
| 2026-05-03 | v2 提案進入 active | v1 已結案，且使用者已明確提出「管理任意 Gmail 題庫授權」需求 |
| 2026-05-03 | v2 權限模型改採「email -> allowedSubjects」 | 真正支援每位使用者不同題庫組合 |
| 2026-05-03 | 第一位管理者固定為 `anson4139@gmail.com` | 符合目前實際使用情境，縮小第一版範圍 |
| 2026-05-03 | 權限儲存層優先採用 D1 | 相較 secret / KV，更適合管理頁 CRUD 與後續擴充 |
| 2026-05-03 | 題庫授權以 `subject key` 為最小控制單位 | 與現有 JSON 路徑保護邏輯最直接對接 |
| 2026-05-03 | v2 提案結案 | D1、管理頁、授權 API、測試資料與 Cloudflare 部署皆已完成 |

</details>

<details>
<summary>## 執行進度</summary>

| 里程碑 | 預計日期 | 狀態 |
|---|---|---|
| 定義 v2 權限模型與管理需求 | 2026-05-03 | 完成 |
| 決定授權儲存層（D1 / KV） | 2026-05-03 | 完成 |
| 設計授權資料表與 migration | 2026-05-03 | 完成 |
| 實作 session API 授權回傳 | 2026-05-03 | 完成 |
| 實作題庫 JSON 路徑授權判斷 | 2026-05-03 | 完成 |
| 實作 `/admin/access` 管理頁 | 2026-05-03 | 完成 |
| 管理者與一般使用者權限驗證 | 2026-05-03 | 完成 |
| Cloudflare Pages 正式部署 | 2026-05-03 | 完成 |

結案判定依據：
- remote D1 `user_access` schema 已建立。
- 測試帳號授權資料已寫入並查詢確認。
- `npm run build` 已通過。
- Cloudflare Pages 最新部署已完成。
- preview 部署網址與正式網域首頁皆可正常回應。

目前保留事項：
- 本次文件以文字記錄畫面，不額外納入截圖檔；若後續需要對外展示，再補入 repo 資產即可。

</details>

<details>
<summary>## 結案 / 擱置 / 作廢備註</summary>

本提案已完成結案。

結案原因：
1. v2 權限模型已從單一 privileged 判斷升級為可管理的 D1 授權表。
2. 管理者可透過 `/admin/access` 直接維護使用者題庫授權。
3. 題庫首頁與 JSON 路徑保護已依 `allowedSubjects` 生效。
4. Cloudflare Pages 正式部署已完成，站點可正常對外提供服務。

若後續要擴充更多管理者、到期日、批次匯入或更完整 RBAC，應另開 v3 提案，不再延用本案 active 狀態。

</details>
