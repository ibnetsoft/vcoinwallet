'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Users, ArrowLeft, Search, RefreshCw, ArrowUpDown, Coins } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'

interface User {
  id: string
  name: string
  phone: string
  email?: string
  referralCode: string
  referrerId?: string
  securityCoins: number
  dividendCoins: number
  memberNumber: number
  role: 'ADMIN' | 'GROUP_LEADER' | 'TEAM_LEADER' | 'USER'
  status?: 'ACTIVE' | 'BLOCKED' | 'DELETED'
  createdAt: string
}

export default function GroupLeaderPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [teamMembers, setTeamMembers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set())

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    // 현재 사용자 정보 가져오기
    fetch('/api/user', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          router.push('/login')
          return
        }
        if (data.user.role !== 'GROUP_LEADER') {
          toast.error('그룹장 권한이 필요합니다.')
          router.push('/wallet')
          return
        }
        setUser(data.user)
        fetchTeamMembers(token, data.user.id)
      })
      .catch(() => {
        router.push('/login')
      })
  }, [router])

  const fetchTeamMembers = async (token: string, groupLeaderId: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/group-leader/members?groupLeaderId=${groupLeaderId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      if (data.members) {
        setTeamMembers(data.members)
      }
    } catch (error) {
      toast.error('팀원 목록을 불러오는데 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  // 검색 및 정렬된 회원 목록
  const filteredMembers = teamMembers
    .filter(member => {
      if (!searchTerm) return true
      const term = searchTerm.toLowerCase()
      return (
        member.name.toLowerCase().includes(term) ||
        member.phone.includes(term) ||
        member.referralCode.toLowerCase().includes(term) ||
        (member.email && member.email.toLowerCase().includes(term))
      )
    })
    .sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime()
      const dateB = new Date(b.createdAt).getTime()
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA
    })

  // 직접 추천한 팀장들만 (최상위)
  const directTeamLeaders = filteredMembers.filter(m => m.referrerId === user?.id)

  // 통계 계산
  const totalTeamLeaders = teamMembers.filter(m => m.role === 'TEAM_LEADER').length
  const totalUsers = teamMembers.filter(m => m.role === 'USER').length
  const totalSecurityCoins = teamMembers.reduce((sum, m) => sum + m.securityCoins, 0)
  const totalDividendCoins = teamMembers.reduce((sum, m) => sum + m.dividendCoins, 0)

  // 재귀적으로 하위 회원 렌더링
  const renderMemberRow = (member: User, depth: number = 0): React.ReactNode[] => {
    const roleLabels: Record<string, string> = {
      'ADMIN': '관리자',
      'GROUP_LEADER': '그룹장',
      'TEAM_LEADER': '팀장',
      'USER': '일반회원'
    }
    const roleColors: Record<string, string> = {
      'ADMIN': 'bg-red-500/20 text-red-400',
      'GROUP_LEADER': 'bg-purple-500/20 text-purple-400',
      'TEAM_LEADER': 'bg-blue-500/20 text-blue-400',
      'USER': 'bg-gray-500/20 text-gray-400'
    }

    const referredMembers = teamMembers.filter(m => m.referrerId === member.id)
    const hasChildren = referredMembers.length > 0
    const isExpanded = expandedUsers.has(member.id)

    const elements: React.ReactNode[] = []

    elements.push(
      <tr key={member.id} className="border-b border-gray-700/50 hover:bg-gray-700/20">
        <td className="py-3 px-2 text-sm text-white" style={{ paddingLeft: `${8 + depth * 24}px` }}>
          {depth > 0 && <span className="text-gray-600 mr-2">└─</span>}
          #{member.memberNumber}
        </td>
        <td className="py-3 px-2 text-sm">
          <div className="flex items-center gap-2">
            {hasChildren ? (
              <button
                onClick={() => {
                  setExpandedUsers(prev => {
                    const newSet = new Set(prev)
                    if (newSet.has(member.id)) {
                      newSet.delete(member.id)
                    } else {
                      newSet.add(member.id)
                    }
                    return newSet
                  })
                }}
                className="text-blue-400 hover:text-blue-300 transition"
              >
                {isExpanded ? '▼ ' : '▶ '}{member.name}
              </button>
            ) : (
              <span className="text-white">{member.name}</span>
            )}
            {member.status === 'BLOCKED' && <span className="text-red-400 text-xs">🚫</span>}
          </div>
        </td>
        <td className="py-3 px-2 text-sm text-gray-300">{member.email || '-'}</td>
        <td className="py-3 px-2">
          <span className={`text-xs px-2 py-1 rounded ${roleColors[member.role]}`}>
            {roleLabels[member.role]}
          </span>
        </td>
        <td className="py-3 px-2 text-sm text-gray-300">{member.phone}</td>
        <td className="py-3 px-2">
          <span className="text-sm font-mono text-yellow-400">{member.referralCode}</span>
        </td>
        <td className="py-3 px-2 text-sm text-right text-blue-400">
          {member.securityCoins.toLocaleString()}
        </td>
        <td className="py-3 px-2 text-sm text-right text-yellow-400">
          {member.dividendCoins.toLocaleString()}
        </td>
        <td className="py-3 px-2 text-sm text-gray-400">
          {new Date(member.createdAt).toLocaleDateString('ko-KR')}
        </td>
      </tr>
    )

    if (isExpanded && referredMembers.length > 0) {
      referredMembers
        .sort((a, b) => {
          const dateA = new Date(a.createdAt).getTime()
          const dateB = new Date(b.createdAt).getTime()
          return sortOrder === 'asc' ? dateA - dateB : dateB - dateA
        })
        .forEach(child => {
          elements.push(...renderMemberRow(child, depth + 1))
        })
    }

    return elements
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex items-center justify-center">
        <div className="text-white text-xl">로딩 중...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black">
      <Toaster position="top-center" />

      {/* Header */}
      <header className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/wallet')}
                className="text-gray-400 hover:text-white transition"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                <Users className="w-6 h-6 text-purple-400" />
                그룹장 관리
              </h1>
            </div>
            <div className="text-gray-400">
              {user?.name} 그룹장님
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-[1600px]">
        {/* 통계 카드 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">소속 팀장</p>
                <p className="text-2xl font-bold text-blue-400">{totalTeamLeaders}명</p>
              </div>
              <Users className="w-8 h-8 text-blue-400/50" />
            </div>
          </div>
          <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">소속 회원</p>
                <p className="text-2xl font-bold text-green-400">{totalUsers}명</p>
              </div>
              <Users className="w-8 h-8 text-green-400/50" />
            </div>
          </div>
          <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">총 증권코인</p>
                <p className="text-2xl font-bold text-blue-400">{totalSecurityCoins.toLocaleString()}</p>
              </div>
              <Coins className="w-8 h-8 text-blue-400/50" />
            </div>
          </div>
          <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">총 배당코인</p>
                <p className="text-2xl font-bold text-yellow-400">{totalDividendCoins.toLocaleString()}</p>
              </div>
              <Coins className="w-8 h-8 text-yellow-400/50" />
            </div>
          </div>
        </div>

        {/* 회원 목록 */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <h2 className="text-xl font-bold text-white">소속 회원 목록</h2>

            <div className="flex items-center space-x-3">
              {/* 새로고침 버튼 */}
              <button
                onClick={() => user && fetchTeamMembers(localStorage.getItem('token') || '', user.id)}
                className="flex items-center space-x-2 px-4 py-2 bg-yellow-600 border border-yellow-500 rounded-lg text-white hover:bg-yellow-500 transition"
              >
                <RefreshCw className="w-4 h-4" />
                <span>새로고침</span>
              </button>

              {/* 정렬 버튼 */}
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white hover:bg-gray-600 transition"
              >
                <ArrowUpDown className="w-4 h-4" />
                <span>{sortOrder === 'asc' ? '오래된 순' : '최신 순'}</span>
              </button>

              {/* 검색 */}
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  placeholder="이름, 휴대폰, 추천코드 검색"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 w-64"
                />
              </div>
            </div>
          </div>

          {/* 테이블 */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-2 text-sm text-gray-400">회원번호</th>
                  <th className="text-left py-3 px-2 text-sm text-gray-400">이름</th>
                  <th className="text-left py-3 px-2 text-sm text-gray-400">이메일</th>
                  <th className="text-left py-3 px-2 text-sm text-gray-400">등급</th>
                  <th className="text-left py-3 px-2 text-sm text-gray-400">휴대폰</th>
                  <th className="text-left py-3 px-2 text-sm text-gray-400">추천코드</th>
                  <th className="text-right py-3 px-2 text-sm text-gray-400">증권코인</th>
                  <th className="text-right py-3 px-2 text-sm text-gray-400">배당코인</th>
                  <th className="text-left py-3 px-2 text-sm text-gray-400">가입일</th>
                </tr>
              </thead>
              <tbody>
                {directTeamLeaders.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-8 text-gray-500">
                      소속된 팀원이 없습니다.
                    </td>
                  </tr>
                ) : (
                  directTeamLeaders.map(member => renderMemberRow(member, 0))
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 text-sm text-gray-500">
            총 {teamMembers.length}명의 회원 (팀장 {totalTeamLeaders}명, 일반회원 {totalUsers}명)
          </div>
        </div>
      </div>
    </div>
  )
}
