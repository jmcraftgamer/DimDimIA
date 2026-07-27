import axios from 'axios'

const TOKEN_URL = 'https://api.mercadolibre.com/oauth/token'
const AUTH_URL = 'https://auth.mercadolivre.com.br/authorization'

export interface MLAuthConfig {
  clientId: string
  clientSecret: string
  redirectUri: string
}

export interface MLToken {
  accessToken: string
  refreshToken: string
  expiresAt: number
}

let currentToken: MLToken | null = null

function getConfig(): MLAuthConfig | null {
  const clientId = process.env.ML_CLIENT_ID
  const clientSecret = process.env.ML_CLIENT_SECRET
  const redirectUri = process.env.ML_REDIRECT_URI || 'https://dimdimia.vercel.app/api/auth/ml-callback'
  if (!clientId || !clientSecret) return null
  return { clientId, clientSecret, redirectUri }
}

export function isMLApiConfigured(): boolean {
  return !!process.env.ML_CLIENT_ID && !!process.env.ML_CLIENT_SECRET
}

export function getAuthorizationUrl(state: string): string {
  const config = getConfig()
  if (!config) return ''
  const params = new URLSearchParams({
    client_id: config.clientId,
    response_type: 'code',
    redirect_uri: config.redirectUri,
    state,
  })
  return `${AUTH_URL}?${params.toString()}`
}

export async function exchangeCodeForToken(code: string): Promise<MLToken> {
  const config = getConfig()
  if (!config) throw new Error('ML API not configured')

  const { data } = await axios.post(TOKEN_URL, {
    grant_type: 'authorization_code',
    client_id: config.clientId,
    client_secret: config.clientSecret,
    code,
    redirect_uri: config.redirectUri,
  })

  const token: MLToken = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  }

  currentToken = token
  return token
}

export async function refreshAccessToken(refreshToken: string): Promise<MLToken> {
  const config = getConfig()
  if (!config) throw new Error('ML API not configured')

  const { data } = await axios.post(TOKEN_URL, {
    grant_type: 'refresh_token',
    client_id: config.clientId,
    client_secret: config.clientSecret,
    refresh_token: refreshToken,
  })

  const token: MLToken = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  }

  currentToken = token
  return token
}

export async function getValidAccessToken(): Promise<string | null> {
  if (!isMLApiConfigured()) return null

  if (currentToken && currentToken.expiresAt > Date.now() + 60000) {
    return currentToken.accessToken
  }

  const fromEnv = process.env.ML_ACCESS_TOKEN
  const refreshFromEnv = process.env.ML_REFRESH_TOKEN

  if (fromEnv && refreshFromEnv) {
    try {
      const token = await refreshAccessToken(refreshFromEnv)
      return token.accessToken
    } catch {
      return fromEnv
    }
  }

  if (fromEnv) return fromEnv
  return null
}

export function getMLHeaders(): Record<string, string> {
  return {
    'User-Agent': 'DimDimIA/1.0',
    Accept: 'application/json',
  }
}
