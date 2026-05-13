# 統一身份驗證與權限設計文件

版本：v0.1（草稿）｜日期：2026-05-10

---

## 1. 現狀分析

### 1.1 考題學習平台（P1）

```
CF Access（Google OAuth）
  → JWT Cookie / Header
  → getAccessIdentity()   ← 解析 email
  → resolveViewerAccess() ← 查 D1 ACCESS_DB.user_access
  → { isAdmin, allowedSubjects[] }
```

**現有 DB Schema：**

```sql
-- ACCESS_DB（D1）
user_access (
  email           TEXT PRIMARY KEY,
  is_admin        INTEGER,        -- 0 / 1
  allowed_subjects TEXT,          -- JSON array, e.g. ["exam-a","exam-b"]
  note            TEXT,
  updated_at      TEXT
)
```

**問題：**

- 只有「個體」維度，無群組 / 角色概念
- 每個用戶都要單獨設定 allowed_subjects
- 管理介面散落在考題平台的 `/admin/access`

---

### 1.2 部落格後台（P3）

```
X-Admin-Secret header（hardcoded）
  OR
Cf-Access-Authenticated-User-Email header（CF Access）
```

**問題：**

- 沒有前端登入 UI，靠 CF Access 攔截或 secret header
- 無角色 / 細粒度權限（admin 就是全開）
- Google OAuth 依賴 CF Access 設定，前端不知道登入狀態

---

### 1.3 共同問題

| 缺口                    | 說明                                       |
| ----------------------- | ------------------------------------------ |
| 無前端登入 UI           | 兩平台都靠 CF Access redirect，非 SPA 友善 |
| 無群組 / 角色           | 每人單獨設定，100 人就要設定 100 次        |
| 權限分散管理            | P1 管考題存取，P3 管 admin；沒有統一入口   |
| Cross-platform 無法共享 | P1 的 admin 不知道 P3 的 admin             |

---

## 2. 目標

1. **Google OAuth 登入 UI**：兩個平台都有明確的登入頁，而非靠 CF Access redirect
2. **群組（Role）+ 個體（User）雙維度權限**
3. **統一權限管理入口**：在 P3 部落格後台統一管理所有平台的權限
4. **向下相容**：P1 現有 `user_access` 邏輯不 breaking change

---

## 3. 架構方案比較

### 方案 A：各自為政（現狀微改）

```
P1 ACCESS_DB  ←──→  P1 admin
P3 (secret)   ←──→  P3 admin
```

- ✅ 改動最小
- ❌ 兩套權限系統，管理成本高
- ❌ 沒有群組概念

---

### 方案 B：共享 D1 資料庫

```
SHARED_AUTH_DB（D1，同一個資料庫）
     ↑                    ↑
P1 binding            P3 binding
（wrangler.jsonc）    （wrangler.jsonc）
```

兩個專案都 bind 同一個 D1，schema 統一設計。

- ✅ 真正的單一來源（Single Source of Truth）
- ✅ P3 後台成為統一管理入口
- ⚠️ Schema 異動要兩邊同步 migration

---

### 方案 C：P3 做權限 API，P1 遠端查詢

```
P3 /api/auth/permissions?email=xxx
          ↑
P1 Functions 在每次請求時 fetch
```

- ✅ 邏輯完全集中在 P3
- ❌ 增加 latency（每次跨域 fetch）
- ❌ P1 依賴 P3 可用性

---

### 結論：推薦方案 B（共享 D1）

CF D1 支援多個 Pages/Workers bind 同一個資料庫，最簡單且無 latency 問題。

---

## 4. 統一 DB Schema 設計

```sql
-- ============================================
-- SHARED_AUTH_DB（替代 / 延伸 P1 ACCESS_DB）
-- ============================================

-- 用戶基本資料（首次 OAuth 登入自動建立）
CREATE TABLE IF NOT EXISTS users (
  email        TEXT PRIMARY KEY,
  display_name TEXT,
  avatar_url   TEXT,
  created_at   TEXT DEFAULT (datetime('now')),
  last_login   TEXT
);

-- 群組（Role）
CREATE TABLE IF NOT EXISTS groups (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT UNIQUE NOT NULL,        -- e.g. "premium", "team-member"
  description TEXT,
  created_at  TEXT DEFAULT (datetime('now'))
);

-- 群組的資源權限
CREATE TABLE IF NOT EXISTS group_permissions (
  group_id    INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  resource    TEXT NOT NULL,   -- e.g. "exam:sa", "exam:pm", "blog:admin"
  PRIMARY KEY (group_id, resource)
);

-- 用戶 ↔ 群組
CREATE TABLE IF NOT EXISTS user_groups (
  email     TEXT NOT NULL,
  group_id  INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  added_at  TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (email, group_id)
);

-- 個體覆寫（override）
CREATE TABLE IF NOT EXISTS user_permissions (
  email        TEXT NOT NULL,
  resource     TEXT NOT NULL,  -- e.g. "exam:sa", "blog:admin"
  granted      INTEGER NOT NULL DEFAULT 1,  -- 1=允許, 0=明確拒絕
  note         TEXT,
  updated_at   TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (email, resource)
);
```

**資源命名規則：**

| resource         | 說明           |
| ---------------- | -------------- |
| `exam:sa`        | 考題：系統分析 |
| `exam:pm`        | 考題：專案管理 |
| `exam:*`         | 考題：所有科目 |
| `blog:admin`     | 部落格後台     |
| `blog:*`         | 部落格所有功能 |
| `platform:admin` | 全平台超管     |

---

## 5. 權限解析邏輯

```
resolvePermissions(email, resource):
  1. 查 user_permissions WHERE email AND resource AND granted=0 → 明確拒絕 → DENY
  2. 查 user_permissions WHERE email AND resource AND granted=1 → 個體允許 → ALLOW
  3. 查 user_groups JOIN group_permissions WHERE email AND resource → 群組允許 → ALLOW
  4. 查 users WHERE email = platform:admin → 超管 → ALLOW
  5. → 預設拒絕 DENY
```

**優先順序：個體拒絕 > 個體允許 > 群組允許 > 超管 > 拒絕**

---

## 6. 前端登入 UI 方案

### 6.1 CF Access 仍是 OAuth 提供者

CF Access 已設定 Google OAuth，無需自己實作 OAuth flow。
前端只需要：

```tsx
// 未登入時顯示登入按鈕
<a href="https://buclaw.cloudflareaccess.com/cdn-cgi/access/login/DOMAIN">
    以 Google 帳號登入
</a>
```

登入後 CF Access 設置 cookie，後端從 JWT cookie 解析 email。

### 6.2 前端 Session 狀態

```typescript
// GET /api/auth/me → { email, displayName, permissions: string[] }
const { data: me } = useQuery("me", () =>
    fetch("/api/auth/me").then((r) => r.json()),
);

// 根據 permissions 控制 UI 顯示
const canAccessAdmin = me?.permissions.includes("blog:admin");
```

---

## 7. 遷移計畫

### Phase 1（最小可行）

- [x] P1 已有 `ACCESS_DB + user_access` → 繼續用，不動
- [ ] P3 新增 `GET /api/auth/me` endpoint（讀 CF Access email）
- [ ] P3 前端加登入狀態顯示（已登入/未登入）

### Phase 2（群組支援）

- [ ] 建立 `SHARED_AUTH_DB`，執行新 schema migration
- [ ] P1 wrangler.jsonc 加 binding 指向 SHARED_AUTH_DB
- [ ] P3 wrangler.jsonc 加 binding 指向 SHARED_AUTH_DB
- [ ] P3 後台新增「用戶管理」頁（/admin/users）
- [ ] P1 access-control.ts 改讀新 DB（向下相容舊 user_access）

### Phase 3（細粒度）

- [ ] 群組功能完整實作
- [ ] P3 後台可管理 P1 的考題科目存取
- [ ] 全平台登入狀態統一（shared cookie domain）

---

## 8. 待決策項目

| #   | 問題                              | 選項                                   |
| --- | --------------------------------- | -------------------------------------- |
| 1   | CF Access 是否繼續做登入？        | A) 是（前端加按鈕）B) 換成自建 OAuth   |
| 2   | P1/P3 cookie domain 是否統一？    | 需要確認兩平台 domain 是否同一 CF zone |
| 3   | Phase 1 要不要先做 /api/auth/me？ | 影響前端是否能顯示「已登入為 xxx」     |
