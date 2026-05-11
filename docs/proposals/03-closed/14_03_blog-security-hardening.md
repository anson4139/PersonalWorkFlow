# Blog 資安補強

> **[AI 規則] 每次修改本文件，必須同時執行以下兩個動作，否則視為不完整的更新：**
>
> 1. **在本文件的「異動記錄」表格最上方新增一筆記錄（日期 / 版本 / 更新人 / 變更說明）**
> 2. **在 `projects/README.md` 的「提案異動歷程」表格最上方同步新增一筆記錄（日期 / 提案 / 對應專案 / 異動摘要）**

| 項目     | 內容                                  |
| -------- | ------------------------------------- |
| 狀態     | `closed`                              |
| 建立日期 | 2026-05-11                            |
| 最後更新 | 2026-05-11（v0.2）                    |
| 對應專案 | `projects/03-personal-blog-platform/` |
| 生產網址 | `https://blog.buclaw.org`             |

---

<details>
<summary>## 異動記錄</summary>

| 日期       | 版本 | 更新人     | 變更說明                                                                                                                                   |
| ---------- | ---- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| 2026-05-11 | v0.2 | Anson + AI | 完成全部修法：BUG-1 移除 X-Dev-Admin bypass、BUG-2 DOMPurify sanitize、BUG-3 移除 SVG + MIME 白名單驗證；build + deploy 至 blog.buclaw.org |
| 2026-05-11 | v0.1 | Anson + AI | 建立提案初稿；診斷三個資安漏洞並規劃補強實作方案                                                                                           |

</details>

---

<details>
<summary>## 一、漏洞診斷</summary>

> 以下為程式碼審查後確認存在的問題，按嚴重性排序。

### 🔴 高風險

#### BUG-1：X-Dev-Admin 開發 Bypass 殘留正式環境

- **位置**：`functions/api/admin/_auth.ts` 第 12 行
- **問題**：任何人只要在請求 Header 加上 `X-Dev-Admin: true`，就可完全繞過 Google OAuth，直接取得 `super_admin` 身份，存取所有後台 API。
- **程式碼**：
    ```typescript
    // 第 12 行（開發期 bypass，正式環境未移除）
    if (request.headers.get("X-Dev-Admin") === "true") return SUPER_ADMIN_EMAIL;
    ```
- **OWASP**：A07:2021 – Identification and Authentication Failures

#### BUG-2：文章內容未 Sanitize 直接 render HTML（XSS）

- **位置**：`src/pages/PostPage.tsx` 第 289 行、`src/pages/admin/AiGeneratePage.tsx` 第 469 行
- **問題**：文章 HTML 內容未經過任何過濾直接注入 DOM。若 DB 遭入侵或 AI 生文回傳惡意內容，攻擊者可在每篇文章植入 `<script>` 標籤，所有讀者打開文章都中招（Stored XSS）。
- **程式碼**：
    ```tsx
    dangerouslySetInnerHTML={{ __html: post.content }}  // 未 sanitize
    ```
- **OWASP**：A03:2021 – Injection（XSS）

---

### 🟡 中風險

#### BUG-3：圖片上傳允許 SVG，且僅驗副檔名未驗 MIME

- **位置**：`functions/api/admin/upload.ts` 第 31–35 行
- **問題一**：副檔名由客戶端自行聲稱，可偽造（`evil.html` 改名 `evil.jpg` 即可繞過）。
- **問題二**：SVG 允許內嵌 `<script>` 標籤，上傳後透過 `/images/` proxy 提供，可觸發 XSS。
- **程式碼**：
    ```typescript
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
    const allowed = ["jpg", "jpeg", "png", "gif", "webp", "svg"]; // SVG 危險
    // contentType 直接使用 file.type（客戶端可偽造）
    await env.BLOG_IMAGES.put(key, buffer, {
        httpMetadata: { contentType: file.type },
    });
    ```
- **OWASP**：A03:2021 – Injection；A04:2021 – Insecure Design

---

### 🟢 低風險（知道就好）

#### INFO-1：缺少 Content-Security-Policy Header

- CF Pages 預設不加 CSP，搭配 BUG-2 擴大 XSS 可利用面積。

#### INFO-2：`Cf-Access-Authenticated-User-Email` Header 無額外驗簽

- 若直接打 Worker URL（非透過 CF Pages Edge）可偽造此 Header。正常使用者不會遇到，屬邊界風險。

</details>

---

<details>
<summary>## 二、補強方案</summary>

### FIX-1：移除 X-Dev-Admin Bypass（對應 BUG-1）

**修改檔案**：`functions/api/admin/_auth.ts`

直接刪除第 12 行：

```typescript
// 刪除這一行
if (request.headers.get("X-Dev-Admin") === "true") return SUPER_ADMIN_EMAIL;
```

本機開發改用現有的 `ADMIN_SECRET` bypass（第 4 條路徑），於 `.dev.vars` 設定即可，不影響正式環境。

---

### FIX-2：加入 DOMPurify sanitize（對應 BUG-2）

**安裝套件**：

```bash
npm install dompurify
npm install --save-dev @types/dompurify
```

**修改 `PostPage.tsx`**：

```tsx
import DOMPurify from 'dompurify';
// ...
dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content) }}
```

**修改 `AiGeneratePage.tsx`**（AI 生文預覽）：

```tsx
import DOMPurify from 'dompurify';
// ...
dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(result.content_html) }}
```

---

### FIX-3：移除 SVG + 驗 MIME Content-Type（對應 BUG-3）

**修改 `functions/api/admin/upload.ts`**：

```typescript
// 1. 移除 svg，縮小攻擊面
const allowed = ["jpg", "jpeg", "png", "gif", "webp"];

// 2. 驗 MIME（從 file.type 對照允許清單，不信任副檔名）
const allowedMime = ["image/jpeg", "image/png", "image/gif", "image/webp"];
if (!allowedMime.includes(file.type)) {
    return json({ error: "File type not allowed" }, 400);
}

// 3. 存入 R2 時強制覆寫 contentType（不信任客戶端傳入的值）
await env.BLOG_IMAGES.put(key, buffer, {
    httpMetadata: { contentType: file.type }, // 已在上方驗證為合法 MIME
});
```

> **注意**：`file.type` 仍來自客戶端，更嚴格的做法是讀取 Magic Bytes（檔案前幾個 byte）驗實際格式。本提案以白名單 MIME + 移除 SVG 為最小有效防禦，個人站風險可接受。

</details>

---

<details>
<summary>## 三、缺口追蹤</summary>

| #   | 缺口項目                          | 優先 | 狀態 | 說明                                            |
| --- | --------------------------------- | ---- | ---- | ----------------------------------------------- |
| ➀   | 移除 `X-Dev-Admin` bypass         | 🔴高 | ❌   | `_auth.ts` 刪第 12 行                           |
| ➁   | `PostPage.tsx` 加 DOMPurify       | 🔴高 | ❌   | `npm install dompurify` + 包 sanitize           |
| ➂   | `AiGeneratePage.tsx` 加 DOMPurify | 🔴高 | ❌   | 同上，AI 生文預覽也需保護                       |
| ➃   | `upload.ts` 移除 SVG + 驗 MIME    | 🟡中 | ❌   | allowed 清單移除 svg；加 allowedMime 白名單驗證 |
| ➄   | rebuild + deploy                  | —    | ❌   | `npm run build && npm run cf:deploy`            |

</details>
