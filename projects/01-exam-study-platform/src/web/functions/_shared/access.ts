interface Env {
  ANSON_EMAIL?: string
  TEAM_DOMAIN?: string
}

interface AccessIdentityResponse {
  email?: string
}

export interface AccessIdentityDiagnostics {
  resolvedFrom: 'header' | 'jwt-header' | 'jwt-cookie' | 'identity-endpoint' | 'none'
  hasCookie: boolean
  hasJwtHeader: boolean
  hasEmailHeader: boolean
  hasConfiguredEmail: boolean
}

const DEFAULT_TEAM_DOMAIN = 'https://buclaw.cloudflareaccess.com'

function normalizeEmail(email: string | null | undefined) {
  const value = email?.trim().toLowerCase()
  return value ? value : null
}

export { normalizeEmail }

function getTeamDomain(env: Env) {
  const value = env.TEAM_DOMAIN?.trim()
  return value ? value.replace(/\/$/, '') : DEFAULT_TEAM_DOMAIN
}

function decodeJwtPayload(token: string | null) {
  if (!token) {
    return null
  }

  const parts = token.split('.')
  if (parts.length < 2) {
    return null
  }

  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')
    const payload = JSON.parse(atob(padded)) as { email?: string }
    return payload
  } catch {
    return null
  }
}

function getCookieValue(cookieHeader: string | null, name: string) {
  if (!cookieHeader) {
    return null
  }

  const cookies = cookieHeader.split(';')
  for (const cookie of cookies) {
    const [rawName, ...rest] = cookie.trim().split('=')
    if (rawName === name) {
      return rest.join('=') || null
    }
  }

  return null
}

export async function getAccessIdentity(request: Request, env: Env) {
  const cookieHeader = request.headers.get('cookie')
  const emailHeader = normalizeEmail(request.headers.get('cf-access-authenticated-user-email'))
  const jwtHeader = request.headers.get('cf-access-jwt-assertion')
  const cookieToken = getCookieValue(cookieHeader, 'CF_Authorization')

  const diagnostics: AccessIdentityDiagnostics = {
    resolvedFrom: 'none',
    hasCookie: Boolean(cookieToken),
    hasJwtHeader: Boolean(jwtHeader),
    hasEmailHeader: Boolean(emailHeader),
    hasConfiguredEmail: Boolean(normalizeEmail(env.ANSON_EMAIL)),
  }

  if (emailHeader) {
    diagnostics.resolvedFrom = 'header'
    return { email: emailHeader, diagnostics }
  }

  const jwtHeaderEmail = normalizeEmail(decodeJwtPayload(jwtHeader)?.email)
  if (jwtHeaderEmail) {
    diagnostics.resolvedFrom = 'jwt-header'
    return { email: jwtHeaderEmail, diagnostics }
  }

  const cookieEmail = normalizeEmail(decodeJwtPayload(cookieToken)?.email)
  if (cookieEmail) {
    diagnostics.resolvedFrom = 'jwt-cookie'
    return { email: cookieEmail, diagnostics }
  }

  if (!cookieToken || !cookieHeader) {
    return { email: null, diagnostics }
  }

  const response = await fetch(`${getTeamDomain(env)}/cdn-cgi/access/get-identity`, {
    headers: {
      cookie: cookieHeader,
    },
  })

  if (!response.ok) {
    return { email: null, diagnostics }
  }

  const data = (await response.json()) as AccessIdentityResponse
  const email = normalizeEmail(data.email)
  diagnostics.resolvedFrom = email ? 'identity-endpoint' : 'none'
  return { email, diagnostics }
}

export async function getAccessEmail(request: Request, env: Env) {
  const identity = await getAccessIdentity(request, env)
  return identity.email
}

