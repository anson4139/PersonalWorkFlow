import { useState } from "react";
import { useSubject } from "../hooks/useSubject";
import { useViewer } from "../hooks/useViewer";
import type { SubjectKey } from "../types";
import BattlePage from "./BattlePage";

// ── Monster metadata ──────────────────────────────────────────────────────────
const MONSTER_NAMES: Record<number, string> = {
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
  21: "末日火神",
  22: "大地終結者",
  23: "混沌魔神",
  24: "雷霆至尊",
  25: "深淵神明",
};

const MONSTER_GLOW: Record<number, string> = {
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
  21: "255,60,0",
  22: "220,180,0",
  23: "180,0,220",
  24: "100,200,255",
  25: "255,0,100",
};

function monsterImg(id: number) {
  return `/images/monsters/${String(id).padStart(2, "0")}-idle.png`;
}

// ── Monster pools ─────────────────────────────────────────────────────────────
const NORMAL_POOL = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const ENHANCED_POOL = [11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
const BOSS_POOL = [21, 22, 23, 24, 25];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ── Question count calculation (ratio 2:3:5) ──────────────────────────────────
function calcQCounts(total: number): {
  normal: number;
  enhanced: number;
  boss: number;
} {
  const normal = Math.max(1, Math.round(total * 0.2));
  const enhanced = Math.max(1, Math.round(total * 0.3));
  const boss = Math.max(1, total - normal - enhanced);
  return { normal, enhanced, boss };
}

// ── localStorage ──────────────────────────────────────────────────────────────
const LS_KEY = "exam_story_progress_v2";

export type SlotType = "normal" | "enhanced" | "boss";
type SlotResult = "clear" | "fail" | null;

interface StoryRunProgress {
  drawnMonsters: { normal: number; enhanced: number; boss: number };
  results: { normal: SlotResult; enhanced: SlotResult; boss: SlotResult };
  seenPrologue: boolean;
  seenChapterIntro: { normal: boolean; enhanced: boolean; boss: boolean };
}

type StoryProgressStore = Record<string, StoryRunProgress>;

function makeStoreKey(subjectKey: SubjectKey, sessionName: string) {
  return `${subjectKey}::${sessionName}`;
}

function loadStore(): StoryProgressStore {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw) as StoryProgressStore;
  } catch {
    /* ignore */
  }
  return {};
}

function saveStore(store: StoryProgressStore) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(store));
  } catch {
    /* quota */
  }
}

function initRun(): StoryRunProgress {
  return {
    drawnMonsters: {
      normal: pickRandom(NORMAL_POOL),
      enhanced: pickRandom(ENHANCED_POOL),
      boss: pickRandom(BOSS_POOL),
    },
    results: { normal: null, enhanced: null, boss: null },
    seenPrologue: false,
    seenChapterIntro: { normal: false, enhanced: false, boss: false },
  };
}

function loadRun(
  subjectKey: SubjectKey,
  sessionName: string,
): StoryRunProgress {
  const store = loadStore();
  return store[makeStoreKey(subjectKey, sessionName)] ?? initRun();
}

function saveRun(
  subjectKey: SubjectKey,
  sessionName: string,
  run: StoryRunProgress,
) {
  const store = loadStore();
  store[makeStoreKey(subjectKey, sessionName)] = run;
  saveStore(store);
}

// ── Chapter intro text ────────────────────────────────────────────────────────
const CHAPTER_INTRO: Record<SlotType, { title: string; body: string }> = {
  normal: {
    title: "第一關：試煉之始",
    body: "試煉開始。用你的知識熱身吧！",
  },
  enhanced: {
    title: "第二關：強化之境",
    body: "你通過了初試。前方的敵人更強大了。",
  },
  boss: {
    title: "第三關：最終決戰",
    body: "最終決戰。深淵的主宰正在等待你！",
  },
};

const SLOT_LABEL: Record<SlotType, string> = {
  normal: "普通怪",
  enhanced: "強化怪",
  boss: "BOSS",
};

// ── Types ─────────────────────────────────────────────────────────────────────
type StoryPhase =
  | "prologue"
  | "map"
  | "chapter-intro"
  | "stage-intro"
  | "battle"
  | "stage-clear"
  | "ending";

interface StoryPageProps {
  subjectKey: SubjectKey;
  sessionName: string;
  onBack: () => void;
  onHome?: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function StoryPage({
  subjectKey,
  sessionName,
  onBack,
  onHome,
}: StoryPageProps) {
  const { viewer, loading: viewerLoading } = useViewer();
  const { data } = useSubject(subjectKey);

  const [run, setRun] = useState<StoryRunProgress>(() =>
    loadRun(subjectKey, sessionName),
  );
  const [storyPhase, setStoryPhase] = useState<StoryPhase>(() =>
    run.seenPrologue ? "map" : "prologue",
  );
  const [currentSlot, setCurrentSlot] = useState<SlotType | null>(null);
  const [battleResult, setBattleResult] = useState<{
    score: number;
    status: string;
  } | null>(null);

  const totalQs =
    data?.sessions.find((s) => s.session === sessionName)?.questions.length ??
    50;
  const qCounts = calcQCounts(totalQs);

  const updateRun = (patch: Partial<StoryRunProgress>) => {
    const newRun = { ...run, ...patch };
    setRun(newRun);
    saveRun(subjectKey, sessionName, newRun);
  };

  const isUnlocked = (slot: SlotType) => {
    if (slot === "normal") return true;
    if (slot === "enhanced") return run.results.normal !== null;
    return run.results.enhanced !== null;
  };

  // ── Auth guard ────────────────────────────────────────────────────────────
  if (viewerLoading) {
    return (
      <div className="h-dvh bg-black flex items-center justify-center text-green-400 text-sm">
        載入中…
      </div>
    );
  }
  if (!viewer.email) {
    return (
      <div className="h-dvh bg-black flex items-center justify-center text-red-400 text-sm">
        請先登入
      </div>
    );
  }

  // ── A. Prologue ───────────────────────────────────────────────────────────
  if (storyPhase === "prologue") {
    return (
      <div className="h-dvh bg-black flex flex-col items-center justify-center px-8 text-center">
        <div className="mb-2 text-xs text-yellow-500 uppercase tracking-widest font-bold">
          試煉序章
        </div>
        <p className="text-sm text-gray-300 leading-loose max-w-xs mb-10">
          深淵試煉地圖已在眼前展開。
          <br />3 道試煉等待著你。
          <br />
          普通怪、強化怪、BOSS——
          <br />
          用你的知識，逐一擊敗它們！
        </p>
        <button
          onClick={() => {
            updateRun({ seenPrologue: true });
            setStoryPhase("map");
          }}
          className="px-8 py-3 rounded-lg bg-green-500 hover:bg-green-400 text-black font-bold text-sm transition-colors"
        >
          開始試煉 →
        </button>
        <button
          onClick={onBack}
          className="mt-3 text-xs text-gray-600 hover:text-gray-400 transition-colors"
        >
          ← 返回
        </button>
      </div>
    );
  }

  // ── C. Chapter intro ──────────────────────────────────────────────────────
  if (storyPhase === "chapter-intro" && currentSlot) {
    const info = CHAPTER_INTRO[currentSlot];
    return (
      <div className="h-dvh bg-black flex flex-col items-center justify-center px-8 text-center">
        <div className="mb-2 text-xs text-yellow-500 uppercase tracking-widest font-bold">
          {info.title}
        </div>
        <p className="text-sm text-gray-300 leading-loose max-w-xs mb-10">
          {info.body}
        </p>
        <button
          onClick={() => setStoryPhase("stage-intro")}
          className="px-8 py-3 rounded-lg bg-green-500 hover:bg-green-400 text-black font-bold text-sm transition-colors"
        >
          繼續 →
        </button>
      </div>
    );
  }

  // ── D. Stage intro (monster reveal) ──────────────────────────────────────
  if (storyPhase === "stage-intro" && currentSlot) {
    const monsterId = run.drawnMonsters[currentSlot];
    const glow = MONSTER_GLOW[monsterId] ?? "118,255,0";
    return (
      <div className="h-dvh bg-black flex flex-col items-center justify-center px-8 text-center">
        <div className="mb-4">
          <img
            src={monsterImg(monsterId)}
            alt={MONSTER_NAMES[monsterId]}
            className="h-36 object-contain"
            style={{ filter: `drop-shadow(0 0 20px rgba(${glow},0.5))` }}
          />
        </div>
        <div className="text-xs text-gray-600 mb-1">
          {SLOT_LABEL[currentSlot]}
        </div>
        <div className="text-lg font-black text-white mb-2">
          {MONSTER_NAMES[monsterId]}
        </div>
        <p className="text-xs text-gray-400 leading-relaxed max-w-xs mb-8 italic">
          「你敢來挑戰我？用你的知識打敗我！」
        </p>
        <button
          onClick={() => setStoryPhase("battle")}
          className="px-8 py-3 rounded-lg bg-green-500 hover:bg-green-400 text-black font-bold text-sm transition-colors"
        >
          ⚔ 開始戰鬥
        </button>
        <button
          onClick={() => setStoryPhase("map")}
          className="mt-3 text-xs text-gray-600 hover:text-gray-400 transition-colors"
        >
          ← 返回地圖
        </button>
      </div>
    );
  }

  // ── E. Battle ─────────────────────────────────────────────────────────────
  if (storyPhase === "battle" && currentSlot) {
    const slot = currentSlot;
    return (
      <BattlePage
        initialKey={subjectKey}
        initialSession={sessionName}
        initialMonsterId={run.drawnMonsters[slot]}
        questionCount={qCounts[slot]}
        onComplete={(score) => {
          const cleared = score >= 60;
          const newResults = {
            ...run.results,
            [slot]: cleared ? "clear" : "fail",
          } as StoryRunProgress["results"];
          const newSeenChapterIntro = {
            ...run.seenChapterIntro,
            [slot]: true,
          };
          updateRun({
            results: newResults,
            seenChapterIntro: newSeenChapterIntro,
          });
          setBattleResult({ score, status: cleared ? "passed" : "failed" });
        }}
        onBack={() => {
          if (battleResult) {
            // User dismissed result screen → show story stage-clear
            setBattleResult(null);
            setStoryPhase("stage-clear");
          } else {
            // User quit mid-battle → back to stage intro without recording
            setStoryPhase("stage-intro");
          }
        }}
      />
    );
  }

  // ── G. Stage clear / fail ─────────────────────────────────────────────────
  if (storyPhase === "stage-clear" && currentSlot) {
    const monsterId = run.drawnMonsters[currentSlot];
    const isCleared = run.results[currentSlot] === "clear";
    const allCleared =
      run.results.normal === "clear" &&
      run.results.enhanced === "clear" &&
      run.results.boss === "clear";

    return (
      <div className="h-dvh bg-black flex flex-col items-center justify-center px-8 text-center">
        {isCleared ? (
          <>
            <div className="text-2xl font-black text-green-400 mb-3">
              關卡通過！
            </div>
            <p className="text-sm text-gray-400 max-w-xs leading-loose mb-8">
              你用知識的力量，擊敗了 {MONSTER_NAMES[monsterId]}！
              <br />
              {allCleared ? "所有試煉已完成！" : "下一關已解鎖。"}
            </p>
          </>
        ) : (
          <>
            <div className="text-2xl font-black text-red-400 mb-3">落敗！</div>
            <p className="text-sm text-gray-400 max-w-xs leading-loose mb-8">
              {MONSTER_NAMES[monsterId]}：你的知識還不夠，再來一次！
              <br />
              但你已踏出了一步——下一關仍然為你開啟。
            </p>
          </>
        )}
        <button
          onClick={() => {
            if (allCleared) {
              setStoryPhase("ending");
            } else {
              setCurrentSlot(null);
              setStoryPhase("map");
            }
          }}
          className="px-8 py-3 rounded-lg bg-green-500 hover:bg-green-400 text-black font-bold text-sm"
        >
          {allCleared ? "查看大結局 →" : "繼續 →"}
        </button>
      </div>
    );
  }

  // ── Ending ────────────────────────────────────────────────────────────────
  if (storyPhase === "ending") {
    return (
      <div className="h-dvh bg-black flex flex-col items-center justify-center px-8 text-center">
        <div className="text-4xl font-black text-yellow-400 mb-4">
          試煉完成！
        </div>
        <p className="text-sm text-gray-300 leading-loose max-w-xs mb-10">
          所有試煉，已被你的知識征服。
          <br />
          深淵的主宰，是你。
        </p>
        <button
          onClick={onHome ?? onBack}
          className="px-8 py-3 rounded-lg bg-[#76b900] hover:bg-[#8fd400] text-black font-bold text-sm"
        >
          回首頁
        </button>
      </div>
    );
  }

  // ── B. Map (default) ──────────────────────────────────────────────────────
  const slots: SlotType[] = ["normal", "enhanced", "boss"];

  return (
    <div className="min-h-dvh bg-black text-gray-200 flex flex-col items-center px-4 py-6">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="mb-1">
          <button
            onClick={onBack}
            className="text-sm text-[#76b900] hover:text-white transition"
          >
            ← 返回
          </button>
        </div>
        <div className="mb-4">
          <div className="text-xs text-green-500 uppercase tracking-widest font-bold mb-0.5">
            劇情模式
          </div>
          <div className="text-lg font-black text-white">試煉地圖</div>
          <div className="text-xs text-gray-600 mt-1">{sessionName}</div>
        </div>

        {/* Legend */}
        <div className="flex gap-4 text-xs text-gray-600 mb-5">
          <span>
            <span className="text-green-400">✓</span> 通關
          </span>
          <span>
            <span className="text-red-400">✗</span> 待重打
          </span>
          <span>
            <span className="text-yellow-400">⚔</span> 可挑戰
          </span>
          <span>
            <span className="text-gray-700">?</span> 未解鎖
          </span>
        </div>

        {/* 3 slot cells */}
        <div className="flex flex-col gap-3">
          {slots.map((slot) => {
            const monsterId = run.drawnMonsters[slot];
            const result = run.results[slot];
            const unlocked = isUnlocked(slot);
            const glow = MONSTER_GLOW[monsterId] ?? "118,255,0";

            return (
              <button
                key={slot}
                onClick={() => {
                  if (!unlocked) return;
                  setCurrentSlot(slot);
                  if (!run.seenChapterIntro[slot]) {
                    setStoryPhase("chapter-intro");
                  } else {
                    setStoryPhase("stage-intro");
                  }
                }}
                disabled={!unlocked}
                className={`w-full rounded-xl border px-5 py-4 flex items-center gap-4 text-left transition-all ${
                  result === "clear"
                    ? "border-green-700 bg-green-900/20"
                    : result === "fail"
                      ? "border-red-800 bg-red-900/10"
                      : unlocked
                        ? "border-yellow-600 bg-yellow-900/10 animate-pulse"
                        : "border-gray-800 bg-gray-900/30 opacity-40 cursor-not-allowed"
                }`}
              >
                {unlocked ? (
                  <img
                    src={monsterImg(monsterId)}
                    alt={MONSTER_NAMES[monsterId]}
                    className="h-14 w-14 object-contain flex-shrink-0"
                    style={{
                      filter: `drop-shadow(0 0 10px rgba(${glow},0.6))`,
                    }}
                  />
                ) : (
                  <div className="h-14 w-14 flex items-center justify-center flex-shrink-0 text-2xl text-gray-700">
                    ?
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-gray-500 mb-0.5">
                    {SLOT_LABEL[slot]}
                  </div>
                  <div className="font-bold text-white text-sm">
                    {unlocked ? MONSTER_NAMES[monsterId] : "???"}
                  </div>
                  <div className="text-xs text-gray-600 mt-0.5">
                    {qCounts[slot]} 題 · 通關門檻 60%
                  </div>
                </div>
                <div className="text-xl flex-shrink-0">
                  {result === "clear" ? (
                    <span className="text-green-400">✓</span>
                  ) : result === "fail" ? (
                    <span className="text-red-400">✗</span>
                  ) : unlocked ? (
                    <span className="text-yellow-400">⚔</span>
                  ) : (
                    <span className="text-gray-700">?</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Reset */}
        <div className="mt-8 text-center">
          <button
            onClick={() => {
              if (
                window.confirm(
                  "確定重置本 session 的劇情進度？怪獸將重新抽取。",
                )
              ) {
                const newRun = initRun();
                setRun(newRun);
                saveRun(subjectKey, sessionName, newRun);
                setCurrentSlot(null);
                setStoryPhase("prologue");
              }
            }}
            className="text-xs text-gray-700 hover:text-gray-500 transition"
          >
            重置進度
          </button>
        </div>
      </div>
    </div>
  );
}
