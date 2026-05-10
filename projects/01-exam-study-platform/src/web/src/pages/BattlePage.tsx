import { useCallback, useEffect, useRef, useState } from "react";
import { useSubject } from "../hooks/useSubject";
import { useViewer } from "../hooks/useViewer";
import type { Question, SubjectKey } from "../types";
import { EXAM_GROUPS, SUBJECTS } from "../types";

// ── Monster metadata ──────────────────────────────────────────────────────────
const MONSTER_NAMES: Record<number, string> = {
  // 普通怪 Lv.1–10
  1: "火焰龍",
  2: "石巨人",
  3: "暗黑騎士",
  4: "雷鷹",
  5: "史萊姆球",
  6: "毛球熊",
  7: "惡作劇狐",
  8: "暗影惡靈",
  9: "骷髏王",
  10: "深淵蛇妖",
  // 強化怪 Lv.11–20
  11: "熔岩龍王",
  12: "鐵甲巨人",
  13: "死神騎士",
  14: "風暴鷹神",
  15: "毒液之王",
  16: "怒熊霸主",
  17: "九尾狐妖",
  18: "幽冥虛空主",
  19: "不死帝王",
  20: "深淵巨龍",
  // Boss Lv.21–25
  21: "末日火神",
  22: "大地終結者",
  23: "混沌魔神",
  24: "雷霆至尊",
  25: "深淵神明",
};

const MONSTER_GLOW: Record<number, string> = {
  // 普通怪
  1: "255,140,0",
  2: "0,200,255",
  3: "150,0,255",
  4: "50,150,255",
  5: "0,230,230",
  6: "255,220,80",
  7: "255,120,0",
  8: "180,0,120",
  9: "130,0,220",
  10: "100,0,200",
  // 強化怪（更飽和、更亮）
  11: "255,80,0",
  12: "0,230,255",
  13: "180,0,255",
  14: "80,180,255",
  15: "0,255,180",
  16: "255,200,0",
  17: "255,80,200",
  18: "120,0,255",
  19: "200,0,80",
  20: "60,0,200",
  // Boss（最亮、多色）
  21: "255,60,0",
  22: "220,180,0",
  23: "180,0,220",
  24: "100,200,255",
  25: "255,0,100",
};

// normal = 普通怪, enhanced = 強化怪, boss = Boss
type MonsterTier = "normal" | "enhanced" | "boss";

const MONSTER_TIER: Record<number, MonsterTier> = {
  1: "normal",
  2: "normal",
  3: "normal",
  4: "normal",
  5: "normal",
  6: "normal",
  7: "normal",
  8: "normal",
  9: "normal",
  10: "normal",
  11: "enhanced",
  12: "enhanced",
  13: "enhanced",
  14: "enhanced",
  15: "enhanced",
  16: "enhanced",
  17: "enhanced",
  18: "enhanced",
  19: "enhanced",
  20: "enhanced",
  21: "boss",
  22: "boss",
  23: "boss",
  24: "boss",
  25: "boss",
};

// P3: Attribute system ────────────────────────────────────────────────────────
type MonsterAttribute =
  | "fire"
  | "earth"
  | "dark"
  | "thunder"
  | "water"
  | "nature"
  | "wind"
  | "poison";

const MONSTER_ATTRIBUTES: Record<number, MonsterAttribute[]> = {
  1: ["fire"],
  2: ["earth"],
  3: ["dark"],
  4: ["thunder"],
  5: ["water"],
  6: ["nature"],
  7: ["wind"],
  8: ["dark"],
  9: ["poison"],
  10: ["poison"],
  11: ["fire", "dark"],
  12: ["earth", "thunder"],
  13: ["dark", "poison"],
  14: ["thunder", "wind"],
  15: ["poison", "water"],
  16: ["nature", "fire"],
  17: ["wind", "dark"],
  18: ["dark", "wind"],
  19: ["poison", "dark"],
  20: ["poison", "fire", "dark"],
  21: ["fire"],
  22: ["earth"],
  23: ["dark", "thunder", "wind"],
  24: ["thunder"],
  25: ["fire", "earth", "dark", "thunder", "water", "nature", "wind", "poison"],
};

// Subject key → which attribute(s) it counters
const SUBJECT_COUNTER_ATTRS: Record<string, MonsterAttribute[]> = {
  "ai-planning": ["fire"],
  "gen-ai-basic": ["thunder"],
  "big-data": ["water"],
  "machine-learning": ["dark"],
  "ai-planning-basic": ["nature"],
  fintech: ["wind"],
  "ecommerce-finance-midterm-113": ["poison"],
  "securities-broker-law-110": ["earth"],
  "securities-broker-law-111": ["earth"],
  "securities-broker-law-112": ["earth"],
  "securities-broker-law-113": ["earth"],
  "securities-broker-law-114": ["earth"],
  "securities-broker-law-115": ["earth"],
  "securities-broker-finance-110": ["earth"],
  "securities-broker-finance-111": ["earth"],
  "securities-broker-finance-112": ["earth"],
  "securities-broker-finance-113": ["earth"],
  "securities-broker-finance-114": ["earth"],
  "securities-broker-finance-115": ["earth"],
};

const ATTR_BADGE: Record<MonsterAttribute, string> = {
  fire: "🔥",
  earth: "🪨",
  dark: "🌑",
  thunder: "⚡",
  water: "💧",
  nature: "🌿",
  wind: "💨",
  poison: "☠️",
};

// ── Monster dialogues ─────────────────────────────────────────────────────────
type DialogueTrigger =
  | "spawn"
  | "hitLight"
  | "hitMedium"
  | "hitHeavy"
  | "counter"
  | "defeated";
interface MonsterDialogue {
  spawn?: string[];
  hitLight?: string[];
  hitMedium?: string[];
  hitHeavy?: string[];
  counter?: string[];
  defeated?: string[];
}

const MONSTER_DIALOGUES: Record<number, MonsterDialogue> = {
  1: {
    spawn: ["哼，又一個送上門的蠢材。我的火焰會讓你的考卷化成灰燼！"],
    hitLight: ["嘿！這還挺痛的嘛……"],
    hitMedium: ["你……你竟然真的知道這個！？"],
    hitHeavy: ["不可能……我的火焰怎麼會……"],
    counter: ["接好了！這道題你一定不會！", "哈哈！選錯了吧！燒光你的自信！"],
    defeated: ["……知識的力量，比我的火更燙。下次……我會更強。"],
  },
  2: {
    spawn: ["……（石頭磨擦聲）……你來了。"],
    hitLight: ["唔……"],
    hitMedium: ["嘎……裂縫……"],
    hitHeavy: ["……我……動搖了……"],
    counter: ["（震地一拳）", "……靜止。思考。再答。"],
    defeated: ["……你的知識，比岩石更硬。我……倒下。"],
  },
  3: {
    spawn: ["混沌遮蔽你的視線。你根本看不清正確答案。"],
    hitLight: ["……運氣好。"],
    hitMedium: ["你……看穿了我的幻術？"],
    hitHeavy: ["不可能。你不該知道這個。"],
    counter: [
      "現在，選擇你的恐懼。A、B、C 還是 D？",
      "這道題，連你的老師也不確定答案。",
    ],
    defeated: ["……知識是唯一能驅散黑暗的光。你……找到了它。"],
  },
  4: {
    spawn: ["滴答！滴答！你的時間不多了！"],
    hitLight: ["嘶——！靜電干擾！"],
    hitMedium: ["你的反應……比閃電還快？！"],
    hitHeavy: ["……電路……超載……"],
    counter: ["時間到！！答不出來就是錯！", "閃電一擊！你躲得過嗎？！"],
    defeated: ["速度……不是唯一的武器。你的準確度……打敗了我。"],
  },
  5: {
    spawn: ["嗚嗚嗚……我好怕……（偷笑）哈！騙你的！"],
    hitLight: ["哎呀哎呀……好痛痛……（假哭）"],
    hitMedium: ["你……你真的要欺負我嗎！"],
    hitHeavy: ["嗚——不公平！我本來就很脆弱！"],
    counter: ["嘿嘿，偷偷給你加個難題！", "彈回去！這道題你一定沒讀過！"],
    defeated: ["……你真的很認真讀書嘛。嗚嗚，我輸得心服口服啦。"],
  },
  6: {
    spawn: ["安安，我不想打架……但你來了，我也沒辦法呢～"],
    hitLight: ["唉唉，好痛……你幹嘛嘛……"],
    hitMedium: ["你……真的很厲害耶……（開始認真了）"],
    hitHeavy: ["不行了！！毛球熊怒了！！"],
    counter: ["巨熊拍！！痛死你！", "這題連毛球熊都懂！你呢？！"],
    defeated: ["嗚嗚嗚……你是我見過最厲害的考生了……加油喔。"],
  },
  7: {
    spawn: ["嘻嘻～選 A 還是選 B？嗯嗯嗯？我不說～"],
    hitLight: ["哎！被你識破了一個！"],
    hitMedium: ["你是念過書的！？這不公平！"],
    hitHeavy: ["……狡猾的我……輸給了更認真的你……"],
    counter: [
      "嘿！這題有兩個看起來都對的！選哪個？嘿嘿嘿！",
      "答案就藏在你最不想選的那個裡面！",
    ],
    defeated: ["你……把我所有的把戲都拆穿了。讀書的力量，真可怕。"],
  },
  8: {
    spawn: ["……你的猶豫……是我的養分。"],
    hitLight: ["……光。"],
    hitMedium: ["……你的確定性……傷到我了。"],
    hitHeavy: ["……我……消散……"],
    counter: ["……懷疑，現在開始侵入你的腦。", "……你真的確定嗎？……再想想……"],
    defeated: ["……堅定的知識，是唯一驅散我的武器。……去吧。"],
  },
  9: {
    spawn: ["以無知之名，本王詛咒你的每一個答案。"],
    hitLight: ["嗚嗚……骨頭……"],
    hitMedium: ["竟敢傷本王！？汝命休矣！"],
    hitHeavy: ["本王……不能倒……"],
    counter: ["詛咒！讓你的下一題必定答錯！", "此題乃本王專精之術，汝必敗！"],
    defeated: ["……知識之光，終究勝過詛咒之暗。本王……承認你。"],
  },
  10: {
    spawn: ["不急……我們有的是時間……慢慢來……選吧……"],
    hitLight: ["……嘶……"],
    hitMedium: ["你……沒有被我的毒霧迷惑……"],
    hitHeavy: ["……清醒的……頭腦……是毒的天敵……"],
    counter: [
      "毒霧散開……你的視線，開始模糊……",
      "……選 C……還是 A 呢……哪個更讓你迷惑……",
    ],
    defeated: ["……你抵抗了混淆。第一章的試煉，結束了。繼續前進吧……"],
  },
  11: {
    spawn: ["你打敗了我的前身？那只會讓我更憤怒。岩漿吞噬一切！"],
    hitMedium: ["……你進步了。但還不夠！"],
    defeated: ["……我的熾焰，被你的知識澆熄。"],
  },
  12: {
    spawn: ["……我吸收了雷電的力量。你的知識之劍，能穿透鋼鐵嗎？"],
    hitMedium: ["……電流……被打散了……"],
    defeated: ["……硬度不等於正確。你讓我明白了這道理。"],
  },
  13: {
    spawn: ["我不再只靠幻術。這次，我帶著死亡詛咒來了。"],
    hitMedium: ["……你識破了詛咒？不……不可能……"],
    defeated: ["……死亡，從未是知識的對手。我敗了。"],
  },
  14: {
    spawn: ["我的翅膀已成為颶風。你有 3 秒。現在開始！"],
    hitMedium: ["你……在颶風中還能看清題目？！"],
    defeated: ["……速度與準確，你兩者兼備。我，認輸。"],
  },
  15: {
    spawn: ["你以為打敗了一顆小史萊姆，就能擋住毒海嗎？哈哈哈！"],
    hitMedium: ["毒液……被你的知識中和了！？"],
    defeated: ["……毒，無法腐蝕真正的理解。你贏了。"],
  },
  16: {
    spawn: ["毛球熊死了。現在站在你面前的，是怒火的霸主。準備好了嗎？"],
    hitMedium: ["……我感受到了……知識的力量……"],
    defeated: ["……憤怒，終究比不上冷靜的學習。……我輸了，服了。"],
  },
  17: {
    spawn: ["一條尾巴的小把戲，你破解了。那九條尾巴的迷陣呢？"],
    hitMedium: ["你……同時識破了幾個迷陣？！這不可能！"],
    defeated: ["……九條尾的謊言，敗給了一顆誠實的學習之心。"],
  },
  18: {
    spawn: ["……你穿越了黑暗。但虛空，沒有邊界。"],
    hitMedium: ["……你的專注，切開了虛空。"],
    defeated: ["……虛空的唯一解藥，是確定性。你做到了。"],
  },
  19: {
    spawn: ["本王死過一次了。死亡，已無法奈我何。你準備好面對不死之敵嗎？"],
    hitMedium: ["痛！但帝王……不倒！"],
    defeated: ["……你兩次都打敗了我。知識的力量……連不死之身都無法抵擋。"],
  },
  20: {
    spawn: [
      "……你走到了深處。這裡的毒，是知識的絕望。我是你在這一層的最後試煉。",
    ],
    hitMedium: ["……你的知識之刃，深入了深淵。"],
    defeated: ["……第二章終結。第三章的試煉，遠超過你的想像。……去吧。"],
  },
  21: {
    spawn: ["考試是火。你不是來滅火的——你是來穿越它的。燒吧！"],
    hitMedium: ["……烈焰中，你還能保持清醒？"],
    hitHeavy: ["……神火……動搖了……"],
    defeated: ["……你穿越了末日之火。你的知識，是最高溫的火焰。"],
  },
  22: {
    spawn: ["我是所有法規的重量。你扛得起嗎？"],
    hitMedium: ["……龜裂……巨岩也能被知識侵蝕……"],
    defeated: ["……你記住了每一條法規的重量，並將它化為武器。我，崩塌。"],
  },
  23: {
    spawn: ["混沌。一切的根源。你以為你讀懂了知識？你只是觸碰了皮毛。"],
    hitMedium: ["……你在混沌中找到了秩序。可怕。"],
    defeated: ["……秩序勝過混沌。你，是例外中的例外。"],
  },
  24: {
    spawn: ["我是最快的知識考驗。你有 20 秒。每一秒都是一道閃電。"],
    hitMedium: ["……你的反應……比閃電更快！？這不可能！"],
    defeated: ["……你的速度與正確率，超越了閃電。我承認你的實力。"],
  },
  25: {
    spawn: [
      "……你終於來了。我是你所有恐懼的集合。每一題都是你內心的懷疑。你，真的準備好了嗎？",
    ],
    hitLight: ["……有趣。"],
    hitMedium: ["……你的知識……真的在成長……"],
    hitHeavy: ["……我……從未如此受傷……"],
    counter: ["你以為你贏了？這只是第一階段！", "……你的猶豫，是我最後的武器！"],
    defeated: [
      "……你做到了。你戰勝了自己所有的恐懼與懶惰。這個試煉之境，屬於你了。去吧——帶著你的知識，面對真正的考場。",
    ],
  },
};

// ── localStorage (P2) ─────────────────────────────────────────────────────────
const LS_MONSTERS = "exam_monsters";
const LS_STATS = "exam_stats";

interface MonsterRecord {
  id: number;
  tier: MonsterTier;
  timesDefeated: number;
  firstDefeatedAt: string;
  unlocked: boolean;
}

interface BattleStats {
  totalGames: number;
  totalMonstersDefeated: number;
  totalCorrect: number;
  totalWrong: number;
  highestCombo: number;
  highestScore: number;
  highestWinStreak: number;
  currentWinStreak: number;
}

const DEFAULT_STATS: BattleStats = {
  totalGames: 0,
  totalMonstersDefeated: 0,
  totalCorrect: 0,
  totalWrong: 0,
  highestCombo: 0,
  highestScore: 0,
  highestWinStreak: 0,
  currentWinStreak: 0,
};

function loadMonsters(): Record<number, MonsterRecord> {
  try {
    return JSON.parse(localStorage.getItem(LS_MONSTERS) ?? "{}") as Record<
      number,
      MonsterRecord
    >;
  } catch {
    return {};
  }
}
function saveMonsters(m: Record<number, MonsterRecord>) {
  try {
    localStorage.setItem(LS_MONSTERS, JSON.stringify(m));
  } catch {
    /* quota */
  }
}
function loadStats(): BattleStats {
  try {
    return {
      ...DEFAULT_STATS,
      ...(JSON.parse(
        localStorage.getItem(LS_STATS) ?? "{}",
      ) as Partial<BattleStats>),
    };
  } catch {
    return { ...DEFAULT_STATS };
  }
}
function saveStats(s: BattleStats) {
  try {
    localStorage.setItem(LS_STATS, JSON.stringify(s));
  } catch {
    /* quota */
  }
}

// ── Types ─────────────────────────────────────────────────────────────────────
type AppPhase = "select" | "loading" | "battle" | "result";
type AnswerState = "idle" | "correct" | "wrong";
type MonsterAnim = "idle" | "hit" | "attack";

interface SessionData {
  sessionId: number;
  monsterOrder: number[];
  totalQuestions: number;
  qPerMonster: number;
  maxWrong: number;
}

interface GameResult {
  score: number;
  status: string;
  correctCount: number;
  wrongCount: number;
  totalQuestions: number;
  monstersDefeated: number;
  pointsEarned: number;
  rewards: Array<{ type: string; points: number; description: string }>;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function shuffleArray<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function dicebearUrl(email: string) {
  return `https://api.dicebear.com/9.x/adventurer/svg?seed=${encodeURIComponent(email)}`;
}

function monsterImg(id: number, anim: MonsterAnim) {
  const state = anim === "idle" ? "idle" : "battle";
  return `/images/monsters/${String(id).padStart(2, "0")}-${state}.png`;
}

// ── HP Bar ────────────────────────────────────────────────────────────────────
function HpBar({
  hp,
  color,
  label,
}: {
  hp: number;
  color: string;
  label: string;
}) {
  const pct = Math.max(0, Math.min(100, hp));
  const barColor = pct > 50 ? color : pct > 25 ? "#f59e0b" : "#ef4444";
  return (
    <div className="w-full">
      <div className="flex justify-between text-xs mb-0.5 font-mono">
        <span className="opacity-70">{label}</span>
        <span>{pct}%</span>
      </div>
      <div className="w-full bg-gray-800 rounded-full h-2.5 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{ width: `${pct}%`, backgroundColor: barColor }}
        />
      </div>
    </div>
  );
}

// ── Pokedex Overlay ─────────────────────────────────────────────────────────
function PokedexOverlay({
  records,
  detail,
  setDetail,
  onClose,
}: {
  records: Record<number, MonsterRecord>;
  detail: number | null;
  setDetail: (id: number | null) => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      <div className="flex-none h-12 flex items-center justify-between px-4 border-b border-gray-800">
        <span className="text-sm font-bold text-white">怪獸圖鑑</span>
        <button
          onClick={onClose}
          className="text-gray-500 text-xs hover:text-gray-300"
        >
          ✕ 關閉
        </button>
      </div>

      {detail ? (
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <img
            src={monsterImg(detail, "idle")}
            alt={MONSTER_NAMES[detail]}
            className="h-44 object-contain mb-3"
            style={{
              filter: `drop-shadow(0 0 20px rgba(${MONSTER_GLOW[detail] ?? "118,255,0"},0.6))`,
            }}
          />
          <h2 className="text-xl font-black text-white">
            {MONSTER_NAMES[detail]}
          </h2>
          <div className="mt-1 flex gap-2 items-center justify-center">
            <span
              className={`text-xs px-2 py-0.5 rounded-full border ${
                MONSTER_TIER[detail] === "boss"
                  ? "border-red-500 text-red-400"
                  : MONSTER_TIER[detail] === "enhanced"
                    ? "border-purple-500 text-purple-400"
                    : "border-green-600 text-green-500"
              }`}
            >
              {MONSTER_TIER[detail] === "boss"
                ? "Boss"
                : MONSTER_TIER[detail] === "enhanced"
                  ? "強化怪"
                  : "普通怪"}
            </span>
            <span className="text-xs text-gray-500">
              #{String(detail).padStart(2, "0")}
            </span>
          </div>
          <p className="mt-3 text-sm text-gray-400">
            擊敗次數：
            <span className="text-yellow-400 font-bold">
              {records[detail]?.timesDefeated ?? 0}
            </span>
          </p>
          <p className="mt-1 text-xs text-gray-600">
            首次擊敗：
            {records[detail]?.firstDefeatedAt
              ? new Date(records[detail].firstDefeatedAt).toLocaleDateString(
                  "zh-TW",
                )
              : "—"}
          </p>
          <button
            onClick={() => setDetail(null)}
            className="mt-6 px-6 py-2 rounded border border-gray-700 text-gray-400 text-sm hover:text-white hover:border-gray-500"
          >
            ← 返回圖鑑
          </button>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-5 gap-2">
            {Array.from({ length: 25 }, (_, i) => i + 1).map((id) => {
              const rec = records[id];
              const isUnlocked = rec?.unlocked ?? false;
              return (
                <button
                  key={id}
                  onClick={() => isUnlocked && setDetail(id)}
                  className={`aspect-square rounded-lg border flex flex-col items-center justify-center p-1 transition-colors ${
                    isUnlocked
                      ? "border-gray-700 bg-gray-900 hover:border-gray-500 cursor-pointer"
                      : "border-gray-800 bg-gray-950 cursor-default"
                  }`}
                >
                  {isUnlocked ? (
                    <img
                      src={monsterImg(id, "idle")}
                      alt={MONSTER_NAMES[id]}
                      className="w-full h-auto object-contain"
                      style={{
                        filter: `drop-shadow(0 0 4px rgba(${MONSTER_GLOW[id] ?? "118,255,0"},0.4))`,
                      }}
                    />
                  ) : (
                    <span className="text-gray-700 text-xl font-black">?</span>
                  )}
                  <span className="text-gray-600 text-xs mt-0.5">
                    {String(id).padStart(2, "0")}
                  </span>
                </button>
              );
            })}
          </div>
          <p className="text-center text-xs text-gray-700 mt-4">
            已解鎖 {Object.values(records).filter((r) => r.unlocked).length} /
            25
          </p>
        </div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
interface BattlePageProps {
  /** Pre-selected subject key passed from Home.tsx (embedded mode) */
  initialKey?: SubjectKey;
  /** Pre-selected session label passed from Home.tsx (embedded mode) */
  initialSession?: string;
  /** Limit question count (story mode: 10 / 15 / 25). Sliced from shuffled pool. */
  questionCount?: number;
  /** Lock battle to a single specific monster (story mode). Overrides monsterOrder. */
  initialMonsterId?: number;
  /** Called when user exits battle (← 換科目 / ✕ quit) in embedded mode */
  onBack?: () => void;
  /** Called when the battle fully ends (result screen reached). Used by StoryPage. */
  onComplete?: (
    score: number,
    status: string,
    monstersDefeated: number,
  ) => void;
}

export default function BattlePage({
  initialKey,
  initialSession,
  questionCount,
  initialMonsterId,
  onBack,
  onComplete,
}: BattlePageProps = {}) {
  const { viewer, loading: viewerLoading } = useViewer();

  // Embedded mode: subject + session already chosen by Home.tsx
  const isEmbedded = Boolean(initialKey && initialSession);
  const hasAutoStarted = useRef(false);

  // Phase
  const [phase, setPhase] = useState<AppPhase>("select");

  // Selection — pre-filled when launched from Home.tsx
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [selectedKey, setSelectedKey] = useState<SubjectKey | null>(
    initialKey ?? null,
  );
  const [selectedSession, setSelectedSession] = useState<string | null>(
    initialSession ?? null,
  );

  // Game data
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  // Monster state — switching triggered by HP reaching 0, NOT by question index
  const [currentMonsterIndex, setCurrentMonsterIndex] = useState(0);
  const [_currentMonsterCorrect, setCurrentMonsterCorrect] = useState(0);
  const [monstersDefeated, setMonstersDefeated] = useState(0);

  // Answer state
  const [answerState, setAnswerState] = useState<AnswerState>("idle");
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Visual state
  const [monsterAnim, setMonsterAnim] = useState<MonsterAnim>("idle");
  const [monsterAnimKey, setMonsterAnimKey] = useState(0);
  const [damageText, setDamageText] = useState<{
    text: string;
    key: number;
  } | null>(null);
  const [showDefeated, setShowDefeated] = useState(false);

  // Result
  const [gameResult, setGameResult] = useState<GameResult | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  // P1: Combo system
  const [comboCount, setComboCount] = useState(0);
  // P1: Timer system
  const [timeLeft, setTimeLeft] = useState(30);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutFiredRef = useRef(false);
  // P1: Speech bubble
  const [speechBubble, setSpeechBubble] = useState<string | null>(null);
  const [speechBubbleKey, setSpeechBubbleKey] = useState(0);
  const speechTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // P1: Accumulated score
  const [totalScore, setTotalScore] = useState(0);

  // P2: Skills
  const [skillSkipUsed, setSkillSkipUsed] = useState(false);
  const [skillRemoveUsed, setSkillRemoveUsed] = useState(false);
  const [hiddenOptions, setHiddenOptions] = useState<string[]>([]);
  // P2: Stats + Pokedex
  const [displayStats, setDisplayStats] = useState<BattleStats>(() =>
    loadStats(),
  );
  const gameStartStatsRef = useRef<BattleStats>(loadStats());
  const maxComboRef = useRef(0);
  const [showPokedex, setShowPokedex] = useState(false);
  const [pokedexDetail, setPokedexDetail] = useState<number | null>(null);
  const [pokedexRecords, setPokedexRecords] = useState<
    Record<number, MonsterRecord>
  >({});

  // P3: Boss mechanics + monster growth
  const bossAnswerCountRef = useRef(0); // per-monster answer count in Boss fights
  const [bossCounterDamage, setBossCounterDamage] = useState(0); // 0–100 visual HP reduction
  const [currentMonsterDamage, setCurrentMonsterDamage] = useState(0); // actual damage dealt (with multipliers)
  const monstersRecordRef = useRef<Record<number, MonsterRecord>>({}); // loaded once per battle

  // P5: Font size preference (persisted)
  type FontSize = "sm" | "md" | "lg";
  const [fontSize, setFontSize] = useState<FontSize>(() => {
    try {
      return (localStorage.getItem("exam_font_size") as FontSize) ?? "md";
    } catch {
      return "md";
    }
  });
  const cycleFontSize = () => {
    const next: FontSize =
      fontSize === "sm" ? "md" : fontSize === "md" ? "lg" : "sm";
    setFontSize(next);
    try {
      localStorage.setItem("exam_font_size", next);
    } catch {
      /* noop */
    }
  };
  const fontClass =
    fontSize === "sm" ? "text-sm" : fontSize === "lg" ? "text-lg" : "text-base";

  const { data: subjectData, loading: subjectLoading } =
    useSubject(selectedKey);
  const answerStartTime = useRef<number>(Date.now());

  const allowedSubjectSet = new Set(viewer.allowedSubjects);
  const visibleGroups = EXAM_GROUPS.filter((g) =>
    g.subjectKeys.some((k) => allowedSubjectSet.has(k)),
  );
  const visibleSubjects = SUBJECTS.filter(
    (s) => s.groupKey === selectedGroup && allowedSubjectSet.has(s.key),
  );

  // ── Computed values ─────────────────────────────────────────────────────────
  const sd = sessionData;
  // damage per correct answer (base value per hit without multipliers)
  const damage = sd ? Math.floor(100 / sd.qPerMonster) : 20;
  const totalMonsters = sd ? sd.monsterOrder.length : 10;
  const safeMonsterIndex = Math.min(currentMonsterIndex, totalMonsters - 1);
  const currentMonsterId = sd ? (sd.monsterOrder[safeMonsterIndex] ?? 1) : 1;

  // P3: Monster growth from localStorage defeat history
  const growthLevel = (() => {
    const td = monstersRecordRef.current[currentMonsterId]?.timesDefeated ?? 0;
    return td >= 6 ? 2 : td >= 3 ? 1 : 0;
  })();
  // P3: Boss HP (200), final boss HP (300), growth bonus +30 for lv2
  const monsterBaseHp =
    currentMonsterId === 25
      ? 300
      : currentMonsterId >= 21
        ? 200
        : 100 + (growthLevel >= 2 ? 30 : 0);

  const monsterHp = sd
    ? Math.max(
        0,
        Math.round(
          ((monsterBaseHp - currentMonsterDamage) / monsterBaseHp) * 100,
        ),
      )
    : 100;
  const playerHp = sd
    ? Math.max(
        0,
        Math.round(((sd.maxWrong - wrongCount) / sd.maxWrong) * 100) -
          bossCounterDamage,
      )
    : 100;

  // P3: Attribute counter multiplier (×1.5 when subject counters monster's attribute)
  const attributeMultiplier = (() => {
    if (!selectedKey || currentMonsterId === 25) return 1;
    const subjectAttrs = SUBJECT_COUNTER_ATTRS[selectedKey] ?? [];
    const monsterAttrs = MONSTER_ATTRIBUTES[currentMonsterId] ?? [];
    return subjectAttrs.some((a) => monsterAttrs.includes(a)) ? 1.5 : 1;
  })();

  const question = questions[currentIndex] ?? null;

  // Helper: show speech bubble (auto-dismiss after 3s)
  const showDialogue = useCallback(
    (monsterId: number, trigger: DialogueTrigger) => {
      const lines = MONSTER_DIALOGUES[monsterId]?.[trigger];
      if (!lines || lines.length === 0) return;
      const line = lines[Math.floor(Math.random() * lines.length)];
      if (speechTimerRef.current) clearTimeout(speechTimerRef.current);
      setSpeechBubble(line);
      setSpeechBubbleKey((k) => k + 1);
      speechTimerRef.current = setTimeout(() => setSpeechBubble(null), 3000);
    },
    [],
  );

  // Reset answer timer + start countdown when question changes
  useEffect(() => {
    if (phase !== "battle") return;
    answerStartTime.current = Date.now();
    const isBoss = currentMonsterId >= 21;
    setTimeLeft(isBoss ? 20 : 30);
    timeoutFiredRef.current = false;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, phase]);

  // Stop timer when user answers
  useEffect(() => {
    if (answerState !== "idle" && timerRef.current) {
      clearInterval(timerRef.current);
    }
  }, [answerState]);

  // Handle timeout (time ran out without answering)
  useEffect(() => {
    if (
      timeLeft === 0 &&
      answerState === "idle" &&
      phase === "battle" &&
      !timeoutFiredRef.current
    ) {
      timeoutFiredRef.current = true;
      // Treat timeout as wrong answer
      setAnswerState("wrong");
      setSelectedAnswer(null);
      setWrongCount((w) => w + 1);
      setComboCount(0);
      setMonsterAnim("attack");
      setMonsterAnimKey((k) => k + 1);
      setTimeout(() => setMonsterAnim("idle"), 600);
      if (currentMonsterId) {
        showDialogue(currentMonsterId, "counter");
      }
      // P3: Boss counter on timeout
      if (currentMonsterId >= 21) {
        bossAnswerCountRef.current += 1;
        if (bossAnswerCountRef.current % 3 === 0) {
          setBossCounterDamage((prev) => Math.min(100, prev + 15));
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, answerState, phase]);

  // Embedded mode: auto-start battle once subject data has loaded
  useEffect(() => {
    if (
      !isEmbedded ||
      hasAutoStarted.current ||
      phase !== "select" ||
      !subjectData ||
      subjectLoading
    )
      return;
    hasAutoStarted.current = true;
    void handleStartBattle();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEmbedded, phase, subjectData, subjectLoading]);

  // ── API calls ──────────────────────────────────────────────────────────────
  const startSession = useCallback(
    async (
      subjectKey: string,
      sessionLabel: string,
      totalQuestions: number,
    ) => {
      const res = await fetch("/api/quiz/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subjectKey, sessionLabel, totalQuestions }),
      });
      if (!res.ok) throw new Error("Failed to create session");
      return res.json() as Promise<SessionData>;
    },
    [],
  );

  const submitAnswer = useCallback(
    async (params: {
      sessionId: number;
      questionIndex: number;
      selectedAnswer: string;
      correctAnswer: string;
      monsterId: number;
      answerTimeMs: number;
      explanationShown: boolean;
    }) => {
      const res = await fetch("/api/quiz/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
      if (!res.ok) throw new Error("Failed to submit answer");
      return res.json() as Promise<{ isCorrect: boolean }>;
    },
    [],
  );

  const finalizeResult = useCallback(
    async (sessionId: number, status: "passed" | "failed" | "gameover") => {
      const res = await fetch("/api/quiz/result", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, status }),
      });
      if (!res.ok) throw new Error("Failed to finalize result");
      return res.json() as Promise<GameResult>;
    },
    [],
  );

  // ── Game flow ──────────────────────────────────────────────────────────────
  const handleStartBattle = async () => {
    if (!selectedKey || !selectedSession || !subjectData) return;
    const sessionObj = subjectData.sessions.find(
      (s) => s.session === selectedSession,
    );
    if (!sessionObj) return;

    setPhase("loading");
    setApiError(null);
    try {
      const shuffled = shuffleArray(sessionObj.questions);
      const limited = questionCount
        ? shuffled.slice(0, questionCount)
        : shuffled;
      let sd: SessionData;
      try {
        sd = await startSession(selectedKey, selectedSession, limited.length);
      } catch {
        // API 不可用時改用 local fallback，不阻斷遊戲
        const total = limited.length;
        const qPerMonster = Math.max(1, Math.ceil(total / 10));
        sd = {
          sessionId: -1,
          monsterOrder: shuffleArray(
            Array.from({ length: 10 }, (_, i) => i + 1),
          ),
          totalQuestions: total,
          qPerMonster,
          maxWrong: Math.max(1, Math.floor(total * 0.3)),
        };
      }
      setSessionData(sd);
      // Story mode: lock to the single pre-drawn monster
      if (initialMonsterId) {
        setSessionData({
          ...sd,
          monsterOrder: [initialMonsterId],
          qPerMonster: limited.length,
        });
      }
      setQuestions(limited);
      setCurrentIndex(0);
      setCorrectCount(0);
      setWrongCount(0);
      setCurrentMonsterIndex(0);
      setCurrentMonsterCorrect(0);
      setMonstersDefeated(0);
      setAnswerState("idle");
      setSelectedAnswer(null);
      setShowExplanation(false);
      // P1: reset combo / score / dialogue
      setComboCount(0);
      setTotalScore(0);
      setSpeechBubble(null);
      // P2: reset skills + capture pre-game stats
      setSkillSkipUsed(false);
      setSkillRemoveUsed(false);
      setHiddenOptions([]);
      maxComboRef.current = 0;
      gameStartStatsRef.current = loadStats();
      // P3: reset boss mechanics + load monster growth records
      setBossCounterDamage(0);
      setCurrentMonsterDamage(0);
      bossAnswerCountRef.current = 0;
      monstersRecordRef.current = loadMonsters();
      setPhase("battle");
      // Show first monster spawn dialogue
      const firstId = sd.monsterOrder[0] ?? 1;
      setTimeout(() => showDialogue(firstId, "spawn"), 600);
    } catch {
      setApiError("資料載入失敗，請重試");
      setPhase("select");
    }
  };

  const handleSelectAnswer = async (choice: string) => {
    if (answerState !== "idle" || !question || !sessionData || isSubmitting)
      return;
    const answerTimeMs = Date.now() - answerStartTime.current;
    setSelectedAnswer(choice);
    setIsSubmitting(true);

    const isCorrect = choice === question.answer;
    setAnswerState(isCorrect ? "correct" : "wrong");

    // ── Combo ──────────────────────────────────────────────────────────────
    const newCombo = isCorrect ? comboCount + 1 : 0;
    setComboCount(newCombo);
    maxComboRef.current = Math.max(maxComboRef.current, newCombo);

    // P3: Combo multiplier for monster HP damage (Boss capped at ×1.5)
    const isBossMonster = currentMonsterId >= 21;
    const comboMult = isBossMonster
      ? newCombo >= 3
        ? 1.5
        : 1
      : newCombo >= 6
        ? 2
        : newCombo >= 3
          ? 1.5
          : 1;
    const monsterDmg = isCorrect
      ? Math.round(damage * comboMult * attributeMultiplier)
      : 0;
    if (isCorrect) setCurrentMonsterDamage((d) => d + monsterDmg);

    // ── Score (base + speed bonus + combo bonus) ───────────────────────────
    let pts = 0;
    if (isCorrect) {
      pts = 100; // base
      const secs = answerTimeMs / 1000;
      if (secs <= 5) pts += 50;
      else if (secs <= 10) pts += 20;
      if (newCombo >= 6) pts += 100;
      else if (newCombo >= 3) pts += 50;
    }
    const newTotalScore = totalScore + pts;
    if (pts > 0) setTotalScore(newTotalScore);

    // ── Dialogue trigger ───────────────────────────────────────────────────
    const newMonsterDamage = currentMonsterDamage + monsterDmg;
    const hpAfterPct = Math.max(
      0,
      Math.round(((monsterBaseHp - newMonsterDamage) / monsterBaseHp) * 100),
    );
    if (isCorrect) {
      // P3: angry/obsessed monsters skip hitLight
      const trigger: DialogueTrigger =
        growthLevel >= 1
          ? hpAfterPct > 33
            ? "hitMedium"
            : "hitHeavy"
          : hpAfterPct > 66
            ? "hitLight"
            : hpAfterPct > 33
              ? "hitMedium"
              : "hitHeavy";
      showDialogue(currentMonsterId, trigger);
    } else {
      showDialogue(currentMonsterId, "counter");
    }

    // ── Visual feedback ────────────────────────────────────────────────────
    if (isCorrect) {
      setMonsterAnim("hit");
      setMonsterAnimKey((k) => k + 1);
      const hasAttrBonus = attributeMultiplier > 1;
      const label = hasAttrBonus
        ? `🎯 克制！×1.5${newCombo >= 3 ? ` COMBO ×${newCombo}` : ""}`
        : newCombo >= 3
          ? `COMBO ×${newCombo} 命中！`
          : "命中！";
      setDamageText({ text: label, key: Date.now() });
      setTimeout(() => {
        setMonsterAnim("idle");
        setDamageText(null);
      }, 700);
    } else {
      setMonsterAnim("attack");
      setMonsterAnimKey((k) => k + 1);
      setTimeout(() => setMonsterAnim("idle"), 600);
    }

    // ── Update local state ─────────────────────────────────────────────────
    const newCorrect = correctCount + (isCorrect ? 1 : 0);
    const newWrong = wrongCount + (isCorrect ? 0 : 1);
    setCorrectCount(newCorrect);
    setWrongCount(newWrong);

    if (isCorrect) {
      setCurrentMonsterCorrect((c) => c + 1);
    }

    // P3: Boss counter attack (every 3 answers, correct or wrong)
    if (isBossMonster) {
      bossAnswerCountRef.current += 1;
      if (bossAnswerCountRef.current % 3 === 0) {
        setBossCounterDamage((prev) => Math.min(100, prev + 15));
        showDialogue(currentMonsterId, "counter");
      }
    }

    // ── Fire-and-forget to server ──────────────────────────────────────────
    submitAnswer({
      sessionId: sessionData.sessionId,
      questionIndex: currentIndex,
      selectedAnswer: choice,
      correctAnswer: question.answer,
      monsterId: currentMonsterId,
      answerTimeMs,
      explanationShown: false,
    }).catch(() => {
      /* best-effort */
    });

    // ── Game-over check ────────────────────────────────────────────────────
    const remaining = questions.length - (currentIndex + 1);
    const maxPossibleScore =
      ((newCorrect + remaining) / questions.length) * 100;
    if (maxPossibleScore < 70) {
      setTimeout(async () => {
        // P2: record stats on gameover
        recordGameStats({
          correct: newCorrect,
          wrong: newWrong,
          maxCombo: maxComboRef.current,
          finalScore: newTotalScore,
          won: false,
          defeatedCount: monstersDefeated,
        });
        try {
          const result = await finalizeResult(
            sessionData.sessionId,
            "gameover",
          );
          setGameResult(result);
        } catch {
          setGameResult({
            score: Math.round((newCorrect / questions.length) * 100),
            status: "gameover",
            correctCount: newCorrect,
            wrongCount: newWrong,
            totalQuestions: questions.length,
            monstersDefeated,
            pointsEarned: newTotalScore,
            rewards: [],
          });
        }
        await submitLeaderboard(
          Math.round((newCorrect / questions.length) * 100),
          monstersDefeated,
        );
        onComplete?.(
          Math.round((newCorrect / questions.length) * 100),
          "gameover",
          monstersDefeated,
        );
        setPhase("result");
      }, 900);
    }

    setIsSubmitting(false);
  };

  const handleNextQuestion = async () => {
    if (!sessionData || !question) return;
    const nextIndex = currentIndex + 1;

    // P3: Kill check uses actual damage (combo/attribute multipliers included)
    const isBoss = currentMonsterId >= 21;
    const baseHp =
      currentMonsterId === 25
        ? 300
        : isBoss
          ? 200
          : 100 + (growthLevel >= 2 ? 30 : 0);
    const newMonsterHp = Math.max(0, baseHp - currentMonsterDamage);
    if (
      newMonsterHp <= 0 &&
      currentMonsterIndex < (sessionData?.monsterOrder.length ?? 10)
    ) {
      showDialogue(currentMonsterId, "defeated");
      // P2: save monster defeat record
      const mRecs = loadMonsters();
      const existing = mRecs[currentMonsterId];
      mRecs[currentMonsterId] = {
        id: currentMonsterId,
        tier: MONSTER_TIER[currentMonsterId] ?? "normal",
        timesDefeated: (existing?.timesDefeated ?? 0) + 1,
        firstDefeatedAt: existing?.firstDefeatedAt ?? new Date().toISOString(),
        unlocked: true,
      };
      saveMonsters(mRecs);
      setShowDefeated(true);
      const newDefeated = monstersDefeated + 1;
      setMonstersDefeated(newDefeated);
      await new Promise<void>((res) => setTimeout(res, 1200));
      setShowDefeated(false);
      const nextMonIdx = Math.min(
        currentMonsterIndex + 1,
        (sessionData?.monsterOrder.length ?? 10) - 1,
      );
      setCurrentMonsterIndex(nextMonIdx);
      setCurrentMonsterCorrect(0);
      setCurrentMonsterDamage(0);
      bossAnswerCountRef.current = 0;
      // Show spawn dialogue for incoming monster
      const nextMonsterId = sessionData.monsterOrder[nextMonIdx] ?? 1;
      setTimeout(() => showDialogue(nextMonsterId, "spawn"), 300);
    }

    // Game finished
    if (nextIndex >= questions.length) {
      const score = Math.round((correctCount / questions.length) * 100);
      const status = score >= 70 ? "passed" : "failed";
      // P2: record stats
      recordGameStats({
        correct: correctCount,
        wrong: wrongCount,
        maxCombo: maxComboRef.current,
        finalScore: totalScore,
        won: status === "passed",
        defeatedCount: monstersDefeated,
      });
      try {
        const result = await finalizeResult(sessionData.sessionId, status);
        setGameResult(result);
      } catch {
        setGameResult({
          score,
          status,
          correctCount,
          wrongCount,
          totalQuestions: questions.length,
          monstersDefeated,
          pointsEarned: totalScore,
          rewards: [],
        });
      }
      await submitLeaderboard(score, monstersDefeated);
      onComplete?.(score, status, monstersDefeated);
      setPhase("result");
      return;
    }

    setCurrentIndex(nextIndex);
    setAnswerState("idle");
    setSelectedAnswer(null);
    setShowExplanation(false);
    setHiddenOptions([]);
  };

  // P2: Record game stats
  function recordGameStats(params: {
    correct: number;
    wrong: number;
    maxCombo: number;
    finalScore: number;
    won: boolean;
    defeatedCount: number;
  }) {
    const stats = loadStats();
    const newStats: BattleStats = {
      totalGames: stats.totalGames + 1,
      totalMonstersDefeated: stats.totalMonstersDefeated + params.defeatedCount,
      totalCorrect: stats.totalCorrect + params.correct,
      totalWrong: stats.totalWrong + params.wrong,
      highestCombo: Math.max(stats.highestCombo, params.maxCombo),
      highestScore: Math.max(stats.highestScore, params.finalScore),
      highestWinStreak: params.won
        ? Math.max(stats.highestWinStreak, stats.currentWinStreak + 1)
        : stats.highestWinStreak,
      currentWinStreak: params.won ? stats.currentWinStreak + 1 : 0,
    };
    saveStats(newStats);
    setDisplayStats(newStats);
  }

  // P4: Submit to leaderboard (fire-and-forget, auth-guarded by API)
  async function submitLeaderboard(score: number, monstersDefeated: number) {
    if (!selectedKey) return;
    try {
      await fetch("/api/leaderboard/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjectKey: selectedKey,
          score,
          monstersDefeated,
          displayName: viewer.email ?? undefined,
        }),
      });
    } catch {
      // Non-critical — silently ignore network errors
    }
  }

  // P2: Skip question skill (-30 pts, advance without scoring)
  const handleSkipQuestion = () => {
    if (skillSkipUsed || answerState !== "idle" || !sessionData || !question)
      return;
    setSkillSkipUsed(true);
    setTotalScore((s) => Math.max(0, s - 30));
    void handleNextQuestion();
  };

  // P2: Remove two wrong options (-10 pts, restart timer)
  const handleRemoveTwo = () => {
    if (skillRemoveUsed || answerState !== "idle" || !question) return;
    setSkillRemoveUsed(true);
    setTotalScore((s) => Math.max(0, s - 10));
    const wrongOpts = (["A", "B", "C", "D"] as const).filter(
      (l) => l !== question.answer,
    );
    setHiddenOptions(shuffleArray([...wrongOpts]).slice(0, 2));
    // Restart timer
    const isBoss = currentMonsterId >= 21;
    const newTime = isBoss ? 20 : 30;
    setTimeLeft(newTime);
    timeoutFiredRef.current = false;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // ── Loading / auth guards ──────────────────────────────────────────────────
  if (viewerLoading) {
    return (
      <div className="h-dvh bg-black flex items-center justify-center text-green-400 text-sm">
        載入中…
      </div>
    );
  }

  if (!viewer.email) {
    return (
      <div className="h-dvh bg-black flex flex-col items-center justify-center gap-4 text-red-400 text-sm">
        <p>請先透過 Cloudflare Access 登入</p>
      </div>
    );
  }

  // Embedded mode: skip select UI, show loading while auto-starting
  if (isEmbedded && (phase === "select" || phase === "loading")) {
    if (apiError && phase === "select") {
      return (
        <div className="h-dvh bg-black flex flex-col items-center justify-center gap-4">
          <p className="text-red-400 text-sm">{apiError}</p>
          {onBack && (
            <button
              onClick={onBack}
              className="text-xs text-green-400 hover:text-white transition"
            >
              ← 返回
            </button>
          )}
        </div>
      );
    }
    return (
      <div className="h-dvh bg-black flex items-center justify-center text-green-400 text-sm">
        準備對戰…
      </div>
    );
  }

  // ── Select View ────────────────────────────────────────────────────────────
  if (phase === "select" || phase === "loading") {
    const selectedSubjectData = SUBJECTS.find((s) => s.key === selectedKey);
    const sessions = subjectData?.sessions ?? [];
    const isReady = selectedKey && selectedSession && !subjectLoading;

    return (
      <div className="min-h-dvh bg-black text-gray-200 flex flex-col items-center px-4 py-8">
        <div className="w-full max-w-sm">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-start justify-between">
              <div>
                <div className="mb-1 inline-block rounded-sm bg-green-500 px-2 py-0.5 text-xs font-bold tracking-widest text-black uppercase">
                  Anson's Study Platform
                </div>
                <h1 className="mt-2 text-2xl font-black text-white">
                  ⚔ 怪獸對戰模式
                </h1>
              </div>
              <div className="flex flex-col items-end gap-2 mt-1">
                <button
                  onClick={() => {
                    setPokedexRecords(loadMonsters());
                    setPokedexDetail(null);
                    setShowPokedex(true);
                  }}
                  className="text-xs text-gray-500 hover:text-yellow-400 transition-colors"
                >
                  圖鑑 →
                </button>
                <button
                  onClick={cycleFontSize}
                  className="text-xs font-mono font-bold text-[#76b900] hover:text-white transition-colors"
                  title="切換字體大小"
                >
                  字體：
                  {fontSize === "sm" ? "小" : fontSize === "md" ? "中" : "大"}
                </button>
              </div>
            </div>
            <p className="mt-1 text-xs text-gray-600">
              {viewer.isAdmin
                ? `管理者：${viewer.email}`
                : `已登入：${viewer.email ?? "使用者"}`}
            </p>
            {viewer.isAdmin && (
              <a
                href="/admin/access"
                className="mt-1 inline-block text-xs text-green-400 hover:text-white transition"
              >
                進入權限管理 →
              </a>
            )}
          </div>

          {apiError && (
            <div className="mb-4 p-3 bg-red-900/50 border border-red-500 rounded text-red-300 text-sm">
              {apiError}
            </div>
          )}

          {/* Step 1: Group */}
          <section className="mb-5">
            <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider">
              ① 選擇科目群組
            </p>
            <div className="flex flex-col gap-2">
              {visibleGroups.map((g) => (
                <button
                  key={g.key}
                  onClick={() => {
                    setSelectedGroup(g.key);
                    setSelectedKey(null);
                    setSelectedSession(null);
                  }}
                  className={`text-left px-4 py-3 rounded border text-sm transition-colors ${
                    selectedGroup === g.key
                      ? "border-green-400 bg-green-900/30 text-green-300"
                      : "border-gray-700 hover:border-gray-500 text-gray-400"
                  }`}
                >
                  {g.title}
                </button>
              ))}
            </div>
          </section>

          {/* Step 2: Subject */}
          {selectedGroup && (
            <section className="mb-5">
              <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider">
                ② 選擇科目
              </p>
              <div className="flex flex-col gap-2">
                {visibleSubjects.map((s) => (
                  <button
                    key={s.key}
                    onClick={() => {
                      setSelectedKey(s.key);
                      setSelectedSession(null);
                    }}
                    className={`text-left px-4 py-3 rounded border text-sm transition-colors ${
                      selectedKey === s.key
                        ? "border-green-400 bg-green-900/30 text-green-300"
                        : "border-gray-700 hover:border-gray-500 text-gray-400"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Step 3: Session */}
          {selectedKey && (
            <section className="mb-6">
              <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider">
                ③ 選擇年份 / 場次
              </p>
              {subjectLoading ? (
                <p className="text-gray-600 text-sm">載入中…</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {sessions.map((s) => (
                    <button
                      key={s.session}
                      onClick={() => setSelectedSession(s.session)}
                      className={`text-left px-4 py-3 rounded border text-sm transition-colors ${
                        selectedSession === s.session
                          ? "border-green-400 bg-green-900/30 text-green-300"
                          : "border-gray-700 hover:border-gray-500 text-gray-400"
                      }`}
                    >
                      <span className="font-medium">{s.session}</span>
                      <span className="text-xs text-gray-500 ml-2">
                        {s.questions.length} 題
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Info card */}
          {isReady && selectedSubjectData && (
            <div className="mb-6 p-3 border border-gray-700 rounded text-xs text-gray-400 space-y-1">
              <p>📋 科目：{selectedSubjectData.label}</p>
              <p>🗓 場次：{selectedSession}</p>
              <p>
                📝 題數：
                {subjectData?.sessions.find(
                  (s) => s.session === selectedSession,
                )?.questions.length ?? "?"}{" "}
                題
              </p>
              <p>🎯 及格：70 分（答對 70% 以上）</p>
            </div>
          )}

          {/* Start button */}
          <button
            onClick={handleStartBattle}
            disabled={!isReady || phase === "loading"}
            className="w-full py-4 rounded-lg font-bold text-base transition-colors disabled:opacity-40 disabled:cursor-not-allowed bg-green-500 hover:bg-green-400 text-black"
          >
            {phase === "loading" ? "準備中…" : "⚔ 開始對戰"}
          </button>

          {/* Personal stats preview */}
          {displayStats.totalGames > 0 && (
            <div className="mt-4 p-3 bg-gray-900/60 border border-gray-800 rounded-lg text-xs text-gray-500 grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="text-yellow-400 font-bold text-sm">
                  {displayStats.highestScore}
                </div>
                <div>最高分</div>
              </div>
              <div>
                <div className="text-orange-400 font-bold text-sm">
                  ×{displayStats.highestCombo}
                </div>
                <div>最高連擊</div>
              </div>
              <div>
                <div className="text-green-400 font-bold text-sm">
                  {displayStats.totalMonstersDefeated}
                </div>
                <div>累積擊敗</div>
              </div>
            </div>
          )}
        </div>
        {/* Pokedex overlay */}
        {showPokedex && (
          <PokedexOverlay
            records={pokedexRecords}
            detail={pokedexDetail}
            setDetail={setPokedexDetail}
            onClose={() => {
              setShowPokedex(false);
              setPokedexDetail(null);
            }}
          />
        )}
      </div>
    );
  }

  // ── Battle View ────────────────────────────────────────────────────────────
  if (phase === "battle" && sessionData && question) {
    const baseGlow = MONSTER_GLOW[currentMonsterId] ?? "118,255,0";
    // P3: Growth level shifts glow toward red
    const glow = (() => {
      if (growthLevel >= 2) return "255,30,30";
      if (growthLevel >= 1) {
        const [r, g, b] = baseGlow.split(",").map(Number);
        return `${Math.min(255, Math.round((r + 255) / 2))},${Math.round(g / 2)},${Math.round(b / 2)}`;
      }
      return baseGlow;
    })();
    const monsterName =
      MONSTER_NAMES[currentMonsterId] ?? `怪獸 ${currentMonsterId}`;
    const imgSrc = monsterImg(currentMonsterId, monsterAnim);
    const progress = Math.round(((currentIndex + 1) / questions.length) * 100);
    const optionLabels = ["A", "B", "C", "D"] as const;

    const getOptionStyle = (label: string) => {
      if (answerState === "idle") {
        return "border-gray-700 hover:border-green-400 hover:bg-green-900/20 text-gray-300 cursor-pointer";
      }
      if (label === question.answer) {
        return "border-green-400 bg-green-900/40 text-green-300";
      }
      if (label === selectedAnswer && label !== question.answer) {
        return "border-red-500 bg-red-900/30 text-red-300";
      }
      return "border-gray-800 text-gray-600 cursor-default";
    };

    return (
      <div className="h-dvh overflow-hidden bg-black flex items-center justify-center">
        <div className="w-full max-w-sm h-dvh flex flex-col relative">
          {/* ── A: Top Bar ────────────────────────────── */}
          <div className="flex-none">
            <div className="h-12 flex items-center justify-between px-4 border-b border-gray-800">
              <button
                onClick={() => {
                  if (confirm("退出後本次對戰不會記分，確定離開？")) {
                    if (onBack) {
                      onBack();
                      return;
                    }
                    setPhase("select");
                  }
                }}
                className="text-gray-600 text-xs hover:text-gray-400"
              >
                ✕
              </button>
              <div className="flex items-center gap-3 text-xs font-mono text-gray-400">
                <span className="text-green-400 font-bold">
                  {currentIndex + 1}
                  <span className="text-gray-600">/{questions.length}</span>
                </span>
                <span>✓{correctCount}</span>
                <span className="text-red-400">✗{wrongCount}</span>
                {comboCount >= 3 && (
                  <span className="text-orange-400 font-bold animate-pulse">
                    ×{comboCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={cycleFontSize}
                  className="text-xs font-mono font-bold text-[#76b900] hover:text-white transition-colors px-1"
                  title="切換字體大小"
                >
                  {fontSize === "sm" ? "小" : fontSize === "md" ? "中" : "大"}
                </button>
                <span
                  className={`text-xs font-mono font-bold w-6 text-right ${
                    timeLeft <= 5
                      ? "text-red-400"
                      : timeLeft <= 10
                        ? "text-yellow-400"
                        : "text-gray-500"
                  }`}
                >
                  {answerState === "idle" ? timeLeft : ""}
                </span>
                <div className="w-14 bg-gray-800 rounded-full h-1.5">
                  <div
                    className="h-full bg-green-500 rounded-full transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>
            {/* Timer bar */}
            {answerState === "idle" && (
              <div className="h-0.5 bg-gray-800">
                <div
                  className="h-full transition-all duration-1000 ease-linear"
                  style={{
                    width: `${(timeLeft / (currentMonsterId >= 21 ? 20 : 30)) * 100}%`,
                    backgroundColor:
                      timeLeft > 10
                        ? "#4ade80"
                        : timeLeft > 5
                          ? "#f59e0b"
                          : "#ef4444",
                  }}
                />
              </div>
            )}
          </div>

          {/* ── B: Monster Zone ───────────────────────── */}
          <div className="flex-[3] min-h-0 flex flex-col items-center justify-center px-4 py-2 relative">
            {/* Monster name + HP */}
            <div className="w-full mb-2">
              <div className="flex justify-between items-center mb-1 gap-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-sm font-bold text-gray-200 truncate">
                    {monsterName}
                  </span>
                  {growthLevel >= 2 && (
                    <span className="text-xs text-red-400 font-bold flex-none">
                      【執念】
                    </span>
                  )}
                  {growthLevel === 1 && (
                    <span className="text-xs text-orange-400 font-bold flex-none">
                      【憤怒】
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 flex-none">
                  {currentMonsterId >= 21 && (
                    <span className="text-xs font-black tracking-wider text-red-400 border border-red-800 rounded px-1 py-0 leading-tight">
                      BOSS
                    </span>
                  )}
                  {(MONSTER_ATTRIBUTES[currentMonsterId] ?? []).map((a) => (
                    <span key={a} className="text-sm leading-none">
                      {ATTR_BADGE[a]}
                    </span>
                  ))}
                  {attributeMultiplier > 1 && (
                    <span className="text-xs text-green-400 font-bold">
                      克制
                    </span>
                  )}
                </div>
              </div>
              <HpBar hp={monsterHp} color={`rgb(${glow})`} label="Monster HP" />
              {currentMonsterId >= 21 && (
                <div className="text-xs text-gray-700 text-right mt-0.5 font-mono">
                  {Math.max(0, monsterBaseHp - currentMonsterDamage)}/
                  {monsterBaseHp}
                </div>
              )}
            </div>

            {/* Speech bubble */}
            {speechBubble && (
              <div key={speechBubbleKey} className="w-full mb-1 px-1 anim-in">
                <div className="relative inline-block max-w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-1.5 text-xs text-gray-200 leading-snug">
                  {speechBubble}
                  <div className="absolute -bottom-1.5 left-6 w-2.5 h-2.5 bg-gray-800 border-r border-b border-gray-600 rotate-45" />
                </div>
              </div>
            )}

            {/* Monster image + damage text */}
            <div className="relative flex items-center justify-center h-36">
              <img
                key={monsterAnimKey}
                src={imgSrc}
                alt={monsterName}
                className={`h-full object-contain select-none ${
                  monsterAnim === "hit"
                    ? "anim-flash anim-shake"
                    : monsterAnim === "attack"
                      ? "anim-attack"
                      : ""
                }`}
                style={{ filter: `drop-shadow(0 0 12px rgba(${glow},0.5))` }}
              />
              {damageText && (
                <div
                  key={damageText.key}
                  className={`absolute top-2 right-4 anim-float font-bold text-lg pointer-events-none ${
                    comboCount >= 3 ? "text-orange-400" : "text-yellow-300"
                  }`}
                >
                  {damageText.text}
                </div>
              )}
              {showDefeated && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="anim-in text-yellow-400 font-black text-xl text-center drop-shadow-lg">
                    怪獸擊敗！
                  </span>
                </div>
              )}
            </div>

            {/* Monster progress dots */}
            <div className="flex gap-1.5 mt-1">
              {sessionData.monsterOrder.map((id, i) => {
                const isDefeated = i < currentMonsterIndex;
                const isCurrent =
                  i === safeMonsterIndex && currentMonsterIndex < totalMonsters;
                return (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      isDefeated
                        ? "bg-yellow-400"
                        : isCurrent
                          ? "bg-green-400"
                          : "bg-gray-800"
                    }`}
                    title={MONSTER_NAMES[id]}
                  />
                );
              })}
            </div>
          </div>

          {/* ── C: Player Zone ────────────────────────── */}
          <div className="flex-none flex flex-col border-t border-b border-gray-800">
            <div className="h-12 flex items-center gap-3 px-4">
              <img
                src={dicebearUrl(viewer.email ?? "")}
                alt="avatar"
                className="w-9 h-9 rounded-full bg-gray-800 flex-none"
              />
              <div className="flex-1">
                <HpBar hp={playerHp} color="#4ade80" label="Player HP" />
              </div>
              <div className="text-right text-xs font-mono text-gray-500 flex-none">
                <div className="text-green-400">{totalScore}pt</div>
                <div>容錯 {Math.max(0, sessionData.maxWrong - wrongCount)}</div>
              </div>
            </div>
            {/* Skill buttons */}
            <div className="h-9 flex items-center gap-2 px-3 pb-1 border-t border-gray-800/60">
              <button
                onClick={handleSkipQuestion}
                disabled={skillSkipUsed || answerState !== "idle"}
                className={`flex-1 py-1 rounded text-xs font-medium transition-colors ${
                  skillSkipUsed
                    ? "bg-gray-800 text-gray-600 cursor-not-allowed"
                    : "bg-yellow-900/40 border border-yellow-700 text-yellow-400 hover:bg-yellow-900/60"
                }`}
              >
                {skillSkipUsed ? "⏭ 已使用" : "⏭ 跳過 (-30)"}
              </button>
              <button
                onClick={handleRemoveTwo}
                disabled={skillRemoveUsed || answerState !== "idle"}
                className={`flex-1 py-1 rounded text-xs font-medium transition-colors ${
                  skillRemoveUsed
                    ? "bg-gray-800 text-gray-600 cursor-not-allowed"
                    : "bg-purple-900/40 border border-purple-700 text-purple-400 hover:bg-purple-900/60"
                }`}
              >
                {skillRemoveUsed ? "✂ 已使用" : "✂ 去掉兩個 (-10)"}
              </button>
            </div>
          </div>

          {/* ── D: Question Zone ──────────────────────── */}
          <div className="flex-[4] min-h-0 overflow-y-auto flex flex-col px-4 py-3">
            <p
              className={`${fontClass} text-gray-200 mb-3 leading-relaxed flex-none`}
            >
              {question.question}
            </p>

            {/* 程式碼區塊 */}
            {question.code_block && (
              <div className="mb-3 overflow-x-auto rounded-lg border border-[#2a2a2a] bg-[#0d0d0d] flex-none">
                <pre className="p-3 text-xs leading-relaxed text-green-300 whitespace-pre">
                  <code>{question.code_block}</code>
                </pre>
              </div>
            )}

            {/* 題目圖片 */}
            {question.image_url && (
              <div className="mb-3 flex-none">
                <img
                  src={question.image_url}
                  alt={`第 ${question.no} 題圖片`}
                  loading="lazy"
                  className="max-w-full rounded-lg border border-[#2a2a2a]"
                  onError={(e) => {
                    const t = e.currentTarget;
                    t.style.display = "none";
                    const ph = t.nextElementSibling as HTMLElement | null;
                    if (ph) ph.style.display = "flex";
                  }}
                />
                <div
                  style={{ display: "none" }}
                  className="items-center gap-2 rounded-lg border border-dashed border-[#3a3a3a] bg-[#0d0d0d] px-3 py-2 text-xs text-gray-500"
                >
                  <span className="text-yellow-500">⚠</span>
                  本題含附圖，圖片尚未上傳，請參考原始試題
                </div>
              </div>
            )}

            <div className="flex flex-col gap-2 flex-none">
              {optionLabels
                .filter((label) => !hiddenOptions.includes(label))
                .map((label) => (
                  <button
                    key={label}
                    disabled={answerState !== "idle"}
                    onClick={() => handleSelectAnswer(label)}
                    className={`w-full text-left px-3 py-2.5 rounded border ${fontClass} transition-colors ${getOptionStyle(label)}`}
                  >
                    <span className="font-bold mr-2">{label}.</span>
                    {question.options[label]}
                  </button>
                ))}
            </div>

            {/* Next button / explanation trigger */}
            {answerState !== "idle" && (
              <div className="mt-4 flex flex-col gap-2 flex-none">
                {answerState === "wrong" &&
                  !showExplanation &&
                  question.explanation && (
                    <button
                      onClick={() => setShowExplanation(true)}
                      className="w-full py-2.5 rounded border border-blue-600 text-blue-400 text-sm hover:bg-blue-900/20 transition-colors"
                    >
                      查看解析
                    </button>
                  )}
                <button
                  onClick={handleNextQuestion}
                  className="w-full py-3 rounded font-bold text-sm bg-green-500 hover:bg-green-400 text-black transition-colors"
                >
                  {currentIndex + 1 >= questions.length
                    ? "查看結果 →"
                    : "下一題 →"}
                </button>
              </div>
            )}
          </div>

          {/* ── E: Explanation Sheet (bottom overlay) ─── */}
          {showExplanation && question.explanation && (
            <div className="absolute inset-0 bg-black/80 flex items-end z-10">
              <div className="w-full bg-gray-900 border-t border-gray-700 rounded-t-xl p-5 max-h-[60%] overflow-y-auto">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-bold text-green-400">解析</span>
                  <button
                    onClick={() => setShowExplanation(false)}
                    className="text-gray-500 text-xs hover:text-gray-300"
                  >
                    收起 ✕
                  </button>
                </div>
                <p className="text-xs text-gray-400 mb-2">
                  正確答案：
                  <span className="text-green-400 font-bold">
                    {question.answer}
                  </span>
                </p>
                <p className={`${fontClass} text-gray-300 leading-relaxed`}>
                  {question.explanation}
                </p>
                <button
                  onClick={() => {
                    setShowExplanation(false);
                    handleNextQuestion();
                  }}
                  className="mt-4 w-full py-2.5 rounded bg-green-500 hover:bg-green-400 text-black font-bold text-sm"
                >
                  {currentIndex + 1 >= questions.length
                    ? "查看結果 →"
                    : "下一題 →"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Result View ────────────────────────────────────────────────────────────
  if (phase === "result" && gameResult) {
    const passed = gameResult.score >= 70;
    const statusText =
      gameResult.status === "gameover"
        ? "遊戲結束"
        : passed
          ? "通過！"
          : "未通過";
    const statusColor =
      gameResult.status === "gameover"
        ? "text-red-400"
        : passed
          ? "text-green-400"
          : "text-yellow-400";

    return (
      <div className="min-h-dvh bg-black text-gray-200 flex flex-col items-center px-4 py-8">
        <div className="w-full max-w-sm">
          {/* Title */}
          <div className="text-center mb-6">
            <div className={`text-4xl font-black mb-1 ${statusColor}`}>
              {statusText}
            </div>
            <div className="text-5xl font-black text-white">
              {gameResult.score}
              <span className="text-2xl text-gray-500"> 分</span>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            {[
              {
                label: "答對",
                value: `${gameResult.correctCount} 題`,
                color: "text-green-400",
              },
              {
                label: "答錯",
                value: `${gameResult.wrongCount} 題`,
                color: "text-red-400",
              },
              {
                label: "擊敗怪獸",
                value: `${gameResult.monstersDefeated} / 10`,
                color: "text-yellow-400",
              },
              {
                label: "獲得積分",
                value: `+${gameResult.pointsEarned || totalScore}`,
                color: "text-blue-400",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="bg-gray-900 rounded-lg p-3 text-center border border-gray-800"
              >
                <div className={`text-xl font-bold ${item.color}`}>
                  {item.value}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">{item.label}</div>
              </div>
            ))}
          </div>

          {/* Rewards */}
          {gameResult.rewards.length > 0 && (
            <div className="mb-5 p-3 bg-gray-900 rounded-lg border border-gray-800">
              <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider">
                獎勵明細
              </p>
              {gameResult.rewards.map((r, i) => (
                <div
                  key={i}
                  className="flex justify-between text-sm py-1 border-b border-gray-800 last:border-0"
                >
                  <span className="text-gray-400">{r.description}</span>
                  <span className="text-yellow-400 font-mono">+{r.points}</span>
                </div>
              ))}
            </div>
          )}

          {/* Personal records */}
          {displayStats.totalGames > 0 && (
            <div className="mb-5 p-3 bg-gray-900 rounded-lg border border-gray-800">
              <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider">
                個人紀錄
              </p>
              {[
                {
                  label: "歷史最高分",
                  value: displayStats.highestScore,
                  highlight:
                    totalScore > gameStartStatsRef.current.highestScore &&
                    totalScore > 0,
                  color: "text-yellow-400",
                },
                {
                  label: "最高連擊",
                  value: `×${displayStats.highestCombo}`,
                  highlight:
                    maxComboRef.current >
                    gameStartStatsRef.current.highestCombo,
                  color: "text-orange-400",
                },
                {
                  label: "累積擊敗怪獸",
                  value: displayStats.totalMonstersDefeated,
                  highlight: false,
                  color: "text-green-400",
                },
                {
                  label: "連勝場數",
                  value: displayStats.currentWinStreak,
                  highlight: false,
                  color: "text-blue-400",
                },
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex justify-between items-center text-sm py-1 border-b border-gray-800 last:border-0"
                >
                  <span className="text-gray-400">{row.label}</span>
                  <span className={`font-mono font-bold ${row.color}`}>
                    {row.value}
                    {row.highlight && (
                      <span className="ml-1 text-xs text-yellow-300">NEW</span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <button
              onClick={() => {
                setGameResult(null);
                setSessionData(null);
                setQuestions([]);
                if (isEmbedded) {
                  // Reset auto-start guard so the effect fires again
                  hasAutoStarted.current = false;
                }
                setPhase("select");
              }}
              className="w-full py-4 rounded-lg font-bold text-base bg-green-500 hover:bg-green-400 text-black transition-colors"
            >
              ⚔ 再戰一局
            </button>
            <button
              onClick={() => {
                setPokedexRecords(loadMonsters());
                setPokedexDetail(null);
                setShowPokedex(true);
              }}
              className="w-full py-3 rounded-lg border border-yellow-800 text-yellow-600 hover:border-yellow-600 hover:text-yellow-400 text-sm transition-colors"
            >
              圖鑑 →
            </button>
            <button
              onClick={() => {
                if (onBack) {
                  onBack();
                  return;
                }
                setPhase("select");
                setGameResult(null);
                setSessionData(null);
                setQuestions([]);
                setSelectedSession(null);
                setSelectedKey(null);
                setSelectedGroup(null);
              }}
              className="w-full py-3 rounded-lg border border-gray-700 text-gray-400 hover:border-gray-500 text-sm transition-colors"
            >
              {onBack ? "← 返回" : "← 換科目"}
            </button>
          </div>
        </div>
        {/* Pokedex overlay */}
        {showPokedex && (
          <PokedexOverlay
            records={pokedexRecords}
            detail={pokedexDetail}
            setDetail={setPokedexDetail}
            onClose={() => {
              setShowPokedex(false);
              setPokedexDetail(null);
            }}
          />
        )}
      </div>
    );
  }

  return null;
}
