import { useEffect, useState } from 'react'
import type { Subject } from '../types'

const cache: Record<string, Subject> = {}

export function useSubject(key: string | null) {
  const [data, setData] = useState<Subject | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!key) return
    if (cache[key]) { setData(cache[key]); return }

    setLoading(true)
    setError(null)
    fetch(`/data/subjects/${key}.json`)
      .then(r => { if (!r.ok) throw new Error('載入失敗'); return r.json() })
      .then((d: Subject) => { cache[key] = d; setData(d) })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [key])

  return { data, loading, error }
}
