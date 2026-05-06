import { useEffect, useState } from 'react'
import { ALL_SUBJECT_KEYS, PUBLIC_SUBJECT_KEYS, isSubjectKey, type SubjectKey } from '../types'

const ADMIN_EMAIL = (import.meta.env.VITE_ADMIN_EMAIL ?? import.meta.env.VITE_PRIVILEGED_EMAIL ?? '').trim().toLowerCase()
const DEV_VIEWER_EMAIL = (import.meta.env.VITE_DEV_VIEWER_EMAIL ?? '').trim().toLowerCase()
const DEV_ALLOWED_SUBJECTS = (import.meta.env.VITE_DEV_ALLOWED_SUBJECTS ?? '').trim()
const DEV_IS_ADMIN = (import.meta.env.VITE_DEV_IS_ADMIN ?? '').trim().toLowerCase() === 'true'

export interface Viewer {
  email: string | null
  isAdmin: boolean
  allowedSubjects: SubjectKey[]
}

function normalizeEmail(email: string | null | undefined) {
  const value = email?.trim().toLowerCase()
  return value ? value : null
}

function normalizeAllowedSubjects(subjects: string[] | null | undefined) {
  if (!subjects?.length) {
    return [] as SubjectKey[]
  }

  return Array.from(new Set(subjects.filter(isSubjectKey)))
}

function getDevAllowedSubjects(email: string | null, isAdmin: boolean) {
  if (DEV_ALLOWED_SUBJECTS) {
    return normalizeAllowedSubjects(DEV_ALLOWED_SUBJECTS.split(',').map(item => item.trim().toLowerCase()))
  }

  if (isAdmin || (email && ADMIN_EMAIL && email === ADMIN_EMAIL)) {
    return [...ALL_SUBJECT_KEYS]
  }

  return [...PUBLIC_SUBJECT_KEYS]
}

function createViewer(email: string | null, isAdmin = false, allowedSubjects: SubjectKey[] = [...PUBLIC_SUBJECT_KEYS]): Viewer {
  return {
    email,
    isAdmin,
    allowedSubjects,
  }
}

export function useViewer() {
  const [viewer, setViewer] = useState<Viewer>(() => {
    const email = normalizeEmail(DEV_VIEWER_EMAIL)
    const isAdmin = DEV_IS_ADMIN || Boolean(email && ADMIN_EMAIL && email === ADMIN_EMAIL)
    return createViewer(email, isAdmin, getDevAllowedSubjects(email, isAdmin))
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function loadViewer() {
      try {
        const response = await fetch('/api/session', { credentials: 'same-origin' })
        if (!response.ok) {
          throw new Error('session unavailable')
        }

        const data = (await response.json()) as { email?: string | null; isAdmin?: boolean; allowedSubjects?: string[] }
        if (!active) {
          return
        }

        const email = normalizeEmail(data.email)
        const isAdmin = Boolean(data.isAdmin)
        const allowedSubjects = normalizeAllowedSubjects(data.allowedSubjects)
        setViewer(createViewer(email, isAdmin, allowedSubjects.length ? allowedSubjects : getDevAllowedSubjects(email, isAdmin)))
      } catch {
        if (!active) {
          return
        }

        const email = normalizeEmail(DEV_VIEWER_EMAIL)
        const isAdmin = DEV_IS_ADMIN || Boolean(email && ADMIN_EMAIL && email === ADMIN_EMAIL)
        setViewer(createViewer(email, isAdmin, getDevAllowedSubjects(email, isAdmin)))
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    void loadViewer()

    return () => {
      active = false
    }
  }, [])

  return { viewer, loading }
}
