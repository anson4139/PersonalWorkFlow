# ADR-002 Memory Schema 升級至 v2

> **Status**: Accepted
> **Date**: 2026-04-27
> **Author**: Anson

---

## 目錄

- [背景](#背景)
- [決策](#決策)
- [後果](#後果)
- [替代方案](#替代方案)

---

<details>
<summary>## 背景</summary>

系統使用 `docs/knowledge/memory/facts.yaml` 作為 AI 助手的長期記憶儲存，透過 `memory-recall` Skill 讀取、`memory-capture` Skill 寫入。

### v1 Schema 問題

v1 的欄位結構過於扁平：

```yaml
- id: fact_001
  claim: "使用 UTF-8 編碼"
  source: "copilot-instructions.md"
  confidence: high
  created: 2026-04-01
```

實際使用後暴露出四個問題：

1. **無專案範疇**：記憶無法區分「哪個事實屬於哪個專案」，recall 時全部混在一起
2. **無 TTL**：環境設定（如 Python 版本）改變後，舊事實無法自動過期
3. **無廢棄機制**：錯誤的事實只能刪除，無法標記為「曾經存在但已被推翻」
4. **Source 欄位過於粗糙**：只有路徑，無法說明「這個事實來自何種佐證」

這導致 AI 在 recall 時可能引用過期或跨專案的錯誤事實。

</details>

<details>
<summary>## 決策</summary>

**將 Memory Schema 升級至 v2，欄位如下：**

```yaml
- id: fact_001
  category: convention           # 分類：convention / toolchain / constraint / decision / pattern
  project: global                # 範疇：global 或 projects/<name>
  claim: "所有 Python 腳本必須使用 UTF-8 編碼"
  source:
    type: file                   # file / conversation / test / observation
    path: ".github/copilot-instructions.md"
    evidence: "Section 4B: File Encodings"
  confidence: high               # high / medium / low
  created: 2026-04-01
  updated_at: 2026-04-27
  expires: null                  # ISO 日期或 null（永不過期）
  deprecated: false              # 若已被推翻，設 true 並保留紀錄
  tags:
    - encoding
    - python
    - cross-template
```

### 欄位說明

| 欄位 | 必填 | 說明 |
|---|---|---|
| `id` | ✅ | 唯一識別碼，格式 `fact_NNN`，不重複 |
| `category` | ✅ | `convention`/`toolchain`/`constraint`/`decision`/`pattern` |
| `project` | ✅ | `global` 或 `projects/<name>`，控制 recall 範疇 |
| `claim` | ✅ | 一句話陳述，無歧義 |
| `source.type` | ✅ | `file`/`conversation`/`test`/`observation` |
| `source.path` | ✅ | 相對路徑或對話識別（如 `conversation:2026-04-27`） |
| `source.evidence` | 建議 | 精確指向（章節、行號、測試名稱） |
| `confidence` | ✅ | `high`（已驗證）/ `medium`（合理推斷）/ `low`（假設） |
| `created` | ✅ | ISO 日期，建立時間 |
| `updated_at` | ✅ | ISO 日期，最後修改時間 |
| `expires` | 選填 | ISO 日期，到期後 recall 時跳過；`null` 永不過期 |
| `deprecated` | ✅ | `false`（現役）/ `true`（已廢棄，保留供歷史查詢） |
| `tags` | 選填 | 便於過濾的標籤清單 |

### Recall 過濾規則

`memory-recall` Skill 在讀取時必須套用以下過濾：
1. `deprecated: false`
2. `expires == null` 或 `expires > today`
3. `project == "global"` 或 `project == 當前工作目錄的專案名稱`

</details>

<details>
<summary>## 後果</summary>

### 正向影響

- **精確 recall**：專案範疇過濾避免跨專案事實污染
- **時效性**：環境設定事實可設 expires，自動過期不影響 recall
- **可稽核**：deprecated 保留歷史，不靜默刪除
- **可追溯**：source.evidence 指向具體佐證，降低 AI 引用錯誤的機率

### 負向影響 / 限制

- **寫入成本更高**：`memory-capture` 需要填更多欄位，單次操作稍繁
- **舊 v1 記憶需遷移**：現有 facts.yaml 中的 v1 格式需手動補充 `category`、`project`、`tags` 等欄位
- **expires 需人工維護**：系統無法自動計算「何時應該過期」，需在 capture 時主動設定
- **deprecated: true 的事實仍佔用空間**：若大量廢棄事實累積，需定期清理（歸檔）

### 遷移策略

v1 → v2 的現有事實補充策略：
- `category`：依 claim 内容人工歸類
- `project`：預設填 `global`
- `source`：舊欄位值移到 `source.path`，`source.type` 補 `file`
- `expires`、`deprecated`：補 `null` / `false`
- `tags`：非必填，可先空白

</details>

<details>
<summary>## 替代方案</summary>

### A. 使用 SQLite 替代 YAML

用 SQLite 儲存記憶，支援 SQL 查詢和 index。

**為何不採用**：YAML 對 AI 直接讀寫更直覺；SQLite 需要額外工具，在純文字 VS Code workflow 中增加複雜度。若未來記憶量超過 500 條，可重新評估。

### B. 保持 v1，只加 project 欄位

只補最緊迫的 `project` 範疇欄位，其他不動。

**為何不採用**：`expires` 和 `deprecated` 的需求同樣迫切（舊 toolchain 版本事實已造成誤引用），一次升級完整比未來再次 schema breaking change 成本更低。

### C. 完全不用 YAML，改存在 Copilot memory 工具

**為何不採用**：Copilot `/memories/` 是工作階段記憶，`facts.yaml` 是**跨平台共用記憶**（Copilot + Claude 都能讀）。廢除 YAML 會讓 Claude Code 失去這份長期記憶。

</details>
