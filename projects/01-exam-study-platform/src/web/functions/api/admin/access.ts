import { getAccessEmail } from '../../_shared/access'
import { deleteAccessEntry, listAccessEntries, resolveViewerAccess, upsertAccessEntry } from '../../_shared/access-control'

interface Env {
  ANSON_EMAIL?: string
  TEAM_DOMAIN?: string
  ACCESS_DB?: D1Database
}

async function requireAdmin(context: EventContext<Env, string, unknown>) {
  const email = await getAccessEmail(context.request, context.env)
  const viewer = await resolveViewerAccess(email, context.env)

  if (!viewer.isAdmin) {
    return null
  }

  return viewer
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const viewer = await requireAdmin(context)
  if (!viewer) {
    return new Response('Forbidden', { status: 403 })
  }

  const entries = await listAccessEntries(context.env)
  return Response.json({ entries })
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const viewer = await requireAdmin(context)
  if (!viewer) {
    return new Response('Forbidden', { status: 403 })
  }

  const body = (await context.request.json()) as {
    email?: string
    allowedSubjects?: string[]
    note?: string | null
  }

  const entry = await upsertAccessEntry(
    {
      email: body.email ?? '',
      allowedSubjects: body.allowedSubjects ?? [],
      note: body.note ?? '',
    },
    context.env,
  )

  return Response.json({ entry })
}

export const onRequestDelete: PagesFunction<Env> = async (context) => {
  const viewer = await requireAdmin(context)
  if (!viewer) {
    return new Response('Forbidden', { status: 403 })
  }

  const email = new URL(context.request.url).searchParams.get('email') ?? ''
  await deleteAccessEntry(email, context.env)
  return Response.json({ ok: true })
}
