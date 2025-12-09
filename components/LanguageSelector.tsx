'use client'

import { useState } from 'react'
import { useLanguage, LANGUAGES, LanguageCode } from '@/contexts/LanguageContext'
import { Globe } from 'lucide-react'

export default function LanguageSelector() {
  const { language, setLanguage } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)

  const handleLanguageChange = (lang: LanguageCode) => {
    setLanguage(lang)
    setIsOpen(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors"
        aria-label="Select language"
      >
        <Globe className="w-5 h-5" />
        <span className="text-2xl">{LANGUAGES[language].flag}</span>
        <span className="text-sm font-medium">{LANGUAGES[language].nativeName}</span>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 max-h-96 overflow-y-auto">
            {(Object.entries(LANGUAGES) as [LanguageCode, typeof LANGUAGES[LanguageCode]][]).map(([code, lang]) => (
              <button
                key={code}
                onClick={() => handleLanguageChange(code)}
                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                  language === code ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''
                }`}
              >
                <span className="text-2xl">{lang.flag}</span>
                <div className="flex-1 text-left">
                  <div className="font-medium text-sm">{lang.nativeName}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{lang.name}</div>
                </div>
                {language === code && (
                  <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
