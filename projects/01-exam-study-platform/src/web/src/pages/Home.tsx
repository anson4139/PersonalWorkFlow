import { useEffect, useMemo, useState } from 'react'
import QuestionCard from '../components/QuestionCard'
import { useSubject } from '../hooks/useSubject'
import { useViewer } from '../hooks/useViewer'
import type { SubjectKey } from '../types'
import { EXAM_GROUPS, SUBJECTS } from '../types'

type Mode = 'home' | 'subject-select' | 'session-select' | 'quiz'
type QuizView = 'single' | 'batch' | 'test'
type Choice = 'A' | 'B' | 'C' | 'D'
type TestAnswers = Record<number, Choice>

interface TestDraft {
  answers: TestAnswers
  startedAt: number
  updatedAt: number
}

interface TestResult {
  finishedAt: number
  score: number
  total: number
  durationSec: number
}

const BATCH_SIZE = 10

export default function Home() {
  const { viewer, loading: viewerLoading } = useViewer()
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null)
  const [selectedKey, setSelectedKey] = useState<SubjectKey | null>(null)
  const [selectedSession, setSelectedSession] = useState<string | null>(null)
  const [mode, setMode] = useState<Mode>('home')
  const [quizView, setQuizView] = useState<QuizView>('single')
  const [page, setPage] = useState(0) // single/test: 題目index；batch: 頁碼

  const [testAnswers, setTestAnswers] = useState<TestAnswers>({})
  const [testStartedAt, setTestStartedAt] = useState<number | null>(null)
  const [testSubmitted, setTestSubmitted] = useState(false)
  const [testScore, setTestScore] = useState<number | null>(null)
  const [lastResult, setLastResult] = useState<TestResult | null>(null)
  const [hasLoadedDraft, setHasLoadedDraft] = useState(false)
  const [resumedDraft, setResumedDraft] = useState(false)

  const { data, loading, error } = useSubject(selectedKey)
  const allowedSubjectSet = new Set(viewer.allowedSubjects)

  const sessionData = data?.sessions.find(s => s.session === selectedSession)
  const questions = sessionData?.questions ?? []
  const visibleGroups = EXAM_GROUPS.filter(group => group.subjectKeys.some(subjectKey => allowedSubjectSet.has(subjectKey)))
  const selectedGroupData = visibleGroups.find(group => group.key === selectedGroup) ?? null
  const visibleSubjects = SUBJECTS.filter(subject => subject.groupKey === selectedGroup && allowedSubjectSet.has(subject.key))
  const selectedSubjectLabel = SUBJECTS.find(subject => subject.key === selectedKey)?.label

  // batch 分頁
  const batchPageCount = Math.ceil(questions.length / BATCH_SIZE)
  const batchQuestions = questions.slice(page * BATCH_SIZE, (page + 1) * BATCH_SIZE)

  const testDraftKey = useMemo(() => {
    if (!selectedKey || !selectedSession) {
      return null
    }
    return `esp.test.draft.${selectedKey}.${selectedSession}`
  }, [selectedKey, selectedSession])

  const testHistoryKey = useMemo(() => {
    if (!selectedKey || !selectedSession) {
      return null
    }
    return `esp.test.history.${selectedKey}.${selectedSession}`
  }, [selectedKey, selectedSession])

  const answeredCount = questions.reduce((acc, item) => (testAnswers[item.no] ? acc + 1 : acc), 0)
  const wrongCount = questions.reduce((acc, item) => {
    const selected = testAnswers[item.no]
    if (!selected) {
      return acc
    }
    return selected === item.answer ? acc : acc + 1
  }, 0)

  useEffect(() => {
    if (mode !== 'quiz' || quizView !== 'test' || !testDraftKey || !testHistoryKey) {
      return
    }

    setHasLoadedDraft(false)
    setTestSubmitted(false)
    setTestScore(null)

    try {
      const historyRaw = localStorage.getItem(testHistoryKey)
      if (historyRaw) {
        const history = JSON.parse(historyRaw) as TestResult[]
        if (Array.isArray(history) && history.length) {
          setLastResult(history[0])
        } else {
          setLastResult(null)
        }
      } else {
        setLastResult(null)
      }
    } catch {
      setLastResult(null)
    }

    try {
      const draftRaw = localStorage.getItem(testDraftKey)
      if (draftRaw) {
        const draft = JSON.parse(draftRaw) as TestDraft
        if (draft?.answers && typeof draft.startedAt === 'number') {
          setTestAnswers(draft.answers)
          setTestStartedAt(draft.startedAt)
          setResumedDraft(true)
          setHasLoadedDraft(true)
          return
        }
      }
    } catch {
      // Ignore malformed draft and create a new one.
    }

    setTestAnswers({})
    setTestStartedAt(Date.now())
    setResumedDraft(false)
    setHasLoadedDraft(true)
  }, [mode, quizView, testDraftKey, testHistoryKey])

  useEffect(() => {
    if (mode !== 'quiz' || quizView !== 'test' || !testDraftKey || !hasLoadedDraft || testSubmitted || !testStartedAt) {
      return
    }

    const payload: TestDraft = {
      answers: testAnswers,
      startedAt: testStartedAt,
      updatedAt: Date.now(),
    }
    localStorage.setItem(testDraftKey, JSON.stringify(payload))
  }, [mode, quizView, testDraftKey, hasLoadedDraft, testSubmitted, testStartedAt, testAnswers])

  function handleRestartTest() {
    setTestAnswers({})
    setTestStartedAt(Date.now())
    setTestSubmitted(false)
    setTestScore(null)
    setResumedDraft(false)
    setHasLoadedDraft(true)
    setPage(0)

    if (testDraftKey) {
      localStorage.removeItem(testDraftKey)
    }
  }

  function handleSubmitTest() {
    const now = Date.now()
    const startedAt = testStartedAt ?? now
    const score = questions.reduce((acc, item) => (testAnswers[item.no] === item.answer ? acc + 1 : acc), 0)
    const result: TestResult = {
      finishedAt: now,
      score,
      total: questions.length,
      durationSec: Math.max(0, Math.round((now - startedAt) / 1000)),
    }

    setTestSubmitted(true)
    setTestScore(score)
    setLastResult(result)

    if (testDraftKey) {
      localStorage.removeItem(testDraftKey)
    }

    if (testHistoryKey) {
      try {
        const historyRaw = localStorage.getItem(testHistoryKey)
        const history = historyRaw ? (JSON.parse(historyRaw) as TestResult[]) : []
        const nextHistory = [result, ...history].slice(0, 20)
        localStorage.setItem(testHistoryKey, JSON.stringify(nextHistory))
      } catch {
        localStorage.setItem(testHistoryKey, JSON.stringify([result]))
      }
    }
  }

  function handleChooseOption(option: Choice) {
    if (testSubmitted) {
      return
    }

    const current = questions[page]
    if (!current) {
      return
    }

    setTestAnswers(prev => ({
      ...prev,
      [current.no]: option,
    }))
  }

  // ── 首頁：選科目 ──
  if (mode === 'home') {
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
              <a href="/admin/access" className="text-xs font-semibold text-[#76b900] transition hover:text-white">
                進入權限管理
              </a>
            </p>
          )}
          <p className="mt-3 text-xs text-gray-600">
            {viewerLoading ? '辨識身份中…' : viewer.isAdmin ? `管理者已登入：${viewer.email ?? 'Anson'}` : `已登入：${viewer.email ?? '使用者'} / 可見 ${viewer.allowedSubjects.length} 個科目`}
          </p>
        </div>
        <div className="space-y-3">
          {visibleGroups.map(group => (
            <button
              key={group.key}
              onClick={() => {
                setSelectedGroup(group.key)
                setSelectedKey(null)
                setSelectedSession(null)
                setMode('subject-select')
              }}
              className="w-full rounded-xl border border-[#1f1f1f] bg-[#111] px-6 py-4 text-left text-base
                         font-medium text-gray-200 transition hover:border-[#76b900] hover:text-[#76b900]"
            >
              <div>{group.title}</div>
              <div className="mt-1 text-xs text-gray-500">{group.subjectKeys.filter(subjectKey => allowedSubjectSet.has(subjectKey)).length} 個科目</div>
            </button>
          ))}
        </div>
      </div>
    )
  }

  if (mode === 'subject-select') {
    return (
      <div className="mx-auto max-w-lg px-4 py-10">
        <button onClick={() => setMode('home')} className="mb-6 text-sm text-[#76b900] hover:text-white transition">
          ← 返回
        </button>
        <h2 className="mb-2 text-xl font-black text-white">{selectedGroupData?.title}</h2>
        <p className="mb-6 text-sm text-gray-500">選擇科目</p>
        <div className="space-y-3">
          {visibleSubjects.map(subject => (
            <button
              key={subject.key}
              onClick={() => {
                setSelectedKey(subject.key as SubjectKey)
                setSelectedSession(null)
                setPage(0)
                setMode('session-select')
              }}
              className="w-full rounded-xl border border-[#1f1f1f] bg-[#111] px-6 py-4 text-left text-base
                         font-medium text-gray-200 transition hover:border-[#76b900] hover:text-[#76b900]"
            >
              {subject.label}
            </button>
          ))}
        </div>
      </div>
    )
  }

  // ── 選屆次 ──
  if (mode === 'session-select') {
    return (
      <div className="mx-auto max-w-lg px-4 py-10">
        <button onClick={() => setMode('subject-select')} className="mb-6 text-sm text-[#76b900] hover:text-white transition">
          ← 返回
        </button>
        <h2 className="mb-6 text-xl font-black text-white">
          {selectedSubjectLabel}
        </h2>
        {loading && <p className="text-center text-gray-500">載入中…</p>}
        {error && <p className="text-center text-red-500">{error}</p>}
        <div className="space-y-3">
          {data?.sessions.map(s => (
            <button
              key={s.session}
              onClick={() => { setSelectedSession(s.session); setPage(0); setMode('quiz') }}
              className="flex w-full items-center justify-between rounded-xl border border-[#1f1f1f]
                         bg-[#111] px-6 py-4 text-left transition hover:border-[#76b900]"
            >
              <span className="font-medium text-gray-200">{s.session}</span>
              <span className="text-sm text-[#76b900]">{s.questions.length} 題</span>
            </button>
          ))}
        </div>
      </div>
    )
  }

  // ── 刷題頁 ──
  const q = questions[page]

  // 頂部 header（兩種模式共用）
  const QuizHeader = () => (
    <div className="mb-4">
      <div className="flex items-center justify-between">
          <button onClick={() => setMode('session-select')} className="text-sm text-[#76b900] hover:text-white transition">
            ← 返回
          </button>
          <span className="text-sm text-gray-500">{selectedSession}</span>
      </div>
      {/* 模式切換 */}
      <div className="mt-3 flex rounded-lg border border-[#1f1f1f] bg-[#0a0a0a] p-1">
        <button
          onClick={() => { setQuizView('single'); setPage(0) }}
          className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition
            ${quizView === 'single' ? 'bg-[#76b900] text-black' : 'text-gray-500 hover:text-white'}`}
        >
          單題模式
        </button>
        <button
          onClick={() => { setQuizView('batch'); setPage(0) }}
          className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition
            ${quizView === 'batch' ? 'bg-[#76b900] text-black' : 'text-gray-500 hover:text-white'}`}
        >
          10題模式
        </button>
        <button
          onClick={() => { setQuizView('test'); setPage(0) }}
          className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition
            ${quizView === 'test' ? 'bg-[#76b900] text-black' : 'text-gray-500 hover:text-white'}`}
        >
          測試模式
        </button>
      </div>
    </div>
  )

  // ── 單題模式 ──
  if (quizView === 'single') {
    return (
      <div className="mx-auto max-w-lg px-4 py-6">
        <QuizHeader />
        <div className="mb-5 h-1 w-full rounded-full bg-[#1f1f1f]">
          <div
            className="h-1 rounded-full bg-[#76b900] transition-all"
            style={{ width: `${((page + 1) / questions.length) * 100}%` }}
          />
        </div>
        {q && <QuestionCard question={q} index={page + 1} total={questions.length} />}
        <div className="mt-5 flex gap-3">
          <button
            disabled={page === 0}
            onClick={() => setPage(p => p - 1)}
            className="flex-1 rounded-xl border border-[#1f1f1f] bg-[#111] py-3 text-sm font-medium
                       text-gray-400 disabled:opacity-30 transition hover:border-[#76b900] hover:text-white"
          >
            上一題
          </button>
          <button
            disabled={page === questions.length - 1}
            onClick={() => setPage(p => p + 1)}
            className="flex-1 rounded-xl bg-[#76b900] py-3 text-sm font-bold
                       text-black disabled:opacity-30 transition hover:bg-[#8fd400]"
          >
            下一題
          </button>
        </div>
      </div>
    )
  }

  if (quizView === 'test') {
    const testQuestion = questions[page]

    return (
      <div className="mx-auto max-w-lg px-4 py-6">
        <QuizHeader />
        <div className="mb-4 rounded-xl border border-[#1f1f1f] bg-[#111] px-4 py-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-400">已作答 {answeredCount} / {questions.length}</span>
            <span className="text-gray-500">目前第 {page + 1} 題</span>
          </div>
          {resumedDraft && !testSubmitted && (
            <p className="mt-2 text-xs text-[#b9ef65]">已延續上次測驗進度，可直接續測。</p>
          )}
          {!resumedDraft && hasLoadedDraft && !testSubmitted && (
            <p className="mt-2 text-xs text-gray-500">已建立新測驗，可隨時離開並下次續測。</p>
          )}
        </div>

        {testQuestion && (
          <QuestionCard
            question={testQuestion}
            index={page + 1}
            total={questions.length}
            revealAnswer={testSubmitted}
            selectedOption={testAnswers[testQuestion.no] ?? null}
            onSelectOption={handleChooseOption}
            disableSelection={testSubmitted}
          />
        )}

        <div className="mt-5 flex gap-3">
          <button
            disabled={page === 0}
            onClick={() => setPage(p => p - 1)}
            className="flex-1 rounded-xl border border-[#1f1f1f] bg-[#111] py-3 text-sm font-medium
                       text-gray-400 disabled:opacity-30 transition hover:border-[#76b900] hover:text-white"
          >
            上一題
          </button>
          <button
            disabled={page === questions.length - 1}
            onClick={() => setPage(p => p + 1)}
            className="flex-1 rounded-xl bg-[#76b900] py-3 text-sm font-bold
                       text-black disabled:opacity-30 transition hover:bg-[#8fd400]"
          >
            下一題
          </button>
        </div>

        {!testSubmitted && (
          <div className="mt-4 flex gap-3">
            <button
              onClick={handleRestartTest}
              className="flex-1 rounded-xl border border-[#1f1f1f] bg-[#111] py-3 text-sm font-medium text-gray-300 transition hover:border-white hover:text-white"
            >
              清空重測
            </button>
            <button
              onClick={handleSubmitTest}
              className="flex-1 rounded-xl bg-[#76b900] py-3 text-sm font-bold text-black transition hover:bg-[#8fd400]"
            >
              送出測驗
            </button>
          </div>
        )}

        {testSubmitted && testScore !== null && (
          <div className="mt-4 rounded-xl border border-[#76b900] bg-[#0d1a00] px-4 py-3">
            <p className="text-sm font-semibold text-[#b9ef65]">
              本次成績：{testScore} / {questions.length}（{questions.length ? Math.round((testScore / questions.length) * 100) : 0}%）
            </p>
            <p className="mt-1 text-xs text-gray-300">錯題數：{wrongCount}</p>
            <button
              onClick={handleRestartTest}
              className="mt-3 w-full rounded-lg bg-[#76b900] py-2 text-sm font-bold text-black transition hover:bg-[#8fd400]"
            >
              重新測驗
            </button>
          </div>
        )}

        {!testSubmitted && lastResult && (
          <p className="mt-4 text-xs text-gray-500">
            上次成績：{lastResult.score} / {lastResult.total}（{lastResult.total ? Math.round((lastResult.score / lastResult.total) * 100) : 0}%）
          </p>
        )}
      </div>
    )
  }

  // ── 10題模式 ──
  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <QuizHeader />
      <p className="mb-4 text-xs text-gray-600">
        第 {page * BATCH_SIZE + 1}–{Math.min((page + 1) * BATCH_SIZE, questions.length)} 題　共 {questions.length} 題
      </p>
      <div className="space-y-4">
        {batchQuestions.map((bq, i) => (
          <QuestionCard key={bq.no} question={bq} index={page * BATCH_SIZE + i + 1} total={questions.length} />
        ))}
      </div>
      <div className="mt-6 flex gap-3">
        <button
          disabled={page === 0}
          onClick={() => { setPage(p => p - 1); window.scrollTo(0, 0) }}
          className="flex-1 rounded-xl border border-[#1f1f1f] bg-[#111] py-3 text-sm font-medium
                     text-gray-400 disabled:opacity-30 transition hover:border-[#76b900] hover:text-white"
        >
          上 10 題
        </button>
        <button
          disabled={page === batchPageCount - 1}
          onClick={() => { setPage(p => p + 1); window.scrollTo(0, 0) }}
          className="flex-1 rounded-xl bg-[#76b900] py-3 text-sm font-bold
                     text-black disabled:opacity-30 transition hover:bg-[#8fd400]"
        >
          下 10 題
        </button>
      </div>
    </div>
  )
}
