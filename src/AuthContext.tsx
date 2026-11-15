import { t } from './i18n/locale'
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { getAuthSession, isAuthConfigured, loginAccount, logoutAccount, registerAccount, updateAccountAvatar, updateAccountProfile, type AuthUser } from './lib/auth'
import { saveAvatar as cacheAvatar } from './lib/avatar'
import { setSyncAccount } from './lib/accountSync'
import { accountRequest } from './lib/accountFeatures'

export type AuthStatus = 'checking' | 'authenticated' | 'unauthenticated' | 'unconfigured' | 'error'
interface AuthContextValue {
  status: AuthStatus
  user: AuthUser | null
  error: string
  configured: boolean
  login(input: { username?: string; email?: string; password: string }): Promise<AuthUser>
  register(input: { username?: string; name?: string; phone?: string; email?: string; password: string }): Promise<AuthUser>
  logout(): Promise<void>
  deleteAccount(password: string): Promise<void>
  saveAvatar(avatarId: string): Promise<void>
  updateProfile(input: { email?: string; phone?: string; name?: string }): Promise<AuthUser>
}
const AuthContext = createContext<AuthContextValue | null>(null)

function cacheProfileAvatar(user: AuthUser | null) {
  setSyncAccount(user?.storageMode === 'account' ? user.id : null)
  if (!user?.avatarId) return
  try { cacheAvatar(user.avatarId) } catch {}
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const configured = isAuthConfigured()
  const [status, setStatus] = useState<AuthStatus>(configured ? 'checking' : 'unconfigured')
  const [user, setUser] = useState<AuthUser | null>(null)
  const [error, setError] = useState('')
  const sessionGeneration = useRef(0)

  useEffect(() => {
    if (!configured) return
    const generation = sessionGeneration.current
    let active = true
    getAuthSession().then(session => {
      if (active && generation === sessionGeneration.current) { cacheProfileAvatar(session); setUser(session); setStatus(session ? 'authenticated' : 'unauthenticated') }
    }).catch(cause => {
      if (active && generation === sessionGeneration.current) { setError(cause instanceof Error ? cause.message : t("Không kiểm tra được phiên đăng nhập.")); setStatus('error') }
    })
    return () => { active = false }
  }, [configured])

  async function login(input: { username?: string; email?: string; password: string }) {
    const session = await loginAccount(input)
    sessionGeneration.current++
    cacheProfileAvatar(session)
    setUser(session); setError(''); setStatus('authenticated')
    return session
  }

  async function register(input: { username?: string; name?: string; phone?: string; email?: string; password: string }) {
    const session = await registerAccount(input)
    sessionGeneration.current++
    cacheProfileAvatar(session)
    setUser(session); setError(''); setStatus('authenticated')
    return session
  }

  async function logout() {
    await logoutAccount()
    sessionGeneration.current++
    setSyncAccount(null)
    setUser(null); setStatus('unauthenticated'); setError('')
  }
  async function deleteAccount(password: string) {
    if (!user) throw new Error(t("Hãy đăng nhập trước."))
    await accountRequest(user.id, '/delete-account', { password, confirmation: 'XÓA TÀI KHOẢN' })
    sessionGeneration.current++; setSyncAccount(null); setUser(null); setStatus('unauthenticated'); setError('')
  }

  async function saveAvatar(avatarId: string) {
    const generation = sessionGeneration.current
    const session = await updateAccountAvatar(avatarId)
    if (generation !== sessionGeneration.current) throw new Error(t("Phiên tài khoản đã thay đổi. Hãy thử lại."))
    cacheProfileAvatar(session)
    setUser(session); setError('')
  }

  async function updateProfile(input: { email?: string; phone?: string; name?: string }) {
    const generation = sessionGeneration.current
    const session = await updateAccountProfile(input)
    if (generation !== sessionGeneration.current) throw new Error(t("Phiên tài khoản đã thay đổi. Hãy thử lại."))
    cacheProfileAvatar(session)
    setUser(session); setError('')
    return session
  }

  return <AuthContext.Provider value={{ status, user, error, configured, login, register, logout, deleteAccount, saveAvatar, updateProfile }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('AuthProvider is missing.')
  return value
}

export function useOptionalAuth(){return useContext(AuthContext)}
