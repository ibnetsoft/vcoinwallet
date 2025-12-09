'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

// 지원하는 언어 목록
export const LANGUAGES = {
  ko: { name: '한국어', nativeName: '한국어', flag: '🇰🇷' },
  en: { name: 'English', nativeName: 'English', flag: '🇺🇸' },
  'zh-CN': { name: 'Chinese (Simplified)', nativeName: '简体中文', flag: '🇨🇳' },
  ja: { name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
  fr: { name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  hi: { name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  id: { name: 'Indonesian', nativeName: 'Bahasa Indonesia', flag: '🇮🇩' },
  de: { name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  ne: { name: 'Nepali', nativeName: 'नेपाली', flag: '🇳🇵' },
  ru: { name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
  ar: { name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
} as const

export type LanguageCode = keyof typeof LANGUAGES

interface LanguageContextType {
  language: LanguageCode
  setLanguage: (lang: LanguageCode) => void
  t: (key: string, params?: Record<string, string | number>) => string
  translations: Record<string, any>
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

interface LanguageProviderProps {
  children: ReactNode
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguageState] = useState<LanguageCode>('ko')
  const [translations, setTranslations] = useState<Record<string, any>>({})

  // 번역 파일 로드
  useEffect(() => {
    const loadTranslations = async () => {
      try {
        const response = await fetch(`/locales/${language}.json`)
        const data = await response.json()
        setTranslations(data)
      } catch (error) {
        console.error(`Failed to load translations for ${language}:`, error)
        // 실패 시 한국어로 폴백
        if (language !== 'ko') {
          const fallbackResponse = await fetch('/locales/ko.json')
          const fallbackData = await fallbackResponse.json()
          setTranslations(fallbackData)
        }
      }
    }

    loadTranslations()
  }, [language])

  // 로컬스토리지에서 언어 설정 불러오기
  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') as LanguageCode
    if (savedLanguage && LANGUAGES[savedLanguage]) {
      setLanguageState(savedLanguage)
    }
  }, [])

  // 언어 변경
  const setLanguage = (lang: LanguageCode) => {
    setLanguageState(lang)
    localStorage.setItem('language', lang)
    // HTML lang 속성 변경
    document.documentElement.lang = lang
  }

  // 번역 함수
  const t = (key: string, params?: Record<string, string | number>): string => {
    const keys = key.split('.')
    let value: any = translations

    for (const k of keys) {
      value = value?.[k]
      if (value === undefined) {
        console.warn(`Translation key not found: ${key}`)
        return key
      }
    }

    if (typeof value !== 'string') {
      console.warn(`Translation value is not a string: ${key}`)
      return key
    }

    // 파라미터 치환
    if (params) {
      return value.replace(/\{(\w+)\}/g, (match, paramKey) => {
        return params[paramKey]?.toString() || match
      })
    }

    return value
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, translations }}>
      {children}
    </LanguageContext.Provider>
  )
}

// Hook
export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
