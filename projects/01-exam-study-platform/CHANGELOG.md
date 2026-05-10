# Changelog — exam-study-platform

## [Unreleased]

### Added

- `pdf_convert_all.py` 新增 `IMAGE_EXTRACTED_ANSWERS` 字典：手動辨識 106 Q3/Q4、107 Q1-Q4、108 Q1-Q4、109 Q1/Q2 共 22 組圖片嵌入答案（各 50 題），套用至 `parse_a_class_file`，所有 A class session 答案缺漏降至 0
- `useViewer.ts` 新增 `sessionFailed` 狀態：當正式站 `/api/session` 回傳 null email 或 non-200 時標記失效
- `Home.tsx` 新增「登入 session 已失效 / 重新登入」提示，點擊導向 CF Access logout 並重新驗證
- `pdf_convert_all.py` 重新解析 105~115 年全量題庫，新版源自 `drive-download-20260509T110258Z-3-001`

### Fixed

- `pdf_convert_all.py` 修正 `parse_options_sequential()` fallback 策略：當選項間無空格分隔（如 `成交量過度異常者(D)選項`）時，改用自由模式尋找下一選項邊界；徹底解決 A/B 選項空白問題，全年份正式科目空白選項降至 0
- `pdf_convert_all.py` 新增 `ANSWER_JUNGEIFEN_RE`：識別「均給分」特殊答案；修正 109 Q3 法規第 9 題無法被擷取的問題
- `pdf_convert_all.py` 修正 `OPTION_RE` 選項解析 bug（改用 `parse_options_sequential()`）：選項內含括號引用（如「選項(A)(B)(C)皆非」）時誤截斷，修復約 500 題選項文字；正式科目空白選項 509 → 0
- `QUESTION_START_RE` 修正：題目解析允許句點後無空格（如 `1.影響金融市場...`），修正 109 Q4 財分 0 題 regression

### Added

- 新增 `113電子商務財務管理(期中考)` 題庫匯入流程與目標 JSON 檔命名
- 新增依登入 email 顯示題庫分類的前端身份辨識流程
- 新增 Cloudflare Pages Functions 的 session API 與題庫 JSON 路徑保護
- 新增 Cloudflare Pages `wrangler` 設定與 sitemap/robots 網域檔案
- 新增 v2 題庫權限管理骨架：D1 授權資料表、`/api/admin/access` 管理 API、`/admin/access` 管理頁
- 新增 D1 遠端授權資料與一般使用者測試帳號，支援依使用者授權顯示不同題庫
- 新增測試模式 MVP（作答、送卷計分、續測草稿、重測）並與既有單題/10題模式整合
- 新增 `src/scripts/pdf_poc_110.py`：110 年單年度 PDF 轉檔 PoC，可輸出法規/財務兩科 JSON 題庫
- 新增 110 年 PoC 題庫輸出：`securities-broker-law-110-poc.json`、`securities-broker-finance-110-poc.json`
- 新增 `src/scripts/pdf_convert_all.py`：全量 PDF 轉 JSON（105~115 年，支援 A/B 兩類命名族群）
- 新增 `src/scripts/explain_gen.py`：LLM 自動補齊 explanation 欄位（OpenAI gpt-4o-mini，支援續跑/dry-run）
- 新增 `src/scripts/.env.example`：API key 設定範本
- 新增證券商業務員（初業）110~115 年題庫 JSON（法規/財務各 6 份）並接入前端可選科目清單
- `types.ts` 新增 `securities-broker` 考試分類與 12 個新科目 key
- 新增證券商業務員（初業）110~115 題庫解析內容並完成正式站資料同步

### Changed

- 首頁導覽由平面科目列表改為考試分類 -> 科目兩層結構
- 正式站 metadata 與部署腳本改為對應 `https://exam.buclaw.org/`
- Cloudflare Access 身份解析改為透過 `CF_Authorization` cookie 取得使用者 identity，修正正式站登入後仍顯示一般權限的問題
- session API 與題庫路徑保護由 `isPrivileged` 布林模型改為 `allowedSubjects` 授權模型
- 完成 v2 權限管理正式部署與結案收尾，正式站改由 D1 授權模型提供管理者與一般使用者題庫可見性
- 正式站新增一位一般使用者之證券商業務員（初業）110~115 題庫授權
- V3 題庫納管、測試模式、解析補齊與正式站部署完成，可依本次提案結案

## [2026-04-29]

### Changed

- 標題標籤由 `Study Platform` 改為 `Anson's Study Platform`
- 頁面 `<title>` 由 `web` 改為 `Anson's Study Platform`
- 部署至 `exam.buclaw.org`（Cloudflare Pages）

### Added

- 專案骨架建立（src/web, src/scripts, data, specs, tests）
