# 考題學習平台擴充提案

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

將既有四科考題平台擴充為「以考試為主體、科目為次層」的題庫入口，並新增 `113電子商務財務管理(期中考)` 題庫，同時加入最小可行的身份辨識與內容可見性控管：Anson 指定 email 可看到三類題庫，其他登入者僅可看到財務管理題庫。

</details>

<details>
<summary>## 範疇</summary>

**包含：**
- 導入新題庫：以 [finance_25_questions_full_solutions.md](../../finance_25_questions_full_solutions.md) 為來源，新增 `113電子商務財務管理(期中考)`。
- 重構首頁資訊架構，從「平面科目清單」改為「考試分類 → 科目／卷別」。
- 考試分類第一版定義：
  - `金融科技力`
    - 金融科技力
  - `AI應用規劃師（中級）`
    - AI規劃師 第一科
    - AI規劃師 第二科
    - AI規劃師 第三科
  - `電子商務課程 / 校內考試`
    - 113電子商務財務管理(期中考)
- 規劃最小可行權限控管：Google 登入辨識身份，Anson 指定 email 可看到三類題庫，其他登入者僅可看到財務管理題庫。
- 確認 Cloudflare 部署型態下，這種單一 email 特權模型的可行性與限制。

**排除：**
- 完整後端資料庫。
- 複雜 RBAC 後台管理介面或多角色權限系統。
- 題庫內容自動生成或 AI 出題。

</details>

<details>
<summary>## 設計</summary>

### 現況摘要

前端已由平面科目列表改為考試分類導覽，題庫仍沿用既有靜態 JSON schema，透過前端分類 registry 將多個 subject key 歸到對應 exam group。

### 題庫分類方案

首頁流程已落地為：

```text
首頁
  └─ 選擇考試分類
       └─ 選擇科目
            └─ 選擇屆次 / 試卷
                 └─ 刷題
```

目前正式站可見分類如下：
- `金融科技力`
- `AI應用規劃師（中級）`
- `電子商務課程 / 校內考試`

### 新題庫導入方案

新題庫 `113電子商務財務管理(期中考)` 已完成轉換與匯入。

正式輸出檔案：
- `data/subjects/ecommerce-finance-midterm-113.json`
- `projects/01-exam-study-platform/src/web/public/data/subjects/ecommerce-finance-midterm-113.json`

session 命名採：
- `113期中考`

### 身份辨識與權限方案

正式站採用 Cloudflare Access + Google OAuth 作為登入與身份來源。

權限模型：
1. `anson4139@gmail.com`
   - 可看到三類題庫。
2. 其他已登入者
   - 僅可看到 `113電子商務財務管理(期中考)`。

為避免只有前端隱藏而檔案仍可直連讀取，已在 Pages Functions 對私有題庫 JSON 路徑補上伺服器側保護。

### 正式環境最終設定清單

#### Cloudflare Pages

1. Pages project：`exam-study-platform`
2. Custom domain：`exam.buclaw.org`
3. Production secret：`ANSON_EMAIL=anson4139@gmail.com`
4. 部署指令：`npm run cf:deploy`

#### Cloudflare Zero Trust / Access

1. Team domain：`https://buclaw.cloudflareaccess.com`
2. Access Application：`exam-study-platform`
3. Application domain：`exam.buclaw.org`
4. Policy：允許通過 Google 登入的使用者進站，不在 Access policy 直接收斂為單一 email

#### Google OAuth

1. 使用獨立 Google Cloud 專案作為 Access 身份來源
2. Google Identity Provider 已接入 Cloudflare Access
3. 若 OAuth consent screen 維持 Testing，需將測試使用者加入名單

### 上線驗證結果

1. 未登入時，正式站會先進入 Cloudflare Access / Google 登入流程
2. `anson4139@gmail.com` 登入後，首頁可見三類題庫
3. 一般登入者僅可見財務管理題庫
4. `/api/session` 已可正確回傳登入者 email 與 `isPrivileged`
5. 私有題庫 JSON 路徑已受保護，避免未授權直接讀取

</details>

<details>
<summary>## 決策紀錄</summary>

| 日期 | 決定 | 原因 |
|---|---|---|
| 2026-05-03 | 提案進入 active | 更新需求已明確，涵蓋資料、導覽與權限三個面向 |
| 2026-05-03 | Active 提案命名為 `01-v1-exam-study-platform.md` | 與既有 [01-exam-study-platform.md](../01-exam-study-platform.md) 區隔，表達同一案的延伸版 |
| 2026-05-03 | 首頁改為考試分類導覽 | 現行平面科目清單無法表達「同一張證照下多科」的關係 |
| 2026-05-03 | AI 三科歸類為 `AI應用規劃師（中級）` | 與使用者指定的考試分類一致 |
| 2026-05-03 | 新題庫歸類於 `電子商務課程 / 校內考試` | 以最小變更滿足現有入口需求 |
| 2026-05-03 | 權限模型收斂為「單一 privileged email + 其他登入者」 | 需求只需辨識 Anson 與一般使用者，不需要完整角色系統 |
| 2026-05-03 | 權限方案採用 Cloudflare Access + Google | 最符合現有靜態站架構，導入成本最低 |
| 2026-05-03 | 題庫 JSON 路徑由 Pages Functions 追加保護 | 避免僅靠前端隱藏造成私有內容可直接讀取 |
| 2026-05-03 | Cloudflare Pages production 以 `ANSON_EMAIL` secret 辨識 privileged 使用者 | 根因修正後的正式環境收斂作法 |

</details>

<details>
<summary>## 執行進度</summary>

| 里程碑 | 完成日期 | 狀態 |
|---|---|---|
| 確認 `113電子商務財務管理(期中考)` 原始題目完整性 | 2026-05-03 | 完成 |
| 新題庫轉換腳本與 JSON 匯入 | 2026-05-03 | 完成 |
| 定義考試分類設定與首頁導覽調整 | 2026-05-03 | 完成 |
| 題庫分類 UI 與手機版驗證 | 2026-05-03 | 完成 |
| Cloudflare Access + Google OAuth 接入 | 2026-05-03 | 完成 |
| 題庫 JSON 路徑級保護方案實作 | 2026-05-03 | 完成 |
| 正式站 privileged 權限修正與驗證 | 2026-05-03 | 完成 |
| 正式站 session debug 移除 | 2026-05-03 | 完成 |

變更摘要：
- 新增 finance 題庫轉換流程與正式 JSON 輸出
- 首頁改版為考試分類導覽
- 新增 viewer/session 權限流程
- 新增 Cloudflare Pages Functions 的 session API 與私有題庫保護
- 接入 Cloudflare Access + Google OAuth
- 修正正式站 privileged 權限判斷根因：改以 Access JWT / cookie 解析身份，並補上 production `ANSON_EMAIL` secret
- 移除臨時 debug 輸出，回復正式站乾淨 API 回應

</details>

<details>
<summary>## 結案 / 擱置 / 作廢備註</summary>

本提案已完成結案。

結案依據：
1. 題庫、分類、登入、權限與部署需求均已落地。
2. 正式站 `https://exam.buclaw.org/` 已可正常提供使用。
3. privileged 與一般使用者兩種視角均已完成實測。
4. 相關部署設定、權限根因與最終收斂方式已回寫本文件。

若未來要擴充更多角色、更多題庫來源或後台管理功能，應另開下一版提案，不再延用本案 active 狀態。

</details>