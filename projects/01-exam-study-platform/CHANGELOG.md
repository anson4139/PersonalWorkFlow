# Changelog — exam-study-platform

## [Unreleased]

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
