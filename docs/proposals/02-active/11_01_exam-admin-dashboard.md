# 考題學習平台 v7：後台管理儀表板（examdashboard.buclaw.org）

> **[AI 規則] 每次修改本文件，必須同時執行以下兩個動作，否則視為不完整的更新：**
>
> 1. **在本文件的「異動記錄」表格最上方新增一筆記錄（日期 / 版本 / 更新人 / 變更說明）**
> 2. **在 `projects/README.md` 的「提案異動歷程」表格最上方同步新增一筆記錄（日期 / 提案 / 對應專案 / 異動摘要）**

| 項目     | 內容                               |
| -------- | ---------------------------------- |
| 狀態     | `active`                           |
| 建立日期 | 2026-05-09                         |
| 最後更新 | 2026-05-09（v0.3）                 |
| 對應專案 | `projects/01-exam-study-platform/` |

---

<details>
<summary>## 異動記錄</summary>

| 日期       | 版本 | 更新人 | 變更說明                                                                      |
| ---------- | ---- | ------ | ----------------------------------------------------------------------------- |
| 2026-05-09 | v0.3 | Anson  | 還原圖表規格：recharts 加回，個人檔案含折線圖（分數趨勢）+ 橫條圖（科目分佈） |
| 2026-05-09 | v0.2 | Anson  | 誤移除圖表，確認 CF Access 使用 Zero Trust self-hosted 方案                   |
| 2026-05-09 | v0.1 | Anson  | 建立提案初稿                                                                  |

</details>

---

<details>
<summary>## 背景與目標</summary>

### 現況

考題學習平台（exam.buclaw.org）已有：

- 對戰模式（BattlePage）：記分到 D1 `battle_sessions`
- 排行榜（LeaderboardPage）：從 D1 讀取 top 10
- 劇情模式（StoryPage）：進度存 localStorage（client-only）
- 怪獸圖鑑解鎖：存 localStorage（client-only）

### 問題

1. **無法監控誰在使用**：不知道有多少人進來玩、各自的進度與表現
2. **client-side 資料看不到**：劇情進度、圖鑑解鎖等資料完全在瀏覽器端，無法彙整
3. **無即時 dashboard**：只有 D1 SQL，必須開 Cloudflare Console 才能查資料

### 目標

建立一個專屬管理員的後台儀表板，URL `https://examdashboard.buclaw.org`：

| 維度         | 目標                                      |
| ------------ | ----------------------------------------- |
| **存取控制** | Google OAuth，僅 anson4139@gmail.com 可讀 |
| **用量總覽** | 有多少人使用、各科目熱門程度              |
| **個人檔案** | 每位使用者的分數、關卡、怪獸解鎖、歷程    |
| **行動友善** | 手機可查閱，RWD 設計                      |

</details>

---

<details>
<summary>## 功能規格</summary>

### A. 存取控制（Auth）

| 項目       | 規格                                   |
| ---------- | -------------------------------------- |
| 認證方式   | Google OAuth 2.0（Cloudflare Access）  |
| 允許帳號   | `anson4139@gmail.com` 唯一             |
| 未授權行為 | 302 redirect 到 Google 登入頁          |
| Session    | Cloudflare Access JWT cookie，自動刷新 |

**建議方案**：使用 **Cloudflare Access**（Zero Trust）設 self-hosted application，指定 email policy，不需自己實作 OAuth flow。

---

### B. 首頁總覽（Overview）

| 指標               | 資料來源             | 說明                         |
| ------------------ | -------------------- | ---------------------------- |
| 總玩家數           | D1 `battle_sessions` | 不重複 `email` 數量          |
| 今日對戰場次       | D1 `battle_sessions` | 今天 `created_at` 的紀錄筆數 |
| 各科目總場次       | D1 `battle_sessions` | GROUP BY `subject_key`       |
| 高分排行前 5       | D1 `battle_sessions` | 依 `score` DESC              |
| 最近 20 場對戰記錄 | D1 `battle_sessions` | 含 email、科目、分數、時間   |

---

### C. 玩家列表（Players）

| 欄位         | 資料來源            | 說明   |
| ------------ | ------------------- | ------ |
| Email        | `battle_sessions`   | 識別碼 |
| 總場次       | COUNT per email     |        |
| 最高分       | MAX score per email |        |
| 平均分       | AVG score per email |        |
| 最後對戰時間 | MAX created_at      |        |
| 最喜愛科目   | 出現最多的 subject  |        |

點擊玩家 → 展開個人頁面（見 D 節）

---

### D. 個人學習檔案（Player Profile）

| 區塊            | 內容                                              |
| --------------- | ------------------------------------------------- |
| 基本資料        | Email、頭像（Google）、加入時間、總場次           |
| 科目分佈        | 各科目場次 + 平均分（橫條圖）                     |
| 分數趨勢        | 時間軸折線圖（每場得分）                          |
| 對戰歷程        | 所有場次表格（科目、怪獸、分數、通關/失敗、時間） |
| 劇情進度 \*     | 各科目各 session 的 normal/enhanced/boss 結果     |
| 怪獸圖鑑解鎖 \* | 已解鎖怪獸清單（ID + 名稱 + 解鎖時間）            |

> `*` 標注項目目前存於 client localStorage，需先實作 **資料上報 API**（見技術規格）

---

### E. 行動裝置設計原則

- 最大寬度 `max-w-sm`（390px）
- 所有表格改為卡片式清單
- 圖表高度固定 200px，使用 `recharts`
- 避免橫向捲軸

</details>

---

<details>
<summary>## 技術架構</summary>

### 前端

| 項目 | 選型                                       |
| ---- | ------------------------------------------ |
| 框架 | React 18 + Vite + TypeScript + Tailwind v4 |
| 部署 | Cloudflare Pages（獨立 project）           |
| 路由 | `react-router-dom`                         |
| 圖表 | `recharts`                                 |
| 認證 | Cloudflare Access JWT（cookie 驗證）       |

### 後端

| 項目       | 選型                                      |
| ---------- | ----------------------------------------- |
| API        | Cloudflare Pages Functions（同 repo）     |
| 資料庫     | D1 `exam-study-platform-access`（同現有） |
| 認證 guard | 在 Functions 中驗 CF-Access-JWT header    |

### 新增 D1 資料表

#### `story_progress`（劇情進度上報）

```sql
CREATE TABLE IF NOT EXISTS story_progress (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  email        TEXT NOT NULL,
  subject_key  TEXT NOT NULL,
  session_name TEXT NOT NULL,
  slot         TEXT NOT NULL,         -- 'normal' | 'enhanced' | 'boss'
  result       TEXT NOT NULL,         -- 'clear' | 'fail'
  score        INTEGER NOT NULL,
  played_at    DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_story_email ON story_progress(email);
```

#### `monster_unlocks`（圖鑑解鎖上報）

```sql
CREATE TABLE IF NOT EXISTS monster_unlocks (
  email        TEXT NOT NULL,
  monster_id   INTEGER NOT NULL,
  unlocked_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (email, monster_id)
);
```

### 新增 API

| 路徑                            | 方法 | 說明                               |
| ------------------------------- | ---- | ---------------------------------- |
| `/api/dashboard/overview`       | GET  | 總覽數據（玩家數、場次、科目統計） |
| `/api/dashboard/players`        | GET  | 玩家列表（分頁）                   |
| `/api/dashboard/players/:email` | GET  | 個人檔案（對戰 + 劇情 + 圖鑑）     |
| `/api/story-progress`           | POST | 劇情進度上報（從前端 submit）      |
| `/api/monster-unlocks`          | POST | 圖鑑解鎖上報（從前端 submit）      |

**Auth guard**：dashboard API 需驗 `CF-Access-Authenticated-User-Email` header，只允許 `anson4139@gmail.com`。

### Cloudflare Access 設定

1. Zero Trust → Access → Applications → Add self-hosted
2. Domain: `examdashboard.buclaw.org`
3. Policy: Email = `anson4139@gmail.com`
4. Session duration: 24h

</details>

---

<details>
<summary>## 實作計畫</summary>

### Phase 0：地基（前提條件）

- [ ] 建立新 Cloudflare Pages project `exam-admin-dashboard`
- [ ] 設定 Cloudflare Access（Zero Trust）保護 `examdashboard.buclaw.org`
- [ ] DNS CNAME: `examdashboard.buclaw.org` → Pages domain
- [ ] 建立 D1 migration 0005（story_progress + monster_unlocks）

### Phase 1：骨架與認證

- [ ] Vite + React + TypeScript + Tailwind 初始化（複用 exam 設定）
- [ ] CF Access JWT 驗證（前端讀 cookie，API 驗 header）
- [ ] 首頁 `/`：未登入 redirect，已登入顯示 Overview

### Phase 2：Overview + 玩家列表

- [ ] `/api/dashboard/overview` API + 前端 Overview 頁
- [ ] `/api/dashboard/players` API + 前端 Players 列表頁（卡片式，RWD）

### Phase 3：個人檔案

- [ ] `/api/dashboard/players/:email` API
- [ ] Player Profile 頁（分數趨勢折線圖、對戰歷程表、科目橫條圖）

### Phase 4：資料上報整合

- [ ] 前端 `exam.buclaw.org` 新增：劇情模式完成後 POST `/api/story-progress`
- [ ] 前端新增：圖鑑解鎖時 POST `/api/monster-unlocks`
- [ ] dashboard 個人頁顯示劇情進度 + 怪獸圖鑑

### Phase 5：優化

- [ ] 資料更新時間顯示（「最後同步 X 分鐘前」）
- [ ] 分頁 / 無限捲動（玩家列表）
- [ ] 深色主題（對齊 exam.buclaw.org 風格）

</details>

---

<details>
<summary>## 工作拆解與優先順序</summary>

| 優先 | 項目                        | 類型     | 說明                             |
| ---- | --------------------------- | -------- | -------------------------------- |
| P0   | CF Access + DNS 設定        | 基礎設施 | 先保護網域，避免未授權訪問       |
| P0   | D1 migration 0005           | 後端     | story_progress + monster_unlocks |
| P1   | Dashboard 前端骨架 + 認證   | 前端     | React 初始化 + JWT 驗證邏輯      |
| P1   | Overview API + 頁面         | 全端     | 總覽數據                         |
| P2   | Players 列表 API + 頁面     | 全端     | 玩家清單 RWD 卡片                |
| P2   | Player Profile API + 頁面   | 全端     | 個人詳細頁 + 折線圖 / 橫條圖     |
| P3   | 劇情進度上報 API + 前端整合 | 全端     | POST story_progress              |
| P3   | 圖鑑解鎖上報 API + 前端整合 | 全端     | POST monster_unlocks             |
| P4   | 分頁優化 + 搜尋篩選         | 前端     | 玩家列表分頁、日期/科目篩選      |
| P5   | 深色主題 + 行動裝置最終調整 | 前端     | 對齊 exam 風格                   |

</details>

---

<details>
<summary>## 驗收標準</summary>

### 環境定義

| 環境    | URL                                |
| ------- | ---------------------------------- |
| **PRD** | `https://examdashboard.buclaw.org` |

### 驗收 Checklist

| #   | 項目                     | 預期結果                                           |
| --- | ------------------------ | -------------------------------------------------- |
| 1   | 非授權帳號訪問           | 302 redirect 到 Google 登入頁                      |
| 2   | anson4139@gmail.com 登入 | 正常進入 dashboard Overview                        |
| 3   | Overview 顯示正確        | 玩家數、今日場次、科目統計符合 D1 實際資料         |
| 4   | 玩家列表 RWD             | 手機（390px）無橫向捲軸，卡片排列整齊              |
| 5   | 個人頁分數趨勢圖         | 折線圖顯示該玩家所有場次得分                       |
| 6   | 劇情進度顯示             | 打完劇情模式後，dashboard 個人頁顯示對應 slot 結果 |
| 7   | 圖鑑解鎖顯示             | 解鎖新怪獸後，dashboard 個人頁顯示已解鎖清單       |
| 8   | API 未授權保護           | 直接 GET `/api/dashboard/overview` 無 JWT → 401    |

</details>
