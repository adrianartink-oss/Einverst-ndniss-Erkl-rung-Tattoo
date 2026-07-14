import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import de from './locales/de'
import en from './locales/en'
import es from './locales/es'
import pt from './locales/pt'
import type { Language } from '../types'

export const resources = {
  de: { translation: de },
  en: { translation: en },
  es: { translation: es },
  pt: { translation: pt },
} as const

const STORAGE_KEY = 'tattoo-consent-language'

function initialLanguage(): Language {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored && ['de', 'en', 'es', 'pt'].includes(stored)) return stored as Language
  const nav = navigator.language.slice(0, 2)
  if (['de', 'en', 'es', 'pt'].includes(nav)) return nav as Language
  return 'de'
}

i18n.use(initReactI18next).init({
  resources,
  lng: initialLanguage(),
  fallbackLng: 'de',
  interpolation: { escapeValue: false },
  returnNull: false,
})

export function setAppLanguage(lng: Language): void {
  localStorage.setItem(STORAGE_KEY, lng)
  void i18n.changeLanguage(lng)
}

export default i18n

export const LANGUAGE_LABELS: Record<Language, string> = {
  de: 'Deutsch',
  en: 'English',
  es: 'Español',
  pt: 'Português',
}
