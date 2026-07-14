import type { Consent, Language } from '../types'

export function fullName(c: Consent): string {
  return [c.customer.firstName, c.customer.lastName].filter(Boolean).join(' ').trim()
}

export function ageFromDob(dob: string): number | null {
  if (!dob) return null
  const d = new Date(dob)
  if (isNaN(d.getTime())) return null
  const now = new Date()
  let age = now.getFullYear() - d.getFullYear()
  const m = now.getMonth() - d.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--
  return age
}

const LOCALES: Record<Language, string> = {
  de: 'de-DE',
  en: 'en-GB',
  es: 'es-ES',
  pt: 'pt-PT',
}

export function formatDate(value: number | string, lang: Language = 'de'): string {
  const d = typeof value === 'number' ? new Date(value) : new Date(value)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleDateString(LOCALES[lang] ?? 'de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function formatDateTime(value: number, lang: Language = 'de'): string {
  const d = new Date(value)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleString(LOCALES[lang] ?? 'de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** Safe file name: YYYY-MM-DD_Lastname_Firstname */
export function consentFileName(c: Consent): string {
  const date = new Date(c.signatures.date || c.createdAt)
  const iso = isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10)
  const name = [c.customer.lastName, c.customer.firstName]
    .filter(Boolean)
    .join('_')
    .replace(/[^\p{L}\p{N}_-]+/gu, '')
  return `${iso}_${name || 'Consent'}.pdf`
}
