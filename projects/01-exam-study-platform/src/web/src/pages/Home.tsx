import { useState } from "react";
import QuestionCard from "../components/QuestionCard";
import { useSubject } from "../hooks/useSubject";
import { useViewer } from "../hooks/useViewer";
import type { SubjectKey } from "../types";
import { EXAM_GROUPS, SUBJECTS } from "../types";
import BattlePage from "./BattlePage";

type Mode = "home" | "subject-select" | "session-select" | "quiz";
type QuizView = "single" | "batch" | "battle";

const BATCH_SIZE = 10;

export default function Home() {
  const { viewer, loading: viewerLoading } = useViewer();
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [selectedKey, setSelectedKey] = useState<SubjectKey | null>(null);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
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
  const visibleSubjects = SUBJECTS.filter(
    (subject) =>
      subject.groupKey === selectedGroup && allowedSubjectSet.has(subject.key),
  );
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
          {visibleGroups.map((group) => (
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
                  group.subjectKeys.filter((subjectKey) =>
                    allowedSubjectSet.has(subjectKey),
                  ).length
                }{" "}
                個科目
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (mode === "subject-select") {
    return (
      <div className="mx-auto max-w-lg px-4 py-10">
        <button
          onClick={() => setMode("home")}
          className="mb-6 text-sm text-[#76b900] hover:text-white transition"
        >
          ← 返回
        </button>
        <h2 className="mb-2 text-xl font-black text-white">
          {selectedGroupData?.title}
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
            <button
              key={s.session}
              onClick={() => {
                setSelectedSession(s.session);
                setPage(0);
                setMode("quiz");
              }}
              className="flex w-full items-center justify-between rounded-xl border border-[#1f1f1f]
                         bg-[#111] px-6 py-4 text-left transition hover:border-[#76b900]"
            >
              <span className="font-medium text-gray-200">{s.session}</span>
              <span className="text-sm text-[#76b900]">
                {s.questions.length} 題
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ── 刷題頁 ──
  const q = questions[page];

  // 頂部 header（兩種模式共用）
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
      {/* 模式切換 */}
      <div className="mt-3 flex rounded-lg border border-[#1f1f1f] bg-[#0a0a0a] p-1">
        <button
          onClick={() => {
            setQuizView("single");
            setPage(0);
          }}
          className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition
            ${quizView === "single" ? "bg-[#76b900] text-black" : "text-gray-500 hover:text-white"}`}
        >
          單題模式
        </button>
        <button
          onClick={() => {
            setQuizView("batch");
            setPage(0);
          }}
          className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition
            ${quizView === "batch" ? "bg-[#76b900] text-black" : "text-gray-500 hover:text-white"}`}
        >
          10題模式
        </button>
        <button
          onClick={() => {
            setQuizView("battle");
            setPage(0);
          }}
          className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition
            ${quizView === "battle" ? "bg-green-500 text-black" : "text-gray-500 hover:text-white"}`}
        >
          ⚔ 對戰模式
        </button>
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

  if (quizView === "battle") {
    return (
      <BattlePage
        initialKey={selectedKey ?? undefined}
        initialSession={selectedSession ?? undefined}
        onBack={() => setQuizView("single")}
      />
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
