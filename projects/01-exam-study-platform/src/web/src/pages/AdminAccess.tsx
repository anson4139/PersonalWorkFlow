import { useEffect, useMemo, useState } from 'react'
import { useViewer } from '../hooks/useViewer'
import { EXAM_GROUPS, SUBJECTS, type SubjectKey } from '../types'

interface AccessEntry {
  email: string
  isAdmin: boolean
  allowedSubjects: SubjectKey[]
  note: string
  updatedAt: string
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function sortSubjects(subjects: SubjectKey[]) {
  const order = new Map(SUBJECTS.map((subject, index) => [subject.key, index]))
  return [...subjects].sort((left, right) => (order.get(left) ?? 0) - (order.get(right) ?? 0))
}

export default function AdminAccess() {
  const { viewer, loading: viewerLoading } = useViewer()
  const [entries, setEntries] = useState<AccessEntry[]>([])
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null)
  const [formEmail, setFormEmail] = useState('')
  const [formNote, setFormNote] = useState('')
  const [formSubjects, setFormSubjects] = useState<SubjectKey[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const editingEntry = useMemo(
    () => entries.find(entry => entry.email === selectedEmail) ?? null,
    [entries, selectedEmail],
  )

  async function loadEntries() {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/admin/access', { credentials: 'same-origin' })
      if (!response.ok) {
        throw new Error('權限列表載入失敗')
      }

      const data = (await response.json()) as { entries: AccessEntry[] }
      setEntries(data.entries)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : '權限列表載入失敗')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!viewer.isAdmin) {
      return
    }

    void loadEntries()
  }, [viewer.isAdmin])

  useEffect(() => {
    if (!editingEntry) {
      return
    }

    setFormEmail(editingEntry.email)
    setFormNote(editingEntry.note)
    setFormSubjects(sortSubjects(editingEntry.allowedSubjects))
  }, [editingEntry])

  function resetForm() {
    setSelectedEmail(null)
    setFormEmail('')
    setFormNote('')
    setFormSubjects([])
    setMessage(null)
    setError(null)
  }

  function toggleSubject(subjectKey: SubjectKey) {
    setFormSubjects(current => {
      if (current.includes(subjectKey)) {
        return current.filter(item => item !== subjectKey)
      }

      return sortSubjects([...current, subjectKey])
    })
  }

  function toggleGroup(groupKey: string) {
    const group = EXAM_GROUPS.find(item => item.key === groupKey)
    if (!group) {
      return
    }

    setFormSubjects(current => {
      const hasAll = group.subjectKeys.every(subjectKey => current.includes(subjectKey))
      if (hasAll) {
        return current.filter(subjectKey => !group.subjectKeys.includes(subjectKey))
      }

      return sortSubjects([...new Set([...current, ...group.subjectKeys])])
    })
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError(null)
    setMessage(null)

    try {
      const response = await fetch('/api/admin/access', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          email: formEmail,
          note: formNote,
          allowedSubjects: formSubjects,
        }),
      })

      if (!response.ok) {
        throw new Error('儲存授權失敗')
      }

      await loadEntries()
      setSelectedEmail(formEmail.trim().toLowerCase())
      setMessage('授權已儲存')
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : '儲存授權失敗')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!editingEntry || editingEntry.isAdmin) {
      return
    }

    const confirmed = window.confirm(`確定要移除 ${editingEntry.email} 的授權嗎？`)
    if (!confirmed) {
      return
    }

    setSaving(true)
    setError(null)
    setMessage(null)

    try {
      const response = await fetch(`/api/admin/access?email=${encodeURIComponent(editingEntry.email)}`, {
        method: 'DELETE',
        credentials: 'same-origin',
      })

      if (!response.ok) {
        throw new Error('刪除授權失敗')
      }

      await loadEntries()
      resetForm()
      setMessage('授權已移除')
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : '刪除授權失敗')
    } finally {
      setSaving(false)
    }
  }

  if (viewerLoading) {
    return <div className="mx-auto max-w-6xl px-4 py-10 text-sm text-gray-500">辨識身份中…</div>
  }

  if (!viewer.isAdmin) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <a href="/" className="text-sm text-[#76b900] transition hover:text-white">← 返回首頁</a>
        <div className="mt-6 rounded-2xl border border-[#1f1f1f] bg-[#111] p-6">
          <h1 className="text-2xl font-black text-white">權限管理</h1>
          <p className="mt-3 text-sm leading-relaxed text-gray-400">只有管理者可以進入這個頁面。請以 `anson4139@gmail.com` 登入後再操作。</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <a href="/" className="text-sm text-[#76b900] transition hover:text-white">← 返回首頁</a>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-white">題庫權限管理</h1>
          <p className="mt-2 text-sm text-gray-500">管理 Gmail 使用者可見的題庫。管理者：{viewer.email}</p>
        </div>
        <button
          type="button"
          onClick={resetForm}
          className="rounded-xl border border-[#1f1f1f] bg-[#111] px-4 py-2 text-sm font-medium text-gray-300 transition hover:border-[#76b900] hover:text-white"
        >
          新增授權
        </button>
      </div>

      {(error || message) && (
        <div className={`mb-4 rounded-xl border px-4 py-3 text-sm ${error ? 'border-red-800 bg-red-950/40 text-red-300' : 'border-[#294800] bg-[#0d1a00] text-[#9de23b]'}`}>
          {error ?? message}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.2fr,1.8fr]">
        <div className="rounded-2xl border border-[#1f1f1f] bg-[#111] p-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">已授權使用者</h2>
            {loading && <span className="text-xs text-gray-500">載入中…</span>}
          </div>
          <div className="space-y-3">
            {entries.map(entry => (
              <button
                key={entry.email}
                type="button"
                onClick={() => setSelectedEmail(entry.email)}
                className={`w-full rounded-xl border px-4 py-3 text-left transition ${selectedEmail === entry.email ? 'border-[#76b900] bg-[#0d1a00]' : 'border-[#1f1f1f] bg-[#0a0a0a] hover:border-[#76b900]'}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-white">{entry.email}</div>
                    <div className="mt-1 text-xs text-gray-500">{entry.isAdmin ? '管理者 / 全部題庫' : `${entry.allowedSubjects.length} 個科目`}</div>
                  </div>
                  <span className="shrink-0 text-[11px] text-gray-600">{formatDate(entry.updatedAt)}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl border border-[#1f1f1f] bg-[#111] p-5">
          <h2 className="text-lg font-bold text-white">{editingEntry ? '編輯授權' : '新增授權'}</h2>
          <div className="mt-5 space-y-5">
            <label className="block">
              <span className="mb-2 block text-xs font-semibold tracking-wide text-gray-500 uppercase">Gmail</span>
              <input
                value={formEmail}
                onChange={event => setFormEmail(event.target.value)}
                placeholder="user@gmail.com"
                disabled={Boolean(editingEntry?.isAdmin)}
                className="w-full rounded-xl border border-[#1f1f1f] bg-[#0a0a0a] px-4 py-3 text-sm text-white outline-none transition focus:border-[#76b900] disabled:cursor-not-allowed disabled:opacity-60"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-semibold tracking-wide text-gray-500 uppercase">備註</span>
              <input
                value={formNote}
                onChange={event => setFormNote(event.target.value)}
                placeholder="例如：AI 班測試使用者"
                className="w-full rounded-xl border border-[#1f1f1f] bg-[#0a0a0a] px-4 py-3 text-sm text-white outline-none transition focus:border-[#76b900]"
              />
            </label>

            <div>
              <div className="mb-2 text-xs font-semibold tracking-wide text-gray-500 uppercase">考試分類快捷勾選</div>
              <div className="flex flex-wrap gap-2">
                {EXAM_GROUPS.map(group => {
                  const allSelected = group.subjectKeys.every(subjectKey => formSubjects.includes(subjectKey))
                  return (
                    <button
                      key={group.key}
                      type="button"
                      onClick={() => toggleGroup(group.key)}
                      disabled={Boolean(editingEntry?.isAdmin)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${allSelected ? 'border-[#76b900] bg-[#0d1a00] text-[#9de23b]' : 'border-[#1f1f1f] bg-[#0a0a0a] text-gray-400 hover:border-[#76b900] hover:text-white'} disabled:cursor-not-allowed disabled:opacity-60`}
                    >
                      {group.title}
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <div className="mb-3 text-xs font-semibold tracking-wide text-gray-500 uppercase">科目細項</div>
              <div className="grid gap-3 md:grid-cols-2">
                {SUBJECTS.map(subject => (
                  <label
                    key={subject.key}
                    className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm transition ${formSubjects.includes(subject.key) ? 'border-[#76b900] bg-[#0d1a00]' : 'border-[#1f1f1f] bg-[#0a0a0a]'}`}
                  >
                    <input
                      type="checkbox"
                      checked={formSubjects.includes(subject.key)}
                      onChange={() => toggleSubject(subject.key)}
                      disabled={Boolean(editingEntry?.isAdmin)}
                      className="mt-1"
                    />
                    <span>
                      <span className="block font-medium text-white">{subject.label}</span>
                      <span className="mt-1 block text-xs text-gray-500">{EXAM_GROUPS.find(group => group.key === subject.groupKey)?.title}</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-[#76b900] px-5 py-3 text-sm font-bold text-black transition hover:bg-[#8fd400] disabled:opacity-50"
              >
                {saving ? '儲存中…' : '儲存授權'}
              </button>
              {editingEntry && !editingEntry.isAdmin && (
                <button
                  type="button"
                  onClick={() => void handleDelete()}
                  disabled={saving}
                  className="rounded-xl border border-red-800 px-5 py-3 text-sm font-medium text-red-300 transition hover:bg-red-950/50 disabled:opacity-50"
                >
                  移除授權
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
