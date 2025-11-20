'use client'

import { useState, useEffect } from 'react'
import { X, ExternalLink, Copy, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function KakaoBrowserWarning() {
  const [isKakaoBrowser, setIsKakaoBrowser] = useState(false)
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    // 카카오톡 인앱 브라우저 감지
    const userAgent = navigator.userAgent.toLowerCase()
    const isKakao = userAgent.includes('kakaotalk')

    setIsKakaoBrowser(isKakao)

    // 로컬 스토리지에서 배너 닫기 상태 확인
    const isClosed = localStorage.getItem('kakao_browser_warning_closed')
    if (isClosed === 'true') {
      setIsVisible(false)
    }
  }, [])

  const handleClose = () => {
    setIsVisible(false)
    localStorage.setItem('kakao_browser_warning_closed', 'true')
  }

  const handleCopyUrl = () => {
    const url = window.location.href
    navigator.clipboard.writeText(url).then(() => {
      toast.success('URL이 복사되었습니다! 크롬 브라우저 주소창에 붙여넣기 해주세요.')
    }).catch(() => {
      toast.error('URL 복사에 실패했습니다.')
    })
  }

  if (!isKakaoBrowser || !isVisible) {
    return null
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-500 text-gray-900 px-4 py-3 shadow-lg">
      <div className="max-w-6xl mx-auto flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold text-sm mb-1">
              크롬 브라우저 사용을 권장합니다
            </p>
            <p className="text-xs leading-relaxed mb-2">
              원활한 서비스 이용을 위해 크롬 브라우저에서 여는 것을 권장합니다.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={handleCopyUrl}
                className="flex items-center justify-center gap-2 px-3 py-1.5 bg-gray-900 text-yellow-400 rounded text-xs font-semibold hover:bg-gray-800 transition"
              >
                <Copy className="w-3.5 h-3.5" />
                URL 복사하기
              </button>
              <div className="text-xs text-gray-800 flex items-center">
                <span className="hidden sm:inline">또는</span>
                <span className="sm:hidden">👉</span>
                <span className="ml-1">
                  우측 상단 <strong>⋮</strong> 메뉴 &gt; <strong>다른 브라우저에서 열기</strong>
                </span>
              </div>
            </div>
          </div>
        </div>
        <button
          onClick={handleClose}
          className="p-1 hover:bg-yellow-600 rounded transition flex-shrink-0"
          aria-label="닫기"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}
