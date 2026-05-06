import { ALL_SUBJECT_KEYS, PUBLIC_SUBJECT_KEYS, isSubjectKey, type SubjectKey } from '../../src/types'
import { normalizeEmail } from './access'

interface Env {
  ACCESS_DB?: D1Database
  ANSON_EMAIL?: string
}

interface AccessRow {
  email: string
  is_admin: number
  allowed_subjects: string
  note: string | null
  updated_at: string
}

export interface ViewerAccess {
  email: string | null
  isAdmin: boolean
  allowedSubjects: SubjectKey[]
}

export interface AccessEntry {
  email: string
  isAdmin: boolean
  allowedSubjects: SubjectKey[]
  note: string
  updatedAt: string
}

function getAdminEmail(env: Env) {
  return normalizeEmail(env.ANSON_EMAIL)
}

function getAllSubjects() {
  return [...ALL_SUBJECT_KEYS]
}

function getDefaultSubjects() {
  return [...PUBLIC_SUBJECT_KEYS]
}

function uniqueSubjects(subjects: string[]) {
  return Array.from(new Set(subjects.filter(isSubjectKey)))
}

function parseAllowedSubjects(raw: string | string[] | null | undefined) {
  if (!raw) {
    return [] as SubjectKey[]
  }

  if (Array.isArray(raw)) {
    return uniqueSubjects(raw)
  }

  try {
    const parsed = JSON.parse(raw) as unknown
    if (Array.isArray(parsed)) {
      return uniqueSubjects(parsed.filter((item): item is string => typeof item === 'string'))
    }
  } catch {
    return uniqueSubjects(raw.split(',').map(item => item.trim().toLowerCase()))
  }

  return [] as SubjectKey[]
}

function mapRow(row: AccessRow): AccessEntry {
  return {
    email: row.email,
    isAdmin: Boolean(row.is_admin),
    allowedSubjects: Boolean(row.is_admin) ? getAllSubjects() : parseAllowedSubjects(row.allowed_subjects),
    note: row.note ?? '',
    updatedAt: row.updated_at,
  }
}

async function getRowByEmail(email: string, env: Env) {
  if (!env.ACCESS_DB) {
    return null
  }

  return await env.ACCESS_DB
    .prepare('SELECT email, is_admin, allowed_subjects, note, updated_at FROM user_access WHERE email = ?1')
    .bind(email)
    .first<AccessRow>()
}

export async function resolveViewerAccess(email: string | null, env: Env): Promise<ViewerAccess> {
  const normalizedEmail = normalizeEmail(email)
  const adminEmail = getAdminEmail(env)

  if (!normalizedEmail) {
    return {
      email: null,
      isAdmin: false,
      allowedSubjects: getDefaultSubjects(),
    }
  }

  if (adminEmail && normalizedEmail === adminEmail) {
    return {
      email: normalizedEmail,
      isAdmin: true,
      allowedSubjects: getAllSubjects(),
    }
  }

  const row = await getRowByEmail(normalizedEmail, env)
  if (!row) {
    return {
      email: normalizedEmail,
      isAdmin: false,
      allowedSubjects: getDefaultSubjects(),
    }
  }

  if (row.is_admin) {
    return {
      email: normalizedEmail,
      isAdmin: true,
      allowedSubjects: getAllSubjects(),
    }
  }

  const allowedSubjects = parseAllowedSubjects(row.allowed_subjects)

  return {
    email: normalizedEmail,
    isAdmin: false,
    allowedSubjects: allowedSubjects.length ? allowedSubjects : getDefaultSubjects(),
  }
}

export async function listAccessEntries(env: Env) {
  if (!env.ACCESS_DB) {
    throw new Error('ACCESS_DB is not configured')
  }

  const result = await env.ACCESS_DB
    .prepare('SELECT email, is_admin, allowed_subjects, note, updated_at FROM user_access ORDER BY email ASC')
    .all<AccessRow>()

  const entries = (result.results ?? []).map(mapRow)
  const adminEmail = getAdminEmail(env)

  if (adminEmail && !entries.some(entry => entry.email === adminEmail)) {
    entries.unshift({
      email: adminEmail,
      isAdmin: true,
      allowedSubjects: getAllSubjects(),
      note: 'System administrator',
      updatedAt: new Date().toISOString(),
    })
  }

  return entries
}

export async function upsertAccessEntry(
  input: { email: string; allowedSubjects: string[]; note?: string | null },
  env: Env,
) {
  if (!env.ACCESS_DB) {
    throw new Error('ACCESS_DB is not configured')
  }

  const email = normalizeEmail(input.email)
  if (!email) {
    throw new Error('email is required')
  }

  const adminEmail = getAdminEmail(env)
  const isAdmin = Boolean(adminEmail && email === adminEmail)
  const allowedSubjects = isAdmin ? getAllSubjects() : parseAllowedSubjects(input.allowedSubjects)
  if (!allowedSubjects.length) {
    throw new Error('at least one subject is required')
  }

  const note = input.note?.trim() ?? ''

  await env.ACCESS_DB
    .prepare(`
      INSERT INTO user_access (email, is_admin, allowed_subjects, note, updated_at)
      VALUES (?1, ?2, ?3, ?4, CURRENT_TIMESTAMP)
      ON CONFLICT(email) DO UPDATE SET
        is_admin = excluded.is_admin,
        allowed_subjects = excluded.allowed_subjects,
        note = excluded.note,
        updated_at = CURRENT_TIMESTAMP
    `)
    .bind(email, isAdmin ? 1 : 0, JSON.stringify(allowedSubjects), note)
    .run()

  return {
    email,
    isAdmin,
    allowedSubjects,
    note,
  }
}

export async function deleteAccessEntry(email: string, env: Env) {
  if (!env.ACCESS_DB) {
    throw new Error('ACCESS_DB is not configured')
  }

  const normalizedEmail = normalizeEmail(email)
  const adminEmail = getAdminEmail(env)

  if (!normalizedEmail) {
    throw new Error('email is required')
  }

  if (adminEmail && normalizedEmail === adminEmail) {
    throw new Error('cannot delete admin access')
  }

  await env.ACCESS_DB.prepare('DELETE FROM user_access WHERE email = ?1').bind(normalizedEmail).run()
}

export function hasSubjectAccess(subjectKey: SubjectKey, allowedSubjects: readonly SubjectKey[]) {
  return allowedSubjects.includes(subjectKey)
}
