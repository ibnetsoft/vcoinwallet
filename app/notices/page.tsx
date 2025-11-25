'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'

export default function NoticesPage() {
  const router = useRouter()
  const [notices, setNotices] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [expandedNoticeId, setExpandedNoticeId] = useState<string | null>(null)

  useEffect(() => {
    fetchNotices()
  }, [])

  const fetchNotices = async () => {
    try {
      const response = await fetch('/api/notices')

      if (response.ok) {
        const data = await response.json()
        setNotices(data.notices || [])
      } else {
        toast.error('공지사항을 불러오는데 실패했습니다.')
      }
    } catch (error) {
      console.error('공지사항 가져오기 실패:', error)
      toast.error('공지사항을 불러오는데 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <Toaster position="top-center" />

      {/* 헤더 */}
      <header className="border-b border-gray-700 bg-gray-800/50 backdrop-blur-sm pt-[max(44px,env(safe-area-inset-top))]">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img src="/vcoin_logo.png" alt="V COIN Logo" className="w-12 h-12 object-contain" />
              <div>
                <h1 className="text-2xl font-bold text-white">V COIN</h1>
                <p className="text-xs text-gray-400">3D SOLAR</p>
              </div>
            </div>

            <button
              onClick={() => router.push('/')}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>메인으로</span>
            </button>
          </div>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
            </div>
          ) : (
            <>
              {/* 사업계획서 배너 */}
              <a
                href="https://docs.google.com/presentation/d/e/2PACX-1vRdoZ99RmXsk0iSKlrrXkC65izzrsNsmfZ5h6EMfDvgrhWEuqVE7uvso516aT9xtlTsUrVdfO0hJI4S/pub?start=true&loop=false&delayms=5000"
                target="_blank"
                rel="noopener noreferrer"
                className="block bg-gradient-to-r from-blue-500/20 to-blue-600/20 rounded-2xl p-6 border border-blue-500/30 mb-6 hover:from-blue-500/30 hover:to-blue-600/30 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">📊 3D SUN 사업계획서</h3>
                    <p className="text-gray-300 text-sm">클릭하여 자세한 사업계획을 확인하세요</p>
                  </div>
                  <div className="text-blue-400 text-sm">
                    새 창에서 열기 →
                  </div>
                </div>
              </a>

              <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
                <div className="flex items-center mb-6">
                  <Bell className="w-6 h-6 text-yellow-400 mr-2" />
                  <h2 className="text-xl font-bold text-white">공지사항</h2>
                </div>

              {/* 공지사항 목록 */}
              <div className="space-y-4">
                {notices.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500">작성된 공지사항이 없습니다.</p>
                  </div>
                ) : (
                  notices.map((notice) => {
                    const typeColors: any = {
                      IMPORTANT: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30', label: '중요' },
                      NOTICE: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30', label: '공지' },
                      INFO: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30', label: '안내' },
                      EVENT: { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/30', label: '이벤트' },
                      UPDATE: { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/30', label: '업데이트' }
                    }

                    const typeColor = typeColors[notice.type] || typeColors.NOTICE

                    const date = new Date(notice.created_at)
                    const formattedDate = date.toLocaleDateString('ko-KR', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit'
                    })

                    const isExpanded = expandedNoticeId === notice.id

                    return (
                      <div key={notice.id} className="bg-gray-900/50 rounded-lg border border-gray-700 hover:border-yellow-500/50 transition">
                        <div
                          className="flex items-start justify-between p-5 cursor-pointer"
                          onClick={() => setExpandedNoticeId(isExpanded ? null : notice.id)}
                        >
                          <div className="flex items-center space-x-2 flex-1">
                            <span className={`px-3 py-1 ${typeColor.bg} ${typeColor.text} text-xs font-semibold rounded-full border ${typeColor.border}`}>
                              {typeColor.label}
                            </span>
                            <h3 className="text-lg font-semibold text-white">{notice.title}</h3>
                          </div>
                          <div className="flex items-center space-x-3 ml-4">
                            <span className="text-sm text-gray-500">{formattedDate}</span>
                            {isExpanded ? (
                              <ChevronUp className="w-5 h-5 text-gray-400" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-gray-400" />
                            )}
                          </div>
                        </div>
                        {isExpanded && (
                          <div className="px-5 pb-5 border-t border-gray-700 pt-4">
                            <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                              {notice.content}
                            </p>
                          </div>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
