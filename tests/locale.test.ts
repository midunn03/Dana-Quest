// @vitest-environment jsdom
import { afterEach, expect, it } from 'vitest'
import { resolveLocale, setLocale, t, formatDate, languageStorageKey } from '../src/i18n/locale'
afterEach(()=>{setLocale('vi');localStorage.clear()})
it('resolves system language and supports explicit VI/EN',()=>{
 expect(resolveLocale('system','en-US')).toBe('en')
 expect(resolveLocale('system','vi-VN')).toBe('vi')
 expect(resolveLocale('en','vi-VN')).toBe('en')
})
it('translates source strings and uses locale-aware dates without changing Vietnamese',()=>{
 setLocale('en'); expect(t('Đăng nhập','Log in')).toBe('Log in')
 expect(formatDate('2026-10-27')).toContain('2026')
 setLocale('vi'); expect(t('Đăng nhập','Log in')).toBe('Đăng nhập')
})
it('separates guest preferences from every account',()=>{
 expect(languageStorageKey()).not.toBe(languageStorageKey('account-a'))
 expect(languageStorageKey('account-a')).not.toBe(languageStorageKey('account-b'))
})
