# PersonalWorkFlow — 文件索引

> 所有文件導覽。建議從 [quickstart.md](guides/quickstart.md) 開始。

---

## 操作指南（guides/）

| 文件                                              | 對象       | 說明                                                                 |
| ------------------------------------------------- | ---------- | -------------------------------------------------------------------- |
| [quickstart.md](guides/quickstart.md)             | 所有使用者 | 5 步驟上手：clone → env → 選 template → VS Code → 第一個 AI 指令     |
| [new-project-sop.md](guides/new-project-sop.md)   | 開發者     | 從 template 建立真實專案的完整 SOP                                   |
| [skills-reference.md](guides/skills-reference.md) | 所有使用者 | 所有 Skill 的觸發時機、範例提示詞、適用平台                          |
| [ai-learning-path.md](guides/ai-learning-path.md) | Anson 個人 | 工程師 → AI 應用規劃師 完整學習路徑（樹狀圖 + 7 章詳解 + 90 天計畫） |

---

## 架構文件（architecture/）

| 文件                                                        | 說明                                | 狀態 |
| ----------------------------------------------------------- | ----------------------------------- | ---- |
| [framework-overview.md](architecture/framework-overview.md) | 三平台架構圖、Skill 同步、SDLC 流程 | ✅   |
| [skill-sync-design.md](architecture/skill-sync-design.md)   | Skill 跨平台同步機制設計            | ✅   |

---

## 架構決策紀錄（decisions/）

| 文件                                                                           | 說明                               | 狀態    |
| ------------------------------------------------------------------------------ | ---------------------------------- | ------- |
| [adr-template.md](decisions/adr-template.md)                                   | ADR 模板                           | ✅ 可用 |
| [adr-001-sdlc-folder-structure.md](decisions/adr-001-sdlc-folder-structure.md) | 為何採用 specs/src/tests/docs 結構 | ✅      |
| [adr-002-memory-schema-v2.md](decisions/adr-002-memory-schema-v2.md)           | Memory Schema v2 設計決策          | ✅      |

---

## 長期記憶（knowledge/）

| 文件                                                       | 說明                                                  |
| ---------------------------------------------------------- | ----------------------------------------------------- |
| [knowledge/memory/facts.yaml](knowledge/memory/facts.yaml) | 跨 session 持久化事實（由 memory-capture skill 維護） |

---

## 框架規範（根目錄）

| 文件                                                                        | 說明                                                         |
| --------------------------------------------------------------------------- | ------------------------------------------------------------ |
| [/../.github/copilot-instructions.md](../.github/copilot-instructions.md)   | AI 行為規則、SDLC、Engineering Standards、Documentation Sync |
| [/../.editorconfig](../.editorconfig)                                       | 縮排 / 換行 / 編碼（全語言統一）                             |
| [/../.github/pull_request_template.md](../.github/pull_request_template.md) | PR 開啟時自動填入的模板                                      |
| [/../environment.yml](../environment.yml)                                   | conda 環境定義（Python 3.12 + 所有相依套件）                 |
| [/../setup.ps1](../setup.ps1)                                               | 一鍵初始化：conda 建立 + .env + health-check + VS Code       |
| [/../CHANGELOG.md](../CHANGELOG.md)                                         | 框架版本記錄（Keep a Changelog 格式）                        |

---

## 文件撰寫規範

所有 `.md` 文件遵循：

- 多章節文件使用 `<details>` 折疊每個 `##` 章節
- 例外：文件標頭（標題/版本/狀態）、TOC、單章節工具文件
- 理由：VS Code Preview 與 GitHub 長文件難以導覽
