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
        className="flex items-center gap-1 p-2 rounded-lg bg-gray-800 border border-gray-700 hover:bg-gray-700 transition-colors"
        aria-label="Select language"
      >
        <span className="text-xl">{LANGUAGES[language].flag}</span>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-[99998]"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-64 bg-gray-900 rounded-lg shadow-xl border border-gray-700 z-[99999] max-h-96 overflow-y-auto">
            {(Object.entries(LANGUAGES) as [LanguageCode, typeof LANGUAGES[LanguageCode]][]).map(([code, lang]) => (
              <button
                key={code}
                onClick={() => handleLanguageChange(code)}
                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-700 transition-colors text-white ${
                  language === code ? 'bg-yellow-900/30' : ''
                }`}
              >
                <span className="text-2xl">{lang.flag}</span>
                <div className="flex-1 text-left">
                  <div className="font-medium text-sm">{lang.nativeName}</div>
                  <div className="text-xs text-gray-400">{lang.name}</div>
                </div>
                {language === code && (
                  <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
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
