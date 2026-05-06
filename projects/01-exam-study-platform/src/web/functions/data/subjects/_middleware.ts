import { isSubjectKey } from '../../../src/types'
import { getAccessEmail } from '../../_shared/access'
import { hasSubjectAccess, resolveViewerAccess } from '../../_shared/access-control'

interface Env {
  ANSON_EMAIL?: string
  TEAM_DOMAIN?: string
  ACCESS_DB?: D1Database
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const requestedPath = new URL(context.request.url).pathname.split('/').pop()
  if (!requestedPath) {
    return context.next()
  }

  if (!requestedPath.endsWith('.json')) {
    return context.next()
  }

  const subjectKey = requestedPath.replace(/\.json$/, '')
  if (!isSubjectKey(subjectKey)) {
    return context.next()
  }

  const email = await getAccessEmail(context.request, context.env)
  const viewer = await resolveViewerAccess(email, context.env)

  if (hasSubjectAccess(subjectKey, viewer.allowedSubjects)) {
    return context.next()
  }

  return new Response('Forbidden', { status: 403 })
}
