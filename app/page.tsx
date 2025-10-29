'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Coins, TrendingUp, Users, Wallet } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'

export default function HomePage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // 로컬 스토리지에서 토큰 확인
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')
    
    if (token && userData) {
      setUser(JSON.parse(userData))
    }
    setIsLoading(false)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    toast.success('로그아웃 되었습니다.')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <Toaster position="top-center" />
      
      {/* 헤더 */}
      <header className="border-b border-gray-700 bg-gray-800/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img src="/vcoin_logo.png" alt="V COIN Logo" className="w-12 h-12 object-contain" />
              <div>
                <h1 className="text-2xl font-bold text-white">V COIN</h1>
                <p className="text-xs text-gray-400">3D SOLAR</p>
              </div>
            </div>
            
            <nav className="flex items-center space-x-4">
              {user ? (
                <>
                  <div className="text-right mr-4">
                    <p className="text-sm text-gray-400">안녕하세요,</p>
                    <p className="text-white font-semibold">{user.name}님</p>
                  </div>
                  <button
                    onClick={() => router.push('/wallet')}
                    className="px-4 py-2 bg-yellow-500 text-gray-900 rounded-lg font-semibold hover:bg-yellow-400 transition"
                  >
                    내 지갑
                  </button>
                  {user.isAdmin && (
                    <button
                      onClick={() => router.push('/admin')}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition"
                    >
                      관리자
                    </button>
                  )}
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition"
                  >
                    로그아웃
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => router.push('/login')}
                    className="px-4 py-2 text-white hover:text-yellow-400 transition"
                  >
                    로그인
                  </button>
                  <button
                    onClick={() => router.push('/signup')}
                    className="px-4 py-2 bg-yellow-500 text-gray-900 rounded-lg font-semibold hover:bg-yellow-400 transition"
                  >
                    회원가입
                  </button>
                </>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* 히어로 섹션 */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center max-w-4xl mx-auto">
          <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
            <span className="text-yellow-400">3배 효율</span> 태양광 발전
            <br />
            <span className="text-yellow-400">V COIN</span>과 함께
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            유휴부지 태양광 발전사업으로 안정적인 수익을 창출합니다
          </p>
          
          <div className="grid md:grid-cols-3 gap-6 mt-12">
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
              <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-yellow-400" />
              </div>
              <h3 className="text-2xl font-bold text-yellow-400 mb-2">15%</h3>
              <p className="text-gray-400">연간 투자 수익률</p>
            </div>
            
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
              <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Coins className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="text-2xl font-bold text-blue-400 mb-2">2종 코인</h3>
              <p className="text-gray-400">배당코인 & 증권코인</p>
            </div>
            
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-green-400" />
              </div>
              <h3 className="text-2xl font-bold text-green-400 mb-2">추천 보너스</h3>
              <p className="text-gray-400">친구 초대 시 코인 지급</p>
            </div>
          </div>
        </div>
      </section>

      {/* 코인 설명 섹션 */}
      <section className="bg-gray-800/30 py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center text-white mb-12">
            V COIN 시스템
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* 배당코인 */}
            <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 rounded-2xl p-8 border border-yellow-500/30">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center mr-4">
                  <Coins className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-yellow-400">배당코인</h3>
              </div>
              
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-start">
                  <span className="text-yellow-400 mr-2">✓</span>
                  100만원 투자 시 10,000개 코인 지급
                </li>
                <li className="flex items-start">
                  <span className="text-yellow-400 mr-2">✓</span>
                  연 15% 수익 보장 (월 배당)
                </li>
                <li className="flex items-start">
                  <span className="text-yellow-400 mr-2">✓</span>
                  10만개 소유 시 연 150만원 수익
                </li>
                <li className="flex items-start">
                  <span className="text-yellow-400 mr-2">✓</span>
                  추천인 1,000개 추가 지급
                </li>
              </ul>
            </div>

            {/* 증권코인 */}
            <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 rounded-2xl p-8 border border-blue-500/30">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mr-4">
                  <Wallet className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-blue-400">증권코인</h3>
              </div>
              
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-start">
                  <span className="text-blue-400 mr-2">✓</span>
                  회원가입 시 500개 무료 지급
                </li>
                <li className="flex items-start">
                  <span className="text-blue-400 mr-2">✓</span>
                  추천 시 1,000개 추가 지급
                </li>
                <li className="flex items-start">
                  <span className="text-blue-400 mr-2">✓</span>
                  회사 순익의 15% 배당
                </li>
                <li className="flex items-start">
                  <span className="text-blue-400 mr-2">✓</span>
                  연말 정산 후 익년 월별 지급
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* YouTube 영상 섹션 */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-white mb-4">
            3D 태양광 기술 소개
          </h2>
          <p className="text-center text-gray-400 mb-12">
            V COIN의 혁신적인 3배 효율 태양광 발전 시스템을 영상으로 확인하세요
          </p>

          <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
            <iframe
              className="absolute top-0 left-0 w-full h-full rounded-2xl shadow-2xl border border-gray-700"
              src="https://www.youtube.com/embed/yfh_WrfOatE"
              title="3D 태양광 기술 소개"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            ></iframe>
          </div>
        </div>
      </section>

      {/* CTA 섹션 */}
      {!user && (
        <section className="container mx-auto px-4 py-20">
          <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-3xl p-12 text-center">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              지금 가입하고 증권코인 500개를 받으세요!
            </h2>
            <p className="text-xl text-gray-800 mb-8">
              초기 회원 특별 혜택 • 추천인 등록 시 1,000개 추가
            </p>
            <button
              onClick={() => router.push('/signup')}
              className="px-8 py-4 bg-gray-900 text-yellow-400 rounded-xl text-lg font-bold hover:bg-gray-800 transition transform hover:scale-105"
            >
              무료 회원가입 →
            </button>
          </div>
        </section>
      )}

      {/* 푸터 */}
      <footer className="border-t border-gray-700 bg-gray-800/50">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-gray-400">
            <p>© 2025 3D SUN TECH. All rights reserved.</p>
            <p className="mt-2">www.3dvcoin.com</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
