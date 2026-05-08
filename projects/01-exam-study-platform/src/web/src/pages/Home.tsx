import { useState } from "react";
import QuestionCard from "../components/QuestionCard";
import { useSubject } from "../hooks/useSubject";
import { useViewer } from "../hooks/useViewer";
import type { SubjectKey } from "../types";
import { EXAM_GROUPS, PARENT_GROUPS, SUBJECTS } from "../types";
import BattlePage from "./BattlePage";
import LeaderboardPage from "./LeaderboardPage";
import StoryPage from "./StoryPage";

type Mode =
  | "home"
  | "level-select"
  | "sub-category-select"
  | "subject-select"
  | "session-select"
  | "quiz"
  | "story"
  | "leaderboard";
type QuizView = "single" | "batch" | "battle";

const BATCH_SIZE = 10;

export default function Home() {
  const { viewer, loading: viewerLoading } = useViewer();
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [selectedKey, setSelectedKey] = useState<SubjectKey | null>(null);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [selectedParent, setSelectedParent] = useState<string | null>(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(
    null,
  );
  const [mode, setMode] = useState<Mode>("home");
  const [quizView, setQuizView] = useState<QuizView>("single");
  const [page, setPage] = useState(0);

  const { data, loading, error } = useSubject(selectedKey);
  const allowedSubjectSet = new Set(viewer.allowedSubjects);

  const sessionData = data?.sessions.find((s) => s.session === selectedSession);
  const questions = sessionData?.questions ?? [];
  const visibleGroups = EXAM_GROUPS.filter((group) =>
    group.subjectKeys.some((subjectKey) => allowedSubjectSet.has(subjectKey)),
  );
  const selectedGroupData =
    visibleGroups.find((group) => group.key === selectedGroup) ?? null;
  const visibleSubjects = SUBJECTS.filter((subject) => {
    if (subject.groupKey !== selectedGroup) return false;
    if (!allowedSubjectSet.has(subject.key)) return false;
    if (selectedSubCategory) {
      const group = EXAM_GROUPS.find((g) => g.key === selectedGroup);
      const subCat = group?.subCategories?.find(
        (sc) => sc.key === selectedSubCategory,
      );
      if (subCat) return subCat.subjectKeys.includes(subject.key);
    }
    return true;
  });
  // 首頁顯示項目：同屬 parent group 的合併為一個入口
  const addedParentKeys = new Set<string>();
  const homeItems: {
    type: "group" | "parent";
    key: string;
    title: string;
    count: number;
  }[] = [];
  for (const group of visibleGroups) {
    const parent = PARENT_GROUPS.find((p) =>
      (p.groupKeys as string[]).includes(group.key),
    );
    if (parent) {
      if (!addedParentKeys.has(parent.key)) {
        addedParentKeys.add(parent.key);
        const count = parent.groupKeys.reduce((acc, gk) => {
          const g = EXAM_GROUPS.find((eg) => eg.key === gk);
          return (
            acc +
            (g?.subjectKeys.filter((sk) => allowedSubjectSet.has(sk)).length ??
              0)
          );
        }, 0);
        homeItems.push({
          type: "parent",
          key: parent.key,
          title: parent.title,
          count,
        });
      }
    } else {
      homeItems.push({
        type: "group",
        key: group.key,
        title: group.title,
        count: group.subjectKeys.filter((sk) => allowedSubjectSet.has(sk))
          .length,
      });
    }
  }
  const selectedSubjectLabel = SUBJECTS.find(
    (subject) => subject.key === selectedKey,
  )?.label;

  // batch 分頁
  const batchPageCount = Math.ceil(questions.length / BATCH_SIZE);
  const batchQuestions = questions.slice(
    page * BATCH_SIZE,
    (page + 1) * BATCH_SIZE,
  );

  // ── 首頁：選科目 ──
  if (mode === "home") {
    return (
      <div className="mx-auto max-w-lg px-4 py-10">
        <div className="mb-8 text-center">
          <div className="mb-2 inline-block rounded-sm bg-[#76b900] px-2 py-0.5 text-xs font-bold tracking-widest text-black uppercase">
            Anson's Study Platform
          </div>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-white">
            考題學習平台
          </h1>
          <p className="mt-2 text-sm text-gray-500">選擇考試分類開始刷題</p>
          {viewer.isAdmin && (
            <p className="mt-3">
              <a
                href="/admin/access"
                className="text-xs font-semibold text-[#76b900] transition hover:text-white"
              >
                進入權限管理
              </a>
            </p>
          )}
          <p className="mt-3 text-xs text-gray-600">
            {viewerLoading
              ? "辨識身份中…"
              : viewer.isAdmin
                ? `管理者已登入：${viewer.email ?? "Anson"}`
                : `已登入：${viewer.email ?? "使用者"} / 可見 ${viewer.allowedSubjects.length} 個科目`}
          </p>
        </div>
        <div className="space-y-3">
          {homeItems.map((item) => (
            <button
              key={item.key}
              onClick={() => {
                if (item.type === "parent") {
                  setSelectedParent(item.key);
                  setSelectedGroup(null);
                  setSelectedKey(null);
                  setSelectedSession(null);
                  setSelectedSubCategory(null);
                  setMode("level-select");
                } else {
                  setSelectedParent(null);
                  setSelectedGroup(item.key);
                  setSelectedKey(null);
                  setSelectedSession(null);
                  setSelectedSubCategory(null);
                  const group = EXAM_GROUPS.find((g) => g.key === item.key);
                  setMode(
                    group?.subCategories?.length
                      ? "sub-category-select"
                      : "subject-select",
                  );
                }
              }}
              className="w-full rounded-xl border border-[#1f1f1f] bg-[#111] px-6 py-4 text-left text-base
                         font-medium text-gray-200 transition hover:border-[#76b900] hover:text-[#76b900]"
            >
              <div>{item.title}</div>
              <div className="mt-1 text-xs text-gray-500">
                {item.count} 個科目
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (mode === "level-select") {
    const parentData = PARENT_GROUPS.find((p) => p.key === selectedParent);
    const parentGroupKeySet = new Set(parentData?.groupKeys ?? []);
    const levelGroups = EXAM_GROUPS.filter(
      (g) =>
        parentGroupKeySet.has(g.key) &&
        g.subjectKeys.some((sk) => allowedSubjectSet.has(sk)),
    );
    return (
      <div className="mx-auto max-w-lg px-4 py-10">
        <button
          onClick={() => setMode("home")}
          className="mb-6 text-sm text-[#76b900] hover:text-white transition"
        >
          ← 返回
        </button>
        <h2 className="mb-2 text-xl font-black text-white">
          {parentData?.title}
        </h2>
        <p className="mb-6 text-sm text-gray-500">選擇等級</p>
        <div className="space-y-3">
          {levelGroups.map((group) => (
            <button
              key={group.key}
              onClick={() => {
                setSelectedGroup(group.key);
                setSelectedKey(null);
                setSelectedSession(null);
                setMode("subject-select");
              }}
              className="w-full rounded-xl border border-[#1f1f1f] bg-[#111] px-6 py-4 text-left text-base
                         font-medium text-gray-200 transition hover:border-[#76b900] hover:text-[#76b900]"
            >
              <div>{group.title}</div>
              <div className="mt-1 text-xs text-gray-500">
                {
                  group.subjectKeys.filter((sk) => allowedSubjectSet.has(sk))
                    .length
                }{" "}
                個科目
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (mode === "sub-category-select") {
    const currentGroup = EXAM_GROUPS.find((g) => g.key === selectedGroup);
    const subCats = currentGroup?.subCategories ?? [];
    return (
      <div className="mx-auto max-w-lg px-4 py-10">
        <button
          onClick={() => setMode("home")}
          className="mb-6 text-sm text-[#76b900] hover:text-white transition"
        >
          ← 返回
        </button>
        <h2 className="mb-2 text-xl font-black text-white">
          {currentGroup?.title}
        </h2>
        <p className="mb-6 text-sm text-gray-500">選擇科目類別</p>
        <div className="space-y-3">
          {subCats.map((sc) => (
            <button
              key={sc.key}
              onClick={() => {
                setSelectedSubCategory(sc.key);
                setMode("subject-select");
              }}
              className="w-full rounded-xl border border-[#1f1f1f] bg-[#111] px-6 py-4 text-left text-base
                         font-medium text-gray-200 transition hover:border-[#76b900] hover:text-[#76b900]"
            >
              <div>{sc.title}</div>
              <div className="mt-1 text-xs text-gray-500">
                {
                  sc.subjectKeys.filter((sk) => allowedSubjectSet.has(sk))
                    .length
                }{" "}
                個年度
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (mode === "subject-select") {
    const backMode = selectedSubCategory
      ? "sub-category-select"
      : selectedParent
        ? "level-select"
        : "home";
    const subCatTitle = selectedSubCategory
      ? EXAM_GROUPS.find((g) => g.key === selectedGroup)?.subCategories?.find(
          (sc) => sc.key === selectedSubCategory,
        )?.title
      : null;
    return (
      <div className="mx-auto max-w-lg px-4 py-10">
        <button
          onClick={() => setMode(backMode)}
          className="mb-6 text-sm text-[#76b900] hover:text-white transition"
        >
          ← 返回
        </button>
        <h2 className="mb-2 text-xl font-black text-white">
          {selectedParent
            ? `${PARENT_GROUPS.find((p) => p.key === selectedParent)?.title}（${selectedGroupData?.title}）`
            : subCatTitle
              ? `${selectedGroupData?.title}（${subCatTitle}）`
              : selectedGroupData?.title}
        </h2>
        <p className="mb-6 text-sm text-gray-500">選擇科目</p>
        <div className="space-y-3">
          {visibleSubjects.map((subject) => (
            <button
              key={subject.key}
              onClick={() => {
                setSelectedKey(subject.key as SubjectKey);
                setSelectedSession(null);
                setPage(0);
                setMode("session-select");
              }}
              className="w-full rounded-xl border border-[#1f1f1f] bg-[#111] px-6 py-4 text-left text-base
                         font-medium text-gray-200 transition hover:border-[#76b900] hover:text-[#76b900]"
            >
              {subject.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ── 選屆次 ──
  if (mode === "session-select") {
    return (
      <div className="mx-auto max-w-lg px-4 py-10">
        <button
          onClick={() => setMode("subject-select")}
          className="mb-6 text-sm text-[#76b900] hover:text-white transition"
        >
          ← 返回
        </button>
        <h2 className="mb-6 text-xl font-black text-white">
          {selectedSubjectLabel}
        </h2>
        {loading && <p className="text-center text-gray-500">載入中…</p>}
        {error && <p className="text-center text-red-500">{error}</p>}
        <div className="space-y-3">
          {data?.sessions.map((s) => (
            <div
              key={s.session}
              className="rounded-xl border border-[#1f1f1f] bg-[#111] px-4 py-3"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-200">{s.session}</span>
                <span className="text-sm text-[#76b900]">
                  {s.questions.length} 題
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                <button
                  onClick={() => {
                    setSelectedSession(s.session);
                    setQuizView("single");
                    setPage(0);
                    setMode("quiz");
                  }}
                  className="rounded-lg border border-[#2a2a2a] bg-[#0a0a0a] py-2 text-xs font-medium
                             text-gray-400 transition hover:border-[#76b900] hover:text-[#76b900]"
                >
                  1題
                </button>
                <button
                  onClick={() => {
                    setSelectedSession(s.session);
                    setQuizView("batch");
                    setPage(0);
                    setMode("quiz");
                  }}
                  className="rounded-lg border border-[#2a2a2a] bg-[#0a0a0a] py-2 text-xs font-medium
                             text-gray-400 transition hover:border-[#76b900] hover:text-[#76b900]"
                >
                  10題
                </button>
                <button
                  onClick={() => {
                    setSelectedSession(s.session);
                    setQuizView("battle");
                    setPage(0);
                    setMode("quiz");
                  }}
                  className="rounded-lg border border-[#2a2a2a] bg-[#0a0a0a] py-2 text-xs font-medium
                             text-gray-400 transition hover:border-green-700 hover:text-green-400"
                >
                  對戰
                </button>
                <button
                  onClick={() => {
                    setSelectedSession(s.session);
                    setMode("story");
                  }}
                  className="rounded-lg border border-[#2a2a2a] bg-[#0a0a0a] py-2 text-xs font-medium
                             text-gray-400 transition hover:border-purple-600 hover:text-purple-400"
                >
                  劇情
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (mode === "leaderboard") {
    return <LeaderboardPage onBack={() => setMode("home")} />;
  }

  // ── 刷題頁 ──
  const q = questions[page];

  if (mode === "story" && selectedKey && selectedSession) {
    return (
      <StoryPage
        subjectKey={selectedKey}
        sessionName={selectedSession}
        onBack={() => setMode("session-select")}
        onHome={() => setMode("home")}
      />
    );
  }

  if (quizView === "battle") {
    return (
      <BattlePage
        initialKey={selectedKey ?? undefined}
        initialSession={selectedSession ?? undefined}
        onBack={() => setMode("session-select")}
      />
    );
  }

  // 頂部 header（單題 / 10題模式共用）
  const QuizHeader = () => (
    <div className="mb-4">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setMode("session-select")}
          className="text-sm text-[#76b900] hover:text-white transition"
        >
          ← 返回
        </button>
        <span className="text-sm text-gray-500">{selectedSession}</span>
      </div>
    </div>
  );

  // ── 單題模式 ──
  if (quizView === "single") {
    return (
      <div className="mx-auto max-w-lg px-4 py-6">
        <QuizHeader />
        <div className="mb-5 h-1 w-full rounded-full bg-[#1f1f1f]">
          <div
            className="h-1 rounded-full bg-[#76b900] transition-all"
            style={{ width: `${((page + 1) / questions.length) * 100}%` }}
          />
        </div>
        {q && (
          <QuestionCard
            question={q}
            index={page + 1}
            total={questions.length}
          />
        )}
        <div className="mt-5 flex gap-3">
          <button
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
            className="flex-1 rounded-xl border border-[#1f1f1f] bg-[#111] py-3 text-sm font-medium
                       text-gray-400 disabled:opacity-30 transition hover:border-[#76b900] hover:text-white"
          >
            上一題
          </button>
          <button
            disabled={page === questions.length - 1}
            onClick={() => setPage((p) => p + 1)}
            className="flex-1 rounded-xl bg-[#76b900] py-3 text-sm font-bold
                       text-black disabled:opacity-30 transition hover:bg-[#8fd400]"
          >
            下一題
          </button>
        </div>
      </div>
    );
  }

  // ── 10題模式 ──
  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <QuizHeader />
      <p className="mb-4 text-xs text-gray-600">
        第 {page * BATCH_SIZE + 1}–
        {Math.min((page + 1) * BATCH_SIZE, questions.length)} 題　共{" "}
        {questions.length} 題
      </p>
      <div className="space-y-4">
        {batchQuestions.map((bq, i) => (
          <QuestionCard
            key={bq.no}
            question={bq}
            index={page * BATCH_SIZE + i + 1}
            total={questions.length}
          />
        ))}
      </div>
      <div className="mt-6 flex gap-3">
        <button
          disabled={page === 0}
          onClick={() => {
            setPage((p) => p - 1);
            window.scrollTo(0, 0);
          }}
          className="flex-1 rounded-xl border border-[#1f1f1f] bg-[#111] py-3 text-sm font-medium
                     text-gray-400 disabled:opacity-30 transition hover:border-[#76b900] hover:text-white"
        >
          上 10 題
        </button>
        <button
          disabled={page === batchPageCount - 1}
          onClick={() => {
            setPage((p) => p + 1);
            window.scrollTo(0, 0);
          }}
          className="flex-1 rounded-xl bg-[#76b900] py-3 text-sm font-bold
                     text-black disabled:opacity-30 transition hover:bg-[#8fd400]"
        >
          下 10 題
        </button>
      </div>
    </div>
  );
}
