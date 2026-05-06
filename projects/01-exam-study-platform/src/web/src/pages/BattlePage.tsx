import { useCallback, useEffect, useRef, useState } from "react";
import { useSubject } from "../hooks/useSubject";
import { useViewer } from "../hooks/useViewer";
import type { Question, SubjectKey } from "../types";
import { EXAM_GROUPS, SUBJECTS } from "../types";

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
};

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

// ── Main Component ────────────────────────────────────────────────────────────
interface BattlePageProps {
  /** Pre-selected subject key passed from Home.tsx (embedded mode) */
  initialKey?: SubjectKey;
  /** Pre-selected session label passed from Home.tsx (embedded mode) */
  initialSession?: string;
  /** Called when user exits battle (← 換科目 / ✕ quit) in embedded mode */
  onBack?: () => void;
}

export default function BattlePage({
  initialKey,
  initialSession,
  onBack,
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
  const [currentMonsterCorrect, setCurrentMonsterCorrect] = useState(0);
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
  // damage per correct answer; monster needs qPerMonster correct hits to die
  const damage = sd ? Math.floor(100 / sd.qPerMonster) : 20;
  const safeMonsterIndex = Math.min(currentMonsterIndex, 9);
  const currentMonsterId = sd ? (sd.monsterOrder[safeMonsterIndex] ?? 1) : 1;
  const monsterHp = sd
    ? Math.max(0, 100 - currentMonsterCorrect * damage)
    : 100;
  const playerHp = sd
    ? Math.max(0, Math.round(((sd.maxWrong - wrongCount) / sd.maxWrong) * 100))
    : 100;
  const question = questions[currentIndex] ?? null;

  // Reset answer timer when question changes
  useEffect(() => {
    answerStartTime.current = Date.now();
  }, [currentIndex]);

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
      const sd = await startSession(
        selectedKey,
        selectedSession,
        shuffled.length,
      );
      setSessionData(sd);
      setQuestions(shuffled);
      setCurrentIndex(0);
      setCorrectCount(0);
      setWrongCount(0);
      setCurrentMonsterIndex(0);
      setCurrentMonsterCorrect(0);
      setMonstersDefeated(0);
      setAnswerState("idle");
      setSelectedAnswer(null);
      setShowExplanation(false);
      setPhase("battle");
    } catch {
      setApiError("無法開始遊戲，請確認網路連線");
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

    // Visual feedback
    if (isCorrect) {
      setMonsterAnim("hit");
      setMonsterAnimKey((k) => k + 1);
      setDamageText({ text: "命中！", key: Date.now() });
      setTimeout(() => {
        setMonsterAnim("idle");
        setDamageText(null);
      }, 700);
    } else {
      setMonsterAnim("attack");
      setMonsterAnimKey((k) => k + 1);
      setTimeout(() => setMonsterAnim("idle"), 600);
    }

    // Update local state
    const newCorrect = correctCount + (isCorrect ? 1 : 0);
    const newWrong = wrongCount + (isCorrect ? 0 : 1);
    setCorrectCount(newCorrect);
    setWrongCount(newWrong);

    if (isCorrect) {
      setCurrentMonsterCorrect((c) => c + 1);
    }

    // Fire-and-forget to server
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

    // Game-over check
    const remaining = questions.length - (currentIndex + 1);
    const maxPossibleScore =
      ((newCorrect + remaining) / questions.length) * 100;
    if (maxPossibleScore < 70) {
      setTimeout(async () => {
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
            pointsEarned: 0,
            rewards: [],
          });
        }
        setPhase("result");
      }, 900);
    }

    setIsSubmitting(false);
  };

  const handleNextQuestion = async () => {
    if (!sessionData || !question) return;
    const nextIndex = currentIndex + 1;

    // HP-based monster switch: only trigger when HP hits 0
    const dmg = Math.floor(100 / sessionData.qPerMonster);
    const newMonsterHp = Math.max(0, 100 - currentMonsterCorrect * dmg);
    if (newMonsterHp <= 0 && currentMonsterIndex < 10) {
      setShowDefeated(true);
      const newDefeated = monstersDefeated + 1;
      setMonstersDefeated(newDefeated);
      await new Promise<void>((res) => setTimeout(res, 1200));
      setShowDefeated(false);
      setCurrentMonsterIndex((i) => Math.min(i + 1, 9));
      setCurrentMonsterCorrect(0);
    }

    // Game finished
    if (nextIndex >= questions.length) {
      const score = Math.round((correctCount / questions.length) * 100);
      const status = score >= 70 ? "passed" : "failed";
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
          pointsEarned: 0,
          rewards: [],
        });
      }
      setPhase("result");
      return;
    }

    setCurrentIndex(nextIndex);
    setAnswerState("idle");
    setSelectedAnswer(null);
    setShowExplanation(false);
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
            <div className="mb-1 inline-block rounded-sm bg-green-500 px-2 py-0.5 text-xs font-bold tracking-widest text-black uppercase">
              Anson's Study Platform
            </div>
            <h1 className="mt-2 text-2xl font-black text-white">
              ⚔ 怪獸對戰模式
            </h1>
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
        </div>
      </div>
    );
  }

  // ── Battle View ────────────────────────────────────────────────────────────
  if (phase === "battle" && sessionData && question) {
    const glow = MONSTER_GLOW[currentMonsterId] ?? "118,255,0";
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
          <div className="flex-none h-12 flex items-center justify-between px-4 border-b border-gray-800">
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
            </div>
            <div className="w-16 bg-gray-800 rounded-full h-1.5">
              <div
                className="h-full bg-green-500 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* ── B: Monster Zone ───────────────────────── */}
          <div className="flex-[3] min-h-0 flex flex-col items-center justify-center px-4 py-2 relative">
            {/* Monster name + HP */}
            <div className="w-full mb-2">
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-sm font-bold text-gray-200">
                  {monsterName}
                </span>
                <span className="text-xs font-mono text-gray-500">
                  #{String(currentMonsterId).padStart(2, "0")}
                </span>
              </div>
              <HpBar hp={monsterHp} color={`rgb(${glow})`} label="Monster HP" />
            </div>

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
                  className="absolute top-2 right-4 anim-float text-yellow-300 font-bold text-lg pointer-events-none"
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
                  i === safeMonsterIndex && currentMonsterIndex < 10;
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
          <div className="flex-none h-16 flex items-center gap-3 px-4 border-t border-b border-gray-800">
            <img
              src={dicebearUrl(viewer.email ?? "")}
              alt="avatar"
              className="w-9 h-9 rounded-full bg-gray-800 flex-none"
            />
            <div className="flex-1">
              <HpBar hp={playerHp} color="#4ade80" label="Player HP" />
            </div>
            <div className="text-right text-xs font-mono text-gray-500 flex-none">
              <div className="text-green-400">{correctCount * 2}pt</div>
              <div>容錯 {Math.max(0, sessionData.maxWrong - wrongCount)}</div>
            </div>
          </div>

          {/* ── D: Question Zone ──────────────────────── */}
          <div className="flex-[4] min-h-0 overflow-y-auto flex flex-col px-4 py-3">
            <p className="text-sm text-gray-200 mb-4 leading-relaxed flex-none">
              {question.question}
            </p>
            <div className="flex flex-col gap-2 flex-none">
              {optionLabels.map((label) => (
                <button
                  key={label}
                  disabled={answerState !== "idle"}
                  onClick={() => handleSelectAnswer(label)}
                  className={`w-full text-left px-3 py-2.5 rounded border text-sm transition-colors ${getOptionStyle(label)}`}
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
                <p className="text-sm text-gray-300 leading-relaxed">
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
                value: `+${gameResult.pointsEarned}`,
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
              ← 換科目
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
