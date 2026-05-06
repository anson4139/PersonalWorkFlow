# 考題學習平台 v4：遊戲化答題模式（怪獸對戰版）

> **[AI 規則] 每次修改本文件，必須同時執行以下兩個動作，否則視為不完整的更新：**
>
> 1. **在本文件的「異動記錄」表格最上方新增一筆記錄（日期 / 版本 / 更新人 / 變更說明）**
> 2. **在 `projects/README.md` 的「提案異動歷程」表格最上方同步新增一筆記錄（日期 / 提案 / 對應專案 / 異動摘要）**

| 項目     | 內容                               |
| -------- | ---------------------------------- |
| 狀態     | `drafting`                         |
| 建立日期 | 2026-05-07                         |
| 最後更新 | 2026-05-07                         |
| 對應專案 | `projects/01-exam-study-platform/` |

---

<details>
<summary>## 異動記錄</summary>

| 日期       | 版本 | 更新人 | 變更說明                                                                                                     |
| ---------- | ---- | ------ | ------------------------------------------------------------------------------------------------------------ | ---------------- |
| 2026-05-07 | v0.4 | Anson  | 怪獸素材就位：20 張 PNG（1254→512px）存入 `src/web/public/images/monsters/`，命名符合 `{id}-idle             | battle.png` 規格 |
| 2026-05-07 | v0.3 | Anson  | 更新 AI 圖片生成語法：改為透明背景優先、加入各怪獸屬性 Rim Light 色彩表、補充 Negative Prompt 與後製流程建議 |
| 2026-05-07 | v0.2 | Anson  | 確認全部 13 項待確認事項；新增動態題數規則、RWD 設計規格、AI 圖片生成語法                                    |
| 2026-05-07 | v0.1 | Anson  | 建立提案初稿：遊戲化答題模式（怪獸對戰版）規格草案                                                           |

</details>

<details>
<summary>## 系統開發規格</summary>

> 進入 active 後與 AI 協作填入，記錄系統各層技術選型與關鍵配置。

### 前端

| 項目          | 內容                                                                            |
| ------------- | ------------------------------------------------------------------------------- |
| 框架 / 技術棧 | React、TypeScript、Tailwind CSS（沿用現有）                                     |
| 語言          | TypeScript                                                                      |
| 主要套件      | Tailwind CSS 自訂 `@keyframes`（不需額外動畫套件）；DiceBear API（玩家頭像）    |
| 特殊規格      | 怪獸圖片狀態切換（精簡版 2 張 + CSS 動畫）、HP 血條動態更新、`h-dvh` 單畫面佈局 |

### 後端 / 平台

| 項目        | 內容                                                                                   |
| ----------- | -------------------------------------------------------------------------------------- |
| 執行環境    | Cloudflare Pages Functions（沿用現有）                                                 |
| API 路由    | 新增：`/api/quiz/session`、`/api/quiz/answer`、`/api/quiz/result`、`/api/quiz/history` |
| 認證 / 授權 | Cloudflare Access + Google OAuth（沿用現有）                                           |
| 主要套件    | 待確認                                                                                 |

### 資料庫 / 儲存

| 項目               | 內容                                                                                                     |
| ------------------ | -------------------------------------------------------------------------------------------------------- |
| 資料庫種類         | Cloudflare D1（SQLite）                                                                                  |
| Binding / 連線名稱 | **合併現有 `ACCESS_DB`**（`exam-study-platform-access`），不新增 binding，避免 wrangler.jsonc 異動       |
| 主要資料表         | `users`、`monsters`、`quiz_sessions`、`quiz_session_answers`、`reward_logs`（詳見「設計 > 資料表結構」） |
| Schema 備註        | 現有 `user_access` 表僅含授權欄位；另建獨立 `users` 表擴充積分與登入紀錄，兩表共用 email 關聯            |

### 環境設定

| 項目       | 內容                                  |
| ---------- | ------------------------------------- |
| 環境變數檔 | `.env`（本機）/ `.env.example`（Git） |
| CI/CD      | 沿用現有 Cloudflare Pages 自動部署    |
| 部署目標   | https://exam.buclaw.org               |

</details>

---

<details>
<summary>## 目標</summary>

將原本制式的「試題模式」改造成具備怪獸戰鬥、即時血量反饋、答錯解析、成績獎勵與個人歷程追蹤的遊戲化答題系統，提升使用者的：

1. **作答投入感**：以「打怪闖關」體驗取代枯燥答題，強化每題的打擊回饋
2. **持續答題意願**：積分、怪獸蒐集與個人歷程驅動回流動機
3. **學習記憶點**：答錯提供解析（玩家自選閱讀），加深錯誤印象
4. **歷程追蹤**：紀錄每次作答的詳細資料，可回顧弱點題型

</details>

<details>
<summary>## 範疇</summary>

**包含（MVP 第一版）：**

- 新增「怪獸對戰模式」作為獨立答題模式，不影響現有測試模式與練習模式
- 怪獸血條（HP Bar）與玩家血條互動機制，依各科目題庫總題數動態計算
- 10 隻怪獸輪流出場，每隻負責題數由 `ceil(totalQ / 10)` 動態分配
- 怪獸狀態圖切換（精簡版：2 張 / 怪獸 + CSS 動畫）：待機 / 攻擊受擊
- 答對扣怪獸血、答錯扣玩家血的即時視覺反饋
- 即時失敗判定：最高可能得分 < 70 分時立即 Game Over
- 答錯顯示「查看解析」按鈕，玩家自選是否閱讀，不強制鎖定「下一題」
- 結算頁：總分、答對/答錯數、積分、擊敗怪獸數
- Google OAuth 歷程紀錄（每次作答資料寫入 D1 的 `ACCESS_DB`）
- 基本積分系統（完成測驗 / 答對 / 及格 / 全對獎勵，純展示用途）
- 玩家頭像：DiceBear API 依 email 生成遊戲風格頭像（CF Access 不提供 Google 頭像）
- Mobile-first 單畫面設計：`h-dvh` 固定高度，不需上下滾動，電腦版置中放大

**排除（第二階段再做）：**

- 音效系統（答對/答錯/怪獸受擊/死亡音效）
- 連擊系統（Combo）與連擊加分
- 排行榜
- 怪獸圖鑑 / 蒐集系統
- 每日任務 / 每日首勝獎勵
- 難度模式（困難模式 / Boss 戰）
- 每題限時倒數
- 中途離開後續接（Session 斷線續玩）

</details>

<details>
<summary>## 設計</summary>

### 一、核心玩法概念

使用者進入「怪獸對戰模式」後，不再只是單純答題，而是進入怪獸對戰：

- 每答對一題，對怪獸造成傷害，怪獸血條扣減
- 每答錯一題，怪獸反擊，扣除玩家生命值
- 玩家若已不可能達到 70 分及格門檻，遊戲立即結束

---

### 二、遊戲規則

#### 1. 題數設定

| 項目         | 數值                |
| ------------ | ------------------- |
| 每回合總題數 | 50 題               |
| 每題分數     | 2 分                |
| 及格門檻     | 70 分（答對 35 題） |
| 最大可錯題數 | 15 題               |

#### 2. 怪獸出場方式（採用「做法 A：10 隻輪流登場」）

- 50 題 / 10 隻怪獸 = 每隻怪獸負責 5 題
- 每隻怪獸初始 HP = 100%
- 每答對 1 題，該怪獸扣 20%（答對 5 題則擊敗）
- 答錯時怪獸不扣血
- 10 隻怪獸隨機排序出場

公式：

```text
monsterHP = 100 - (該怪獸區段內答對題數 × 20)
```

#### 3. 玩家血條計算規則

玩家 HP 與「剩餘容錯次數」綁定：

- 初始 HP = 100%
- 每答錯 1 題：扣除 100 / 15 ≈ 6.67%
- 錯題數 > 15：直接 Game Over（視覺層）

公式：

```text
playerHP = ((15 - wrongCount) / 15) × 100
```

#### 4. 即時失敗判定（邏輯層）

每答完一題，系統判斷：

```text
最高可能得分 = (目前答對題數 + 剩餘題數) / 50 × 100
```

若 `最高可能得分 < 70`，立即觸發 Game Over。

範例：已答 20 題，答錯 16 題 → 最多只能答對 34 題 → 68 分 < 70 分 → 立即結束

> 視覺上顯示血條，邏輯上以「最高可能得分」判定，兩者並行。

---

### 三、畫面配置（由上到下）

#### A. 頂部資訊列

- 關卡 / 題號（例：第 12 / 50 題）
- 目前分數
- 已答對 / 已答錯數
- 暫停 / 離開按鈕

#### B. 怪獸區

- 怪獸名稱 + 血條（HP Bar）+ HP 數字
- 怪獸圖片（狀態切換）：
    - 平常 → 待機圖
    - 答對時 → 受擊圖 / 受傷動畫
    - 答錯時 → 攻擊圖 / 攻擊動畫
    - HP 歸零 → 死亡圖 / 淡出效果

#### C. 玩家區

- 玩家血條（HP Bar）+ HP 數字 + 剩餘容錯次數
- 玩家頭像：使用 **DiceBear API** 依 email 自動生成遊戲風格頭像
    - **技術說明**：現有 `getAccessIdentity` 將 CF Access JWT 解析後僅回傳 `email`，不包含 Google 頭像 URL
    - **哪裡可以驗證**：`access.ts` 的 `AccessIdentityResponse` 接口只有 `email?: string`，CF Access JWT 本身不轉發 Google 頭像 URL
    - **解法**：呼叫 DiceBear 免費 API，不需額外 OAuth scope 或 API key
    - **用法**：`https://api.dicebear.com/9.x/adventurer/svg?seed={encodeURIComponent(email)}`
    - **後期優化**：可嘗試從 `/cdn-cgi/access/get-identity` 擴充取得 Google 頭像

#### D. 題目作答區

- 題目內容
- 選項 A / B / C / D（按鈕）
- 下一題按鈕（答完後才出現）

#### E. 解析區（答錯時出現）

- 顯示「查看解析」按鈕（**選看，不強制**）
- 玩家可直接按「下一題」跨過解析
- 点擊「查看解析」後顯示：正確答案、解題思路
- 建議做成**底部抜屉式層山（Bottom Sheet）**或全螢幕遣罩彈窗，避免展開式小版擄高造成滾動

---

### 四、答題互動流程

#### 答對時

1. 鎖定選項不可重選
2. 顯示「答對」視覺效果（綠色高亮 / 打擊特效）
3. 怪獸切換為受擊圖
4. 怪獸 HP 扣減動畫（顯示 `-20%` 傷害數字）
5. 若怪獸 HP 歸零 → 播放死亡效果 → 顯示「擊敗怪獸！」 → 切換下一隻
6. 使用者按「下一題」繼續

#### 答錯時

1. 鎖定選項不可重選
2. 顯示「答錯」視覺效果（紅色高亮 / 受擊特效）
3. 怪獸切換為攻擊圖 + CSS 攻擊動畫
4. 玩家 HP 扣減動畫（顯示受傷數字）
5. 顯示「查看解析」按鈕（**選看，不強制**）
6. 玩家可直接按「下一題」繼續（不被解析鎖定）
7. 重新判定是否仍可及格，若否 → Game Over

> 不自動跳題，使用者手動按「下一題」。解析設計為輔助學習用途，不強制，把閱讀自主權交給玩家。

---

### 五、結算頁設計

#### 基本結果

| 欄位       | 說明        |
| ---------- | ----------- |
| 總分       | 0 ~ 100     |
| 是否及格   | PASS / FAIL |
| 答對題數   | N / 50      |
| 答錯題數   | N / 50      |
| 正確率     | %           |
| 花費時間   | 分：秒      |
| 擊敗怪獸數 | N / 10      |
| 獲得積分   | +N 點       |

#### 錯題分析

- 列出所有答錯題目
- 題目內容、正確答案、題目解析（若有）

---

### 六、積分獎勵設計

| 觸發條件              | 積分 |
| --------------------- | ---- |
| 完成測驗              | +50  |
| 每答對 1 題           | +2   |
| 及格獎勵（70 分以上） | +30  |
| 全對獎勵（100 分）    | +100 |
| 連續答對每 5 題       | +10  |

第二階段可擴充：每日首勝、連續登入、首次擊敗特定怪獸、全怪獸圖鑑蒐集。

---

### 七、資料表結構

#### `users`（新增或擴充現有 `user_access`）

| 欄位            | 型別              | 說明                                  |
| --------------- | ----------------- | ------------------------------------- |
| id              | INTEGER PK        |                                       |
| google_oauth_id | TEXT UNIQUE       | CF Access sub                         |
| email           | TEXT UNIQUE       |                                       |
| name            | TEXT              | 顯示名稱                              |
| avatar_url      | TEXT              | DiceBear 生成 URL（依 email 為 seed） |
| total_points    | INTEGER DEFAULT 0 | 累計積分                              |
| created_at      | TEXT              | ISO 8601                              |
| last_login_at   | TEXT              |                                       |

#### `monsters`

額外備註：MVP 精簡版對每隻怪獸僅準備 2 張（`idle_image` + `battle_image`，battle 共用於攻擊與受擊），後期升級時再補充 `hit_image` 與 `dead_image`。

| 欄位          | 型別       | 說明                                                  |
| ------------- | ---------- | ----------------------------------------------------- |
| id            | INTEGER PK |                                                       |
| name          | TEXT       | 怪獸名稱                                              |
| idle_image    | TEXT       | 待機圖路徑，對應 `{id}-idle.png`                      |
| battle_image  | TEXT       | 攻擊/受擊共用圖（精簡版 MVP），對應 `{id}-battle.png` |
| hit_image     | TEXT       | 受擊圖（後期標準版補充）                              |
| attack_image  | TEXT       | 攻擊圖（後期標準版補充）                              |
| dead_image    | TEXT       | 死亡圖（後期標準版補充）                              |
| style_tag     | TEXT       | `rpg` / `cartoon` / `dark-fantasy`                    |
| display_order | INTEGER    | 排序                                                  |
| is_active     | INTEGER    | 0/1                                                   |

#### `quiz_sessions`

| 欄位                   | 型別       | 說明                                         |
| ---------------------- | ---------- | -------------------------------------------- |
| id                     | INTEGER PK |                                              |
| user_id                | INTEGER FK |                                              |
| mode                   | TEXT       | 固定為 `battle`                              |
| total_questions        | INTEGER    | 依科目題庫動態寫入                           |
| answered_count         | INTEGER    |                                              |
| correct_count          | INTEGER    |                                              |
| wrong_count            | INTEGER    |                                              |
| score                  | INTEGER    |                                              |
| status                 | TEXT       | `ongoing` / `passed` / `failed` / `gameover` |
| current_monster_id     | INTEGER    |                                              |
| current_question_index | INTEGER    |                                              |
| started_at             | TEXT       |                                              |
| ended_at               | TEXT       |                                              |

#### `quiz_session_answers`

| 欄位              | 型別       | 說明             |
| ----------------- | ---------- | ---------------- |
| id                | INTEGER PK |                  |
| session_id        | INTEGER FK |                  |
| question_id       | INTEGER    | 題庫題號         |
| selected_answer   | TEXT       | A/B/C/D          |
| correct_answer    | TEXT       | A/B/C/D          |
| is_correct        | INTEGER    | 0/1              |
| explanation_shown | INTEGER    | 0/1              |
| answer_time_ms    | INTEGER    | 作答耗時（毫秒） |
| monster_id        | INTEGER    | 所屬怪獸         |
| created_at        | TEXT       |                  |

#### `reward_logs`

| 欄位        | 型別       | 說明         |
| ----------- | ---------- | ------------ |
| id          | INTEGER PK |              |
| user_id     | INTEGER FK |              |
| session_id  | INTEGER FK |              |
| reward_type | TEXT       | 獎勵類型說明 |
| points      | INTEGER    | 本次獲得積分 |
| description | TEXT       | 人可讀描述   |
| created_at  | TEXT       |              |

---

### 八、素材需求清單

#### 怪獸素材（10 隻）

**標準版（推薦）：每隻 4 張**

| 類型                   | 數量      |
| ---------------------- | --------- |
| 待機圖（正常）         | 10 張     |
| 受擊圖（被打）         | 10 張     |
| 攻擊圖（怪獸攻擊玩家） | 10 張     |
| 死亡圖（可選）         | 10 張     |
| **小計**               | **40 張** |

**精簡版 MVP（預算有限）：每隻 2 張，搭配 CSS 動畫**

- 正常圖 + 攻擊/受擊共用圖 = 10 × 2 = 20 張
- 受擊：CSS 震動動畫；死亡：CSS 淡出動畫

#### 其他素材

| 類型                                                   | 數量估算       |
| ------------------------------------------------------ | -------------- |
| 特效素材（答對/答錯/傷害數字/怪獸死亡/過關/Game Over） | 8 ~ 15 個      |
| UI 素材（血條/按鈕/題目框/解析框/結果頁背景）          | 10 ~ 20 個     |
| 背景圖（戰鬥背景 2~3 張 / 結果頁背景 1 張）            | 4 ~ 6 張       |
| **最基本可上線素材總數**                               | **52 ~ 81 個** |

---

### 九、前端互動事件規格

| #   | 事件              | 說明                                                                      |
| --- | ----------------- | ------------------------------------------------------------------------- |
| 1   | 進入遊戲          | 初始化 session，載入怪獸與題庫                                            |
| 2   | 載入怪獸          | 依怪獸排序決定出場順序                                                    |
| 3   | 載入題目          | 依 session 進度載入當前題目                                               |
| 4   | 使用者選答案      | 鎖定選項，呼叫判斷邏輯                                                    |
| 5   | 判斷對錯          | 比對正確答案，更新 HP                                                     |
| 6   | 播放動畫          | 切換怪獸/玩家狀態圖，顯示傷害數字                                         |
| 7   | 更新 HP           | 血條動畫更新                                                              |
| 8   | 顯示解析          | 答錯時顯示「查看解析」按鈕（選看，不強制）                                |
| 9   | 判斷 Game Over    | 計算最高可能得分，若 < 70 觸發 Game Over                                  |
| 10  | 進入下一題 / 換怪 | 更新 session index，怪獸 HP 歸零時切換怪獸                                |
| 11  | 顯示結算頁        | 計算積分，呈現結果統計                                                    |
| 12  | 儲存歷程與獎勵    | 寫入 D1：`quiz_session_answers`、`reward_logs`，更新 `users.total_points` |

---

### 十、MVP 實作範圍（第一版）

#### 必做（MVP）

- [ ] 怪獸血條 + 玩家血條（依題數動態計算 `maxWrong`）
- [ ] 10 隻怪獸隨機排序出場（`qPerMonster = ceil(totalQ / 10)`）
- [ ] 怪獸狀態圖切換（精簡版：2 張 / 怪獸）+ CSS 動畫（震動 / 閃白 / 淡出）
- [ ] 答對扣怪獸血、答錯扣玩家血
- [ ] 即時失敗判定（最高可能得分 < 70 → Game Over）
- [ ] 答錯顯示「查看解析」按鈕（選看，不強制）
- [ ] 結算頁（分數、答對/答錯、積分、擊敗怪獸數）
- [ ] Google OAuth 歷程紀錄（寫入 `ACCESS_DB`）
- [ ] 基本積分系統（純展示）
- [ ] 玩家頭像（DiceBear API，`adventurer` 風格，依 email 生成）
- [ ] Mobile-first 單畫面不滾動（`h-dvh` + Tailwind flex 佈局，電腦版置中放大）

#### 第二階段

- [ ] 音效系統（答對/答錯/怪獸受擊/死亡）
- [ ] 連擊系統（Combo）
- [ ] 排行榜
- [ ] 怪獸圖鑑 / 蒐集
- [ ] 每日任務
- [ ] 難度模式 / Boss 戰
- [ ] 每題限時倒數
- [ ] 中途離開後續接（Session 斷線續玩）

---

### 十一、RWD 單畫面響應式設計

#### 設計目標

所有畫面必須在一個螢幕內完整顯示，**不需上下滾動**：

- 手機：直向操作，所有元素在一個畫面
- 電腦：置中放大，保持卡片比例

#### 實作方案（React + Tailwind CSS）

**根容器：**

```html
<div class="h-dvh overflow-hidden flex flex-col">...</div>
```

- `h-dvh`：Dynamic Viewport Height，手機瀏覽器 Chrome bar 縮放時自動調整，不用 `h-screen`（有 100vh 問題）
- `overflow-hidden`：防止任何子元件溢出造成捲動

**電腦版置中：**

```html
<div class="h-dvh overflow-hidden flex items-center justify-center bg-gray-900">
    <div class="w-full max-w-sm h-dvh flex flex-col">
        <!-- 遊戲內容 -->
    </div>
</div>
```

- `max-w-sm`（384px）：桌機置中顯示手機比例，背景可補整場景圖

**各區塊高度分配（flex 比例）：**

| 區塊          | Tailwind 類別                                   | 建議比例           |
| ------------- | ----------------------------------------------- | ------------------ |
| A. 頂部資訊列 | `flex-none h-12`                                | 固定 48px          |
| B. 怪獸區     | `flex-[3] min-h-0`                              | 約 35%             |
| C. 玩家區     | `flex-none h-14`                                | 固定 56px          |
| D. 題目作答區 | `flex-[4] min-h-0 overflow-hidden`              | 約 50%             |
| E. 解析區     | `fixed bottom-0` 拉層 / `absolute inset-0` 彈窗 | 浮層，不佔主流高度 |

> `min-h-0` 是 flex 子項目縮放的關鍵，避免內容超出時撐大整體高度。

**解析區建議做法：**

不做展開式（會撐高 D 區造成滾動），改為：

- **底部抽屜（Bottom Sheet）**：Tailwind `fixed bottom-0 left-0 right-0` + 高度動畫
- 或**全螢幕遮罩彈窗**：`fixed inset-0 bg-black/70`

**字體大小建議：**

- 題目文字：`text-sm`（14px）手機 / `text-base`（16px）桌機
- 選項按鈕：`text-sm py-2`，保持 4 個選項都在螢幕內
- 怪獸名稱：`text-xs` 或 `text-sm`

**最小支援螢幕尺寸：**

| 裝置            | 尺寸        | 狀態                 |
| --------------- | ----------- | -------------------- |
| iPhone SE (3rd) | 375 × 667px | 設計基準（最小目標） |
| iPhone 14 Pro   | 393 × 852px | 標準                 |
| Android 中階機  | 360 × 780px | 需測試               |
| 桌機（Chrome）  | 1280px+     | 置中卡片             |

---

### 十二、AI 圖片生成語法（怪獸素材）

#### 使用方式

以下語法可用於 DALL-E 3、Midjourney、Stable Diffusion 等 AI 圖像生成工具。每隻怪獸需生成 **2 張**（精簡版）：

1. **Idle**：待機 / 正常站立姿態
2. **Battle**：戰鬥動態狀態，可共用於攻擊與受擊

#### 素材規格

```text
怪獸素材生成規格：
每隻怪獸產出 2 張：
  1. idle：正常待機狀態
  2. battle：戰鬥動態狀態，可共用於攻擊與受擊

圖片要求：
- 底稿 1254×1254，已縮放储存為 512×512 PNG，實際 UI 顯示建議用 256×256 或 320×320 CSS 大小
- PNG 格式
- 透明背景優先
- 不可使用白底
- 若無法透明，使用深黑背景
- 怪獸外緣需要有微弱 rim light，確保在黑色 UI 上清楚可見
- 主體必須完整全身、置中、不要裁切
- 不要文字、不要卡框、不要 UI 元件、不要浮水印
```

存放路徑：`src/web/public/images/monsters/{id}-{state}.png`

- 範例：`01-idle.png`、`01-battle.png` … `10-idle.png`、`10-battle.png`

---

#### 怪獸屬性 Rim Light 色彩建議

| 怪獸        | 建議 Rim Light 顏色        | CSS `drop-shadow` 色      |
| ----------- | -------------------------- | ------------------------- |
| 01 火焰龍   | orange rim light           | `rgba(255, 140, 0, 0.5)`  |
| 02 石巨人   | cyan blue rim light        | `rgba(0, 200, 255, 0.5)`  |
| 03 暗黑騎士 | purple rim light           | `rgba(150, 0, 255, 0.5)`  |
| 04 雷鷹     | electric blue rim light    | `rgba(50, 150, 255, 0.5)` |
| 05 史萊姆球 | cyan rim light             | `rgba(0, 230, 230, 0.5)`  |
| 06 毛球熊   | soft warm yellow rim light | `rgba(255, 220, 80, 0.5)` |
| 07 惡作劇狐 | orange rim light           | `rgba(255, 120, 0, 0.5)`  |
| 08 暗影惡靈 | red purple rim light       | `rgba(180, 0, 120, 0.5)`  |
| 09 骷髏王   | violet rim light           | `rgba(130, 0, 220, 0.5)`  |
| 10 深淵蛇妖 | dark purple rim light      | `rgba(100, 0, 200, 0.5)`  |

CSS 套用方式（配合黑底霓虹綠主題）：

```css
.monster-image {
    filter: drop-shadow(0 0 10px rgba(118, 255, 0, 0.35));
}
/* 或依怪獸屬性動態套用各自顏色 */
```

---

#### 共用 Style Guide

**版本 A（透明背景，優先使用）：**

```text
single monster character asset, full body, centered composition, front 3/4 view, clean 2D game illustration, flat colors, bold clean outline, simple cel shading, strong readable silhouette, subtle rim light for visibility on a black UI, transparent background, no white background, no scene background, no text, no UI, no frame, no watermark, 512x512, high quality, consistent character design across the monster set
```

**版本 B（深黑背景，若透明背景效果不佳改用）：**

```text
single monster character asset, full body, centered composition, front 3/4 view, clean 2D game illustration, flat colors, bold clean outline, simple cel shading, strong readable silhouette, subtle neon rim light around the monster for visibility, deep black background, dark game UI friendly, no white background, no bright plain background, no scene background, no text, no UI, no frame, no watermark, 512x512, high quality, consistent character design across the monster set
```

**Negative Prompt（支援 Negative Prompt 的工具請附上）：**

```text
white background, gray background, bright background, colorful scenery, landscape, room, environment, multiple characters, cropped body, close-up portrait, text, logo, watermark, card frame, UI elements, blurry, low quality, photorealistic, 3d render, extra limbs, bad anatomy
```

---

#### 怪獸 Prompt 清單（共 10 隻 × 2 張 = 20 張）

> 所有 Prompt 使用「版本 A 透明背景」尾段。若工具不支援透明背景，將尾段最後兩行替換為版本 B 的 `deep black background` 段落。

---

**Monster 01 — 火焰龍 Flamedrake（RPG 勇者風）**

`01-idle.png`

```text
Create a single monster character asset for a quiz battle game: Flamedrake, a fierce red dragon with flaming wings, ember-like horns, glowing orange eyes, sharp claws, and a powerful tail. Show the monster in a calm but powerful idle pose, standing upright with wings slightly open and a confident expression. RPG heroic fantasy style. Single monster character asset, full body, centered composition, front 3/4 view, clean 2D game illustration, flat colors, bold clean outline, simple cel shading, strong readable silhouette, subtle orange rim light for visibility on a black UI, transparent background, no white background, no scene background, no text, no UI, no frame, no watermark, 512x512, high quality, consistent character design across the monster set.
```

`01-battle.png`

```text
Create a single monster character asset for a quiz battle game: Flamedrake, a fierce red dragon with flaming wings, ember-like horns, glowing orange eyes, sharp claws, and a powerful tail. Show the monster in a dynamic battle pose, roaring with wings spread wide, body leaning forward, flames bursting from its mouth, suitable for either attacking or reacting in combat. RPG heroic fantasy style. Single monster character asset, full body, centered composition, front 3/4 view, clean 2D game illustration, flat colors, bold clean outline, simple cel shading, strong readable silhouette, subtle orange rim light for visibility on a black UI, transparent background, no white background, no scene background, no text, no UI, no frame, no watermark, 512x512, high quality, consistent character design across the monster set.
```

---

**Monster 02 — 石巨人 Golem Rex（RPG 勇者風）**

`02-idle.png`

```text
Create a single monster character asset for a quiz battle game: Golem Rex, a massive stone golem made of cracked rock plates with glowing blue runes, thick arms, and heavy legs. Show the monster in a tall idle pose, standing solidly with both arms relaxed at its sides, ancient and powerful. RPG heroic fantasy style. Single monster character asset, full body, centered composition, front 3/4 view, clean 2D game illustration, flat colors, bold clean outline, simple cel shading, strong readable silhouette, subtle cyan blue rim light for visibility on a black UI, transparent background, no white background, no scene background, no text, no UI, no frame, no watermark, 512x512, high quality, consistent character design across the monster set.
```

`02-battle.png`

```text
Create a single monster character asset for a quiz battle game: Golem Rex, a massive stone golem made of cracked rock plates with glowing blue runes, thick arms, and heavy legs. Show the monster in a dynamic battle pose, raising both fists high and leaning forward as if smashing the ground, with brighter glowing cracks and runes, suitable for either attacking or reacting in combat. RPG heroic fantasy style. Single monster character asset, full body, centered composition, front 3/4 view, clean 2D game illustration, flat colors, bold clean outline, simple cel shading, strong readable silhouette, subtle cyan blue rim light for visibility on a black UI, transparent background, no white background, no scene background, no text, no UI, no frame, no watermark, 512x512, high quality, consistent character design across the monster set.
```

---

**Monster 03 — 暗黑騎士 Shadow Knight（RPG 勇者風）**

`03-idle.png`

```text
Create a single monster character asset for a quiz battle game: Shadow Knight, a dark armored knight with a horned helmet, glowing eyes, black steel armor, a dark cape, and a sheathed sword. Show the monster standing at attention in an idle pose, upright and intimidating, disciplined and ominous. RPG heroic fantasy style. Single monster character asset, full body, centered composition, front 3/4 view, clean 2D game illustration, flat colors, bold clean outline, simple cel shading, strong readable silhouette, subtle purple rim light for visibility on a black UI, transparent background, no white background, no scene background, no text, no UI, no frame, no watermark, 512x512, high quality, consistent character design across the monster set.
```

`03-battle.png`

```text
Create a single monster character asset for a quiz battle game: Shadow Knight, a dark armored knight with a horned helmet, glowing eyes, black steel armor, a flowing cape, and a glowing dark sword. Show the monster in a dynamic battle pose, lunging forward with the sword raised diagonally, cape flowing, suitable for either attacking or reacting in combat. RPG heroic fantasy style. Single monster character asset, full body, centered composition, front 3/4 view, clean 2D game illustration, flat colors, bold clean outline, simple cel shading, strong readable silhouette, subtle purple rim light for visibility on a black UI, transparent background, no white background, no scene background, no text, no UI, no frame, no watermark, 512x512, high quality, consistent character design across the monster set.
```

---

**Monster 04 — 雷鷹 Thunderwing（RPG 勇者風）**

`04-idle.png`

```text
Create a single monster character asset for a quiz battle game: Thunderwing, a majestic eagle monster with electric blue feathers, sharp golden beak, glowing eyes, and lightning crackling along its wings. Show the monster in a poised idle stance, standing proudly with wings partially folded and a noble, alert expression. RPG heroic fantasy style. Single monster character asset, full body, centered composition, front 3/4 view, clean 2D game illustration, flat colors, bold clean outline, simple cel shading, strong readable silhouette, subtle electric blue rim light for visibility on a black UI, transparent background, no white background, no scene background, no text, no UI, no frame, no watermark, 512x512, high quality, consistent character design across the monster set.
```

`04-battle.png`

```text
Create a single monster character asset for a quiz battle game: Thunderwing, a majestic eagle monster with electric blue feathers, sharp golden beak, glowing eyes, and lightning crackling along its wings. Show the monster in a dynamic battle pose, diving forward with wings swept back, claws extended, and lightning bursting around its body, suitable for either attacking or reacting in combat. RPG heroic fantasy style. Single monster character asset, full body, centered composition, front 3/4 view, clean 2D game illustration, flat colors, bold clean outline, simple cel shading, strong readable silhouette, subtle electric blue rim light for visibility on a black UI, transparent background, no white background, no scene background, no text, no UI, no frame, no watermark, 512x512, high quality, consistent character design across the monster set.
```

---

**Monster 05 — 史萊姆球 Blobby（可愛卡通）**

`05-idle.png`

```text
Create a single monster character asset for a quiz battle game: Blobby, a cute round blue slime with a glossy jelly body, big sparkly eyes, and a happy smile. Show the monster in a cheerful idle pose, slightly bouncing or wobbling gently, adorable and friendly. Cute cartoon chibi style with soft pastel tones. Single monster character asset, full body, centered composition, front 3/4 view, clean 2D game illustration, flat colors, bold clean outline, simple cel shading, strong readable silhouette, subtle cyan rim light for visibility on a black UI, transparent background, no white background, no scene background, no text, no UI, no frame, no watermark, 512x512, high quality, consistent character design across the monster set.
```

`05-battle.png`

```text
Create a single monster character asset for a quiz battle game: Blobby, a cute round blue slime with a glossy jelly body, big sparkly eyes, and expressive eyebrows. Show the monster in a dynamic battle pose, bouncing upward with a splashy body shape, determined expression, and energetic movement, suitable for either attacking or reacting in combat. Cute cartoon chibi style with soft pastel tones. Single monster character asset, full body, centered composition, front 3/4 view, clean 2D game illustration, flat colors, bold clean outline, simple cel shading, strong readable silhouette, subtle cyan rim light for visibility on a black UI, transparent background, no white background, no scene background, no text, no UI, no frame, no watermark, 512x512, high quality, consistent character design across the monster set.
```

---

**Monster 06 — 毛球熊 Fluffybear（可愛卡通）**

`06-idle.png`

```text
Create a single monster character asset for a quiz battle game: Fluffybear, an adorable round fluffy bear cub with soft cream-colored fur, small paws, rosy cheeks, and a little flower on its head. Show the monster in a friendly idle pose, waving hello with a warm and cute expression. Cute cartoon chibi style with soft pastel tones. Single monster character asset, full body, centered composition, front 3/4 view, clean 2D game illustration, flat colors, bold clean outline, simple cel shading, strong readable silhouette, subtle soft warm yellow rim light for visibility on a black UI, transparent background, no white background, no scene background, no text, no UI, no frame, no watermark, 512x512, high quality, consistent character design across the monster set.
```

`06-battle.png`

```text
Create a single monster character asset for a quiz battle game: Fluffybear, an adorable round fluffy bear cub with soft cream-colored fur, small paws, rosy cheeks, and a little flower on its head. Show the monster in a dynamic battle pose, puffing up with cheeks full, tiny fists raised, and an angry-but-cute expression, suitable for either attacking or reacting in combat. Cute cartoon chibi style with soft pastel tones. Single monster character asset, full body, centered composition, front 3/4 view, clean 2D game illustration, flat colors, bold clean outline, simple cel shading, strong readable silhouette, subtle soft warm yellow rim light for visibility on a black UI, transparent background, no white background, no scene background, no text, no UI, no frame, no watermark, 512x512, high quality, consistent character design across the monster set.
```

---

**Monster 07 — 惡作劇狐 Trickster Fox（可愛卡通）**

`07-idle.png`

```text
Create a single monster character asset for a quiz battle game: Trickster Fox, a cheeky orange fox with big expressive eyes, oversized ears, fluffy tail, and a mischievous grin. Show the monster in a playful idle pose, tail curled around its body, looking clever and sneaky. Cute cartoon chibi style with soft pastel tones. Single monster character asset, full body, centered composition, front 3/4 view, clean 2D game illustration, flat colors, bold clean outline, simple cel shading, strong readable silhouette, subtle orange rim light for visibility on a black UI, transparent background, no white background, no scene background, no text, no UI, no frame, no watermark, 512x512, high quality, consistent character design across the monster set.
```

`07-battle.png`

```text
Create a single monster character asset for a quiz battle game: Trickster Fox, a cheeky orange fox with big expressive eyes, oversized ears, fluffy tail, and a mischievous grin. Show the monster in a dynamic battle pose, springing forward mid-jump with tiny claws out and tail sweeping behind, suitable for either attacking or reacting in combat. Cute cartoon chibi style with soft pastel tones. Single monster character asset, full body, centered composition, front 3/4 view, clean 2D game illustration, flat colors, bold clean outline, simple cel shading, strong readable silhouette, subtle orange rim light for visibility on a black UI, transparent background, no white background, no scene background, no text, no UI, no frame, no watermark, 512x512, high quality, consistent character design across the monster set.
```

---

**Monster 08 — 暗影惡靈 Shadowwraith（暗黑奇幻）**

`08-idle.png`

```text
Create a single monster character asset for a quiz battle game: Shadowwraith, a dark shadowy wraith with glowing red eyes, a tattered cloak, smoky ghost-like body, and eerie floating posture. Show the monster in a haunting idle pose, hovering quietly with a sinister presence and drifting shadow aura. Dark fantasy gothic style. Single monster character asset, full body, centered composition, front 3/4 view, clean 2D game illustration, flat colors, bold clean outline, simple cel shading, strong readable silhouette, subtle red purple rim light for visibility on a black UI, transparent background, no white background, no scene background, no text, no UI, no frame, no watermark, 512x512, high quality, consistent character design across the monster set.
```

`08-battle.png`

```text
Create a single monster character asset for a quiz battle game: Shadowwraith, a dark shadowy wraith with glowing red eyes, a tattered cloak, smoky ghost-like body, and eerie floating posture. Show the monster in a dynamic battle pose, lunging forward with clawed hands outstretched and a dramatic dark aura swirling around it, suitable for either attacking or reacting in combat. Dark fantasy gothic style. Single monster character asset, full body, centered composition, front 3/4 view, clean 2D game illustration, flat colors, bold clean outline, simple cel shading, strong readable silhouette, subtle red purple rim light for visibility on a black UI, transparent background, no white background, no scene background, no text, no UI, no frame, no watermark, 512x512, high quality, consistent character design across the monster set.
```

---

**Monster 09 — 骷髏王 Bone King（暗黑奇幻）**

`09-idle.png`

```text
Create a single monster character asset for a quiz battle game: Bone King, a skeleton king with a cracked crown, glowing eye sockets, bony armor details, and a bone staff. Show the monster in a regal idle pose, standing tall and still, with a dark noble aura and commanding expression. Dark fantasy gothic style. Single monster character asset, full body, centered composition, front 3/4 view, clean 2D game illustration, flat colors, bold clean outline, simple cel shading, strong readable silhouette, subtle violet rim light for visibility on a black UI, transparent background, no white background, no scene background, no text, no UI, no frame, no watermark, 512x512, high quality, consistent character design across the monster set.
```

`09-battle.png`

```text
Create a single monster character asset for a quiz battle game: Bone King, a skeleton king with a cracked crown, glowing eye sockets, bony armor details, and a bone staff. Show the monster in a dynamic battle pose, raising the bone staff and casting a dark purple curse, with skeletal energy and dramatic motion, suitable for either attacking or reacting in combat. Dark fantasy gothic style. Single monster character asset, full body, centered composition, front 3/4 view, clean 2D game illustration, flat colors, bold clean outline, simple cel shading, strong readable silhouette, subtle violet rim light for visibility on a black UI, transparent background, no white background, no scene background, no text, no UI, no frame, no watermark, 512x512, high quality, consistent character design across the monster set.
```

---

**Monster 10 — 深淵蛇妖 Abyssal Serpent（暗黑奇幻）**

`10-idle.png`

```text
Create a single monster character asset for a quiz battle game: Abyssal Serpent, a dark purple serpent monster with multiple glowing eyes, venomous fangs, and a sleek coiled body. Show the monster in a tense idle pose, coiled and waiting, with its head raised and an ominous gaze. Dark fantasy gothic style. Single monster character asset, full body, centered composition, front 3/4 view, clean 2D game illustration, flat colors, bold clean outline, simple cel shading, strong readable silhouette, subtle dark purple rim light for visibility on a black UI, transparent background, no white background, no scene background, no text, no UI, no frame, no watermark, 512x512, high quality, consistent character design across the monster set.
```

`10-battle.png`

```text
Create a single monster character asset for a quiz battle game: Abyssal Serpent, a dark purple serpent monster with multiple glowing eyes, venomous fangs, and a sleek coiled body. Show the monster in a dynamic battle pose, rearing upward with mouth open, venom dripping from its fangs, body twisting aggressively, suitable for either attacking or reacting in combat. Dark fantasy gothic style. Single monster character asset, full body, centered composition, front 3/4 view, clean 2D game illustration, flat colors, bold clean outline, simple cel shading, strong readable silhouette, subtle dark purple rim light for visibility on a black UI, transparent background, no white background, no scene background, no text, no UI, no frame, no watermark, 512x512, high quality, consistent character design across the monster set.
```

---

#### 若工具不支援透明背景：替換尾段

將每個 Prompt 最後 `transparent background, no white background` 替換為：

```text
deep black background, dark game UI friendly, subtle neon rim light around the monster, no white background
```

完整替換後尾段：

```text
single monster character asset, full body, centered composition, front 3/4 view, clean 2D game illustration, flat colors, bold clean outline, simple cel shading, strong readable silhouette, subtle neon rim light around the monster for visibility, deep black background, dark game UI friendly, no white background, no bright plain background, no scene background, no text, no UI, no frame, no watermark, 512x512, high quality, consistent character design across the monster set.
```

#### 後製流程建議

1. 用透明背景版 Prompt 生成 PNG
2. 若背景非真正透明，用去背工具（remove.bg、Photoshop、GIMP）處理
3. 匯入 `src/web/public/images/monsters/`
4. 在黑底 UI 上測試可讀性
5. 若邊緣不明顯，在 CSS 加 `drop-shadow`（顏色參考上方怪獸屬性 Rim Light 表）

</details>

<details>
<summary>## 待確認事項（已全數確認）</summary>

所有開發前決策已於 2026-05-07 確認，詳見下表與「決策紀錄」章節。

### 規則面

| #   | 問題                     | 決策                                                                                   |
| --- | ------------------------ | -------------------------------------------------------------------------------------- |
| 1   | 題數是否固定？怪獸場數？ | 不固定，依各科目題庫 `totalQ` 動態計算；怪獸 10 隻固定，每隻題數為 `ceil(totalQ / 10)` |
| 2   | 每隻怪獸固定打 5 題？    | 否，依 `totalQ` 動態平均分配                                                           |
| 3   | 中途離線是否可續玩？     | MVP 不支援，列為第二階段優化項目                                                       |
| 4   | 答錯是否強制看解析？     | 否，解析為**選看**；「下一題」按鈕不被解析鎖定，閱讀自主權交給玩家                     |
| 5   | 是否允許返回上一題？     | 不允許                                                                                 |
| 6   | 是否顯示法條依據？       | 不顯示；各科目不一定是法律題，不適合預設此欄位                                         |

### 視覺面

| #   | 問題                    | 決策                                                                                                                                             |
| --- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| 7   | 怪獸風格？              | 三種混合：RPG 勇者風（Monster 1–4）+ 可愛卡通（5–7）+ 暗黑奇幻（8–10）                                                                           |
| 8   | 靜態圖 vs 動畫 Sprite？ | MVP 先用**靜態圖（2 張 / 怪獸）+ CSS 動畫**（React + Tailwind 完全支援）；後期升級為 4 張標準版；Sprite 動畫技術上可行但製作成本高，暫不採用     |
| 9   | 玩家頭像？              | CF Access JWT 不包含 Google 頭像 URL（已驗證 `access.ts` 程式碼）；採用 **DiceBear API**（`adventurer` 風格）依 email 生成，無需額外 OAuth scope |

### 獎勵面

| #   | 問題       | 決策                     |
| --- | ---------- | ------------------------ |
| 10  | 積分用途？ | 純展示，保留後期擴充空間 |

### 素材面

| #   | 問題             | 決策                                                                                                                   |
| --- | ---------------- | ---------------------------------------------------------------------------------------------------------------------- |
| 11  | 素材方案？       | 先做**精簡版（20 張 + CSS 動畫）**；React + Tailwind 兩種方案均可實作；後期優化升級為標準版（40 張）                   |
| 12  | 怪獸素材來源？   | AI 生成圖；語法詳見設計章節「十二、AI 圖片生成語法」                                                                   |
| 13  | 資料庫 binding？ | **合併現有 `ACCESS_DB`**（`exam-study-platform-access`）；不新增 binding，避免 `wrangler.jsonc` 異動與新 D1 資料庫建立 |

### 介面規格

| #   | 問題                         | 決策                                                                                                                                                 |
| --- | ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| 14  | 是否支援手機且單畫面不滾動？ | 是，採 **mobile-first** 設計；`h-dvh` 固定高度，Tailwind flex 比例分配各區塊；桌機版置中 `max-w-sm` 卡片；詳見設計章節「十一、RWD 單畫面響應式設計」 |

</details>

<details>
<summary>## 決策紀錄</summary>

| 日期       | 決定                                                              | 原因                                                          |
| ---------- | ----------------------------------------------------------------- | ------------------------------------------------------------- |
| 2026-05-07 | 題數與怪獸場次依科目題庫動態計算，不固定 50 題                    | 不同科目題庫總量不同，固定 50 題無法適用所有科目              |
| 2026-05-07 | 解析改為選看，「下一題」不被鎖定                                  | 把閱讀自主權交給玩家，遊戲節奏不強制停留                      |
| 2026-05-07 | 玩家頭像採 DiceBear API，不使用 Google 頭像                       | CF Access JWT 不含 Google 頭像 URL，已驗證 `access.ts` 程式碼 |
| 2026-05-07 | 怪獸風格：RPG 勇者風（1–4）+ 可愛卡通（5–7）+ 暗黑奇幻（8–10）    | 三種風格並存，豐富視覺層次                                    |
| 2026-05-07 | MVP 先用精簡版素材（20 張 + CSS 動畫），後期升級為標準版（40 張） | React + Tailwind 兩方案均可，先快速上線驗證遊戲感             |
| 2026-05-07 | 資料庫合併現有 `ACCESS_DB`，不新增 binding                        | 避免 `wrangler.jsonc` 異動與新 D1 資料庫建立，降低複雜度      |
| 2026-05-07 | 採用 `h-dvh` + flex 比例佈局，支援 Mobile-first 單畫面不滾動      | 手機優先，桌機置中 `max-w-sm` 卡片，適配 375px 最小螢幕       |
| 2026-05-07 | 採用「10 隻怪獸輪流登場（做法 A）」                               | 關卡感強，比較像真實打王，10 隻都能出場                       |
| 2026-05-07 | 即時失敗判定以「最高可能得分 < 70」為準，血條為輔助視覺           | 邏輯更精確，避免視覺與實際失敗點不一致                        |
| 2026-05-07 | MVP 先不做音效與連擊系統                                          | 降低複雜度，快速驗證遊戲感核心體驗                            |

</details>

<details>
<summary>## 執行進度</summary>

> 進入 active 後填入。

| 里程碑                       | 預計日期 | 狀態        |
| ---------------------------- | -------- | ----------- |
| 提案確認 / 待確認事項拍板    | —        | not-started |
| 怪獸素材交付                 | —        | not-started |
| 資料表 Schema 設計與建立     | —        | not-started |
| 前端怪獸對戰畫面（無後端版） | —        | not-started |
| 後端 API 串接（D1 歷程寫入） | —        | not-started |
| MVP 整合測試與部署           | —        | not-started |

</details>

<details>
<summary>## 結案 / 擱置 / 作廢備註</summary>

> 尚未結案。

</details>
