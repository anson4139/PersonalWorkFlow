# 履歷網站 — 論文展示功能

> **[AI 規則] 每次修改本文件，必須同時執行以下兩個動作，否則視為不完整的更新：**
>
> 1. **在本文件的「異動記錄」表格最上方新增一筆記錄（日期 / 版本 / 更新人 / 變更說明）**
> 2. **在 `projects/README.md` 的「提案異動歷程」表格最上方同步新增一筆記錄（日期 / 提案 / 對應專案 / 異動摘要）**

| 項目     | 內容                                   |
| -------- | -------------------------------------- |
| 狀態     | `closed`                               |
| 建立日期 | 2026-05-07                             |
| 最後更新 | 2026-05-07                             |
| 結案日期 | 2026-05-07                             |
| 對應專案 | `projects/02-personal-resume-website/` |

---

<details>
<summary>## 異動記錄</summary>

| 日期       | 版本 | 更新人 | 變更說明                                                                                                                 |
| ---------- | ---- | ------ | ------------------------------------------------------------------------------------------------------------------------ |
| 2026-05-07 | v0.2 | Anson  | 方案 B 實作完成：論文卡片加全寬綠色按鈕、PDF Lightbox（iframe 嵌入 + iOS 降級開新分頁）、thesis-v2.pdf 加入 data/thesis/ |
| 2026-05-07 | v0.1 | Anson  | 建立提案初稿                                                                                                             |

</details>

---

<details>
<summary>## 目標</summary>

在現有個人履歷網站（https://resume.buclaw.org）的論文專案卡片上，加入論文 PDF 的可視化展示，讓面試官或合作對象可以在履歷頁面直接瀏覽或下載論文，強化學術研究能力的可信度與展示深度。

**預期效益：**

- 讓面試官一鍵看到論文全文，不需另外搜尋
- 展示 AI / 量化交易研究深度，提升履歷說服力
- PDF 隨網站部署，長期可用、不依賴第三方連結

</details>

---

<details>
<summary>## 範疇</summary>

**包含（三個方案，擇一或漸進實作）：**

### 方案 A — 下載連結（MVP）

- 論文 PDF 放入 `projects/02-personal-resume-website/data/thesis/`
- 在「兩階段股票交易最佳化架構」Project Card 上新增「↗ 查看論文」按鈕
- 按鈕開新分頁顯示 PDF（`target="_blank"`）
- 估計工時：0.5 hr

### 方案 B — Lightbox PDF Viewer（推薦）

- 承方案 A，額外加入 lightbox Modal
- 點擊卡片或按鈕 → 全螢幕遮罩，內嵌 `<iframe>` PDF 檢視器
- 右上角關閉按鈕（或點遮罩關閉）
- 行動裝置自動降級為「下載開啟」（iframe 在 iOS Safari 支援有限）
- 估計工時：2 hr

### 方案 C — 獨立論文展示頁（進階）

- 新增 `/thesis.html`，含：
    - 論文標題、摘要（中英文）
    - 核心成果數字（累積報酬 600%、Sharpe Ratio +22.8 等）
    - 全頁 PDF 嵌入 viewer
    - 下載按鈕
- 在 Project Card 加「↗ 論文詳情」連結
- 估計工時：4~6 hr

**排除：**

- 論文投影片（PPT/PPTX）轉換（第一版只做 PDF）
- 後端 PDF 處理
- 多份文件管理（只有一份論文 PDF）

</details>

---

<details>
<summary>## 系統開發規格</summary>

### 前端

| 項目          | 內容                                                      |
| ------------- | --------------------------------------------------------- |
| 框架 / 技術棧 | 純 HTML / CSS / Vanilla JS（延續現有架構）                |
| 語言          | HTML5、CSS3、ES6+                                         |
| 主要套件      | 無（不引入額外套件）                                      |
| PDF Viewer    | 瀏覽器內建 `<iframe src="data/thesis/thesis.pdf">`        |
| 特殊規格      | iOS Safari 降級處理（`<object>` fallback or direct link） |

### 資料 / 靜態資源

| 項目     | 內容                                                                           |
| -------- | ------------------------------------------------------------------------------ |
| PDF 位置 | `projects/02-personal-resume-website/data/thesis/thesis.pdf`                   |
| 原始檔案 | `D:\Anson\PersonalWorkFlow\113論文_對比學習與知識蒸餾_113453003_V2_江哲緯.pdf` |
| 部署路徑 | `https://resume.buclaw.org/data/thesis/thesis.pdf`                             |
| 注意     | PDF 約 5~20MB，Cloudflare Pages 單檔限制 25MB，需確認檔案大小                  |

### 環境設定

| 項目     | 內容                                    |
| -------- | --------------------------------------- |
| Hosting  | Cloudflare Pages（現有）                |
| 部署方式 | Push to GitHub → 自動部署（現有 CI/CD） |
| Git Repo | https://github.com/anson4139/resume     |

</details>

---

<details>
<summary>## 待決策事項</summary>

在進入實作前，需確認以下決策：

| #   | 問題          | 選項                                     | 預設建議                                     |
| --- | ------------- | ---------------------------------------- | -------------------------------------------- |
| D1  | 實作方案選擇  | A / B / C                                | **B（Lightbox）** — 最佳使用者體驗，工時合理 |
| D2  | PDF 檔名      | 保留原文/重新命名                        | 重新命名為 `thesis-v2.pdf`（避免中文路徑）   |
| D3  | 行動裝置降級  | 直接下載 / Google Docs Viewer            | **直接下載**（不依賴外部服務）               |
| D4  | 卡片 CTA 文字 | 「查看論文」/ 「下載論文」/ 「論文詳情」 | **「查看論文 ↗」**                           |

</details>

---

<details>
<summary>## 驗收條件</summary>

| #   | 條件                                                                           |
| --- | ------------------------------------------------------------------------------ |
| AC1 | 桌機：點擊「查看論文」可成功開啟/顯示 PDF                                      |
| AC2 | 行動裝置：點擊後可下載或在系統 PDF 閱讀器開啟                                  |
| AC3 | PDF 路徑正確，部署後 `https://resume.buclaw.org/data/thesis/thesis.pdf` 可存取 |
| AC4 | 不影響現有 index.html 其他區塊的功能與樣式                                     |

</details>
