import { getAccessIdentity } from '../_shared/access'
import { resolveViewerAccess } from '../_shared/access-control'

interface Env {
  ANSON_EMAIL?: string
  TEAM_DOMAIN?: string
  ACCESS_DB?: D1Database
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const identity = await getAccessIdentity(context.request, context.env)
  const viewer = await resolveViewerAccess(identity.email, context.env)

  return Response.json({
    email: viewer.email,
    isAdmin: viewer.isAdmin,
    allowedSubjects: viewer.allowedSubjects,
  })
}
