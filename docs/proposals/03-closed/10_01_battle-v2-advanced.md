# 考題學習平台 v6：對戰模式全面升級

> **[AI 規則] 每次修改本文件，必須同時執行以下兩個動作，否則視為不完整的更新：**
>
> 1. **在本文件的「異動記錄」表格最上方新增一筆記錄（日期 / 版本 / 更新人 / 變更說明）**
> 2. **在 `projects/README.md` 的「提案異動歷程」表格最上方同步新增一筆記錄（日期 / 提案 / 對應專案 / 異動摘要）**

| 項目     | 內容                                    |
| -------- | --------------------------------------- |
| 狀態     | `closed`                                |
| 建立日期 | 2026-05-08                              |
| 最後更新 | 2026-05-09（v1.0 P0–P5 全部完成，結案） |
| 對應專案 | `projects/01-exam-study-platform/`      |

---

<details>
<summary>## 異動記錄</summary>

| 日期       | 版本 | 更新人 | 變更說明                                                                                                                   |
| ---------- | ---- | ------ | -------------------------------------------------------------------------------------------------------------------------- |
| 2026-05-09 | v1.0 | Anson  | 結案：P5 字體大小切換（小/中/大）確認已實作並部署，P0–P5 全部完成，提案正式結案                                            |
| 2026-05-09 | v0.6 | Anson  | P4 劇情模式（StoryPage 3格地圖+怪獸池）與排行榜（LeaderboardPage + D1 migration 0004）全數實作完成並部署至 exam.buclaw.org |
| 2026-05-09 | v0.5 | Anson  | 修正 BattlePage 退出跳 quiz bug、API fallback total 計算 bug；移除 quiz 模式切換 tabs；修正對戰退出後路徑                  |
| 2026-05-08 | v0.4 | Anson  | P1/P2/P3 全部實作完成；新增 P5（字體大小切換功能）                                                                         |
| 2026-05-08 | v0.1 | Anson  | 建立提案初稿                                                                                                               |

</details>

---

<details>
<summary>## 背景與目標</summary>

### 現況

V5 對戰模式（BattlePage）已完成基礎 MVP：

- 10 隻怪獸（同等強度），隨機出場
- HP 制答題扣血，答對傷怪/答錯扣自己
- 怪獸有 idle/battle 兩種圖，CSS glow 效果
- 答題有解析（KaTeX 支援）

### 問題

1. **怪獸無強弱之分**：10 隻視覺、強度一致，缺乏挑戰感與成就感
2. **缺乏留存機制**：打完一局沒有紀錄，沒有「下次更強」的誘因
3. **玩法過於單調**：每局流程完全相同，無技能、無壓力、無劇情
4. **素材不足**：目前只有 10 隻普通怪，缺乏強化版與 Boss 級素材

### 目標

打造完整的進階對戰體驗，分三個維度升級：

| 維度     | 目標                                 |
| -------- | ------------------------------------ |
| **素材** | 25 隻怪 × 2 poses = 50 張圖          |
| **玩法** | 11 項功能優化全數落地                |
| **內容** | 世界觀、劇情腳本、台詞、設計文件完備 |

</details>

---

<details>
<summary>## 世界觀與劇情大綱</summary>

### 世界觀設定

**《知識試煉之境》**

這個世界由「知識」構成。想要離開試煉之境，玩家必須擊敗在此盤踞的 25 隻「無知怪獸」——牠們是考生心中對知識的恐懼與懶惰所具現化的存在。

> 怪獸越強，代表對應領域越深的恐懼。

玩家扮演一名正在備考的「試煉者」，持有知識之劍，每答對一題就能刺傷怪獸，每答錯一題就是自身動搖。

---

### 關卡劇情腳本

**劇情模式共 3 大章，每章不同怪獸等級：**

#### 第一章：初試之境（普通怪 Lv.1–10）

> 「你踏入試煉之境。空氣裡散佈著考題的氣息，前方十隻怪獸懶洋洋地等著你。牠們是最基礎的恐懼，但忽視牠們，你將永遠無法前進。」

- 關 1：火焰龍的嘲諷（你怕熱嗎？）
- 關 2：石巨人的沉默壓迫
- 關 3：暗黑騎士的恐嚇
- 關 4：雷鷹的速度測試
- 關 5：史萊姆球的意外反彈
- 關 6：毛球熊的假裝可愛
- 關 7：惡作劇狐的陷阱
- 關 8：暗影惡靈的心理壓迫
- 關 9：骷髏王的詛咒倒數
- 關 10：深淵蛇妖的毒霧（第一章 Boss 關）

#### 第二章：強化試煉（強化怪 Lv.11–20）

> 「你以為你贏了？那只是牠們的熱身。真正的試煉，從現在開始。」

- 關 11–20：對應怪獸各自的進化形態，台詞更具攻擊性
- 每關結束有一句「進化過場台詞」

#### 第三章：深淵決戰（Boss Lv.21–25）

> 「深處傳來震動。那不是怪獸的咆哮——那是你對自己的懷疑，集結成形。」

- 5 場 Boss 戰，每場有開場動畫文字 + 擊敗後台詞
- 最終 Boss：深淵神明，代表「所有學科的終極恐懼」

---

### 普通模式（隨機遭遇）

不走劇情線，系統從 25 隻怪中隨機排列，難度依所選場次自動決定怪獸等級池：

- 初級科目 → 從普通怪池抽
- 中級科目 → 從強化怪池抽
- 混合難度 → 全池隨機

</details>

---

<details>
<summary>## 25 隻怪獸設計</summary>

### 屬性對應表

| 屬性    | 象徵意涵           | 克制科目（建議）      |
| ------- | ------------------ | --------------------- |
| 🔥 火   | 高強度、高頻考題   | AI 應用規劃師（中級） |
| ⚡ 雷   | 快速技術、精準判斷 | 生成式 AI 基礎        |
| 💧 水   | 廣泛基礎、資料分析 | 大數據分析            |
| 🌑 暗   | 深度難題、抽象理論 | 機器學習              |
| 🪨 土   | 穩健傳統、法規記憶 | 證券商業務（初業）    |
| 🌿 自然 | 入門概念、觀念建立 | AI 應用規劃師（初級） |
| 💨 風   | 靈活應用、跨領域   | 金融科技力            |
| ☠️ 毒   | 細節陷阱、容易誤答 | 電子商務              |

---

### 第一層：普通怪（Lv.1–10）

#### 01 火焰龍 Flamedrake

| 項目       | 內容                                                       |
| ---------- | ---------------------------------------------------------- |
| 屬性       | 🔥 火                                                      |
| 個性       | 衝動、自大、愛嘲諷                                         |
| 弱點       | 被連續答對會慌亂（連擊有效）                               |
| 出場台詞   | 「哼，又一個送上門的蠢材。我的火焰會讓你的考卷化成灰燼！」 |
| 受傷（輕） | 「嘿！這還挺痛的嘛……」                                     |
| 受傷（中） | 「你……你竟然真的知道這個！？」                             |
| 受傷（重） | 「不可能……我的火焰怎麼會……」                               |
| 反擊       | 「接好了！這道題你一定不會！」                             |
| 反擊 2     | 「哈哈！選錯了吧！燒光你的自信！」                         |
| 被擊敗     | 「……知識的力量，比我的火更燙。下次……我會更強。」           |

---

#### 02 石巨人 Golem Rex

| 項目       | 內容                                     |
| ---------- | ---------------------------------------- |
| 屬性       | 🪨 土                                    |
| 個性       | 沉默寡言、行動緩慢但攻擊重               |
| 弱點       | 慢速防禦，對快速答題（計時獎勵）特別脆弱 |
| 出場台詞   | 「……（石頭磨擦聲）……你來了。」           |
| 受傷（輕） | 「唔……」                                 |
| 受傷（中） | 「嘎……裂縫……」                           |
| 受傷（重） | 「……我……動搖了……」                       |
| 反擊       | 「（震地一拳）」                         |
| 反擊 2     | 「……靜止。思考。再答。」                 |
| 被擊敗     | 「……你的知識，比岩石更硬。我……倒下。」   |

---

#### 03 暗黑騎士 Shadow Knight

| 項目       | 內容                                           |
| ---------- | ---------------------------------------------- |
| 屬性       | 🌑 暗                                          |
| 個性       | 冷酷、高傲、愛心理戰                           |
| 弱點       | 你選技能「移除錯誤選項」時牠會大受打擊         |
| 出場台詞   | 「混沌遮蔽你的視線。你根本看不清正確答案。」   |
| 受傷（輕） | 「……運氣好。」                                 |
| 受傷（中） | 「你……看穿了我的幻術？」                       |
| 受傷（重） | 「不可能。你不該知道這個。」                   |
| 反擊       | 「現在，選擇你的恐懼。A、B、C 還是 D？」       |
| 反擊 2     | 「這道題，連你的老師也不確定答案。」           |
| 被擊敗     | 「……知識是唯一能驅散黑暗的光。你……找到了它。」 |

---

#### 04 雷鷹 Thunderwing

| 項目       | 內容                                             |
| ---------- | ------------------------------------------------ |
| 屬性       | ⚡ 雷                                            |
| 個性       | 急躁、快速、愛施壓                               |
| 弱點       | 連擊時雷鷹會短路                                 |
| 出場台詞   | 「滴答！滴答！你的時間不多了！」                 |
| 受傷（輕） | 「嘶——！靜電干擾！」                             |
| 受傷（中） | 「你的反應……比閃電還快？！」                     |
| 受傷（重） | 「……電路……超載……」                               |
| 反擊       | 「時間到！！答不出來就是錯！」                   |
| 反擊 2     | 「閃電一擊！你躲得過嗎？！」                     |
| 被擊敗     | 「速度……不是唯一的武器。你的準確度……打敗了我。」 |

---

#### 05 史萊姆球 Blobby

| 項目       | 內容                                               |
| ---------- | -------------------------------------------------- |
| 屬性       | 💧 水                                              |
| 個性       | 看似弱小，其實反彈力強、愛假裝可憐                 |
| 弱點       | 容易被連擊打爆                                     |
| 出場台詞   | 「嗚嗚嗚……我好怕……（偷笑）哈！騙你的！」           |
| 受傷（輕） | 「哎呀哎呀……好痛痛……（假哭）」                     |
| 受傷（中） | 「你……你真的要欺負我嗎！」                         |
| 受傷（重） | 「嗚——不公平！我本來就很脆弱！」                   |
| 反擊       | 「嘿嘿，偷偷給你加個難題！」                       |
| 反擊 2     | 「彈回去！這道題你一定沒讀過！」                   |
| 被擊敗     | 「……你真的很認真讀書嘛。嗚嗚，我輸得心服口服啦。」 |

---

#### 06 毛球熊 Fluffybear

| 項目       | 內容                                           |
| ---------- | ---------------------------------------------- |
| 屬性       | 🌿 自然                                        |
| 個性       | 表面溫柔可愛，生氣時全力爆發                   |
| 弱點       | 初期防禦高但技能可以突破                       |
| 出場台詞   | 「安安，我不想打架……但你來了，我也沒辦法呢～」 |
| 受傷（輕） | 「唉唉，好痛……你幹嘛嘛……」                     |
| 受傷（中） | 「你……真的很厲害耶……（開始認真了）」           |
| 受傷（重） | 「不行了！！毛球熊怒了！！」                   |
| 反擊       | 「巨熊拍！！痛死你！」                         |
| 反擊 2     | 「這題連毛球熊都懂！你呢？！」                 |
| 被擊敗     | 「嗚嗚嗚……你是我見過最厲害的考生了……加油喔。」 |

---

#### 07 惡作劇狐 Trickster Fox

| 項目       | 內容                                                 |
| ---------- | ---------------------------------------------------- |
| 屬性       | 💨 風                                                |
| 個性       | 狡猾、愛設陷阱，說話帶著謎語                         |
| 弱點       | 移除錯誤選項技能讓牠的把戲失效                       |
| 出場台詞   | 「嘻嘻～選 A 還是選 B？嗯嗯嗯？我不說～」            |
| 受傷（輕） | 「哎！被你識破了一個！」                             |
| 受傷（中） | 「你是念過書的！？這不公平！」                       |
| 受傷（重） | 「……狡猾的我……輸給了更認真的你……」                   |
| 反擊       | 「嘿！這題有兩個看起來都對的！選哪個？嘿嘿嘿！」     |
| 反擊 2     | 「答案就藏在你最不想選的那個裡面！」                 |
| 被擊敗     | 「你……把我所有的把戲都拆穿了。讀書的力量，真可怕。」 |

---

#### 08 暗影惡靈 Shadowwraith

| 項目       | 內容                                           |
| ---------- | ---------------------------------------------- |
| 屬性       | 🌑 暗                                          |
| 個性       | 低沉、不說廢話，專攻心理弱點                   |
| 弱點       | 答題速度夠快時牠找不到縫隙進攻                 |
| 出場台詞   | 「……你的猶豫……是我的養分。」                   |
| 受傷（輕） | 「……光。」                                     |
| 受傷（中） | 「……你的確定性……傷到我了。」                   |
| 受傷（重） | 「……我……消散……」                               |
| 反擊       | 「……懷疑，現在開始侵入你的腦。」               |
| 反擊 2     | 「……你真的確定嗎？……再想想……」                 |
| 被擊敗     | 「……堅定的知識，是唯一驅散我的武器。……去吧。」 |

---

#### 09 骷髏王 Bone King

| 項目       | 內容                                             |
| ---------- | ------------------------------------------------ |
| 屬性       | ☠️ 毒（Undead 型）                               |
| 個性       | 威嚴、詛咒型，說話帶古老儀式感                   |
| 弱點       | HP 清零的速度越快，詛咒效果越短                  |
| 出場台詞   | 「以無知之名，本王詛咒你的每一個答案。」         |
| 受傷（輕） | 「嗚嗚……骨頭……」                                 |
| 受傷（中） | 「竟敢傷本王！？汝命休矣！」                     |
| 受傷（重） | 「本王……不能倒……」                               |
| 反擊       | 「詛咒！讓你的下一題必定答錯！」                 |
| 反擊 2     | 「此題乃本王專精之術，汝必敗！」                 |
| 被擊敗     | 「……知識之光，終究勝過詛咒之暗。本王……承認你。」 |

---

#### 10 深淵蛇妖 Abyssal Serpent

| 項目       | 內容                                                   |
| ---------- | ------------------------------------------------------ |
| 屬性       | ☠️ 毒                                                  |
| 個性       | 冷靜、危險、說話像在催眠                               |
| 弱點       | 對計時壓力反應遲鈍（倒數答題傷害加倍）                 |
| 出場台詞   | 「不急……我們有的是時間……慢慢來……選吧……」               |
| 受傷（輕） | 「……嘶……」                                             |
| 受傷（中） | 「你……沒有被我的毒霧迷惑……」                           |
| 受傷（重） | 「……清醒的……頭腦……是毒的天敵……」                       |
| 反擊       | 「毒霧散開……你的視線，開始模糊……」                     |
| 反擊 2     | 「……選 C……還是 A 呢……哪個更讓你迷惑……」                |
| 被擊敗     | 「……你抵抗了混淆。第一章的試煉，結束了。繼續前進吧……」 |

---

### 第二層：強化怪（Lv.11–20）

> 強化版是原怪獸被知識的恐懼「強化進化」後的型態，視覺更猛、台詞更有攻擊性。

#### 11 熔岩龍王 Magma Overlord（🔥 火焰龍進化）

| 項目       | 內容                                                   |
| ---------- | ------------------------------------------------------ |
| 屬性       | 🔥 火 × 🌑 暗                                          |
| 個性       | 不再嘲諷，純粹破壞                                     |
| 出場台詞   | 「你打敗了我的前身？那只會讓我更憤怒。岩漿吞噬一切！」 |
| 受傷（中） | 「……你進步了。但還不夠！」                             |
| 被擊敗     | 「……我的熾焰，被你的知識澆熄。」                       |

#### 12 鐵甲巨人 Iron Colossus（🪨 石巨人進化）

| 項目       | 內容                                                   |
| ---------- | ------------------------------------------------------ |
| 屬性       | 🪨 土 × ⚡ 雷                                          |
| 個性       | 沉默但現在帶電流反擊                                   |
| 出場台詞   | 「……我吸收了雷電的力量。你的知識之劍，能穿透鋼鐵嗎？」 |
| 受傷（中） | 「……電流……被打散了……」                                 |
| 被擊敗     | 「……硬度不等於正確。你讓我明白了這道理。」             |

#### 13 死神騎士 Death Knight（🌑 暗黑騎士進化）

| 項目       | 內容                                           |
| ---------- | ---------------------------------------------- |
| 屬性       | 🌑 暗 × ☠️ 毒                                  |
| 個性       | 加入了詛咒能力，更難纏                         |
| 出場台詞   | 「我不再只靠幻術。這次，我帶著死亡詛咒來了。」 |
| 受傷（中） | 「……你識破了詛咒？不……不可能……」               |
| 被擊敗     | 「……死亡，從未是知識的對手。我敗了。」         |

#### 14 風暴鷹神 Storm Hawk（⚡ 雷鷹進化）

| 項目       | 內容                                          |
| ---------- | --------------------------------------------- |
| 屬性       | ⚡ 雷 × 💨 風                                 |
| 個性       | 更快更強，製造強烈時間壓力                    |
| 出場台詞   | 「我的翅膀已成為颶風。你有 3 秒。現在開始！」 |
| 受傷（中） | 「你……在颶風中還能看清題目？！」              |
| 被擊敗     | 「……速度與準確，你兩者兼備。我，認輸。」      |

#### 15 毒液之王 Toxic King（💧 史萊姆球進化）

| 項目       | 內容                                                   |
| ---------- | ------------------------------------------------------ |
| 屬性       | ☠️ 毒 × 💧 水                                          |
| 個性       | 不再假裝可憐，散佈毒霧混淆視線                         |
| 出場台詞   | 「你以為打敗了一顆小史萊姆，就能擋住毒海嗎？哈哈哈！」 |
| 受傷（中） | 「毒液……被你的知識中和了！？」                         |
| 被擊敗     | 「……毒，無法腐蝕真正的理解。你贏了。」                 |

#### 16 怒熊霸主 Bear Warlord（🌿 毛球熊進化）

| 項目       | 內容                                                         |
| ---------- | ------------------------------------------------------------ |
| 屬性       | 🌿 自然 × 🔥 火                                              |
| 個性       | 溫柔徹底消失，變成憤怒的戰士                                 |
| 出場台詞   | 「毛球熊死了。現在站在你面前的，是怒火的霸主。準備好了嗎？」 |
| 受傷（中） | 「……我感受到了……知識的力量……」                               |
| 被擊敗     | 「……憤怒，終究比不上冷靜的學習。……我輸了，服了。」           |

#### 17 九尾狐妖 Nine-tail Vixen（💨 惡作劇狐進化）

| 項目       | 內容                                                 |
| ---------- | ---------------------------------------------------- |
| 屬性       | 💨 風 × 🌑 暗                                        |
| 個性       | 九條尾巴各代表一個陷阱，誤導能力大幅提升             |
| 出場台詞   | 「一條尾巴的小把戲，你破解了。那九條尾巴的迷陣呢？」 |
| 受傷（中） | 「你……同時識破了幾個迷陣？！這不可能！」             |
| 被擊敗     | 「……九條尾的謊言，敗給了一顆誠實的學習之心。」       |

#### 18 幽冥虛空主 Void Sovereign（🌑 暗影惡靈進化）

| 項目       | 內容                                       |
| ---------- | ------------------------------------------ |
| 屬性       | 🌑 暗 × 💨 風                              |
| 個性       | 進化為虛空本身，讓選項在眼前扭曲           |
| 出場台詞   | 「……你穿越了黑暗。但虛空，沒有邊界。」     |
| 受傷（中） | 「……你的專注，切開了虛空。」               |
| 被擊敗     | 「……虛空的唯一解藥，是確定性。你做到了。」 |

#### 19 不死帝王 Undying Emperor（☠️ 骷髏王進化）

| 項目       | 內容                                                             |
| ---------- | ---------------------------------------------------------------- |
| 屬性       | ☠️ 毒 × 🌑 暗                                                    |
| 個性       | 詛咒升級，且每次被打倒都會回復一次                               |
| 出場台詞   | 「本王死過一次了。死亡，已無法奈我何。你準備好面對不死之敵嗎？」 |
| 受傷（中） | 「痛！但帝王……不倒！」                                           |
| 被擊敗     | 「……你兩次都打敗了我。知識的力量……連不死之身都無法抵擋。」       |

#### 20 深淵巨龍 Abyss Dragon（☠️ 深淵蛇妖進化）

| 項目       | 內容                                                                   |
| ---------- | ---------------------------------------------------------------------- |
| 屬性       | ☠️ 毒 × 🔥 火 × 🌑 暗                                                  |
| 個性       | 最強強化怪，三屬性混合，第二章最終關                                   |
| 出場台詞   | 「……你走到了深處。這裡的毒，是知識的絕望。我是你在這一層的最後試煉。」 |
| 受傷（中） | 「……你的知識之刃，深入了深淵。」                                       |
| 被擊敗     | 「……第二章終結。第三章的試煉，遠超過你的想像。……去吧。」               |

---

### 第三層：Boss 怪（Lv.21–25）

#### 21 末日火神 Apocalypse Ignis（🔥 終極火屬性 Boss）

| 項目       | 內容                                                 |
| ---------- | ---------------------------------------------------- |
| 屬性       | 🔥 火（極限）                                        |
| 特性       | HP 200，連擊免疫，每 3 題反擊一次                    |
| 出場台詞   | 「考試是火。你不是來滅火的——你是來穿越它的。燒吧！」 |
| 受傷（中） | 「……烈焰中，你還能保持清醒？」                       |
| 受傷（重） | 「……神火……動搖了……」                                 |
| 被擊敗     | 「……你穿越了末日之火。你的知識，是最高溫的火焰。」   |

#### 22 大地終結者 Terra Destroyer（🪨 終極土屬性 Boss）

| 項目       | 內容                                                       |
| ---------- | ---------------------------------------------------------- |
| 屬性       | 🪨 土（極限）                                              |
| 特性       | HP 200，慢速但每次反擊扣血更重                             |
| 出場台詞   | 「我是所有法規的重量。你扛得起嗎？」                       |
| 受傷（中） | 「……龜裂……巨岩也能被知識侵蝕……」                           |
| 被擊敗     | 「……你記住了每一條法規的重量，並將它化為武器。我，崩塌。」 |

#### 23 混沌魔神 Chaos Archon（🌑 終極暗屬性 Boss）

| 項目       | 內容                                                         |
| ---------- | ------------------------------------------------------------ |
| 屬性       | 🌑 暗 × ⚡ 雷 × 💨 風                                        |
| 特性       | HP 200，選項每道題都隨機移位（視覺干擾）                     |
| 出場台詞   | 「混沌。一切的根源。你以為你讀懂了知識？你只是觸碰了皮毛。」 |
| 受傷（中） | 「……你在混沌中找到了秩序。可怕。」                           |
| 被擊敗     | 「……秩序勝過混沌。你，是例外中的例外。」                     |

#### 24 雷霆至尊 Thunder Overlord（⚡ 終極雷屬性 Boss）

| 項目       | 內容                                                     |
| ---------- | -------------------------------------------------------- |
| 屬性       | ⚡ 雷（極限）                                            |
| 特性       | HP 200，計時縮短為 20 秒，每題                           |
| 出場台詞   | 「我是最快的知識考驗。你有 20 秒。每一秒都是一道閃電。」 |
| 受傷（中） | 「……你的反應……比閃電更快！？這不可能！」                 |
| 被擊敗     | 「……你的速度與正確率，超越了閃電。我承認你的實力。」     |

#### 25 深淵神明 Abyss Deity（🌑🔥⚡☠️ 終極 Boss — 所有屬性）

| 項目       | 內容                                                                                                       |
| ---------- | ---------------------------------------------------------------------------------------------------------- |
| 屬性       | 全屬性                                                                                                     |
| 特性       | HP 300，連擊攻擊加倍，技能只能用一次，最終關                                                               |
| 出場台詞   | 「……你終於來了。我是你所有恐懼的集合。每一題都是你內心的懷疑。你，真的準備好了嗎？」                       |
| 受傷（輕） | 「……有趣。」                                                                                               |
| 受傷（中） | 「……你的知識……真的在成長……」                                                                               |
| 受傷（重） | 「……我……從未如此受傷……」                                                                                   |
| 反擊       | 「你以為你贏了？這只是第一階段！」                                                                         |
| 反擊 2     | 「……你的猶豫，是我最後的武器！」                                                                           |
| 被擊敗     | 「……你做到了。你戰勝了自己所有的恐懼與懶惰。這個試煉之境，屬於你了。去吧——帶著你的知識，面對真正的考場。」 |

</details>

---

<details>
<summary>## 怪獸圖片生成 Prompt 清單（新增 30 張）</summary>

> 舊有 10 隻普通怪的 20 張 Prompt 保留於 `docs/proposals/03-closed/06_01_monster-battle.md`，本節僅補充新增的 30 張。

---

### 共用 Style Guide — 強化版（Enhanced Tier）

**尾段模板：**

```text
single monster character asset, full body, centered composition, front 3/4 view, clean 2D game illustration, flat colors, bold clean outline, simple cel shading, strong readable silhouette, powerful and menacing design, more complex detail than normal tier, subtle rim light for visibility on a black UI, transparent background, no white background, no scene background, no text, no UI, no frame, no watermark, 512x512, high quality, consistent character design across the monster set
```

### 共用 Style Guide — Boss 版（Boss Tier）

**尾段模板：**

```text
single BOSS monster character asset, full body, centered composition, front 3/4 view, clean 2D game illustration, flat colors, bold clean outline, detailed cel shading, MASSIVE imposing silhouette, ultra detailed and complex design far larger than normal monsters, dramatic multi-color rim light aura, transparent background, no white background, no scene background, no text, no UI, no frame, no watermark, 512x512, high quality, consistent character design across the monster set
```

---

### 強化怪 Prompt（10 隻 × 2 poses = 20 張）

---

**Monster 11 — 熔岩龍王 Magma Overlord（強化）**

`11-idle.png`

```text
Create a single monster character asset for a quiz battle game: Magma Overlord, the evolved form of Flamedrake — a massive lava dragon with molten rock scales, glowing magma cracks across its entire body, enormous curved horns dripping with lava, and deep glowing eyes. Show the monster in a powerful idle pose, standing upright with wings spread wide, radiating intense heat. RPG dark fantasy style. Single monster character asset, full body, centered composition, front 3/4 view, clean 2D game illustration, flat colors, bold clean outline, simple cel shading, strong readable silhouette, powerful and menacing design, more complex detail than normal tier, subtle orange-red dual rim light for visibility on a black UI, transparent background, no white background, no scene background, no text, no UI, no frame, no watermark, 512x512, high quality, consistent character design across the monster set.
```

`11-battle.png`

```text
Create a single monster character asset for a quiz battle game: Magma Overlord, the evolved form of Flamedrake — a massive lava dragon with molten rock scales, glowing magma cracks across its entire body, enormous curved horns dripping with lava, and deep glowing eyes. Show the monster in a dynamic battle pose, rearing back and unleashing a colossal torrent of lava from its open jaws, wings fully spread and glowing with internal fire, devastating and overwhelming. RPG dark fantasy style. Single monster character asset, full body, centered composition, front 3/4 view, clean 2D game illustration, flat colors, bold clean outline, simple cel shading, strong readable silhouette, powerful and menacing design, more complex detail than normal tier, subtle orange-red dual rim light for visibility on a black UI, transparent background, no white background, no scene background, no text, no UI, no frame, no watermark, 512x512, high quality, consistent character design across the monster set.
```

---

**Monster 12 — 鐵甲巨人 Iron Colossus（強化）**

`12-idle.png`

```text
Create a single monster character asset for a quiz battle game: Iron Colossus, the evolved form of Golem Rex — a titanic golem encased in thick iron plating with glowing electric-blue rune circuits running across its surface, massive shoulders with metallic spikes, and crackling lightning between its joints. Show the monster in a towering idle stance, arms crossed with arcs of electricity sparking off its body. RPG dark fantasy style. Single monster character asset, full body, centered composition, front 3/4 view, clean 2D game illustration, flat colors, bold clean outline, simple cel shading, strong readable silhouette, powerful and menacing design, more complex detail than normal tier, subtle cyan-gold dual rim light for visibility on a black UI, transparent background, no white background, no scene background, no text, no UI, no frame, no watermark, 512x512, high quality, consistent character design across the monster set.
```

`12-battle.png`

```text
Create a single monster character asset for a quiz battle game: Iron Colossus, the evolved form of Golem Rex — a titanic golem encased in thick iron plating with glowing electric-blue rune circuits running across its surface, massive shoulders with metallic spikes, and crackling lightning between its joints. Show the monster in a dynamic battle pose, charging forward with one fist raised to deliver an electrified ground-shattering punch, circuits blazing with full power. RPG dark fantasy style. Single monster character asset, full body, centered composition, front 3/4 view, clean 2D game illustration, flat colors, bold clean outline, simple cel shading, strong readable silhouette, powerful and menacing design, more complex detail than normal tier, subtle cyan-gold dual rim light for visibility on a black UI, transparent background, no white background, no scene background, no text, no UI, no frame, no watermark, 512x512, high quality, consistent character design across the monster set.
```

---

**Monster 13 — 死神騎士 Death Knight（強化）**

`13-idle.png`

```text
Create a single monster character asset for a quiz battle game: Death Knight, the evolved form of Shadow Knight — a towering undead armored knight with a cracked black skull visible through a shattered visor, massive dark greatsword dripping with cursed energy, tattered dark red cape, and a corona of soul fire around its shoulders. Show the monster in an imposing idle pose, gripping the greatsword vertically and staring forward with glowing curse energy in its eye sockets. RPG dark fantasy gothic style. Single monster character asset, full body, centered composition, front 3/4 view, clean 2D game illustration, flat colors, bold clean outline, simple cel shading, strong readable silhouette, powerful and menacing design, more complex detail than normal tier, subtle deep purple-green dual rim light for visibility on a black UI, transparent background, no white background, no scene background, no text, no UI, no frame, no watermark, 512x512, high quality, consistent character design across the monster set.
```

`13-battle.png`

```text
Create a single monster character asset for a quiz battle game: Death Knight, the evolved form of Shadow Knight — a towering undead armored knight with a cracked black skull visible through a shattered visor, massive dark greatsword dripping with cursed energy, tattered dark red cape, and a corona of soul fire around its shoulders. Show the monster in a dynamic battle pose, sweeping the massive greatsword in a wide arc with a burst of dark cursed energy exploding from the blade, devastating and unstoppable. RPG dark fantasy gothic style. Single monster character asset, full body, centered composition, front 3/4 view, clean 2D game illustration, flat colors, bold clean outline, simple cel shading, strong readable silhouette, powerful and menacing design, more complex detail than normal tier, subtle deep purple-green dual rim light for visibility on a black UI, transparent background, no white background, no scene background, no text, no UI, no frame, no watermark, 512x512, high quality, consistent character design across the monster set.
```

---

**Monster 14 — 風暴鷹神 Storm Hawk（強化）**

`14-idle.png`

```text
Create a single monster character asset for a quiz battle game: Storm Hawk, the evolved form of Thunderwing — a divine storm eagle with massive wings that crackle with purple and white lightning, sleek metallic-blue feathers, a crown of storm energy on its head, and eyes like twin lightning bolts. Show the monster in a proud idle stance, wings half-spread with constant lightning arcing between the primary feathers. RPG dark fantasy style. Single monster character asset, full body, centered composition, front 3/4 view, clean 2D game illustration, flat colors, bold clean outline, simple cel shading, strong readable silhouette, powerful and menacing design, more complex detail than normal tier, subtle electric-blue purple dual rim light for visibility on a black UI, transparent background, no white background, no scene background, no text, no UI, no frame, no watermark, 512x512, high quality, consistent character design across the monster set.
```

`14-battle.png`

```text
Create a single monster character asset for a quiz battle game: Storm Hawk, the evolved form of Thunderwing — a divine storm eagle with massive wings that crackle with purple and white lightning, sleek metallic-blue feathers, a crown of storm energy on its head, and eyes like twin lightning bolts. Show the monster in a dynamic battle pose, diving at full speed with wings pulled back and both talons extended forward, a colossal bolt of lightning erupting from its entire body as it strikes. RPG dark fantasy style. Single monster character asset, full body, centered composition, front 3/4 view, clean 2D game illustration, flat colors, bold clean outline, simple cel shading, strong readable silhouette, powerful and menacing design, more complex detail than normal tier, subtle electric-blue purple dual rim light for visibility on a black UI, transparent background, no white background, no scene background, no text, no UI, no frame, no watermark, 512x512, high quality, consistent character design across the monster set.
```

---

**Monster 15 — 毒液之王 Toxic King（強化）**

`15-idle.png`

```text
Create a single monster character asset for a quiz battle game: Toxic King, the evolved form of Blobby — no longer cute, now a massive toxic slime creature with a bloated dark green-black body, glowing poison eyes, acid dripping from jagged fanged mouth, and toxic bubbles forming a makeshift crown. Show the monster in a threatening idle pose, body half-submerged as if rising from a toxic pool, emanating a visible poison aura. RPG dark fantasy style. Single monster character asset, full body, centered composition, front 3/4 view, clean 2D game illustration, flat colors, bold clean outline, simple cel shading, strong readable silhouette, powerful and menacing design, more complex detail than normal tier, subtle toxic-green dark purple dual rim light for visibility on a black UI, transparent background, no white background, no scene background, no text, no UI, no frame, no watermark, 512x512, high quality, consistent character design across the monster set.
```

`15-battle.png`

```text
Create a single monster character asset for a quiz battle game: Toxic King, the evolved form of Blobby — a massive toxic slime creature with a bloated dark green-black body, glowing poison eyes, acid dripping from jagged fanged mouth, and toxic bubbles forming a crown. Show the monster in a dynamic battle pose, erupting upward and launching a massive torrent of corrosive acid from its open mouth, body distorted and aggressive in the attack. RPG dark fantasy style. Single monster character asset, full body, centered composition, front 3/4 view, clean 2D game illustration, flat colors, bold clean outline, simple cel shading, strong readable silhouette, powerful and menacing design, more complex detail than normal tier, subtle toxic-green dark purple dual rim light for visibility on a black UI, transparent background, no white background, no scene background, no text, no UI, no frame, no watermark, 512x512, high quality, consistent character design across the monster set.
```

---

**Monster 16 — 怒熊霸主 Bear Warlord（強化）**

`16-idle.png`

```text
Create a single monster character asset for a quiz battle game: Bear Warlord, the evolved form of Fluffybear — no longer cute, now a towering battle-hardened bear warlord wearing crude iron war armor with fur-lined shoulder guards, battle scars across its face, blazing eyes, and massive spiked gauntlets. Show the monster in a commanding idle pose, arms crossed and standing tall, radiating battle fury. RPG dark fantasy style. Single monster character asset, full body, centered composition, front 3/4 view, clean 2D game illustration, flat colors, bold clean outline, simple cel shading, strong readable silhouette, powerful and menacing design, more complex detail than normal tier, subtle fire-orange deep brown dual rim light for visibility on a black UI, transparent background, no white background, no scene background, no text, no UI, no frame, no watermark, 512x512, high quality, consistent character design across the monster set.
```

`16-battle.png`

```text
Create a single monster character asset for a quiz battle game: Bear Warlord, the evolved form of Fluffybear — a towering battle-hardened bear warlord wearing crude iron war armor, battle scars, blazing eyes, and massive spiked gauntlets. Show the monster in a dynamic battle pose, rearing up on its hind legs with both spiked gauntlets raised overhead, roaring with absolute ferocity, ready to crush everything. RPG dark fantasy style. Single monster character asset, full body, centered composition, front 3/4 view, clean 2D game illustration, flat colors, bold clean outline, simple cel shading, strong readable silhouette, powerful and menacing design, more complex detail than normal tier, subtle fire-orange deep brown dual rim light for visibility on a black UI, transparent background, no white background, no scene background, no text, no UI, no frame, no watermark, 512x512, high quality, consistent character design across the monster set.
```

---

**Monster 17 — 九尾狐妖 Nine-tail Vixen（強化）**

`17-idle.png`

```text
Create a single monster character asset for a quiz battle game: Nine-tail Vixen, the evolved form of Trickster Fox — a mystical nine-tailed fox spirit with silver and gold fur, all nine tails splayed out in a spectacular fan, glowing arcane symbols hovering around its body, elegant and dangerously beautiful. Show the monster in a poised idle stance, tails spread wide with illusory mirage effects around each one. RPG mystical dark fantasy style. Single monster character asset, full body, centered composition, front 3/4 view, clean 2D game illustration, flat colors, bold clean outline, simple cel shading, strong readable silhouette, powerful and menacing design, more complex detail than normal tier, subtle gold-violet dual rim light for visibility on a black UI, transparent background, no white background, no scene background, no text, no UI, no frame, no watermark, 512x512, high quality, consistent character design across the monster set.
```

`17-battle.png`

```text
Create a single monster character asset for a quiz battle game: Nine-tail Vixen, the evolved form of Trickster Fox — a mystical nine-tailed fox spirit with silver and gold fur, all nine tails splayed out in a spectacular fan, glowing arcane symbols hovering around its body. Show the monster in a dynamic battle pose, spinning with all nine tails sweeping forward in a vortex of illusory energy, surrounded by spiraling mirage clones of itself. RPG mystical dark fantasy style. Single monster character asset, full body, centered composition, front 3/4 view, clean 2D game illustration, flat colors, bold clean outline, simple cel shading, strong readable silhouette, powerful and menacing design, more complex detail than normal tier, subtle gold-violet dual rim light for visibility on a black UI, transparent background, no white background, no scene background, no text, no UI, no frame, no watermark, 512x512, high quality, consistent character design across the monster set.
```

---

**Monster 18 — 幽冥虛空主 Void Sovereign（強化）**

`18-idle.png`

```text
Create a single monster character asset for a quiz battle game: Void Sovereign, the evolved form of Shadowwraith — a towering void entity with a body made of swirling dark matter and fractured space, multiple ghostly arms extending from its torso, a featureless void face with a single blinding white eye, and reality-warping distortions around its edges. Show the monster in an idle hover, arms spread wide with void tendrils drifting outward. RPG dark cosmic horror style. Single monster character asset, full body, centered composition, front 3/4 view, clean 2D game illustration, flat colors, bold clean outline, simple cel shading, strong readable silhouette, powerful and menacing design, more complex detail than normal tier, subtle deep black-magenta dual rim light for visibility on a black UI, transparent background, no white background, no scene background, no text, no UI, no frame, no watermark, 512x512, high quality, consistent character design across the monster set.
```

`18-battle.png`

```text
Create a single monster character asset for a quiz battle game: Void Sovereign, the evolved form of Shadowwraith — a towering void entity with a body made of swirling dark matter, multiple ghostly arms, a featureless void face with a single blinding white eye. Show the monster in a dynamic battle pose, all ghostly arms lunging forward simultaneously with void energy erupting outward in all directions, singularity-like force. RPG dark cosmic horror style. Single monster character asset, full body, centered composition, front 3/4 view, clean 2D game illustration, flat colors, bold clean outline, simple cel shading, strong readable silhouette, powerful and menacing design, more complex detail than normal tier, subtle deep black-magenta dual rim light for visibility on a black UI, transparent background, no white background, no scene background, no text, no UI, no frame, no watermark, 512x512, high quality, consistent character design across the monster set.
```

---

**Monster 19 — 不死帝王 Undying Emperor（強化）**

`19-idle.png`

```text
Create a single monster character asset for a quiz battle game: Undying Emperor, the evolved form of Bone King — a grand undead emperor in ornate bone-plate armor with a full skull face visible through a shattered golden crown, a massive soul-staff crackling with dark energy, and an aura of revival flames that keep it alive. Show the monster in a regal idle pose, holding the staff with one hand and emanating death energy from its empty eye sockets. RPG dark necromancy fantasy style. Single monster character asset, full body, centered composition, front 3/4 view, clean 2D game illustration, flat colors, bold clean outline, simple cel shading, strong readable silhouette, powerful and menacing design, more complex detail than normal tier, subtle violet-gold dual rim light for visibility on a black UI, transparent background, no white background, no scene background, no text, no UI, no frame, no watermark, 512x512, high quality, consistent character design across the monster set.
```

`19-battle.png`

```text
Create a single monster character asset for a quiz battle game: Undying Emperor, the evolved form of Bone King — a grand undead emperor in ornate bone-plate armor with a full skull face, shattered golden crown, a massive soul-staff crackling with dark energy, and revival flames. Show the monster in a dynamic battle pose, slamming the soul-staff into the ground and releasing a wave of undead dark energy in all directions, body wreathed in resurrection flames. RPG dark necromancy fantasy style. Single monster character asset, full body, centered composition, front 3/4 view, clean 2D game illustration, flat colors, bold clean outline, simple cel shading, strong readable silhouette, powerful and menacing design, more complex detail than normal tier, subtle violet-gold dual rim light for visibility on a black UI, transparent background, no white background, no scene background, no text, no UI, no frame, no watermark, 512x512, high quality, consistent character design across the monster set.
```

---

**Monster 20 — 深淵巨龍 Abyss Dragon（強化）**

`20-idle.png`

```text
Create a single monster character asset for a quiz battle game: Abyss Dragon, the evolved form of Abyssal Serpent — a colossal multi-headed abyss dragon with deep purple-black scales that absorb light, three serpent heads each with different glowing eye colors (red, green, violet), enormous wings like torn void fabric, and a massive body coiled with dark energy. Show the monster in an imposing idle pose, all three heads raised and facing different directions. RPG dark abyss fantasy style. Single monster character asset, full body, centered composition, front 3/4 view, clean 2D game illustration, flat colors, bold clean outline, simple cel shading, strong readable silhouette, powerful and menacing design, more complex detail than normal tier, subtle tri-color abyss rim light for visibility on a black UI, transparent background, no white background, no scene background, no text, no UI, no frame, no watermark, 512x512, high quality, consistent character design across the monster set.
```

`20-battle.png`

```text
Create a single monster character asset for a quiz battle game: Abyss Dragon, the evolved form of Abyssal Serpent — a colossal multi-headed abyss dragon with deep purple-black scales, three serpent heads with different colored glowing eyes, wings like void fabric, and massive body coiled with dark energy. Show the monster in a dynamic battle pose, all three heads lunging forward simultaneously each breathing a different color of void-poison energy (dark red, dark green, dark violet), a devastating triple-threat attack. RPG dark abyss fantasy style. Single monster character asset, full body, centered composition, front 3/4 view, clean 2D game illustration, flat colors, bold clean outline, simple cel shading, strong readable silhouette, powerful and menacing design, more complex detail than normal tier, subtle tri-color abyss rim light for visibility on a black UI, transparent background, no white background, no scene background, no text, no UI, no frame, no watermark, 512x512, high quality, consistent character design across the monster set.
```

---

### Boss 怪 Prompt（5 隻 × 2 poses = 10 張）

---

**Monster 21 — 末日火神 Apocalypse Ignis（Boss）**

`21-idle.png`

```text
Create a single BOSS monster character asset for a quiz battle game: Apocalypse Ignis, the god of apocalyptic fire — an immense draconic deity standing twice as tall as a normal monster, armored in volcanic obsidian with rivers of magma running through every joint, six enormous wings engulfed in celestial fire, a crown of erupting volcanoes, and eyes like burning suns. Show the monster in an overwhelming idle pose, wings fully spread and magma flowing freely, radiating apocalyptic heat haze. RPG divine-disaster fantasy style. Single BOSS monster character asset, full body, centered composition, front 3/4 view, clean 2D game illustration, flat colors, bold clean outline, detailed cel shading, MASSIVE imposing silhouette, ultra detailed and complex design far larger than normal monsters, dramatic multi-color orange-white-red rim light aura, transparent background, no white background, no scene background, no text, no UI, no frame, no watermark, 512x512, high quality, consistent character design across the monster set.
```

`21-battle.png`

```text
Create a single BOSS monster character asset for a quiz battle game: Apocalypse Ignis, the god of apocalyptic fire — an immense draconic deity with volcanic obsidian armor, rivers of magma in every joint, six enormous wings engulfed in celestial fire, a crown of erupting volcanoes, and eyes like burning suns. Show the monster in an earth-shattering battle pose, all six wings spread to maximum and unleashing a continent-burning torrent of divine magma and solar fire from its jaws, the sheer scale overwhelming. RPG divine-disaster fantasy style. Single BOSS monster character asset, full body, centered composition, front 3/4 view, clean 2D game illustration, flat colors, bold clean outline, detailed cel shading, MASSIVE imposing silhouette, ultra detailed and complex design, dramatic multi-color orange-white-red rim light aura, transparent background, no white background, no scene background, no text, no UI, no frame, no watermark, 512x512, high quality, consistent character design across the monster set.
```

---

**Monster 22 — 大地終結者 Terra Destroyer（Boss）**

`22-idle.png`

```text
Create a single BOSS monster character asset for a quiz battle game: Terra Destroyer, the colossus that ends worlds — an impossibly large stone titan with a body made of tectonic plates slowly grinding against each other, ancient law-runes carved deep into its surface and glowing gold, multiple massive arms of different stone types, and a featureless stone face with two golden law-seal eyes. Show the monster in a supreme idle pose, arms slowly moving like tectonic forces, with deep cracks of gold light running through its body. RPG ancient-titan fantasy style. Single BOSS monster character asset, full body, centered composition, front 3/4 view, clean 2D game illustration, flat colors, bold clean outline, detailed cel shading, MASSIVE imposing silhouette, ultra detailed and complex design far larger than normal monsters, dramatic gold-deep-brown dual rim light aura, transparent background, no white background, no scene background, no text, no UI, no frame, no watermark, 512x512, high quality, consistent character design across the monster set.
```

`22-battle.png`

```text
Create a single BOSS monster character asset for a quiz battle game: Terra Destroyer, the colossus that ends worlds — an impossibly large stone titan with tectonic plate body, ancient law-runes glowing gold, multiple massive arms, and golden law-seal eyes. Show the monster in a world-ending battle pose, all multiple arms raised simultaneously about to bring down the full weight of tectonic law upon everything, gold runes blazing to maximum intensity, unstoppable force. RPG ancient-titan fantasy style. Single BOSS monster character asset, full body, centered composition, front 3/4 view, clean 2D game illustration, flat colors, bold clean outline, detailed cel shading, MASSIVE imposing silhouette, ultra detailed and complex design, dramatic gold-deep-brown dual rim light aura, transparent background, no white background, no scene background, no text, no UI, no frame, no watermark, 512x512, high quality, consistent character design across the monster set.
```

---

**Monster 23 — 混沌魔神 Chaos Archon（Boss）**

`23-idle.png`

```text
Create a single BOSS monster character asset for a quiz battle game: Chaos Archon, the supreme entity of pure chaos — a towering figure whose body is a constantly shifting form of pure chaos energy, with colors cycling between deep purple, electric white, and void black, multiple faces melting and reforming across its surface, reality-distortion rings orbiting it, and a crown of shattered logic symbols. Show the monster in an eerie idle pose, hovering with its shifting form pulsating and reality bending around it. RPG cosmic-chaos dark fantasy style. Single BOSS monster character asset, full body, centered composition, front 3/4 view, clean 2D game illustration, flat colors, bold clean outline, detailed cel shading, MASSIVE imposing silhouette, ultra detailed and complex design far larger than normal monsters, dramatic multi-spectrum chaos rim light aura, transparent background, no white background, no scene background, no text, no UI, no frame, no watermark, 512x512, high quality, consistent character design across the monster set.
```

`23-battle.png`

```text
Create a single BOSS monster character asset for a quiz battle game: Chaos Archon, the supreme entity of pure chaos — a towering figure of constantly shifting chaos energy, cycling colors between deep purple, electric white, and void black, multiple melting faces, reality-distortion rings. Show the monster in a chaotic battle pose, reality itself tearing apart around it as it unleashes a multi-dimensional chaos explosion, the attack pulling in fragments of existence. RPG cosmic-chaos dark fantasy style. Single BOSS monster character asset, full body, centered composition, front 3/4 view, clean 2D game illustration, flat colors, bold clean outline, detailed cel shading, MASSIVE imposing silhouette, ultra detailed and complex design, dramatic multi-spectrum chaos rim light aura, transparent background, no white background, no scene background, no text, no UI, no frame, no watermark, 512x512, high quality, consistent character design across the monster set.
```

---

**Monster 24 — 雷霆至尊 Thunder Overlord（Boss）**

`24-idle.png`

```text
Create a single BOSS monster character asset for a quiz battle game: Thunder Overlord, the supreme deity of lightning — an immense avian god with a body formed entirely of condensed pure lightning, feathers that are individual lightning bolts, a wingspan that fills the sky, eyes of pure white electricity, and a crown of perpetual storm. Show the monster in an imposing idle stance, standing tall with lightning continuously discharging from its entire body, the air visibly ionized around it. RPG divine-storm fantasy style. Single BOSS monster character asset, full body, centered composition, front 3/4 view, clean 2D game illustration, flat colors, bold clean outline, detailed cel shading, MASSIVE imposing silhouette, ultra detailed and complex design far larger than normal monsters, dramatic pure-white electric-gold dual rim light aura, transparent background, no white background, no scene background, no text, no UI, no frame, no watermark, 512x512, high quality, consistent character design across the monster set.
```

`24-battle.png`

```text
Create a single BOSS monster character asset for a quiz battle game: Thunder Overlord, the supreme deity of lightning — an immense avian god with a body formed entirely of condensed pure lightning, feathers as lightning bolts, a sky-filling wingspan, eyes of pure white electricity. Show the monster in a devastating battle pose, both wings sweeping forward and condensing into a single impossibly bright divine lightning bolt aimed forward, the concentration of electrical energy visible as a white-hot focused beam. RPG divine-storm fantasy style. Single BOSS monster character asset, full body, centered composition, front 3/4 view, clean 2D game illustration, flat colors, bold clean outline, detailed cel shading, MASSIVE imposing silhouette, ultra detailed and complex design, dramatic pure-white electric-gold dual rim light aura, transparent background, no white background, no scene background, no text, no UI, no frame, no watermark, 512x512, high quality, consistent character design across the monster set.
```

---

**Monster 25 — 深淵神明 Abyss Deity（終極 Boss）**

`25-idle.png`

```text
Create a single BOSS monster character asset for a quiz battle game: Abyss Deity, the ultimate final boss embodying ALL fears of knowledge — an incomprehensibly massive entity that combines every elemental force: fire wings, stone body, void darkness, lightning crown, poison aura, storm winds, and natural growth twisted into corruption. Multiple heads representing different fears, countless arms bearing weapons of every type, and a central core of pure dark energy. Show the monster in a supreme idle pose that exudes absolute dominance, all elements swirling around it in a corona of power. RPG ultimate-final-boss dark cosmic style. Single BOSS monster character asset, full body, centered composition, front 3/4 view, clean 2D game illustration, flat colors, bold clean outline, detailed cel shading, SUPREMELY MASSIVE imposing silhouette, the most ultra detailed and complex design of all monsters, dramatic ALL-COLOR multi-element rim light aura (fire, lightning, void, poison, storm), transparent background, no white background, no scene background, no text, no UI, no frame, no watermark, 512x512, high quality, consistent character design across the monster set.
```

`25-battle.png`

```text
Create a single BOSS monster character asset for a quiz battle game: Abyss Deity, the ultimate final boss combining ALL elemental forces — fire wings, stone body, void darkness, lightning crown, poison aura, storm winds. Multiple heads, countless arms. Show the monster in its ultimate battle pose: all elements erupting simultaneously in every direction, a cataclysmic full-power release where fire, lightning, void, poison and storm energy all explode outward at once in a world-ending attack. RPG ultimate-final-boss dark cosmic style. Single BOSS monster character asset, full body, centered composition, front 3/4 view, clean 2D game illustration, flat colors, bold clean outline, detailed cel shading, SUPREMELY MASSIVE imposing silhouette, the most ultra detailed and complex design of all monsters, dramatic ALL-COLOR multi-element rim light aura, transparent background, no white background, no scene background, no text, no UI, no frame, no watermark, 512x512, high quality, consistent character design across the monster set.
```

---

### 新增圖片對應表

| 編號 | 中文名     | 英文名           | 類型 | 屬性       |
| ---- | ---------- | ---------------- | ---- | ---------- |
| 11   | 熔岩龍王   | Magma Overlord   | 強化 | 🔥🌑       |
| 12   | 鐵甲巨人   | Iron Colossus    | 強化 | 🪨⚡       |
| 13   | 死神騎士   | Death Knight     | 強化 | 🌑☠️       |
| 14   | 風暴鷹神   | Storm Hawk       | 強化 | ⚡💨       |
| 15   | 毒液之王   | Toxic King       | 強化 | ☠️💧       |
| 16   | 怒熊霸主   | Bear Warlord     | 強化 | 🌿🔥       |
| 17   | 九尾狐妖   | Nine-tail Vixen  | 強化 | 💨🌑       |
| 18   | 幽冥虛空主 | Void Sovereign   | 強化 | 🌑💨       |
| 19   | 不死帝王   | Undying Emperor  | 強化 | ☠️🌑       |
| 20   | 深淵巨龍   | Abyss Dragon     | 強化 | ☠️🔥🌑     |
| 21   | 末日火神   | Apocalypse Ignis | Boss | 🔥（極限） |
| 22   | 大地終結者 | Terra Destroyer  | Boss | 🪨（極限） |
| 23   | 混沌魔神   | Chaos Archon     | Boss | 🌑⚡💨     |
| 24   | 雷霆至尊   | Thunder Overlord | Boss | ⚡（極限） |
| 25   | 深淵神明   | Abyss Deity      | 終極 | 全屬性     |

</details>

---

<details>
<summary>## 11 項玩法優化規格</summary>

### 1. 連擊獎勵 Combo

- 連續答對 3 題：進入「Combo ×3」狀態
- 每多 1 題：Combo 計數 +1，傷害 = `base × (1 + comboCount × 0.2)`，最高上限 ×2
- 答錯立刻重置 Combo
- 畫面顯示：怪獸旁出現「COMBO ×N 🔥」浮字動畫

### 2. Boss 怪機制

- Boss 出現時 HP = 200（或 300），畫面頂部顯示「BOSS」紅色標籤
- Boss 有「連擊免疫」：Combo 效果對 Boss 上限 ×1.5
- 每答 3 題不論對錯，Boss 強制反擊（player HP -15%）
- 終極 Boss（No.25）HP = 300，技能只能用一次

### 3. 答題計時

- 每題預設 30 秒倒數進度條（可依關卡難度縮短）
- 快速加分：≤5 秒 +50 分，≤10 秒 +20 分
- 時間到自動算錯
- Boss 關卡：計時縮短為 20 秒

### 4. 怪獸台詞系統

- 出場、受傷（輕/中/重）、反擊、被擊敗共 8 種觸發時機
- 台詞以「對話泡泡」顯示在怪獸頭上，3 秒後自動消失
- 多條台詞隨機選一條（避免重複感）

### 5. 技能系統（冷卻型）

每場戰鬥提供 2 個技能，各只能使用 1 次：

| 技能名稱    | 效果                  | 分數影響 |
| ----------- | --------------------- | -------- |
| ⏭️ 跳過本題 | 跳過當前題，不算對/錯 | -30 分   |
| ✂️ 去掉兩個 | 隨機移除 2 個錯誤選項 | -10 分   |

- 使用後按鈕灰掉、顯示「已使用」
- 計時器在技能使用時重置

### 6. 怪獸屬性克制

- 每個怪獸有 1–2 個屬性
- 玩家選題時，若科目屬性與怪獸屬性相剋 → 傷害 ×1.5
- 若無克制關係 → 正常傷害
- 屬性對照：見「25 隻怪獸設計 → 屬性對應表」

### 7. 怪獸解鎖圖鑑（localStorage）

- 每次擊敗一隻新怪，記入 `localStorage.monsters` 的 `unlocked: true`
- 首頁或 BattlePage 新增「圖鑑」Tab，顯示 25 格，未解鎖為黑色問號剪影
- 點擊已解鎖的怪獸格：顯示怪獸大圖 + 名稱 + 屬性 + 「打倒次數」

### 8. 挑戰記錄（localStorage）

記錄以下統計，結果頁顯示個人突破：

| 記錄項目 | 說明                      |
| -------- | ------------------------- |
| 最高分   | 單場最高得分              |
| 最高連擊 | 單場最高 Combo 數         |
| 擊殺總數 | 累積擊敗怪獸次數          |
| 最快通關 | 10 隻普通怪最快時間（秒） |
| 最高連勝 | 連續不輸的場次數          |

### 9. 怪獸等級成長（localStorage）

- 每隻怪有獨立 `timesDefeated` 計數器
- 計數 ≥3：視覺上顯示「🔥 憤怒狀態」（CSS 紅色光暈加強）
- 計數 ≥6：顯示「💀 執念狀態」（光暈更強 + 台詞更有攻擊性）
- 計數增加後下次 HP 自動 +10（上限 +50）

### 10. 多人非同步排行榜（Cloudflare D1）

- 每場結束呼叫 `/api/leaderboard/submit`，記錄 email + 分數 + 日期
- 首頁排行榜顯示「本週前 10 名」
- 防刷分：同 email 同場次每天只記錄最高一次
- 管理者可從 Admin 頁看完整排行

### 11. 劇情模式

- 新增「劇情模式」選項（vs「隨機遭遇模式」）
- 固定 3 章 × 關卡順序（見「世界觀 → 關卡腳本」）
- 每關開始前：全螢幕半透明黑底 + 關卡故事文字（2–3 句）+ 「開始戰鬥」按鈕
- 通關後：過場台詞 + 章節完成畫面
- 進度記入 `localStorage.storyProgress`

</details>

---

<details>
<summary>## 分數公式</summary>

### 基礎計算

```
最終分數 = 基礎分 + 速度獎勵 + 連擊獎勵 + Boss 擊敗獎勵 - 技能扣分
```

### 詳細公式

| 項目         | 計算方式                                       |
| ------------ | ---------------------------------------------- |
| 基礎分       | 答對題數 × 100                                 |
| 速度獎勵     | 每題：≤5 秒答對 +50；≤10 秒答對 +20；>10 秒 +0 |
| 連擊獎勵     | Combo ≥3 時，每題額外 +50；Combo ≥6 時 +100    |
| 怪獸擊敗獎勵 | 每隻普通怪 +200；強化怪 +400；Boss +1000       |
| 技能扣分     | 跳過本題 -30；去掉兩個 -10                     |

### 等級評定

| 分數區間  | 評定 | 說明     |
| --------- | ---- | -------- |
| ≥ 8000    | S    | 知識大師 |
| 6000–7999 | A    | 實力出眾 |
| 4000–5999 | B    | 穩紮穩打 |
| 2000–3999 | C    | 尚需努力 |
| < 2000    | D    | 繼續加油 |

</details>

---

<details>
<summary>## localStorage Schema</summary>

```typescript
// 怪獸個別狀態
interface MonsterRecord {
    id: number; // 1–25
    tier: "normal" | "enhanced" | "boss";
    timesDefeated: number; // 累積擊敗次數
    firstDefeatedAt: string; // ISO 8601 日期
    unlocked: boolean; // 是否已遭遇
    extraHp: number; // 因 timesDefeated 疊加的額外 HP（max 50）
}

// 玩家全局統計
interface BattleStats {
    totalGames: number;
    totalMonstersDefeated: number;
    totalCorrect: number;
    totalWrong: number;
    highestCombo: number;
    highestScore: number;
    fastestClearMs: number; // 最快 10 普通怪通關時間（毫秒）
    highestWinStreak: number;
    currentWinStreak: number;
}

// 劇情模式進度
interface StoryProgress {
    chapter: 1 | 2 | 3; // 目前最高已解鎖章節
    completedStages: number[]; // 已完成的關卡 ID 陣列
    lastPlayedAt: string;
}

// 技能使用紀錄（每場局部，場景清空）
interface SkillState {
    skipUsed: boolean;
    removeUsed: boolean;
}

// localStorage key 對應
// "exam_monsters"     → Record<number, MonsterRecord>
// "exam_stats"        → BattleStats
// "exam_story"        → StoryProgress
// "exam_skill_[date]" → SkillState（當日局）
```

</details>

---

<details>
<summary>## 技術實作規格</summary>

### 圖片擴充

| 項目     | 內容                                         |
| -------- | -------------------------------------------- |
| 新增圖片 | 30 張（強化 20 + Boss 10）✅ 已完成          |
| 路徑     | `src/web/public/images/monsters/`            |
| 命名格式 | `NN-idle.png`、`NN-battle.png`（NN = 11–25） |
| 尺寸     | 512 × 512 px（與現有一致）                   |

**素材來源對應（原始檔名 → 目標檔名）：**

| 原始檔名                 | 目標檔名        | 怪獸       |
| ------------------------ | --------------- | ---------- |
| `Magma Overlord.png`     | `11-idle.png`   | 熔岩龍王   |
| `Magma Overlord_2.png`   | `11-battle.png` | 熔岩龍王   |
| `Iron Colossus.png`      | `12-idle.png`   | 鐵甲巨人   |
| `Iron Colossus_2.png`    | `12-battle.png` | 鐵甲巨人   |
| `Death Knight.png`       | `13-idle.png`   | 死神騎士   |
| `Death Knight_2.png`     | `13-battle.png` | 死神騎士   |
| `Storm Hawk.png`         | `14-idle.png`   | 風暴鷹神   |
| `Storm Hawk_2.png`       | `14-battle.png` | 風暴鷹神   |
| `Toxic King.png`         | `15-idle.png`   | 毒液之王   |
| `Toxic King_2.png`       | `15-battle.png` | 毒液之王   |
| `Bear Warlord.png`       | `16-idle.png`   | 怒熊霸主   |
| `Bear Warlord_2.png`     | `16-battle.png` | 怒熊霸主   |
| `Nine-tail Vixen.png`    | `17-idle.png`   | 九尾狐妖   |
| `Nine-tail Vixen_2.png`  | `17-battle.png` | 九尾狐妖   |
| `Void Sovereign.png`     | `18-idle.png`   | 幽冥虛空主 |
| `Void Sovereign_2.png`   | `18-battle.png` | 幽冥虛空主 |
| `Undying Emperor.png`    | `19-idle.png`   | 不死帝王   |
| `Undying Emperor_2.png`  | `19-battle.png` | 不死帝王   |
| `Abyss Dragon.png`       | `20-idle.png`   | 深淵巨龍   |
| `Abyss Dragon_2.png`     | `20-battle.png` | 深淵巨龍   |
| `Apocalypse Ignis.png`   | `21-idle.png`   | 末日火神   |
| `Apocalypse Ignis_2.png` | `21-battle.png` | 末日火神   |
| `Terra Destroyer.png`    | `22-idle.png`   | 大地終結者 |
| `Terra Destroyer_2.png`  | `22-battle.png` | 大地終結者 |
| `Chaos Archon.png`       | `23-idle.png`   | 混沌魔神   |
| `Chaos Archon_2.png`     | `23-battle.png` | 混沌魔神   |
| `Thunder Overlord.png`   | `24-idle.png`   | 雷霆至尊   |
| `Thunder Overlord_2.png` | `24-battle.png` | 雷霆至尊   |
| `Abyss Deity.png`        | `25-idle.png`   | 深淵神明   |
| `Abyss Deity_2.png`      | `25-battle.png` | 深淵神明   |

### 前端擴充（全在 BattlePage.tsx 範圍內）

| 項目       | 說明                                                         |
| ---------- | ------------------------------------------------------------ |
| 怪獸資料表 | `MONSTER_NAMES`、`MONSTER_GLOW`、`MONSTER_TIER` 擴充至 25 隻 |
| 連擊系統   | `comboCount` state + 傷害係數計算                            |
| 計時系統   | `useEffect` 倒數 + 進度條 UI                                 |
| 技能系統   | `skillState` + 按鈕 UI                                       |
| 台詞系統   | 台詞資料表 + 觸發邏輯 + 泡泡動畫 CSS                         |
| 圖鑑系統   | `localStorage` 讀寫 + 圖鑑 UI                                |
| 紀錄系統   | `localStorage` 讀寫 + 結果頁個人紀錄對比                     |
| 劇情系統   | 劇情資料表 + 進場動畫 + 關卡序列控制                         |

### 後端擴充（Cloudflare D1 + Functions）

| 項目     | 說明                                                    |
| -------- | ------------------------------------------------------- |
| 新增表   | `leaderboard` 表（email, score, subject, date）         |
| 新增 API | `GET /api/leaderboard` + `POST /api/leaderboard/submit` |

</details>

---

<details>
<summary>## 工作拆解與優先順序</summary>

| 優先 | 項目                                | 類型 | 說明                                                                |
| ---- | ----------------------------------- | ---- | ------------------------------------------------------------------- |
| P0   | ~~強化怪 11–20 圖片生成（20 張）~~  | 素材 | ✅ 已完成（2026-05-08）                                             |
| P0   | ~~Boss 怪 21–25 圖片生成（10 張）~~ | 素材 | ✅ 已完成（2026-05-08）                                             |
| P0   | ~~BattlePage 資料表擴充至 25 隻~~   | 前端 | ✅ NAMES / GLOW / TIER 完成                                         |
| P1   | ~~連擊系統~~                        | 前端 | ✅ 已完成（2026-05-08）                                             |
| P1   | ~~答題計時系統~~                    | 前端 | ✅ 已完成（2026-05-08）                                             |
| P1   | ~~怪獸台詞系統~~                    | 前端 | ✅ 已完成（2026-05-08）                                             |
| P2   | ~~技能系統~~                        | 前端 | ✅ 已完成（2026-05-08）                                             |
| P2   | ~~localStorage 統計記錄~~           | 前端 | ✅ 已完成（2026-05-08）                                             |
| P2   | ~~怪獸圖鑑解鎖~~                    | 前端 | ✅ 已完成（2026-05-08）                                             |
| P3   | ~~Boss 特殊機制~~                   | 前端 | ✅ 強制反擊 + 連擊上限 + HP 加成                                    |
| P3   | ~~怪獸屬性克制~~                    | 前端 | ✅ 屬性表 + 克制加成計算                                            |
| P3   | ~~怪獸等級成長~~                    | 前端 | ✅ timesDefeated 讀寫 + CSS 狀態                                    |
| P4   | ~~劇情模式~~                        | 前端 | ✅ StoryPage 3格地圖，怪獸池抽籤，localStorage v2（2026-05-09）     |
| P4   | ~~排行榜~~                          | 後端 | ✅ LeaderboardPage + D1 migration 0004 + GET/POST API（2026-05-09） |
| P5   | 字體大小切換                        | 前端 | 小/中/大三段，套用至題目+選項+解析（待實作）                        |

</details>

---

<details>
<summary>## 驗收標準</summary>

### 環境定義

| 環境    | 指令                                                        | URL                       |
| ------- | ----------------------------------------------------------- | ------------------------- |
| **DEV** | `cd projects/01-exam-study-platform/src/web && npm run dev` | `http://localhost:5173`   |
| **PRD** | `npm run build && npm run cf:deploy`                        | `https://exam.buclaw.org` |

> **原則：每一階段完成後，先在 DEV 驗收所有 Checkpoint，全部通過才能執行下一階段。所有階段在 DEV 驗完，才能 build + deploy 到 PRD。**

---

### DEV 啟動腳本

```powershell
# 啟動 DEV server
Push-Location "D:\Anson\PersonalWorkFlow\projects\01-exam-study-platform\src\web"
npm run dev
# 瀏覽器開 http://localhost:5173
```

### PRD 部署腳本

```powershell
# build + 部署到 exam.buclaw.org
Push-Location "D:\Anson\PersonalWorkFlow\projects\01-exam-study-platform\src\web"
npm run build
npx wrangler pages deploy dist --project-name exam-study-platform --branch main --commit-dirty=true
```

---

### P0 Checkpoint — 怪獸擴充至 25 隻

> **DEV 驗收後，才能進 P1**

| #   | 驗收項目       | 操作步驟                                                 | 預期結果                            |
| --- | -------------- | -------------------------------------------------------- | ----------------------------------- |
| 1   | 素材完整       | `Get-ChildItem public/images/monsters \| Measure-Object` | 共 50 個檔案（01–25 × idle/battle） |
| 2   | 普通怪出圖正確 | DEV 進入對戰模式，觀察 1–10 號怪獸圖片                   | 圖片與原版一致，無破圖              |
| 3   | 強化怪出圖正確 | 手動觸發或暫時調整 `monsterOrder` 讓 11–20 出場          | 新圖正常顯示，有 glow 效果          |
| 4   | Boss 出圖正確  | 同上，讓 21–25 出場                                      | Boss 圖正常顯示                     |
| 5   | 怪獸名稱正確   | 觀察對戰畫面右側怪獸名稱                                 | 顯示正確中文名（如「熔岩龍王」）    |
| 6   | Regression     | 完整跑一場 10 題普通模式                                 | 計分、HP、翻頁、結果頁全部正常      |

---

### P1 Checkpoint — 連擊 + 計時 + 台詞

> **DEV 驗收後，才能進 P2**

| #   | 驗收項目     | 操作步驟                        | 預期結果                                        |
| --- | ------------ | ------------------------------- | ----------------------------------------------- |
| 1   | 連擊計數顯示 | 連續答對 3 題                   | 畫面出現「COMBO ×3 🔥」浮字                     |
| 2   | 連擊傷害加成 | 觀察 Combo 狀態下怪獸 HP 扣血量 | 扣血 > 無 Combo 時（可用 console.log 確認係數） |
| 3   | 連擊重置     | Combo 中答錯 1 題               | Combo 計數歸零                                  |
| 4   | 計時條顯示   | 進入任一題                      | 題目下方出現倒數進度條                          |
| 5   | 計時到自動錯 | 等待 30 秒不作答                | 自動算錯，進入下一題流程                        |
| 6   | 速度加分     | ≤5 秒內答對                     | 結果頁分數包含速度獎勵（可對照公式驗算）        |
| 7   | 台詞出場     | 怪獸切換時                      | 新怪獸出現「出場台詞」對話泡泡                  |
| 8   | 台詞受傷     | 答對造成傷害                    | 怪獸顯示對應受傷台詞（輕/中/重三段）            |
| 9   | 台詞擊敗     | 怪獸 HP 歸零                    | 顯示「被擊敗台詞」                              |
| 10  | Regression   | P0 的 Checkpoint 1–6 全部重跑   | 全部通過                                        |

---

### P2 Checkpoint — 技能 + localStorage + 圖鑑

> **DEV 驗收後，才能進 P3**

| #   | 驗收項目          | 操作步驟                  | 預期結果                                     |
| --- | ----------------- | ------------------------- | -------------------------------------------- |
| 1   | 技能按鈕顯示      | 進入對戰模式              | 畫面有「⏭️ 跳過本題」「✂️ 去掉兩個」2 個按鈕 |
| 2   | 跳過本題          | 按下跳過                  | 題目換下一題，按鈕變灰「已使用」，分數扣 30  |
| 3   | 去掉兩個          | 按下去掉兩個              | 選項中 2 個錯誤選項消失，按鈕變灰，分數扣 10 |
| 4   | 技能不可重複      | 技能用完後再點按鈕        | 無任何反應（灰色無法點擊）                   |
| 5   | localStorage 寫入 | 擊敗一隻怪後重新整理頁面  | 重整後圖鑑該怪顯示已解鎖                     |
| 6   | 最高分更新        | 打出高於歷史最高分        | 結果頁顯示「新紀錄！」                       |
| 7   | 圖鑑頁            | 點開圖鑑 Tab              | 25 格，已打倒的怪有圖，未打倒的是黑色問號    |
| 8   | 圖鑑點擊          | 點擊已解鎖的怪            | 顯示大圖 + 名稱 + 屬性 + 打倒次數            |
| 9   | Regression        | P1 的 Checkpoint 全部重跑 | 全部通過                                     |

---

### P3 Checkpoint — Boss 機制 + 屬性克制 + 怪獸成長

> **DEV 驗收後，才能進 P4**

| #   | 驗收項目         | 操作步驟                                   | 預期結果                                      |
| --- | ---------------- | ------------------------------------------ | --------------------------------------------- |
| 1   | Boss HP 加成     | 讓 21–25 號 Boss 出場                      | Boss HP = 200（或 300），顯示「BOSS」紅色標籤 |
| 2   | Boss 強制反擊    | 在 Boss 戰作答 3 題（不論對錯）            | 玩家 HP 被扣 15%                              |
| 3   | Boss 連擊上限    | Boss 戰中達到高 Combo                      | Combo 傷害上限為 ×1.5（而非普通怪的 ×2）      |
| 4   | 屬性克制加成     | 選擇對應屬性科目對戰克制屬性的怪           | 傷害顯示 ×1.5，可用 console 確認              |
| 5   | 怪獸成長（憤怒） | 打倒同一隻怪 3 次以上（localStorage 累積） | 再次遭遇時光暈變紅，台詞更兇                  |
| 6   | 怪獸成長（執念） | 打倒同一隻怪 6 次以上                      | 光暈更強，HP 比初始 +30 以上                  |
| 7   | Regression       | P2 的 Checkpoint 全部重跑                  | 全部通過                                      |

---

### P4 Checkpoint — 劇情模式 + 排行榜

> **DEV 驗收後，執行 PRD 部署前的最終確認**

| #   | 驗收項目     | 操作步驟                  | 預期結果                                                          |
| --- | ------------ | ------------------------- | ----------------------------------------------------------------- |
| 1   | 劇情模式入口 | 首頁選「劇情模式」        | 進入第一章開場文字畫面                                            |
| 2   | 劇情過場     | 關卡開始前                | 顯示黑底半透明 + 劇情文字 + 「開始戰鬥」按鈕                      |
| 3   | 劇情進度保留 | 通關第一章後重整頁面      | 劇情進度從 localStorage 恢復，不需重打                            |
| 4   | 排行榜提交   | 完成一場對戰              | 呼叫 `POST /api/leaderboard/submit` 成功（DevTools Network 確認） |
| 5   | 排行榜顯示   | 開啟排行榜頁              | 顯示前 10 名，自己的分數在列                                      |
| 6   | 防刷分       | 同 email 同天提交兩次     | 只記錄最高分（D1 資料庫確認）                                     |
| 7   | Regression   | P3 的 Checkpoint 全部重跑 | 全部通過                                                          |

---

### P5 Checkpoint — 字體大小切換

> **可獨立於 P4 驗收**

| #   | 驗收項目          | 操作步驟                     | 預期結果                                      |
| --- | ----------------- | ---------------------------- | --------------------------------------------- |
| 1   | 切換按鈕顯示      | 進入對戰模式任一題           | 右上角（或題目區）有「小 / 中 / 大」切換鈕    |
| 2   | 字體小            | 點選「小」                   | 題目、選項、解析文字變小（text-sm）           |
| 3   | 字體中            | 點選「中」                   | 恢復預設（text-base）                         |
| 4   | 字體大            | 點選「大」                   | 題目、選項、解析文字變大（text-lg / text-xl） |
| 5   | 跨題持續          | 切換後翻到下一題             | 字體設定不重置，持續套用                      |
| 6   | localStorage 保存 | 切換大字後重整頁面           | 重整後字體設定維持「大」                      |
| 7   | Regression        | P0–P4 的核心 Checkpoint 重跑 | 全部通過                                      |

---

### PRD 部署最終 Checkpoint

> **所有 P0–P5 在 DEV 驗完後，才執行此步驟**
