const csrfToken = () => decodeURIComponent(document.cookie.split('; ').find(row => row.startsWith('csrftoken='))?.slice(10) ?? '')
export interface AuthUser {
  id: string
  name: string
  phone?: string
  email?: string
  avatarId?: string | null
  storageMode?: 'account'
  phoneVerifiedAt?: number | null
}

export const authApiBase = () => (import.meta.env.VITE_AUTH_API_URL ?? '/api/auth').trim().replace(/\/+$/, '')
export const isAuthConfigured = () => authApiBase().length > 0

async function request(path: string, method = 'GET', body?: unknown): Promise<{ user: AuthUser }> {
  const base = authApiBase()
  if (!base) throw new Error('Dịch vụ xác thực chưa được cấu hình.')
  const response = await fetch(`${base}${path}`, {
    method,
    credentials: 'include',
        headers: body ? { 'Content-Type': 'application/json', 'X-CSRFToken': csrfToken() } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!response.ok) {
    const payload = await response.json().catch(() => ({})) as { message?: string }
    if (response.status === 401 && path === '/session') throw new Error('Chưa đăng nhập.')
    throw new Error(payload.message ?? `Dịch vụ xác thực trả về lỗi ${response.status}.`)
  }
  const payload = await response.json() as { user?: AuthUser }
  if (!payload.user || !payload.user.id || !payload.user.name) throw new Error('Phản hồi hồ sơ từ dịch vụ xác thực không hợp lệ.')
  return { user: payload.user }
}

export async function getAuthSession(): Promise<AuthUser | null> {
  try { return (await request('/session')).user }
  catch (error) {
    if (error instanceof Error && error.message === 'Chưa đăng nhập.') return null
    throw error
  }
}

export async function registerAccount(input: { username?: string; name?: string; phone?: string; email?: string; password: string }): Promise<AuthUser> {
  return (await request('/register', 'POST', input)).user
}

export async function loginAccount(input: { username?: string; email?: string; password: string }): Promise<AuthUser> {
  return (await request('/login', 'POST', input)).user
}

export async function logoutAccount(): Promise<void> {
  const base = authApiBase()
  if (!base) throw new Error('Dịch vụ xác thực chưa được cấu hình.')
    const response = await fetch(`${base}/logout`, { method: 'POST', credentials: 'include', headers: { 'X-CSRFToken': csrfToken() } })
  if (!response.ok) throw new Error(`Không thể kết thúc phiên (lỗi ${response.status}).`)
}

export async function updateAccountAvatar(avatarId: string): Promise<AuthUser> {
  return (await request('/profile/avatar', 'PATCH', { avatarId })).user
}

export async function updateAccountProfile(input: { email?: string; phone?: string; name?: string }): Promise<AuthUser> {
  return (await request('/profile', 'PATCH', input)).user
}
