'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Wallet, Coins, TrendingUp, History, Copy, Share2, ArrowLeft, User as UserIcon, Lock, Mail, Phone, Users } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'

export default function WalletPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [transactions, setTransactions] = useState<any[]>([])
  const [referredUsers, setReferredUsers] = useState<any[]>([])
  const [isTeamLeader, setIsTeamLeader] = useState(false)
  const [teamStats, setTeamStats] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'wallet' | 'transactions' | 'referral' | 'mypage'>('wallet')

  // 마이페이지 수정 상태
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')

    if (!token || !userData) {
      router.push('/login')
      return
    }

    const parsedUser = JSON.parse(userData)

    // 최신 사용자 정보 가져오기
    fetchUserInfo(parsedUser.id, token)

    // 거래 내역 가져오기
    fetchTransactions(parsedUser.id, token)

    // 추천한 회원 목록 가져오기
    fetchReferredUsers(token)

    setIsLoading(false)
  }, [router])

  const fetchUserInfo = async (userId: string, token: string) => {
    try {
      const response = await fetch(`/api/user?userId=${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        const updatedUser = data.user

        // 최신 정보로 업데이트
        setUser(updatedUser)

        // localStorage도 업데이트
        localStorage.setItem('user', JSON.stringify(updatedUser))

        // 수정 폼 초기화
        setEditForm({
          name: updatedUser.name || '',
          phone: updatedUser.phone || '',
          email: updatedUser.email || '',
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        })
      }
    } catch (error) {
      console.error('사용자 정보 가져오기 실패:', error)
      // 실패 시 localStorage 데이터 사용
      const userData = localStorage.getItem('user')
      if (userData) {
        const parsedUser = JSON.parse(userData)
        setUser(parsedUser)
        setEditForm({
          name: parsedUser.name || '',
          phone: parsedUser.phone || '',
          email: parsedUser.email || '',
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        })
      }
    }
  }

  const fetchTransactions = async (userId: string, token: string) => {
    try {
      const response = await fetch(`/api/transactions?userId=${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setTransactions(data.transactions || [])
      }
    } catch (error) {
      console.error('거래 내역 가져오기 실패:', error)
    }
  }

  const fetchReferredUsers = async (token: string) => {
    try {
      const response = await fetch('/api/referrals', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setReferredUsers(data.referredUsers || [])
        setIsTeamLeader(data.isTeamLeader || false)
        setTeamStats(data.teamStats || null)
      }
    } catch (error) {
      console.error('추천 회원 목록 가져오기 실패:', error)
    }
  }

  const copyReferralCode = () => {
    if (user?.referralCode) {
      const referralUrl = `${window.location.origin}/signup?ref=${user.referralCode}`
      navigator.clipboard.writeText(referralUrl)
      toast.success('추천 링크가 복사되었습니다!')
    }
  }

  const shareReferralLink = () => {
    const referralUrl = `${window.location.origin}/signup?ref=${user?.referralCode}`
    const shareText = `V COIN과 함께 태양광 투자로 안정적인 수익을 만들어보세요!

지금 가입하면 증권코인 500개 + 추천 보너스 1,000개!
추천 코드: ${user?.referralCode}

가입하기: ${referralUrl}`

    if (navigator.share) {
      navigator.share({
        title: 'V COIN 추천',
        text: shareText,
        url: referralUrl
      })
    } else {
      navigator.clipboard.writeText(referralUrl)
      toast.success('추천 링크가 복사되었습니다!')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    toast.success('로그아웃되었습니다.')
    router.push('/login')
  }

  const handleUpdateProfile = async () => {
    const token = localStorage.getItem('token')

    try {
      const response = await fetch('/api/user/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: editForm.name,
          phone: editForm.phone,
          email: editForm.email,
          currentPassword: editForm.currentPassword,
          newPassword: editForm.newPassword
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || '정보 수정 실패')
      }

      // 로컬 스토리지 업데이트
      const updatedUser = { ...user, ...result.user }
      localStorage.setItem('user', JSON.stringify(updatedUser))
      setUser(updatedUser)

      setIsEditing(false)
      setEditForm(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }))
      toast.success('정보가 수정되었습니다!')

    } catch (error: any) {
      toast.error(error.message || '정보 수정 중 오류가 발생했습니다.')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
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
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/')}
                className="p-2 hover:bg-gray-700 rounded-lg transition"
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>
              <h1 className="text-xl font-bold text-white">내 지갑</h1>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-400">회원번호:</span>
              <span className="text-sm font-semibold text-yellow-400">#{user?.memberNumber}</span>
            </div>
          </div>
        </div>
      </header>

      {/* 탭 메뉴 */}
      <div className="container mx-auto px-4 pt-6 max-w-4xl">
        <div className="flex space-x-2 border-b border-gray-700">
          <button
            onClick={() => setActiveTab('wallet')}
            className={`px-6 py-3 font-semibold transition-colors relative ${
              activeTab === 'wallet'
                ? 'text-yellow-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Wallet className="w-5 h-5" />
              <span>지갑</span>
            </div>
            {activeTab === 'wallet' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-yellow-400"></div>
            )}
          </button>

          <button
            onClick={() => setActiveTab('transactions')}
            className={`px-6 py-3 font-semibold transition-colors relative ${
              activeTab === 'transactions'
                ? 'text-yellow-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <History className="w-5 h-5" />
              <span>거래내역</span>
            </div>
            {activeTab === 'transactions' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-yellow-400"></div>
            )}
          </button>

          <button
            onClick={() => setActiveTab('referral')}
            className={`px-6 py-3 font-semibold transition-colors relative ${
              activeTab === 'referral'
                ? 'text-yellow-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5" />
              <span>추천</span>
            </div>
            {activeTab === 'referral' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-yellow-400"></div>
            )}
          </button>

          <button
            onClick={() => setActiveTab('mypage')}
            className={`px-6 py-3 font-semibold transition-colors relative ${
              activeTab === 'mypage'
                ? 'text-yellow-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <UserIcon className="w-5 h-5" />
              <span>마이페이지</span>
            </div>
            {activeTab === 'mypage' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-yellow-400"></div>
            )}
          </button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* 지갑 탭 내용 */}
        {activeTab === 'wallet' && (
          <div className="min-h-[800px]">
        {/* 사용자 정보 카드 */}
        <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-2xl p-6 mb-8 text-gray-900">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm opacity-80">안녕하세요!</p>
              <h2 className="text-2xl font-bold">{user?.name}님</h2>
              <p className="text-sm opacity-80">{user?.email}</p>
            </div>
            <Wallet className="w-12 h-12 opacity-20" />
          </div>
          
          {/* 추천 코드 */}
          <div className="bg-black/20 rounded-lg p-3 flex items-center justify-between">
            <div>
              <p className="text-xs opacity-80">내 추천 코드</p>
              <p className="text-lg font-bold">{user?.referralCode}</p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={copyReferralCode}
                className="p-2 bg-black/20 hover:bg-black/30 rounded-lg transition"
              >
                <Copy className="w-4 h-4" />
              </button>
              <button
                onClick={shareReferralLink}
                className="p-2 bg-black/20 hover:bg-black/30 rounded-lg transition"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* 코인 잔액 */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* 증권코인 */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mr-4">
                  <Coins className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">증권코인</p>
                  <p className="text-xs text-gray-500">Security Coins</p>
                </div>
              </div>
            </div>
            <div className="text-3xl font-bold text-white">
              {user?.securityCoins?.toLocaleString() || 0}
              <span className="text-sm text-gray-400 ml-2">개</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              회사 순익 15% 배당 • 연말 정산
            </p>
          </div>

          {/* 배당코인 */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center mr-4">
                  <TrendingUp className="w-6 h-6 text-yellow-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">배당코인</p>
                  <p className="text-xs text-gray-500">Dividend Coins</p>
                </div>
              </div>
            </div>
            <div className="text-3xl font-bold text-white">
              {user?.dividendCoins?.toLocaleString() || 0}
              <span className="text-sm text-gray-400 ml-2">개</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              연 15% 수익 • 월 배당 지급
            </p>
          </div>
        </div>

        {/* 예상 수익 - 주석처리 */}
        {/* {user?.dividendCoins > 0 && (
          <div className="bg-gradient-to-r from-green-500/10 to-green-600/10 rounded-2xl p-6 mb-8 border border-green-500/30">
            <h3 className="text-lg font-semibold text-green-400 mb-4">💰 예상 수익</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-400">월 배당 예상</p>
                <p className="text-xl font-bold text-white">
                  ₩ {Math.floor(user.dividendCoins * 0.15 / 12).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400">연간 배당 예상</p>
                <p className="text-xl font-bold text-white">
                  ₩ {Math.floor(user.dividendCoins * 0.15).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        )} */}

        {/* 최근 내역 */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <History className="w-6 h-6 text-gray-400 mr-2" />
              <h3 className="text-lg font-semibold text-white">최근 내역</h3>
            </div>
            <button
              onClick={() => setActiveTab('transactions')}
              className="text-sm text-yellow-400 hover:text-yellow-300 transition"
            >
              전체보기 →
            </button>
          </div>

          {transactions.length > 0 ? (
            <div className="space-y-3">
              {transactions.slice(0, 2).map((tx, index) => {
                const date = new Date(tx.createdAt)
                const formattedDate = date.toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit'
                })

                return (
                  <div key={tx.id || index} className="flex items-center justify-between py-3 border-b border-gray-700 last:border-b-0">
                    <div>
                      <p className="text-sm font-medium text-white">{tx.description}</p>
                      <p className="text-xs text-gray-400">{formattedDate}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-semibold ${tx.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString()}개
                      </p>
                      <p className="text-xs text-gray-500">{tx.coinType === 'SECURITY' ? '증권코인' : '배당코인'}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">아직 거래 내역이 없습니다.</p>
            </div>
          )}
        </div>

        {/* 추천 유도 */}
        <div className="mt-8 bg-gradient-to-r from-purple-500/10 to-purple-600/10 rounded-2xl p-6 border border-purple-500/30">
          <h3 className="text-lg font-semibold text-purple-400 mb-2">🎁 친구 초대하고 보너스 받기!</h3>
          <p className="text-sm text-gray-300 mb-4">
            친구가 가입하면 증권코인을 드립니다.
            배당코인 구매 시에도 추천보너스가 지급됩니다!
          </p>
          <button
            onClick={shareReferralLink}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition flex items-center"
          >
            <Share2 className="w-4 h-4 mr-2" />
            추천 링크 공유하기
          </button>
        </div>
          </div>
        )}

        {/* 거래내역 탭 내용 */}
        {activeTab === 'transactions' && (
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700 min-h-[800px]">
              <div className="flex items-center mb-6">
                <History className="w-6 h-6 text-yellow-400 mr-2" />
                <h2 className="text-xl font-bold text-white">전체 거래 내역</h2>
              </div>

              {transactions.length > 0 ? (
                <div className="space-y-3">
                  {transactions.map((tx, index) => {
                    const date = new Date(tx.createdAt)
                    const formattedDate = date.toLocaleDateString('ko-KR', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    })

                    return (
                      <div key={tx.id || index} className="flex items-center justify-between py-4 border-b border-gray-700 last:border-b-0">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-white mb-1">{tx.description}</p>
                          <div className="flex items-center space-x-3">
                            <p className="text-xs text-gray-400">{formattedDate}</p>
                            <span className={`text-xs px-2 py-1 rounded ${
                              tx.coinType === 'SECURITY'
                                ? 'bg-blue-500/20 text-blue-400'
                                : 'bg-yellow-500/20 text-yellow-400'
                            }`}>
                              {tx.coinType === 'SECURITY' ? '증권코인' : '배당코인'}
                            </span>
                            <span className={`text-xs px-2 py-1 rounded ${
                              tx.type === 'SIGNUP_BONUS' ? 'bg-green-500/20 text-green-400' :
                              tx.type === 'REFERRAL_BONUS' ? 'bg-purple-500/20 text-purple-400' :
                              tx.type === 'ADMIN_GRANT' ? 'bg-orange-500/20 text-orange-400' :
                              'bg-gray-500/20 text-gray-400'
                            }`}>
                              {tx.type === 'SIGNUP_BONUS' ? '가입 보너스' :
                               tx.type === 'REFERRAL_BONUS' ? '추천 보너스' :
                               tx.type === 'ADMIN_GRANT' ? '지급' :
                               tx.type}
                            </span>
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <p className={`text-lg font-bold ${tx.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-500">잔액: {tx.balance.toLocaleString()}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <History className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">아직 거래 내역이 없습니다.</p>
                  <p className="text-sm text-gray-500 mt-2">코인을 받으면 여기에 표시됩니다.</p>
                </div>
              )}
            </div>
        )}

        {/* 추천 탭 내용 */}
        {activeTab === 'referral' && (
          <div className="min-h-[800px]">
            {/* 추천 코드 공유 카드 */}
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl p-6 mb-8 text-white">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold mb-2">친구 초대하고 보너스 받기!</h2>
                  <p className="text-sm opacity-90">친구가 가입하면 증권코인을 드립니다</p>
                </div>
                <Users className="w-12 h-12 opacity-20" />
              </div>

              <div className="bg-white/20 rounded-lg p-4 backdrop-blur-sm">
                <p className="text-xs opacity-80 mb-2">내 추천 코드</p>
                <div className="flex items-center justify-between">
                  <p className="text-2xl font-mono font-bold">{user?.referralCode}</p>
                  <div className="flex space-x-2">
                    <button
                      onClick={copyReferralCode}
                      className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition"
                    >
                      <Copy className="w-5 h-5" />
                    </button>
                    <button
                      onClick={shareReferralLink}
                      className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition flex items-center"
                    >
                      <Share2 className="w-5 h-5 mr-2" />
                      <span>공유</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 팀장 전용 산하 매출 통계 */}
            {isTeamLeader && teamStats && (
              <div className="bg-gradient-to-r from-blue-500/10 to-blue-600/10 rounded-2xl p-6 mb-8 border border-blue-500/30">
                <div className="flex items-center mb-6">
                  <TrendingUp className="w-7 h-7 text-blue-400 mr-2" />
                  <div>
                    <h2 className="text-xl font-bold text-blue-400">팀장 산하 매출 통계</h2>
                    <p className="text-xs text-gray-400 mt-1">직접 추천 + 간접 추천 통합 데이터</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4 mb-4">
                  <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                    <p className="text-xs text-gray-400 mb-1">산하 총 인원</p>
                    <p className="text-3xl font-bold text-white">{teamStats.totalMembers}명</p>
                    <div className="flex items-center space-x-2 mt-2 text-xs">
                      <span className="text-green-400">직접 {teamStats.directMembers}명</span>
                      <span className="text-gray-500">•</span>
                      <span className="text-blue-400">간접 {teamStats.indirectMembers}명</span>
                    </div>
                  </div>

                  <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                    <p className="text-xs text-gray-400 mb-1">산하 총 증권코인</p>
                    <p className="text-3xl font-bold text-blue-400">{teamStats.totalSecurityCoins.toLocaleString()}</p>
                    <p className="text-xs text-gray-500 mt-2">개</p>
                  </div>

                  <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                    <p className="text-xs text-gray-400 mb-1">산하 총 배당코인</p>
                    <p className="text-3xl font-bold text-yellow-400">{teamStats.totalDividendCoins.toLocaleString()}</p>
                    <p className="text-xs text-gray-500 mt-2">개</p>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-green-500/10 to-green-600/10 rounded-xl p-6 border border-green-500/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-300 mb-1">산하 총 매출액</p>
                      <p className="text-xs text-gray-500">배당코인 × 100원</p>
                    </div>
                    <div className="text-right">
                      <p className="text-4xl font-bold text-green-400">₩{teamStats.totalSales.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 추천 통계 */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
                <div className="flex items-center mb-3">
                  <Users className="w-6 h-6 text-green-400 mr-2" />
                  <h3 className="text-lg font-semibold text-white">직접 추천한 인원</h3>
                </div>
                <p className="text-4xl font-bold text-green-400">{referredUsers.length}명</p>
              </div>

              <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
                <div className="flex items-center mb-3">
                  <Coins className="w-6 h-6 text-blue-400 mr-2" />
                  <h3 className="text-lg font-semibold text-white">받은 추천 보너스</h3>
                </div>
                <p className="text-4xl font-bold text-blue-400">{(referredUsers.length * 1000).toLocaleString()}개</p>
                <p className="text-xs text-gray-500 mt-2">증권코인 기준</p>
              </div>
            </div>

            {/* 추천한 회원 목록 */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
              <div className="flex items-center mb-6">
                <Users className="w-6 h-6 text-yellow-400 mr-2" />
                <h2 className="text-xl font-bold text-white">추천한 회원 목록</h2>
              </div>

              {referredUsers.length > 0 ? (
                <div className="space-y-3">
                  {referredUsers.map((referredUser, index) => {
                    const roleLabels: Record<string, string> = {
                      'ADMIN': '관리자',
                      'TEAM_LEADER': '팀장',
                      'USER': '일반회원'
                    }
                    const roleColors: Record<string, string> = {
                      'ADMIN': 'bg-red-500/20 text-red-400',
                      'TEAM_LEADER': 'bg-blue-500/20 text-blue-400',
                      'USER': 'bg-gray-500/20 text-gray-400'
                    }
                    const currentRole: string = referredUser.role || 'USER'

                    return (
                      <div key={referredUser.id || index} className="flex items-center justify-between py-4 border-b border-gray-700 last:border-b-0">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-1">
                            <p className="text-sm font-medium text-white">{referredUser.name}</p>
                            <span className={`text-xs px-2 py-1 rounded ${roleColors[currentRole]}`}>
                              {roleLabels[currentRole]}
                            </span>
                          </div>
                          <div className="flex items-center space-x-3">
                            <p className="text-xs text-gray-400">{referredUser.phone}</p>
                            <p className="text-xs text-gray-500">회원번호: #{referredUser.memberNumber}</p>
                            <p className="text-xs text-gray-500">가입일: {referredUser.createdAt}</p>
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <div className="flex items-center space-x-4">
                            <div>
                              <p className="text-xs text-gray-500">증권코인</p>
                              <p className="text-sm font-semibold text-blue-400">{referredUser.securityCoins.toLocaleString()}개</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">배당코인</p>
                              <p className="text-sm font-semibold text-yellow-400">{referredUser.dividendCoins.toLocaleString()}개</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">아직 추천한 회원이 없습니다.</p>
                  <p className="text-sm text-gray-500 mt-2">친구를 초대하고 보너스를 받아보세요!</p>
                  <button
                    onClick={shareReferralLink}
                    className="mt-4 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition flex items-center mx-auto"
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    추천 링크 공유하기
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 마이페이지 탭 내용 */}
        {activeTab === 'mypage' && (
          <div className="min-h-[800px]">
            {/* 내 정보 카드 */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700 mb-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white flex items-center">
                  <UserIcon className="w-6 h-6 mr-2 text-yellow-400" />
                  내 정보
                </h2>
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 bg-yellow-500 text-gray-900 rounded-lg hover:bg-yellow-400 transition font-semibold"
                  >
                    정보 수정
                  </button>
                )}
              </div>

              {!isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-400">이름</label>
                    <p className="text-white font-medium">{user?.name}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">휴대폰 번호</label>
                    <p className="text-white font-medium">{user?.phone}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">이메일</label>
                    <p className="text-white font-medium">{user?.email || '미등록'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">추천 코드</label>
                    <p className="text-yellow-400 font-mono font-bold text-lg">{user?.referralCode}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">회원번호</label>
                    <p className="text-white font-medium">#{user?.memberNumber}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">가입일</label>
                    <p className="text-white font-medium">
                      {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('ko-KR') : '-'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">이름 * <span className="text-gray-500">(실명기입)</span></label>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">휴대폰 번호 *</label>
                    <input
                      type="tel"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">이메일</label>
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                      placeholder="선택사항"
                    />
                  </div>

                  <div className="pt-4 border-t border-gray-700">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                      <Lock className="w-5 h-5 mr-2 text-yellow-400" />
                      비밀번호 변경
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm text-gray-300 mb-2">현재 비밀번호</label>
                        <input
                          type="password"
                          value={editForm.currentPassword}
                          onChange={(e) => setEditForm({ ...editForm, currentPassword: e.target.value })}
                          className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                          placeholder="비밀번호 변경 시 필수"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-300 mb-2">새 비밀번호</label>
                        <input
                          type="password"
                          value={editForm.newPassword}
                          onChange={(e) => setEditForm({ ...editForm, newPassword: e.target.value })}
                          className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                          placeholder="6자 이상"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-300 mb-2">새 비밀번호 확인</label>
                        <input
                          type="password"
                          value={editForm.confirmPassword}
                          onChange={(e) => setEditForm({ ...editForm, confirmPassword: e.target.value })}
                          className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                          placeholder="새 비밀번호 재입력"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <button
                      onClick={handleUpdateProfile}
                      className="flex-1 px-4 py-3 bg-yellow-500 text-gray-900 rounded-lg hover:bg-yellow-400 transition font-semibold"
                    >
                      저장
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false)
                        setEditForm({
                          name: user?.name || '',
                          phone: user?.phone || '',
                          email: user?.email || '',
                          currentPassword: '',
                          newPassword: '',
                          confirmPassword: ''
                        })
                      }}
                      className="flex-1 px-4 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition font-semibold"
                    >
                      취소
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 로그아웃 버튼 */}
            <button
              onClick={handleLogout}
              className="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold"
            >
              로그아웃
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
