# v2 Proposal Screenshot Assets

此目錄用於存放 `04-v2-exam-study-platform.md` 的畫面截圖資產。

目前狀態：
- 本次 v2 結案文件不嵌入截圖。
- 若未來需要補圖，再依下列檔名放入本目錄即可。

建議檔名：
- `admin-access-list.png`：權限管理頁總覽
- `admin-access-edit-finance-only.png`：編輯 finance-only 使用者授權
- `admin-access-create-form.png`：新增授權表單空白狀態

建議原則：
- 以 `png` 為主，避免失真
- 寬度控制在 1400px 以內，減少 repo 體積
- 同一批截圖維持一致視窗寬度與深色主題
- 僅存放文件用靜態截圖，不需放入資料庫

若未來需要在網站中上傳或顯示大量圖片，再考慮改放 Cloudflare R2；目前提案/README 類型文件截圖，直接跟版本一起放在 repo 最適合。
