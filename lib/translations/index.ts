import { en } from './en'
import { fr } from './fr'

export type Language = 'en' | 'fr'
export type TranslationKey = keyof typeof en

export const translations = {
  en,
  fr
} as const

export function getTranslations(language: Language) {
  return translations[language]
}

// Type-safe translation function
export function translate<T extends TranslationKey>(
  language: Language,
  key: T,
  ...args: typeof en[T] extends (...args: any[]) => any 
    ? Parameters<typeof en[T]> 
    : []
): string {
  const t = translations[language]
  const translation = t[key]
  
  if (typeof translation === 'function') {
    return (translation as any)(...args)
  }
  
  return translation as string
}

// React hook for translations
export function useTranslations(language: Language) {
  return translations[language]
}