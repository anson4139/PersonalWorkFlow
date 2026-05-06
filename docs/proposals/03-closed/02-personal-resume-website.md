# 個人履歷網站

| 項目 | 內容 |
|---|---|
| 狀態 | `closed` |
| 建立日期 | 2026-04-30 |
| 結案日期 | 2026-04-30 |
| 對應專案 | `projects/02-personal-resume-website/` |
| **線上網址** | https://resume.buclaw.org |
| **GitHub Repo** | https://github.com/anson4139/resume |
| **Hosting** | Cloudflare Pages |
| **主要檔案** | `projects/02-personal-resume-website/index.html` |

---

<details>
<summary>## 目標</summary>

建立一個個人履歷展示網站，以 NVIDIA 風格（暗色系、科技感）呈現 PM / AI 應用規劃師 / 系統分析師 / 資深後端工程師的專業形象，提升個人品牌，作為求職、接案、合作邀約的第一張名片。

**預期效益：**
- 讓面試官或合作對象在 3 分鐘內掌握核心亮點
- 展示技術深度與跨域能力（PM + AI + 後端）
- 可長期維護、持續更新

</details>

<details>
<summary>## 範疇</summary>

**包含：**
- 靜態個人履歷網站（Single Page Application，可選多頁）
- 以下核心區塊：
  - Hero 首頁（姓名、職稱、Tagline、CTA）
  - About（個人簡介、核心價值觀）
  - Skills（技術能力分類展示）
  - Experience（工作經歷時間軸）
  - Projects（精選專案卡片）
  - Contact（聯絡方式）
- NVIDIA 風格視覺設計（暗色主題、NVIDIA 綠 #76B900 為主色調）
- **Mobile-First 設計**（主要瀏覽裝置為手機，版型以手機為優先）
  - 單欄垂直滑動佈局
  - 大字體、大點擊區域（min 44px touch target）
  - 底部固定聯絡按鈕（CTA）
  - 避免 hover-only 互動，改用 tap 友善設計
- 響應式向上延伸（Tablet / Desktop 為加分項，不是主軸）
- 基礎動畫效果（scroll-in，手機效能友善，不做重動畫）

**排除：**
- 後端 API / 資料庫（純靜態）
- CMS 管理後台
- 多語系切換（第一版只做繁中，英文版列為後續）
- 求職申請表單後端串接

</details>

<details>
<summary>## 設計</summary>

### 視覺風格參考
- 主色：`#000000` / `#0a0a0a`（背景深黑）
- 強調色：`#76B900`（NVIDIA 綠）
- 文字：`#FFFFFF` / `#CCCCCC`
- 字體：Barlow / Inter（無襯線，現代科技感）
- 風格元素：細線條分隔、Grid 排版、微光效果、動態 Tagline

### 技術選型
| 項目 | 選擇 | 原因 |
|---|---|---|
| 框架 | **純 HTML / CSS / JS**（Single File） | 手機瀏覽最快載入，無需 build，可直接開啟 |
| 樣式 | CSS 自訂（搭配 CSS Variables） | 控制 Mobile-First breakpoint，無框架依賴 |
| 動畫 | CSS Intersection Observer + transition | 輕量，手機效能優先 |
| 部署 | GitHub Pages / Vercel | 免費、快速、支援自訂 domain |

> Mobile-First 優先採用純 HTML 方案，載入速度快、部署零門檻，手機無需等待 JS bundle。

### 頁面架構（SPA）
```
/
├── Hero Section        ← 全螢幕 dark background + NVIDIA 綠漸層 Tagline
├── About Section       ← 個人簡介 + 照片（可選）
├── Skills Section      ← 分類技能 Badge 或 Progress Bar
├── Experience Section  ← 時間軸（工作經歷、職稱演進）
├── Projects Section    ← 精選專案卡片 Grid
└── Contact Section     ← Email / LinkedIn / GitHub
```

### 待確認資料（需使用者提供）
- [ ] 真實姓名 / 英文名 / Tagline 文案
- [ ] 個人簡介段落（2-3 句）
- [ ] 技能清單（分類）
- [ ] 工作經歷（公司、職稱、年份、亮點成就）
- [ ] 精選專案（名稱、描述、技術、連結）
- [ ] 聯絡方式（email、LinkedIn、GitHub 等）
- [ ] 個人照片（可選）

</details>

<details>
<summary>## 決策紀錄</summary>

| 日期 | 決定 | 原因 |
|---|---|---|
| 2026-04-30 | 採用 NVIDIA 風格暗色主題 | 使用者偏好，符合科技/AI 領域定位 |
| 2026-04-30 | 第一版純靜態，不含後端 | 快速交付，降低維護成本 |
| 2026-04-30 | 採用純 HTML 單檔方案（非 React） | 手機載入最快，零 build 依賴 |
| 2026-04-30 | Hosting 選用 Cloudflare Pages | 已有 buclaw.org 在 Cloudflare，DNS 自動設定 |

</details>

<details>
<summary>## 執行進度</summary>

| 里程碑 | 日期 | 狀態 |
|---|---|---|
| 提案確認 | 2026-04-30 | ✅ 完成 |
| 使用者資料收集完畢 | 2026-04-30 | ✅ 完成 |
| 視覺原型（Hero + About） | 2026-04-30 | ✅ 完成 |
| 完整網站開發 | 2026-04-30 | ✅ 完成 |
| 部署上線 | 2026-04-30 | ✅ 完成 — https://resume.buclaw.org |

</details>

<details>
<summary>## 部署說明（Cloudflare Pages）</summary>

### 後續更新方式

在本機改完 `index.html` 後，執行以下指令，Cloudflare 會自動同步：

```powershell
cd "D:\Anson\PersonalWorkFlow\projects\02-personal-resume-website"
git add index.html
git commit -m "fix(resume): 說明改了什麼"
git push
```

push 完 Cloudflare Pages 約 **30 秒** 自動重新部署，https://resume.buclaw.org 即更新。

> 若同時有新增圖片（如新證書），改用 `git add .` 取代 `git add index.html`。

### 安全設定

`_headers` 已設定：`X-Frame-Options: DENY`、`X-Content-Type-Options: nosniff`、`Referrer-Policy`、`Permissions-Policy`

### .gitignore

`data/profile/*.pdf` — 原始個人 PDF 不推上 repo，僅圖片上線。

</details>

<details>
<summary>## 字體設計系統</summary>

### 字型家族

| 用途 | 字型 |
|---|---|
| 大標題 / 導覽 / 區塊標題 | `Barlow Condensed` (Google Fonts) |
| 內文 / 段落 | `Barlow` (Google Fonts) |
| 程式碼 / 指標 / badge | `JetBrains Mono` (Google Fonts) |

### CSS Class 字體大小對照表

| CSS Class | 用途 | font-size |
|---|---|---|
| `.nav-logo` | 頂部 ANSON. LOGO | `1.75rem` |
| `.nav-links a` | 導覽連結 | `1.25rem` |
| `.nav-cta` | 聯繫我按鈕 | `1.25rem` |
| `.hero-name` | Hero 中文姓名 | `clamp(3.4rem, 17vw, 8.5rem)` |
| `.hero-name-en` | Hero 英文姓名 | `clamp(1.9rem, 9.5vw, 5rem)` |
| `.hero-tagline` | Hero 副標語 | `clamp(0.78rem, 2.8vw, 0.92rem)` |
| `.sec-title` | 各區塊大標 | `clamp(2rem, 9vw, 3.6rem)` |
| `.stat-n` | About 統計數字 | `clamp(1.7rem, 5.5vw, 2.4rem)` |
| `.about-bio` | About 自我介紹段落 | `1.38rem` |
| `.about-current-body` | About 目前狀態方塊 | `1.23rem` |
| `.skill-label` | 技能分類標題 | `1.17rem` |
| `.tag` | 技能 badge | `0.96rem` |
| `.tl-date` | 工作經歷日期 | `0.96rem` |
| `.tl-role` | 工作職稱 | `1.20rem` |
| `.tl-co` | 公司名稱 | `1.20rem` |
| `.tl-list li` | 工作內容條列 | `1.23rem` |
| `.tl-list .m` | 綠色指標數字 | `0.76rem` |
| `.proj-name` | 專案卡片標題 | `1.35rem` |
| `.proj-metric` | 專案綠色指標列 | `0.99rem` |
| `.proj-desc` | 專案描述 | `1.23rem` |
| `.contact-sub` | 聯繫區副標語 | `1.35rem` |
| `.contact-link` | 聯繫連結 | `1.23rem` |

</details>

<details>
<summary>## 色彩系統</summary>

| CSS 變數 | 色值 | 用途 |
|---|---|---|
| `--bg` | `#080808` | 主背景 |
| `--surface` | `#0f0f0f` | 次背景 |
| `--green` | `#76B900` | NVIDIA 主色 / 強調色 |
| `--green-dim` | `rgba(118,185,0,0.10)` | 綠色背景 |
| `--green-border` | `rgba(118,185,0,0.35)` | 綠色邊框 |
| `--text` | `#f0f0f0` | 主要文字 |
| `--text-dim` | `rgba(240,240,240,0.72)` | 次要文字 |
| `--text-muted` | `rgba(240,240,240,0.38)` | 低對比文字 |

</details>

<details>
<summary>## 內容資料</summary>

### 個人資料
- **姓名**：江哲緯 / Anson Chiang
- **Email**：anson4139@gmail.com
- **電話**：0923-147-703
- **GitHub**：https://github.com/anson4139
- **Facebook**：https://www.facebook.com/anson4139/

### 統計數字
| 數字 | 說明 |
|---|---|
| 13+ | 年工作經驗 |
| 9 | 橫跨產業 / 企業 |
| 7+ | 主要交付專案 |

### 技能分類
| 分類 | Tags |
|---|---|
| 專案管理 PM | Scrum, WBS, KPI 報告, Release Mgr |
| 系統分析 SA | Use Case, ERD / DFD, SRS 文件, API 規格, UAT |
| 後端開發 | .NET Core, .NET 6/7/8, ASP.NET C#, EF Core, RESTful API, IIS |
| 資料庫 | SQL Server, Azure SQL, Oracle DB, SQL 最佳化 |
| AI / ML 應用 | Python, Machine Learning, 策略回測, 特徵工程, ML PoC, IoT |
| 平台 / 工具 | Azure, GCP, GitHub Actions, Docker, Jira, Copilot |
| 證照 / 認證 | AI 應用規劃師, 恒逸 ASP.NET MVC 開發實務, GPT / ChatGPT 開發實戰 |

### 工作經歷
| 期間 | 公司 | 職稱 |
|---|---|---|
| 2022/09 — 至今 | 中信資融股份有限公司 | 系統分析師 |
| 2022/02 — 2022/09 | 智誠科技 | 系統分析師 |
| 2019/07 — 2022/02 | 訊聯生物科技 | 專員 |
| 2018/08 — 2019/07 | 智擎數位有限公司 | 程式設計師 |
| 2017/08 — 2018/08 | 三商家購（美廉社） | MIS |
| 2016/06 — 2017/06 | 鑫科技 | 業務副理 |
| 2013/08 — 2016/05 | 數位峰科技股份有限公司 | SA / 開發 |
| 2012/10 — 2013/08 | 明源物聯（錸德） | — |
| 2011/11 — 2012/10 | 皇旺科技 | — |

### 專案
| 專案 | 指標 |
|---|---|
| AS400 → 車貸 API Hub | 貸款時間 -67% \| 工時 -40% \| 差異率 -50% |
| 中台授權日誌監控平台 | 工期 -30% \| 問題解決 -40% |
| 服務排程平台最佳化 | 4h → 30min (+87.5%) |
| TPMI 醫療整合平台 | 已上線供林口長庚、台中榮總等機構使用 |
| 兩階段股票交易最佳化架構 | 碩士論文 |
| PersonalWorkFlow | 開源 · 類 IDE 開發框架 |
| EIP+HR 整合系統 | — |

### 學歷
| 學位 | 學校 | 期間 |
|---|---|---|
| 碩士（在職） | 國立中央大學 資訊管理系所 | 2024/09 — 2026/06 |
| 學士 | 國立政治大學 資訊管理系 | 2006/09 — 2012/06 |
| 專科 | 僑光科技大學 資管專科 | 2000/09 — 2006/09 |

### 證書 / 圖檔
| 檔案 | 說明 |
|---|---|
| `data/profile/S__30408962.jpg` | 個人照片 |
| `data/profile/1769322929446.jpg` | AI 應用規劃師證書（經濟部 2025/12） |
| `data/profile/S__5710205.jpg` | 僑光技術學院畢業專題競賽第一名獎狀 |
| `data/profile/1777547214484.jpg` | 恒逸 ASP.NET MVC 修業證明 |
| `data/profile/1777547232549.jpg` | GPT / ChatGPT 開發實戰修業證明 |

</details>

<details>
<summary>## 結案 / 擱置 / 作廢備註</summary>

> 尚未結案。

</details>
