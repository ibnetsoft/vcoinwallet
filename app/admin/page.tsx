'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Users, Coins, Gift, Search, ArrowLeft, Shield, Settings, Lock, Mail, Phone, X, ArrowUpDown, Bell, RefreshCw, Download } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'
import * as XLSX from 'xlsx'

interface User {
  id: string
  name: string
  phone: string
  idNumber?: string
  email?: string
  password: string
  referralCode: string
  referrerId?: string
  securityCoins: number
  dividendCoins: number
  memberNumber: number
  role: 'ADMIN' | 'TEAM_LEADER' | 'USER'
  isAdmin: boolean
  status?: 'ACTIVE' | 'BLOCKED' | 'DELETED'
  createdAt: string
  updatedAt: string
}

export default function AdminPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [grantSearchTerm, setGrantSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [grantAmount, setGrantAmount] = useState('10000') // 기본값 10000개 (100만원)
  const [grantDescription, setGrantDescription] = useState('')
  const [grantMode, setGrantMode] = useState<'add' | 'set'>('add') // 지급 모드: add(추가), set(수정)
  const [selectedAmountOption, setSelectedAmountOption] = useState<string>('1000000') // 기본값: 100만원

  // 증권코인 지급용 상태
  const [securitySearchTerm, setSecuritySearchTerm] = useState('')
  const [securitySelectedUser, setSecuritySelectedUser] = useState<User | null>(null)
  const [securityGrantAmount, setSecurityGrantAmount] = useState('')
  const [securityGrantDescription, setSecurityGrantDescription] = useState('')
  const [securityGrantMode, setSecurityGrantMode] = useState<'add' | 'set'>('add')
  const [roleChangeUserId, setRoleChangeUserId] = useState('')
  const [newRole, setNewRole] = useState<'USER' | 'TEAM_LEADER'>('USER')
  const [roleSearchTerm, setRoleSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState<'users' | 'grant' | 'security-grant' | 'roles' | 'notice' | 'settings' | 'coin-settings' | 'team-stats'>('users')
  const [userRoleFilter, setUserRoleFilter] = useState<'ALL' | 'ADMIN' | 'TEAM_LEADER' | 'USER'>('ALL')
  const [selectedUserDetail, setSelectedUserDetail] = useState<User | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // 회원 정보 수정 상태
  const [isEditingUserInfo, setIsEditingUserInfo] = useState(false)
  const [userEditForm, setUserEditForm] = useState({
    phone: '',
    idNumber: ''
  })

  // 페이지네이션
  const [currentPage, setCurrentPage] = useState(1)
  const usersPerPage = 30

  // 기간 필터
  const [periodFilter, setPeriodFilter] = useState<'all' | 'custom'>('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  // 공지사항 관련 상태
  const [notices, setNotices] = useState<any[]>([])
  const [isNoticeModalOpen, setIsNoticeModalOpen] = useState(false)
  const [editingNoticeId, setEditingNoticeId] = useState<string | null>(null)
  const [noticeForm, setNoticeForm] = useState({
    type: 'NOTICE',
    title: '',
    content: ''
  })

  // 팀장별 펼침/접힘 상태
  const [expandedTeamLeaders, setExpandedTeamLeaders] = useState<Set<string>>(new Set())

  // 관리자 정보 수정 상태
  const [isEditingAdmin, setIsEditingAdmin] = useState(false)
  const [adminEditForm, setAdminEditForm] = useState({
    name: '',
    phone: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  // 코인지급 설정 상태
  const [coinSettings, setCoinSettings] = useState({
    newUserReward: 500, // 신규 가입 보너스
    referralBonus: 1000, // 추천인 보너스 (안전코인)
    dividendCoinPer100: 10000, // 100만원당 배당코인
    referralBonusPercentage: 10, // 배당코인 추천 보너스 비율 (%)
    youtubeUrl: 'https://www.youtube.com/embed/mJPAA9OzoPI' // 메인 페이지 유튜브 URL
  })

  // 회원번호별 특별 지급 설정
  const [memberNumberRules, setMemberNumberRules] = useState<Array<{
    id: string
    memberNumberFrom: number
    memberNumberTo: number
    referralBonus: number
    newMemberCoins: number
  }>>([])

  const [newRule, setNewRule] = useState({
    memberNumberFrom: '',
    memberNumberTo: '',
    referralBonus: '',
    newMemberCoins: ''
  })

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')

    if (!token || !userData) {
      router.push('/login')
      return
    }

    const parsedUser = JSON.parse(userData)

    // 관리자 권한 확인
    if (!parsedUser.isAdmin) {
      toast.error('관리자 권한이 없습니다.')
      router.push('/')
      return
    }

    setUser(parsedUser)

    // 관리자 정보 수정 폼 초기화
    setAdminEditForm({
      name: parsedUser.name || '',
      phone: parsedUser.phone || '',
      email: parsedUser.email || '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    })

    // 코인지급 설정 불러오기
    const savedCoinSettings = localStorage.getItem('coinSettings')
    if (savedCoinSettings) {
      setCoinSettings(JSON.parse(savedCoinSettings))
    }

    // 회원번호별 규칙 불러오기
    const savedRules = localStorage.getItem('memberNumberRules')

    // 기본 규칙 정의 (lib/auth.ts와 동기화)
    const defaultRules = [
        {
          id: 'default-1',
          memberNumberFrom: 1,
          memberNumberTo: 10000,
          referralBonus: 1000,
          newMemberCoins: 500
        },
        {
          id: 'default-2',
          memberNumberFrom: 10001,
          memberNumberTo: 20000,
          referralBonus: 600,
          newMemberCoins: 300
        },
        {
          id: 'default-3',
          memberNumberFrom: 20001,
          memberNumberTo: 100000,
          referralBonus: 400,
          newMemberCoins: 200
        },
        {
          id: 'default-4',
          memberNumberFrom: 100001,
          memberNumberTo: 999999,
          referralBonus: 200,
          newMemberCoins: 100
        }
      ]

    // 항상 최신 기본값으로 업데이트 (lib/auth.ts와 동기화 유지)
    setMemberNumberRules(defaultRules)
    localStorage.setItem('memberNumberRules', JSON.stringify(defaultRules))

    // 실제 사용자 목록 가져오기
    fetchUsers()
  }, [router])

  // 검색 또는 필터 변경 시 페이지를 1로 리셋
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, userRoleFilter, sortOrder])

  // 공지사항 탭 접속 시 공지사항 불러오기
  useEffect(() => {
    if (activeTab === 'notice') {
      fetchNotices()
    }
  }, [activeTab])

  // 세션 체크 (30초마다) - 모든 유저 적용
  useEffect(() => {
    const checkSession = async () => {
      const token = localStorage.getItem('token')

      if (!token) return

      try {
        const response = await fetch('/api/auth/check-session', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (!response.ok) {
          // 세션이 무효화됨 (다른 기기에서 로그인)
          toast.error('다른 기기에서 로그인되었습니다. 다시 로그인해주세요.')
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          router.push('/login')
        }
      } catch (error) {
        console.error('Session check error:', error)
      }
    }

    // 즉시 실행
    checkSession()

    // 30초마다 실행
    const interval = setInterval(checkSession, 30000)

    return () => clearInterval(interval)
  }, [router])

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token')
      // 타임스탬프를 쿼리 파라미터로 추가하여 캐시 우회
      const timestamp = new Date().getTime()
      const response = await fetch(`/api/admin/users?_t=${timestamp}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        },
        cache: 'no-store'
      })

      if (response.ok) {
        const data = await response.json()
        console.log('🔍 API Response - Total users from API:', data.users?.length)
        setUsers(data.users || [])
      }
    } catch (error) {
      console.error('사용자 목록 가져오기 실패:', error)
      setUsers([])
    } finally {
      setIsLoading(false)
    }
  }

  const fetchNotices = async () => {
    const token = localStorage.getItem('token')
    try {
      const response = await fetch('/api/admin/notices', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setNotices(data.notices || [])
      }
    } catch (error) {
      console.error('공지사항 가져오기 실패:', error)
    }
  }

  const handleCreateNotice = async () => {
    if (!noticeForm.title || !noticeForm.content) {
      toast.error('제목과 내용을 입력해주세요.')
      return
    }

    const token = localStorage.getItem('token')

    try {
      const response = await fetch('/api/admin/notices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(noticeForm)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || '공지사항 작성 실패')
      }

      toast.success(result.message || '공지사항이 작성되었습니다.')

      // 모달 닫기 전에 목록 새로고침
      await fetchNotices()

      setIsNoticeModalOpen(false)
      setNoticeForm({ type: 'NOTICE', title: '', content: '' })
    } catch (error: any) {
      toast.error(error.message || '공지사항 작성 중 오류가 발생했습니다.')
    }
  }

  const handleDeleteNotice = async (noticeId: string) => {
    if (!confirm('이 공지사항을 삭제하시겠습니까?')) {
      return
    }

    const token = localStorage.getItem('token')

    try {
      const response = await fetch('/api/admin/notices', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ noticeId })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || '공지사항 삭제 실패')
      }

      toast.success('공지사항이 삭제되었습니다.')
      await fetchNotices()
    } catch (error: any) {
      toast.error(error.message || '공지사항 삭제 중 오류가 발생했습니다.')
    }
  }

  const handleEditNotice = (notice: any) => {
    setEditingNoticeId(notice.id)
    setNoticeForm({
      type: notice.type,
      title: notice.title,
      content: notice.content
    })
    setIsNoticeModalOpen(true)
  }

  const handleUpdateNotice = async () => {
    if (!noticeForm.title || !noticeForm.content || !editingNoticeId) {
      toast.error('제목과 내용을 입력해주세요.')
      return
    }

    const token = localStorage.getItem('token')

    try {
      const response = await fetch('/api/admin/notices', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          noticeId: editingNoticeId,
          ...noticeForm
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || '공지사항 수정 실패')
      }

      toast.success(result.message || '공지사항이 수정되었습니다.')

      // 모달 닫기 전에 목록 새로고침
      await fetchNotices()

      setIsNoticeModalOpen(false)
      setEditingNoticeId(null)
      setNoticeForm({ type: 'NOTICE', title: '', content: '' })
    } catch (error: any) {
      toast.error(error.message || '공지사항 수정 중 오류가 발생했습니다.')
    }
  }

  const handleGrantSecurityCoins = async () => {
    if (!securitySelectedUser || !securityGrantAmount) {
      toast.error('사용자와 수량을 입력해주세요.')
      return
    }

    const token = localStorage.getItem('token')

    try {
      const endpoint = securityGrantMode === 'add' ? '/api/admin/grant-security' : '/api/admin/set-security'
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: securitySelectedUser.id,
          amount: parseInt(securityGrantAmount),
          description: securityGrantDescription || (securityGrantMode === 'add' ? `증권코인 ${securityGrantAmount}개 지급` : `증권코인 수정 - ${securityGrantAmount}개로 변경`)
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || (securityGrantMode === 'add' ? '지급 실패' : '수정 실패'))
      }

      if (securityGrantMode === 'add') {
        toast.success(`${securitySelectedUser.name}님께 증권코인 ${securityGrantAmount}개가 지급되었습니다!`)
      } else {
        toast.success(`${securitySelectedUser.name}님의 증권코인이 ${securityGrantAmount}개로 변경되었습니다!`)
      }

      // 폼 초기화
      setSecurityGrantAmount('')
      setSecurityGrantDescription('')
      setSecuritySearchTerm('')
      setSecuritySelectedUser(null)

      // 사용자 목록 새로고침
      await fetchUsers()
    } catch (error: any) {
      toast.error(error.message || (securityGrantMode === 'add' ? '증권코인 지급 중 오류가 발생했습니다.' : '증권코인 수정 중 오류가 발생했습니다.'))
    }
  }

  const handleGrantDividendCoins = async () => {
    if (!selectedUser || !grantAmount) {
      toast.error('사용자와 수량을 입력해주세요.')
      return
    }

    const token = localStorage.getItem('token')

    try {
      const endpoint = grantMode === 'add' ? '/api/admin/grant-dividend' : '/api/admin/set-dividend'
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: selectedUser.id,
          amount: parseInt(grantAmount),
          description: grantDescription || (grantMode === 'add' ? `100만원 입금 - 배당코인 ${grantAmount}개` : `배당코인 수정 - ${grantAmount}개로 변경`)
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || (grantMode === 'add' ? '지급 실패' : '수정 실패'))
      }

      if (grantMode === 'add') {
        toast.success(`${selectedUser.name}님께 배당코인 ${grantAmount}개가 지급되었습니다!`)
      } else {
        toast.success(`${selectedUser.name}님의 배당코인이 ${grantAmount}개로 수정되었습니다!`)
      }

      // 목록 갱신
      await fetchUsers()

      // 폼 초기화
      setSelectedUser(null)
      setGrantAmount('')
      setGrantDescription('')
      setGrantSearchTerm('')

    } catch (error: any) {
      toast.error(error.message || '배당코인 처리 중 오류가 발생했습니다.')
    }
  }

  const handleChangeRole = async () => {
    if (!roleChangeUserId) {
      toast.error('회원을 선택해주세요.')
      return
    }

    const targetUser = users.find(u => u.id === roleChangeUserId)
    if (!targetUser) return

    const roleNames: Record<string, string> = {
      'USER': '일반회원',
      'TEAM_LEADER': '팀장'
    }

    const token = localStorage.getItem('token')

    try {
      const response = await fetch('/api/admin/set-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: roleChangeUserId,
          role: newRole
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || '등급 변경 실패')
      }

      toast.success(`${targetUser.name}님의 등급이 ${roleNames[newRole]}(으)로 변경되었습니다!`)

      // 목록 갱신
      await fetchUsers()

      // 폼 초기화
      setRoleChangeUserId('')
      setNewRole('USER')
      setRoleSearchTerm('')

    } catch (error: any) {
      toast.error(error.message || '등급 변경 중 오류가 발생했습니다.')
    }
  }

  const handleUserClick = (selectedUser: any) => {
    setSelectedUserDetail(selectedUser)
    setIsDetailModalOpen(true)
    setIsEditingUserInfo(false)
    setUserEditForm({
      phone: selectedUser.phone || '',
      idNumber: selectedUser.idNumber || ''
    })
  }

  const closeDetailModal = () => {
    setIsDetailModalOpen(false)
    setSelectedUserDetail(null)
    setIsEditingUserInfo(false)
  }

  const handleUpdateUserInfo = async () => {
    if (!selectedUserDetail) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/admin/users/${selectedUserDetail.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          phone: userEditForm.phone,
          idNumber: userEditForm.idNumber
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '회원 정보 수정 실패')
      }

      toast.success('회원 정보가 수정되었습니다')
      setIsEditingUserInfo(false)

      // 회원 목록 새로고침
      await fetchUsers()

      // 상세 정보 업데이트
      const updatedUser = { ...selectedUserDetail, ...userEditForm }
      setSelectedUserDetail(updatedUser)
    } catch (error: any) {
      toast.error(error.message || '회원 정보 수정 중 오류가 발생했습니다')
    }
  }

  const handleBlockUser = async (userId: string, action: 'block' | 'unblock') => {
    const token = localStorage.getItem('token')

    const confirmMessage = action === 'block'
      ? '이 회원을 차단하시겠습니까? 차단된 회원은 로그인할 수 없습니다.'
      : '이 회원의 차단을 해제하시겠습니까?'

    if (!confirm(confirmMessage)) return

    try {
      const response = await fetch('/api/admin/block-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId, action })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || '처리 실패')
      }

      toast.success(result.message)
      await fetchUsers() // 목록 새로고침
      closeDetailModal()
    } catch (error: any) {
      toast.error(error.message || '처리 중 오류가 발생했습니다.')
    }
  }

  const handleDeleteUser = async (userId: string) => {
    const token = localStorage.getItem('token')

    if (!confirm('정말로 이 회원을 탈퇴 처리하시겠습니까?\n탈퇴 처리된 회원은 로그인할 수 없으며, 복구가 어렵습니다.')) {
      return
    }

    try {
      const response = await fetch('/api/admin/delete-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || '탈퇴 처리 실패')
      }

      toast.success(result.message)
      await fetchUsers() // 목록 새로고침
      closeDetailModal()
    } catch (error: any) {
      toast.error(error.message || '처리 중 오류가 발생했습니다.')
    }
  }

  const handlePermanentlyDeleteUser = async (userId: string) => {
    const token = localStorage.getItem('token')

    if (!confirm('⚠️ 경고: 이 회원의 모든 데이터를 영구적으로 삭제하시겠습니까?\n\n삭제되는 데이터:\n- 회원 정보\n- 모든 거래 내역\n- 코인 보유 내역\n\n이 작업은 되돌릴 수 없습니다!')) {
      return
    }

    // 한 번 더 확인
    if (!confirm('정말로 영구 삭제하시겠습니까? 이 작업은 복구가 불가능합니다!')) {
      return
    }

    try {
      const response = await fetch('/api/admin/permanently-delete-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || '영구 삭제 실패')
      }

      toast.success(result.message)
      await fetchUsers() // 목록 새로고침
      closeDetailModal()
    } catch (error: any) {
      toast.error(error.message || '처리 중 오류가 발생했습니다.')
    }
  }

  const handleSetupNotifications = async () => {
    const token = localStorage.getItem('token')

    if (!confirm('알림 테이블을 생성하시겠습니까?\n\nnotifications와 push_subscriptions 테이블이 생성됩니다.')) {
      return
    }

    try {
      toast.loading('테이블 생성 중...')

      const response = await fetch('/api/admin/setup-notifications', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const result = await response.json()

      toast.dismiss()

      if (!response.ok) {
        // 수동으로 생성해야 하는 경우
        if (result.sql || result.notificationsSQL) {
          alert('Supabase 대시보드에서 수동으로 생성이 필요합니다.\n\nSQL이 콘솔에 출력되었습니다. F12를 눌러서 확인하세요.')
          console.log('=== Notifications 테이블 생성 SQL ===')
          console.log(result.notificationsSQL || result.sql)
          if (result.pushSubscriptionsSQL) {
            console.log('\n=== Push Subscriptions 테이블 생성 SQL ===')
            console.log(result.pushSubscriptionsSQL)
          }
        }
        throw new Error(result.error || '테이블 생성 실패')
      }

      toast.success('알림 테이블이 생성되었습니다!', { duration: 5000 })
      console.log('생성된 테이블:', result.tables)

    } catch (error: any) {
      toast.dismiss()
      toast.error(error.message || '테이블 생성 중 오류가 발생했습니다.')
    }
  }

  const handleFixReferralData = async () => {
    const token = localStorage.getItem('token')

    if (!confirm('추천 데이터를 수정하시겠습니까?\n\n이 작업은 referred_by 필드를 user ID에서 referralCode로 변경합니다.')) {
      return
    }

    try {
      toast.loading('데이터 수정 중...')

      const response = await fetch('/api/admin/fix-referrals', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const result = await response.json()

      toast.dismiss()

      if (!response.ok) {
        throw new Error(result.error || '데이터 수정 실패')
      }

      toast.success(
        `수정 완료!\n수정됨: ${result.updated}명\n스킵됨: ${result.skipped}명`,
        { duration: 5000 }
      )

      console.log('=== 추천 데이터 수정 결과 ===')
      console.log('총 사용자:', result.totalUsers)
      console.log('수정됨:', result.updated)
      console.log('스킵됨:', result.skipped)
      console.log('에러:', result.errors)
      if (result.updates) {
        console.log('\n상세 내역:')
        result.updates.forEach((u: string) => console.log(u))
      }

    } catch (error: any) {
      toast.dismiss()
      toast.error(error.message || '데이터 수정 중 오류가 발생했습니다.')
    }
  }

  const handleUpdateAdminProfile = async () => {
    const token = localStorage.getItem('token')

    // 비밀번호 확인 검증
    if (adminEditForm.newPassword && adminEditForm.newPassword !== adminEditForm.confirmPassword) {
      toast.error('새 비밀번호가 일치하지 않습니다.')
      return
    }

    try {
      const response = await fetch('/api/user/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: adminEditForm.name,
          phone: adminEditForm.phone,
          email: adminEditForm.email,
          currentPassword: adminEditForm.currentPassword,
          newPassword: adminEditForm.newPassword
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

      setIsEditingAdmin(false)
      setAdminEditForm(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }))
      toast.success('관리자 정보가 수정되었습니다!')

    } catch (error: any) {
      toast.error(error.message || '정보 수정 중 오류가 발생했습니다.')
    }
  }

  // 기간 필터링된 사용자 (통계용)
  const periodFilteredUsers = users.filter(u => {
    if (periodFilter === 'all') {
      return true
    }

    // custom 기간 필터
    const userDate = new Date(u.createdAt)

    if (startDate && endDate) {
      const start = new Date(startDate)
      const end = new Date(endDate)
      end.setHours(23, 59, 59, 999) // 종료일 끝까지 포함
      return userDate >= start && userDate <= end
    } else if (startDate) {
      const start = new Date(startDate)
      return userDate >= start
    } else if (endDate) {
      const end = new Date(endDate)
      end.setHours(23, 59, 59, 999)
      return userDate <= end
    }

    return true
  })

  const filteredUsers = users.filter(u => {
    // 검색 필터
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.phone || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.referralCode.toLowerCase().includes(searchTerm.toLowerCase())

    // 등급 필터
    const userRole = u.role || 'USER'
    const matchesRole = userRoleFilter === 'ALL' || userRole === userRoleFilter

    return matchesSearch && matchesRole
  }).sort((a, b) => {
    // 회원번호 정렬
    if (sortOrder === 'asc') {
      return a.memberNumber - b.memberNumber
    } else {
      return b.memberNumber - a.memberNumber
    }
  })

  // 페이지네이션 계산
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage)
  const indexOfLastUser = currentPage * usersPerPage
  const indexOfFirstUser = indexOfLastUser - usersPerPage
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser)

  const grantFilteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(grantSearchTerm.toLowerCase()) ||
    (u.phone || '').toLowerCase().includes(grantSearchTerm.toLowerCase())
  )

  const securityFilteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(securitySearchTerm.toLowerCase()) ||
    (u.phone || '').toLowerCase().includes(securitySearchTerm.toLowerCase())
  )

  const roleFilteredUsers = users.filter(u =>
    !u.isAdmin && (
      u.name.toLowerCase().includes(roleSearchTerm.toLowerCase()) ||
      (u.phone || '').toLowerCase().includes(roleSearchTerm.toLowerCase())
    )
  )

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
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
              <div className="flex items-center space-x-2">
                <Shield className="w-6 h-6 text-purple-400" />
                <h1 className="text-xl font-bold text-white">관리자 패널</h1>
              </div>
            </div>
            <div className="text-sm text-gray-400">
              관리자: {user?.name}
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* 기간 필터 */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <label className="text-sm text-gray-400 mr-3">조회 기간:</label>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setPeriodFilter('all')
                  setStartDate('')
                  setEndDate('')
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  periodFilter === 'all'
                    ? 'bg-yellow-500 text-gray-900'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                전체
              </button>
              <button
                onClick={() => {
                  const now = new Date()
                  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
                  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
                  setPeriodFilter('custom')
                  setStartDate(firstDay.toISOString().split('T')[0])
                  setEndDate(lastDay.toISOString().split('T')[0])
                }}
                className="px-4 py-2 bg-gray-700 text-gray-300 hover:bg-gray-600 rounded-lg text-sm font-medium transition"
              >
                이번 달
              </button>
              <button
                onClick={() => {
                  const now = new Date()
                  const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1)
                  const lastDay = new Date(now.getFullYear(), now.getMonth(), 0)
                  setPeriodFilter('custom')
                  setStartDate(firstDay.toISOString().split('T')[0])
                  setEndDate(lastDay.toISOString().split('T')[0])
                }}
                className="px-4 py-2 bg-gray-700 text-gray-300 hover:bg-gray-600 rounded-lg text-sm font-medium transition"
              >
                지난 달
              </button>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value)
                  if (e.target.value || endDate) {
                    setPeriodFilter('custom')
                  }
                }}
                className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm"
              />
              <span className="text-gray-400">~</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value)
                  if (startDate || e.target.value) {
                    setPeriodFilter('custom')
                  }
                }}
                className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm"
              />
            </div>
          </div>
        </div>

        {/* 통계 카드 */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">
                  총 회원수
                  {periodFilter === 'custom' && (startDate || endDate) && (
                    <span className="block text-xs text-yellow-400 mt-1">
                      {startDate && endDate ? `${startDate} ~ ${endDate}` :
                       startDate ? `${startDate} 이후` :
                       `${endDate} 이전`}
                    </span>
                  )}
                </p>
                <p className="text-2xl font-bold text-white">
                  {(() => {
                    const count = periodFilter === 'all' ? users.length : periodFilteredUsers.length
                    console.log('🔍 Display Count - periodFilter:', periodFilter, 'users.length:', users.length, 'periodFilteredUsers.length:', periodFilteredUsers.length, 'showing:', count)
                    return count
                  })()}명
                </p>
              </div>
              <Users className="w-8 h-8 text-blue-400" />
            </div>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">
                  총 증권코인
                  {periodFilter === 'custom' && (startDate || endDate) && (
                    <span className="block text-xs text-yellow-400 mt-1">
                      {startDate && endDate ? `${startDate} ~ ${endDate}` :
                       startDate ? `${startDate} 이후` :
                       `${endDate} 이전`}
                    </span>
                  )}
                </p>
                <p className="text-2xl font-bold text-white">
                  {(periodFilter === 'all' ? users : periodFilteredUsers).reduce((sum, u) => sum + u.securityCoins, 0).toLocaleString()}개
                </p>
              </div>
              <Coins className="w-8 h-8 text-blue-400" />
            </div>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 relative">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">
                  총 배당코인
                  {periodFilter === 'custom' && (startDate || endDate) && (
                    <span className="block text-xs text-yellow-400 mt-1">
                      {startDate && endDate ? `${startDate} ~ ${endDate}` :
                       startDate ? `${startDate} 이후` :
                       `${endDate} 이전`}
                    </span>
                  )}
                </p>
                <p className="text-2xl font-bold text-white">
                  {(periodFilter === 'all' ? users : periodFilteredUsers).reduce((sum, u) => sum + u.dividendCoins, 0).toLocaleString()}개
                </p>
              </div>
              <Coins className="w-8 h-8 text-yellow-400" />
            </div>
            <div className="absolute bottom-4 right-6">
              <p className="text-xs text-gray-500">
                {(periodFilteredUsers.reduce((sum, u) => sum + u.dividendCoins, 0) * 100).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* 탭 메뉴 */}
        <div className="mb-8">
          <div className="flex space-x-2 border-b border-gray-700">
            <button
              onClick={() => setActiveTab('users')}
              className={`px-4 py-3 text-sm font-medium transition-colors relative ${
                activeTab === 'users'
                  ? 'text-yellow-400'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4" />
                <span>회원</span>
              </div>
              {activeTab === 'users' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-yellow-400"></div>
              )}
            </button>

            <button
              onClick={() => setActiveTab('grant')}
              className={`px-4 py-3 text-sm font-medium transition-colors relative ${
                activeTab === 'grant'
                  ? 'text-yellow-400'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Gift className="w-4 h-4" />
                <span>배당코인</span>
              </div>
              {activeTab === 'grant' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-yellow-400"></div>
              )}
            </button>

            <button
              onClick={() => setActiveTab('security-grant')}
              className={`px-4 py-3 text-sm font-medium transition-colors relative ${
                activeTab === 'security-grant'
                  ? 'text-yellow-400'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Coins className="w-4 h-4" />
                <span>증권코인</span>
              </div>
              {activeTab === 'security-grant' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-yellow-400"></div>
              )}
            </button>

            <button
              onClick={() => setActiveTab('roles')}
              className={`px-4 py-3 text-sm font-medium transition-colors relative ${
                activeTab === 'roles'
                  ? 'text-yellow-400'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Shield className="w-4 h-4" />
                <span>등급관리</span>
              </div>
              {activeTab === 'roles' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-yellow-400"></div>
              )}
            </button>

            <button
              onClick={() => setActiveTab('notice')}
              className={`px-4 py-3 text-sm font-medium transition-colors relative ${
                activeTab === 'notice'
                  ? 'text-yellow-400'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Bell className="w-4 h-4" />
                <span>공지사항</span>
              </div>
              {activeTab === 'notice' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-yellow-400"></div>
              )}
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`px-4 py-3 text-sm font-medium transition-colors relative ${
                activeTab === 'settings'
                  ? 'text-yellow-400'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Settings className="w-4 h-4" />
                <span>관리자설정</span>
              </div>
              {activeTab === 'settings' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-yellow-400"></div>
              )}
            </button>

            {/* 부관리자(01012341234)는 코인지급설정 메뉴 숨김 */}
            {user?.phone !== '01012341234' && (
              <button
                onClick={() => setActiveTab('coin-settings')}
                className={`px-4 py-3 text-sm font-medium transition-colors relative ${
                  activeTab === 'coin-settings'
                    ? 'text-yellow-400'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Coins className="w-4 h-4" />
                  <span>코인지급설정</span>
                </div>
                {activeTab === 'coin-settings' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-yellow-400"></div>
                )}
              </button>
            )}

            {/* 팀별 통계 탭 */}
            <button
              onClick={() => setActiveTab('team-stats')}
              className={`relative px-4 py-3 rounded-lg transition font-medium ${
                activeTab === 'team-stats' ? 'bg-gray-700 text-yellow-400' : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4" />
                <span>팀별통계</span>
              </div>
              {activeTab === 'team-stats' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-yellow-400"></div>
              )}
            </button>
          </div>
        </div>

        {/* 회원 목록 탭 */}
        {activeTab === 'users' && (
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700 min-h-[600px]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">회원 목록</h2>

              <div className="flex items-center space-x-3">
                {/* 등급 필터 */}
                <select
                  value={userRoleFilter}
                  onChange={(e) => setUserRoleFilter(e.target.value as 'ALL' | 'ADMIN' | 'TEAM_LEADER' | 'USER')}
                  className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                >
                  <option value="ALL">전체 등급</option>
                  <option value="ADMIN">관리자</option>
                  <option value="TEAM_LEADER">팀장</option>
                  <option value="USER">일반회원</option>
                </select>

                {/* 새로고침 버튼 */}
                <button
                  onClick={() => fetchUsers()}
                  className="flex items-center space-x-2 px-4 py-2 bg-yellow-600 border border-yellow-500 rounded-lg text-white hover:bg-yellow-500 transition"
                  title="회원 목록 새로고침"
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
                    <th className="text-left py-3 px-2 text-sm text-gray-400">추천인</th>
                    <th className="text-left py-3 px-2 text-sm text-gray-400">등급</th>
                    <th className="text-left py-3 px-2 text-sm text-gray-400">휴대폰</th>
                    <th className="text-left py-3 px-2 text-sm text-gray-400">추천코드</th>
                    <th className="text-right py-3 px-2 text-sm text-gray-400">증권코인</th>
                    <th className="text-right py-3 px-2 text-sm text-gray-400">배당코인</th>
                    <th className="text-left py-3 px-2 text-sm text-gray-400">가입일</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    // 재귀적으로 회원과 하부 추천 회원들을 렌더링하는 함수
                    const renderUserRow = (u: User, depth: number = 0): React.ReactNode[] => {
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
                      const currentRole: string = u.role || 'USER'

                      // 추천인 찾기 (referrerId는 USER ID 또는 추천코드일 수 있음)
                      const referrer = u.referrerId
                        ? users.find(user => user.id === u.referrerId || user.referralCode === u.referrerId)
                        : null

                      // 이 회원이 추천한 회원들 (referrerId가 USER ID 또는 추천코드일 수 있음)
                      const referredMembers = users.filter(user => user.referrerId === u.id || user.referrerId === u.referralCode)
                      const referredCount = referredMembers.length
                      const isExpanded = expandedTeamLeaders.has(u.id)

                      const elements: React.ReactNode[] = []

                      // 현재 회원 행
                      elements.push(
                        <tr key={u.id} className={`border-b border-gray-700/50 hover:bg-gray-700/20 ${
                          u.status === 'BLOCKED' ? 'opacity-60' :
                          u.status === 'DELETED' ? 'opacity-40' : ''
                        }`}>
                          <td className="py-3 px-2 text-sm text-white" style={{ paddingLeft: `${8 + depth * 20}px` }}>
                            {depth > 0 && <span className="text-gray-600 mr-2">└─</span>}
                            #{u.memberNumber}
                          </td>
                          <td className="py-3 px-2 text-sm">
                            <div className="flex items-center gap-2">
                              {/* 이름 클릭하면 하부 회원들 펼침/접힘 */}
                              <button
                                onClick={() => {
                                  if (referredCount > 0) {
                                    setExpandedTeamLeaders(prev => {
                                      const newSet = new Set(prev)
                                      if (newSet.has(u.id)) {
                                        newSet.delete(u.id)
                                      } else {
                                        newSet.add(u.id)
                                      }
                                      return newSet
                                    })
                                  }
                                }}
                                className={`${referredCount > 0 ? 'text-blue-400 hover:text-blue-300' : 'text-white'} transition`}
                              >
                                {referredCount > 0 && (isExpanded ? '▼ ' : '▶ ')}
                                {u.name}
                              </button>
                              {/* 회원 상세 정보 버튼 */}
                              <button
                                onClick={() => handleUserClick(u)}
                                className="text-yellow-400 hover:text-yellow-300 text-xs"
                                title="회원 상세 정보"
                              >
                                📋
                              </button>
                              {u.status === 'BLOCKED' && <span className="text-red-400 text-xs">🚫</span>}
                              {u.status === 'DELETED' && <span className="text-gray-500 text-xs">❌</span>}
                            </div>
                          </td>
                          <td className="py-3 px-2 text-sm text-gray-300">
                            {referrer ? referrer.name : '-'}
                          </td>
                          <td className="py-3 px-2">
                            <span className={`text-xs px-2 py-1 rounded ${roleColors[currentRole]}`}>
                              {roleLabels[currentRole]}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-sm text-gray-300">{u.phone}</td>
                          <td className="py-3 px-2">
                            <span className="text-sm font-mono text-yellow-400">{u.referralCode}</span>
                          </td>
                          <td className="py-3 px-2 text-sm text-right text-blue-400">
                            {u.securityCoins.toLocaleString()}
                          </td>
                          <td className="py-3 px-2 text-sm text-right text-yellow-400">
                            {u.dividendCoins.toLocaleString()}
                          </td>
                          <td className="py-3 px-2 text-sm text-gray-400">{u.createdAt}</td>
                        </tr>
                      )

                      // 하부 추천 회원들 (펼쳐져 있을 때만)
                      if (isExpanded && referredMembers.length > 0) {
                        referredMembers.forEach(member => {
                          elements.push(...renderUserRow(member, depth + 1))
                        })
                      }

                      return elements
                    }

                    // 모든 회원을 렌더링
                    return currentUsers.flatMap(u => renderUserRow(u, 0))
                  })()}
                </tbody>
              </table>
            </div>

            {/* 페이지네이션 */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center mt-6 space-x-2">
                {/* 이전 버튼 */}
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                    currentPage === 1
                      ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                      : 'bg-gray-700 text-white hover:bg-gray-600'
                  }`}
                >
                  이전
                </button>

                {/* 페이지 번호 */}
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => {
                  // 현재 페이지 주변 페이지만 표시 (1, 2, 3 ... 현재-1, 현재, 현재+1 ... 마지막-2, 마지막-1, 마지막)
                  const showPage =
                    pageNum === 1 ||
                    pageNum === totalPages ||
                    (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)

                  if (!showPage) {
                    // 생략 표시 (...)
                    if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                      return (
                        <span key={pageNum} className="px-2 text-gray-500">
                          ...
                        </span>
                      )
                    }
                    return null
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                        currentPage === pageNum
                          ? 'bg-yellow-500 text-gray-900'
                          : 'bg-gray-700 text-white hover:bg-gray-600'
                      }`}
                    >
                      {pageNum}
                    </button>
                  )
                })}

                {/* 다음 버튼 */}
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                    currentPage === totalPages
                      ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                      : 'bg-gray-700 text-white hover:bg-gray-600'
                  }`}
                >
                  다음
                </button>
              </div>
            )}
          </div>
        )}

        {/* 배당코인 지급 탭 */}
        {activeTab === 'grant' && (
        <div className="bg-gradient-to-r from-purple-500/10 to-purple-600/10 rounded-2xl p-6 mb-8 border border-purple-500/30 min-h-[600px]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-purple-400 flex items-center">
              <Gift className="w-6 h-6 mr-2" />
              배당코인 관리
            </h2>

            {/* 모드 선택 버튼 */}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setGrantMode('add')
                  setGrantAmount('')
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  grantMode === 'add'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                지급
              </button>
              <button
                onClick={() => {
                  setGrantMode('set')
                  setGrantAmount(selectedUser ? selectedUser.dividendCoins.toString() : '')
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  grantMode === 'set'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                수정
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-300 mb-2">회원 검색 (이름 또는 휴대폰 번호)</label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  placeholder="이름 또는 휴대폰 번호로 검색"
                  value={grantSearchTerm}
                  onChange={(e) => {
                    setGrantSearchTerm(e.target.value)
                    setSelectedUser(null)
                  }}
                  className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm text-gray-300 mb-2">
                회원 선택 {grantSearchTerm && `(${grantFilteredUsers.length}명 검색됨)`}
              </label>
              <select
                value={selectedUser?.id || ''}
                onChange={(e) => setSelectedUser(users.find(u => u.id === e.target.value) || null)}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
              >
                <option value="">회원을 선택하세요</option>
                {(grantSearchTerm ? grantFilteredUsers : users).map(u => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.phone}) - 회원번호: #{u.memberNumber}
                  </option>
                ))}
              </select>
            </div>

            {selectedUser && (() => {
              const roleLabels: Record<string, string> = {
                'ADMIN': '관리자',
                'TEAM_LEADER': '팀장',
                'USER': '일반회원'
              }
              const currentRole: string = selectedUser.role || 'USER'
              // referrerId는 USER ID 또는 추천코드일 수 있음
              const referrer = selectedUser.referrerId
                ? users.find(u => u.id === selectedUser.referrerId || u.referralCode === selectedUser.referrerId)
                : null
              const referredCount = users.filter(u => u.referrerId === selectedUser.id || u.referrerId === selectedUser.referralCode).length
              const joinDate = new Date(selectedUser.createdAt).toLocaleDateString('ko-KR')

              // 디버깅
              if (selectedUser.phone === '01088418964' || selectedUser.phone === '01044818013') {
                console.log('증권코인 관리 - 선택된 회원:', selectedUser.name, selectedUser.phone)
                console.log('referrerId:', selectedUser.referrerId)
                console.log('찾은 추천인:', referrer)
                console.log('전체 users 수:', users.length)
              }

              return (
                <div className="md:col-span-2 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                  <p className="text-sm text-gray-400 mb-3">선택된 회원 정보</p>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <p className="text-xs text-gray-500">이름</p>
                      <p className="text-white font-medium">{selectedUser.name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">휴대폰</p>
                      <p className="text-white font-medium">{selectedUser.phone}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">회원번호</p>
                      <p className="text-white font-medium">#{selectedUser.memberNumber}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">등급</p>
                      <p className="text-blue-400 font-medium">{roleLabels[currentRole]}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">가입일</p>
                      <p className="text-white font-medium">{joinDate}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">추천한 인원</p>
                      <p className="text-green-400 font-medium">{referredCount}명</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">추천인</p>
                      <p className="text-purple-400 font-medium">{referrer ? referrer.name : '없음'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">증권코인</p>
                      <p className="text-blue-400 font-bold">{selectedUser.securityCoins.toLocaleString()}개</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">배당코인</p>
                      <p className="text-yellow-400 font-bold">{selectedUser.dividendCoins.toLocaleString()}개</p>
                    </div>
                  </div>
                </div>
              )
            })()}
            
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-300 mb-3">
                {grantMode === 'add' ? '지급 수량' : '배당코인 수량 (현재: ' + (selectedUser?.dividendCoins.toLocaleString() || '0') + '개)'}
              </label>

              {grantMode === 'add' && (
                <div className="flex items-center gap-6 mb-3">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="amountOption"
                      value="1000000"
                      checked={selectedAmountOption === '1000000'}
                      onChange={(e) => {
                        setSelectedAmountOption(e.target.value)
                        setGrantAmount('10000')
                      }}
                      className="w-4 h-4 text-purple-600"
                    />
                    <span className="ml-2 text-white">100만원 (10,000개)</span>
                  </label>

                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="amountOption"
                      value="5000000"
                      checked={selectedAmountOption === '5000000'}
                      onChange={(e) => {
                        setSelectedAmountOption(e.target.value)
                        setGrantAmount('50000')
                      }}
                      className="w-4 h-4 text-purple-600"
                    />
                    <span className="ml-2 text-white">500만원 (50,000개)</span>
                  </label>

                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="amountOption"
                      value="10000000"
                      checked={selectedAmountOption === '10000000'}
                      onChange={(e) => {
                        setSelectedAmountOption(e.target.value)
                        setGrantAmount('100000')
                      }}
                      className="w-4 h-4 text-purple-600"
                    />
                    <span className="ml-2 text-white">1,000만원 (100,000개)</span>
                  </label>
                </div>
              )}

              <input
                type="number"
                value={grantAmount}
                onChange={(e) => {
                  setGrantAmount(e.target.value)
                  setSelectedAmountOption('') // 직접 입력 시 라디오 선택 해제
                }}
                placeholder={grantMode === 'add' ? '10000' : '변경할 수량'}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm text-gray-300 mb-2">설명 (선택)</label>
              <input
                type="text"
                value={grantDescription}
                onChange={(e) => setGrantDescription(e.target.value)}
                placeholder={grantMode === 'add' ? '100만원 입금 확인' : '수정 사유'}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
              />
            </div>
          </div>

          {/* 안내 메시지 */}
          {grantMode === 'add' ? (
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3">
              <p className="text-sm text-green-300">
                <strong>자동 지급:</strong> 배당코인 지급 시 추천인에게 자동으로 보너스가 지급됩니다. (현재 설정: {coinSettings.referralBonus.toLocaleString()}개)
              </p>
            </div>
          ) : (
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-3">
              <p className="text-sm text-orange-300">
                <strong>주의:</strong> 수정 모드는 배당코인을 입력한 값으로 변경합니다. 추천인 보너스는 지급되지 않습니다.
              </p>
            </div>
          )}

          <button
            onClick={handleGrantDividendCoins}
            disabled={!selectedUser || !grantAmount}
            className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {grantMode === 'add' ? '배당코인 지급' : '배당코인 수정'}
          </button>
        </div>
        )}

        {/* 증권코인 지급 탭 */}
        {activeTab === 'security-grant' && (
        <div className="bg-gradient-to-r from-blue-500/10 to-blue-600/10 rounded-2xl p-6 mb-8 border border-blue-500/30 min-h-[600px]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-blue-400 flex items-center">
              <Coins className="w-6 h-6 mr-2" />
              증권코인 관리
            </h2>

            {/* 모드 선택 버튼 */}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setSecurityGrantMode('add')
                  setSecurityGrantAmount('')
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  securityGrantMode === 'add'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                지급
              </button>
              <button
                onClick={() => {
                  setSecurityGrantMode('set')
                  setSecurityGrantAmount(securitySelectedUser ? securitySelectedUser.securityCoins.toString() : '')
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  securityGrantMode === 'set'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                수정
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-300 mb-2">회원 검색 (이름 또는 휴대폰 번호)</label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  placeholder="이름 또는 휴대폰 번호로 검색"
                  value={securitySearchTerm}
                  onChange={(e) => {
                    setSecuritySearchTerm(e.target.value)
                    setSecuritySelectedUser(null)
                  }}
                  className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm text-gray-300 mb-2">
                회원 선택 {securitySearchTerm && `(${securityFilteredUsers.length}명 검색됨)`}
              </label>
              <select
                value={securitySelectedUser?.id || ''}
                onChange={(e) => setSecuritySelectedUser(users.find(u => u.id === e.target.value) || null)}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
              >
                <option value="">회원을 선택하세요</option>
                {(securitySearchTerm ? securityFilteredUsers : users).map(u => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.phone}) - 회원번호: #{u.memberNumber}
                  </option>
                ))}
              </select>
            </div>

            {securitySelectedUser && (() => {
              const roleLabels: Record<string, string> = {
                'ADMIN': '관리자',
                'TEAM_LEADER': '팀장',
                'USER': '일반회원'
              }
              const currentRole: string = securitySelectedUser.role || 'USER'
              // referrerId는 USER ID 또는 추천코드일 수 있음
              const referrer = securitySelectedUser.referrerId
                ? users.find(u => u.id === securitySelectedUser.referrerId || u.referralCode === securitySelectedUser.referrerId)
                : null
              const referredCount = users.filter(u => u.referrerId === securitySelectedUser.id || u.referrerId === securitySelectedUser.referralCode).length
              const joinDate = new Date(securitySelectedUser.createdAt).toLocaleDateString('ko-KR')

              // 디버깅
              if (securitySelectedUser.phone === '01088418964' || securitySelectedUser.phone === '01044818013') {
                console.log('배당코인 관리 - 선택된 회원:', securitySelectedUser.name, securitySelectedUser.phone)
                console.log('referrerId:', securitySelectedUser.referrerId)
                console.log('찾은 추천인:', referrer)
                console.log('전체 users 수:', users.length)
              }

              return (
                <div className="md:col-span-2 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                  <p className="text-sm text-gray-400 mb-3">선택된 회원 정보</p>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <p className="text-xs text-gray-500">이름</p>
                      <p className="text-white font-medium">{securitySelectedUser.name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">휴대폰</p>
                      <p className="text-white font-medium">{securitySelectedUser.phone}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">회원번호</p>
                      <p className="text-white font-medium">#{securitySelectedUser.memberNumber}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">등급</p>
                      <p className="text-blue-400 font-medium">{roleLabels[currentRole]}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">가입일</p>
                      <p className="text-white font-medium">{joinDate}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">추천한 인원</p>
                      <p className="text-green-400 font-medium">{referredCount}명</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">추천인</p>
                      <p className="text-purple-400 font-medium">{referrer ? referrer.name : '없음'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">증권코인</p>
                      <p className="text-blue-400 font-bold">{securitySelectedUser.securityCoins.toLocaleString()}개</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">배당코인</p>
                      <p className="text-yellow-400 font-bold">{securitySelectedUser.dividendCoins.toLocaleString()}개</p>
                    </div>
                  </div>
                </div>
              )
            })()}

            <div className="md:col-span-2">
              <label className="block text-sm text-gray-300 mb-3">
                {securityGrantMode === 'add' ? '지급 수량' : '증권코인 수량 (현재: ' + (securitySelectedUser?.securityCoins.toLocaleString() || '0') + '개)'}
              </label>

              <input
                type="number"
                value={securityGrantAmount}
                onChange={(e) => setSecurityGrantAmount(e.target.value)}
                placeholder={securityGrantMode === 'add' ? '지급할 수량 입력' : '변경할 수량'}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm text-gray-300 mb-2">설명 (선택)</label>
              <input
                type="text"
                value={securityGrantDescription}
                onChange={(e) => setSecurityGrantDescription(e.target.value)}
                placeholder={securityGrantMode === 'add' ? '증권코인 지급 사유' : '수정 사유'}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
              />
            </div>
          </div>

          {/* 안내 메시지 */}
          {securityGrantMode === 'add' ? (
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3 mt-4">
              <p className="text-sm text-green-300">
                <strong>자동 알림:</strong> 증권코인 지급 시 해당 회원에게 자동으로 알림이 발송됩니다.
              </p>
            </div>
          ) : (
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-3 mt-4">
              <p className="text-sm text-orange-300">
                <strong>주의:</strong> 수정 모드는 증권코인을 입력한 값으로 변경합니다.
              </p>
            </div>
          )}

          <button
            onClick={handleGrantSecurityCoins}
            disabled={!securitySelectedUser || !securityGrantAmount}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {securityGrantMode === 'add' ? '증권코인 지급' : '증권코인 수정'}
          </button>
        </div>
        )}

        {/* 회원 등급 관리 탭 */}
        {activeTab === 'roles' && (
        <div className="bg-gradient-to-r from-blue-500/10 to-blue-600/10 rounded-2xl p-6 mb-8 border border-blue-500/30 min-h-[600px]">
          <h2 className="text-xl font-bold text-blue-400 mb-4 flex items-center">
            <Shield className="w-6 h-6 mr-2" />
            회원 등급 관리
          </h2>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="md:col-span-3">
              <label className="block text-sm text-gray-300 mb-2">회원 검색 (이름 또는 휴대폰 번호)</label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  placeholder="이름 또는 휴대폰 번호로 검색"
                  value={roleSearchTerm}
                  onChange={(e) => {
                    setRoleSearchTerm(e.target.value)
                    setRoleChangeUserId('')
                  }}
                  className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm text-gray-300 mb-2">
                회원 선택 {roleSearchTerm && `(${roleFilteredUsers.length}명 검색됨)`}
              </label>
              <select
                value={roleChangeUserId}
                onChange={(e) => setRoleChangeUserId(e.target.value)}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
              >
                <option value="">회원을 선택하세요</option>
                {(roleSearchTerm ? roleFilteredUsers : users.filter(u => !u.isAdmin)).map(u => {
                  const roleLabels: Record<string, string> = {
                    'ADMIN': '관리자',
                    'TEAM_LEADER': '팀장',
                    'USER': '일반회원'
                  }
                  const currentRole: string = u.role || 'USER'
                  return (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.phone}) - 현재: {roleLabels[currentRole]}
                    </option>
                  )
                })}
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-2">변경할 등급</label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as 'USER' | 'TEAM_LEADER')}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
              >
                <option value="USER">일반회원</option>
                <option value="TEAM_LEADER">팀장</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleChangeRole}
            disabled={!roleChangeUserId}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            등급 변경
          </button>
        </div>
        )}

        {/* 공지사항 관리 탭 */}
        {activeTab === 'notice' && (
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700 min-h-[600px]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white flex items-center">
                <Bell className="w-6 h-6 mr-2 text-yellow-400" />
                공지사항 관리
              </h2>
              <button
                className="px-4 py-2 bg-yellow-500 text-gray-900 rounded-lg font-semibold hover:bg-yellow-400 transition"
                onClick={() => setIsNoticeModalOpen(true)}
              >
                + 새 공지사항 작성
              </button>
            </div>

            {/* 공지사항 목록 */}
            <div className="space-y-4">
              {notices.length === 0 ? (
                <div className="text-center py-12">
                  <Bell className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">작성된 공지사항이 없습니다.</p>
                  <p className="text-sm text-gray-500 mt-2">새 공지사항을 작성해보세요!</p>
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

                  return (
                    <div key={notice.id} className="bg-gray-900/50 rounded-lg p-5 border border-gray-700">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <span className={`px-3 py-1 ${typeColor.bg} ${typeColor.text} text-xs font-semibold rounded-full border ${typeColor.border}`}>
                            {typeColor.label}
                          </span>
                          <h3 className="text-lg font-semibold text-white">{notice.title}</h3>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-500">
                            {new Date(notice.created_at).toLocaleDateString('ko-KR')}
                          </span>
                          <button
                            onClick={() => handleEditNotice(notice)}
                            className="px-3 py-1 bg-blue-500/20 text-blue-400 text-xs rounded hover:bg-blue-500/30 transition"
                          >
                            수정
                          </button>
                          <button
                            onClick={() => handleDeleteNotice(notice.id)}
                            className="px-3 py-1 bg-red-500/20 text-red-400 text-xs rounded hover:bg-red-500/30 transition"
                          >
                            삭제
                          </button>
                        </div>
                      </div>
                      <p className="text-gray-300 text-sm leading-relaxed mb-3">{notice.content}</p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>조회수: {notice.view_count || 0}</span>
                        <span>작성자: {notice.author_name}</span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )}

        {/* 관리자 설정 탭 */}
        {activeTab === 'settings' && (
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700 min-h-[600px]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white flex items-center">
                <Settings className="w-6 h-6 mr-2 text-yellow-400" />
                관리자 정보 관리
              </h2>
              {!isEditingAdmin && (
                <button
                  onClick={() => setIsEditingAdmin(true)}
                  className="px-4 py-2 bg-yellow-500 text-gray-900 rounded-lg hover:bg-yellow-400 transition font-semibold"
                >
                  정보 수정
                </button>
              )}
            </div>

            {!isEditingAdmin ? (
              <div className="space-y-6">
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
                    <label className="text-sm text-gray-400">권한</label>
                    <p className="text-red-400 font-bold">관리자</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-2 flex items-center">
                    <Users className="w-4 h-4 mr-1" />
                    이름 *
                  </label>
                  <input
                    type="text"
                    value={adminEditForm.name}
                    onChange={(e) => setAdminEditForm({ ...adminEditForm, name: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-2 flex items-center">
                    <Phone className="w-4 h-4 mr-1" />
                    휴대폰 번호 *
                  </label>
                  <input
                    type="tel"
                    value={adminEditForm.phone}
                    onChange={(e) => setAdminEditForm({ ...adminEditForm, phone: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-2 flex items-center">
                    <Mail className="w-4 h-4 mr-1" />
                    이메일
                  </label>
                  <input
                    type="email"
                    value={adminEditForm.email}
                    onChange={(e) => setAdminEditForm({ ...adminEditForm, email: e.target.value })}
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
                        value={adminEditForm.currentPassword}
                        onChange={(e) => setAdminEditForm({ ...adminEditForm, currentPassword: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                        placeholder="비밀번호 변경 시 필수"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-300 mb-2">새 비밀번호</label>
                      <input
                        type="password"
                        value={adminEditForm.newPassword}
                        onChange={(e) => setAdminEditForm({ ...adminEditForm, newPassword: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                        placeholder="6자 이상"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-300 mb-2">새 비밀번호 확인</label>
                      <input
                        type="password"
                        value={adminEditForm.confirmPassword}
                        onChange={(e) => setAdminEditForm({ ...adminEditForm, confirmPassword: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                        placeholder="새 비밀번호 재입력"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={handleUpdateAdminProfile}
                    className="flex-1 px-4 py-3 bg-yellow-500 text-gray-900 rounded-lg hover:bg-yellow-400 transition font-semibold"
                  >
                    저장
                  </button>
                  <button
                    onClick={() => {
                      setIsEditingAdmin(false)
                      setAdminEditForm({
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
        )}

        {/* 코인지급 설정 탭 - 부관리자(01012341234)는 접근 불가 */}
        {activeTab === 'coin-settings' && user?.phone !== '01012341234' && (
          <div className="space-y-6 min-h-[600px]">
            {/* 기본 설정 */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
              <div className="flex items-center mb-6">
                <Coins className="w-6 h-6 mr-2 text-yellow-400" />
                <h2 className="text-xl font-bold text-white">기본 코인지급 설정</h2>
              </div>

              <div className="space-y-6">
                {/* 배당코인 지급 비율 설정 */}
                <div className="bg-gray-700/50 rounded-xl p-5 border border-gray-600">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <Gift className="w-5 h-5 mr-2 text-purple-400" />
                    배당코인 지급 비율
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-gray-300 mb-2">입금액 대비 배당코인 비율</label>
                      <div className="flex items-center space-x-3">
                        <input
                          type="number"
                          value={coinSettings.dividendCoinPer100}
                          onChange={(e) => setCoinSettings({...coinSettings, dividendCoinPer100: parseInt(e.target.value) || 10000})}
                          className="flex-1 px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white"
                          placeholder="10000"
                        />
                        <span className="text-gray-400">개 / 100만원</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">예: 100만원 = {coinSettings.dividendCoinPer100.toLocaleString()}개 배당코인</p>
                    </div>
                  </div>
                </div>

                {/* 기본 추천인 보너스 */}
                <div className="bg-gray-700/50 rounded-xl p-5 border border-gray-600">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <Users className="w-5 h-5 mr-2 text-green-400" />
                    추천인 배당코인 보너스 설정
                  </h3>
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">배당코인 추천 보너스 (백분율)</label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="number"
                        value={coinSettings.referralBonusPercentage}
                        onChange={(e) => setCoinSettings({...coinSettings, referralBonusPercentage: parseInt(e.target.value) || 10})}
                        className="flex-1 px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white"
                        placeholder="10"
                        min="0"
                        max="100"
                      />
                      <span className="text-gray-400">%</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">회원에게 배당코인 지급 시 추천인에게 지급 금액의 {coinSettings.referralBonusPercentage}%를 자동 지급</p>
                  </div>
                </div>

                {/* 유튜브 동영상 URL 설정 */}
                <div className="bg-gray-700/50 rounded-xl p-5 border border-gray-600">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 0C4.477 0 0 4.477 0 10s4.477 10 10 10 10-4.477 10-10S15.523 0 10 0zm3.5 10.5l-5 3a.5.5 0 01-.75-.433v-6a.5.5 0 01.75-.433l5 3a.5.5 0 010 .866z"/>
                    </svg>
                    메인 페이지 유튜브 동영상
                  </h3>
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">유튜브 임베드 URL</label>
                    <input
                      type="text"
                      value={coinSettings.youtubeUrl}
                      onChange={(e) => setCoinSettings({...coinSettings, youtubeUrl: e.target.value})}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white"
                      placeholder="https://www.youtube.com/embed/VIDEO_ID"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      예: https://www.youtube.com/embed/mJPAA9OzoPI
                      <br />
                      ※ 일반 유튜브 링크를 임베드 URL로 변환: watch?v= → embed/
                    </p>
                  </div>
                </div>

                {/* 저장 버튼 */}
                <div className="flex justify-end pt-4">
                  <button
                    onClick={async () => {
                      const token = localStorage.getItem('token')
                      try {
                        const response = await fetch('/api/admin/system-config', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                          },
                          body: JSON.stringify({
                            config: {
                              securityCoinNewUser: coinSettings.newUserReward,
                              securityCoinReferral: coinSettings.referralBonus,
                              dividendCoinPer100: coinSettings.dividendCoinPer100,
                              dividendCoinReferralPercentage: coinSettings.referralBonusPercentage || 10,
                              youtubeUrl: coinSettings.youtubeUrl
                            }
                          })
                        })

                        const result = await response.json()

                        if (!response.ok) {
                          throw new Error(result.error || '설정 저장 실패')
                        }

                        toast.success('기본 코인지급 설정이 Supabase에 저장되었습니다! 모든 사용자에게 적용됩니다.')
                      } catch (error: any) {
                        toast.error(error.message || '설정 저장 중 오류가 발생했습니다.')
                      }
                    }}
                    className="px-6 py-3 bg-yellow-500 text-gray-900 rounded-lg hover:bg-yellow-400 transition font-semibold"
                  >
                    기본 설정 저장 (온라인 DB)
                  </button>
                </div>
              </div>
            </div>

            {/* 회원번호별 지급 설정 */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
              <div className="flex items-center mb-6">
                <Shield className="w-6 h-6 mr-2 text-blue-400" />
                <h2 className="text-xl font-bold text-white">회원번호별 지급 설정</h2>
              </div>
              <p className="text-sm text-gray-400 mb-6">회원번호 범위에 따라 가입 시 지급되는 증권코인과 추천인 보너스를 설정합니다.</p>

              {/* 설정된 규칙 목록 */}
              {memberNumberRules.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-300 mb-3">설정된 규칙</h3>
                  <div className="space-y-3">
                    {memberNumberRules.map((rule) => (
                      <div key={rule.id} className="bg-gray-700/50 rounded-lg p-4 border border-gray-600 flex items-center justify-between">
                        <div className="flex-1 grid grid-cols-4 gap-4">
                          <div>
                            <p className="text-xs text-gray-400">회원번호 범위</p>
                            <p className="text-white font-medium">#{rule.memberNumberFrom} ~ #{rule.memberNumberTo}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400">추천인 보너스</p>
                            <p className="text-yellow-400 font-bold">{rule.referralBonus.toLocaleString()}개</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400">가입회원</p>
                            <p className="text-blue-400 font-bold">{rule.newMemberCoins.toLocaleString()}개</p>
                          </div>
                          <div className="flex items-center justify-end">
                            <button
                              onClick={() => {
                                const updatedRules = memberNumberRules.filter(r => r.id !== rule.id)
                                setMemberNumberRules(updatedRules)
                                localStorage.setItem('memberNumberRules', JSON.stringify(updatedRules))
                                toast.success('규칙이 삭제되었습니다.')
                              }}
                              className="px-3 py-1 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition text-sm"
                            >
                              삭제
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 새 규칙 추가 폼 */}
              <div className="bg-gray-700/30 rounded-xl p-5 border border-gray-600">
                <h3 className="text-sm font-semibold text-gray-300 mb-4">새 규칙 추가</h3>
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">회원번호 시작</label>
                    <input
                      type="number"
                      value={newRule.memberNumberFrom}
                      onChange={(e) => setNewRule({...newRule, memberNumberFrom: e.target.value})}
                      placeholder="예: 1"
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">회원번호 끝</label>
                    <input
                      type="number"
                      value={newRule.memberNumberTo}
                      onChange={(e) => setNewRule({...newRule, memberNumberTo: e.target.value})}
                      placeholder="예: 100"
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">추천인 보너스 (배당코인)</label>
                    <input
                      type="number"
                      value={newRule.referralBonus}
                      onChange={(e) => setNewRule({...newRule, referralBonus: e.target.value})}
                      placeholder="예: 2000"
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">가입회원</label>
                    <input
                      type="number"
                      value={newRule.newMemberCoins}
                      onChange={(e) => setNewRule({...newRule, newMemberCoins: e.target.value})}
                      placeholder="예: 200"
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white"
                    />
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (!newRule.memberNumberFrom || !newRule.memberNumberTo || !newRule.referralBonus || !newRule.newMemberCoins) {
                      toast.error('모든 항목을 입력해주세요.')
                      return
                    }

                    const from = parseInt(newRule.memberNumberFrom)
                    const to = parseInt(newRule.memberNumberTo)

                    if (from > to) {
                      toast.error('시작 회원번호는 끝 회원번호보다 작아야 합니다.')
                      return
                    }

                    const newRuleObj = {
                      id: Date.now().toString(),
                      memberNumberFrom: from,
                      memberNumberTo: to,
                      referralBonus: parseInt(newRule.referralBonus),
                      newMemberCoins: parseInt(newRule.newMemberCoins)
                    }

                    const updatedRules = [...memberNumberRules, newRuleObj]
                    setMemberNumberRules(updatedRules)
                    localStorage.setItem('memberNumberRules', JSON.stringify(updatedRules))

                    setNewRule({
                      memberNumberFrom: '',
                      memberNumberTo: '',
                      referralBonus: '',
                      newMemberCoins: ''
                    })

                    toast.success('회원번호별 규칙이 추가되었습니다!')
                  }}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
                >
                  규칙 추가
                </button>
              </div>

              {/* 안내 메시지 */}
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mt-6">
                <p className="text-sm text-blue-300 mb-2">
                  <strong>참고:</strong> 회원가입 시 회원번호에 따라 자동으로 증권코인이 지급됩니다.
                </p>
                <ul className="text-xs text-blue-300 list-disc list-inside space-y-1">
                  <li><strong>가입회원</strong>: 신규 회원이 가입할 때 받는 증권코인</li>
                  <li><strong>추천인 보너스</strong>: 신규 회원을 추천한 회원이 받는 증권코인</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* 팀별 통계 탭 */}
        {activeTab === 'team-stats' && (
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700 min-h-[600px]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white flex items-center">
                <Users className="w-6 h-6 mr-2 text-yellow-400" />
                팀장별 산하 회원 및 매출 통계
              </h2>
              <button
                onClick={() => {
                  // 엑셀 데이터 생성
                  const excelData: any[] = []

                  users.filter(u => u.role === 'TEAM_LEADER').forEach(teamLeader => {
                    const teamMembers = users.filter(u => u.referrerId === teamLeader.referralCode)
                    const totalSales = teamMembers.reduce((sum, member) => sum + member.dividendCoins, 0)

                    // 산하 총회원수 계산 (하위 팀장은 포함하지만, 그 팀장의 하위는 제외)
                    const getAllSubMembers = (referralCode: string): any[] => {
                      const directMembers = users.filter(u => u.referrerId === referralCode)
                      let allMembers = [...directMembers]
                      directMembers.forEach(member => {
                        // 팀장이면 그 팀장만 포함하고, 그 팀장의 하위는 탐색하지 않음
                        if (member.role !== 'TEAM_LEADER') {
                          allMembers = [...allMembers, ...getAllSubMembers(member.referralCode)]
                        }
                      })
                      return allMembers
                    }
                    const allSubMembers = getAllSubMembers(teamLeader.referralCode)
                    const totalSubMemberCount = allSubMembers.length

                    // 팀장 정보 헤더
                    excelData.push({
                      '팀장명': teamLeader.name,
                      '팀장 회원번호': teamLeader.memberNumber,
                      '팀장 휴대폰': teamLeader.phone,
                      '산하총회원수': totalSubMemberCount + '명',
                      '직추천한 회원': teamMembers.length + '명',
                      '총 매출(배당코인)': totalSales.toLocaleString() + '개',
                      '': '',
                      '회원번호': '',
                      '이름': '',
                      '휴대폰': '',
                      '추천인수': '',
                      '배당코인': '',
                      '증권코인': '',
                      '가입일': ''
                    })

                    // 직추천한 회원 목록
                    teamMembers.forEach(member => {
                      const referredCount = users.filter(u => u.referrerId === member.referralCode).length
                      excelData.push({
                        '팀장명': '',
                        '팀장 회원번호': '',
                        '팀장 휴대폰': '',
                        '산하총회원수': '',
                        '직추천한 회원': '',
                        '총 매출(배당코인)': '',
                        '': '',
                        '회원번호': member.memberNumber,
                        '이름': member.name,
                        '휴대폰': member.phone,
                        '추천인수': referredCount,
                        '배당코인': member.dividendCoins,
                        '증권코인': member.securityCoins,
                        '가입일': member.createdAt
                      })
                    })

                    // 빈 행 추가 (팀 구분)
                    excelData.push({
                      '팀장명': '',
                      '팀장 회원번호': '',
                      '팀장 휴대폰': '',
                      '산하총회원수': '',
                      '직추천한 회원': '',
                      '총 매출(배당코인)': '',
                      '': '',
                      '회원번호': '',
                      '이름': '',
                      '휴대폰': '',
                      '추천인수': '',
                      '배당코인': '',
                      '증권코인': '',
                      '가입일': ''
                    })
                  })

                  // 엑셀 파일 생성
                  const worksheet = XLSX.utils.json_to_sheet(excelData)
                  const workbook = XLSX.utils.book_new()
                  XLSX.utils.book_append_sheet(workbook, worksheet, '팀별통계')

                  // 파일 다운로드
                  const today = new Date().toISOString().split('T')[0]
                  XLSX.writeFile(workbook, `팀별통계_${today}.xlsx`)

                  toast.success('엑셀 파일이 다운로드되었습니다!')
                }}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold"
              >
                <Download className="w-4 h-4" />
                <span>엑셀 다운로드</span>
              </button>
            </div>

            {/* 팀장 목록 */}
            <div className="space-y-4">
              {users.filter(u => u.role === 'TEAM_LEADER').length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">등록된 팀장이 없습니다.</p>
                </div>
              ) : (
                users.filter(u => u.role === 'TEAM_LEADER').map(teamLeader => {
                  // 해당 팀장의 직추천 회원 찾기 (추천코드로)
                  const teamMembers = users.filter(u => u.referrerId === teamLeader.referralCode)

                  // 산하 총회원수 계산 (하위 팀장은 포함하지만, 그 팀장의 하위는 제외)
                  const getAllSubMembers = (referralCode: string): any[] => {
                    const directMembers = users.filter(u => u.referrerId === referralCode)
                    let allMembers = [...directMembers]
                    directMembers.forEach(member => {
                      // 팀장이면 그 팀장만 포함하고, 그 팀장의 하위는 탐색하지 않음
                      if (member.role !== 'TEAM_LEADER') {
                        allMembers = [...allMembers, ...getAllSubMembers(member.referralCode)]
                      }
                    })
                    return allMembers
                  }
                  const allSubMembers = getAllSubMembers(teamLeader.referralCode)
                  const totalSubMemberCount = allSubMembers.length

                  // 총 배당코인 매출
                  const totalSales = teamMembers.reduce((sum, member) => sum + member.dividendCoins, 0)

                  // 펼침/접힘 상태 확인
                  const isExpanded = expandedTeamLeaders.has(teamLeader.id)

                  // 토글 함수
                  const toggleExpand = () => {
                    setExpandedTeamLeaders(prev => {
                      const newSet = new Set(prev)
                      if (newSet.has(teamLeader.id)) {
                        newSet.delete(teamLeader.id)
                      } else {
                        newSet.add(teamLeader.id)
                      }
                      return newSet
                    })
                  }

                  return (
                    <div key={teamLeader.id} className="bg-gray-700/50 rounded-xl p-5 border border-gray-600">
                      {/* 팀장 정보 헤더 (클릭 가능) */}
                      <div
                        className="flex items-center justify-between mb-4 pb-4 border-b border-gray-600 cursor-pointer hover:bg-gray-700/30 transition rounded-lg p-2"
                        onClick={toggleExpand}
                      >
                        <div className="flex items-center">
                          <div className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center mr-4">
                            <Users className="w-6 h-6 text-yellow-400" />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-white flex items-center">
                              {teamLeader.name}
                              <span className="ml-2 px-2 py-1 bg-yellow-600 rounded text-xs font-semibold">팀장</span>
                            </h3>
                            <p className="text-sm text-gray-400">회원번호: #{teamLeader.memberNumber}</p>
                            <p className="text-sm text-gray-400">휴대폰: {teamLeader.phone}</p>
                          </div>
                        </div>

                        {/* 통계 요약 */}
                        <div className="text-right">
                          <div className="flex items-center space-x-4">
                            <div>
                              <p className="text-xs text-gray-400">산하총회원수</p>
                              <p className="text-2xl font-bold text-blue-400">{totalSubMemberCount}명</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-400">직추천한 회원</p>
                              <p className="text-2xl font-bold text-green-400">{teamMembers.length}명</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-400">총 매출 (배당코인)</p>
                              <p className="text-2xl font-bold text-yellow-400">{totalSales.toLocaleString()}개</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 직추천 회원 리스트 (펼쳐졌을 때만 표시) */}
                      {isExpanded && (teamMembers.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <p>직추천한 회원이 없습니다.</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <h4 className="text-sm font-semibold text-gray-300 mb-3">직추천한 회원 목록</h4>
                          <div className="bg-gray-800/50 rounded-lg overflow-hidden">
                            {/* 재귀적 회원 트리 렌더링 함수 */}
                            {(() => {
                              const renderMemberTree = (member: User, depth: number = 0): React.ReactNode[] => {
                                const subMembers = users.filter(u => u.referrerId === member.referralCode)
                                const referredCount = subMembers.length
                                const isMemberExpanded = expandedTeamLeaders.has(member.id)

                                const elements: React.ReactNode[] = []

                                // 현재 회원 행
                                elements.push(
                                  <div
                                    key={member.id}
                                    className="border-b border-gray-700 hover:bg-gray-700/30 transition"
                                    style={{ paddingLeft: `${depth * 20}px` }}
                                  >
                                    <div className="flex items-center px-4 py-3">
                                      {/* 들여쓰기 표시 */}
                                      {depth > 0 && (
                                        <span className="text-gray-600 mr-2">{'└─'}</span>
                                      )}

                                      {/* 이름 (클릭 가능) */}
                                      <div className="flex-1 grid grid-cols-7 gap-4 items-center">
                                        <div className="text-sm text-yellow-400 font-medium">#{member.memberNumber}</div>
                                        <div
                                          className={`text-sm ${referredCount > 0 ? 'text-blue-400 cursor-pointer hover:underline' : 'text-white'}`}
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            if (referredCount > 0) {
                                              setExpandedTeamLeaders(prev => {
                                                const newSet = new Set(prev)
                                                if (newSet.has(member.id)) {
                                                  newSet.delete(member.id)
                                                } else {
                                                  newSet.add(member.id)
                                                }
                                                return newSet
                                              })
                                            }
                                          }}
                                        >
                                          {referredCount > 0 && (isMemberExpanded ? '▼ ' : '▶ ')}
                                          {member.name}
                                        </div>
                                        <div className="text-sm text-gray-300">{member.phone}</div>
                                        <div className="text-sm text-green-400 font-bold text-right">{referredCount}명</div>
                                        <div className="text-sm text-yellow-400 font-bold text-right">{member.dividendCoins.toLocaleString()}개</div>
                                        <div className="text-sm text-blue-400 font-bold text-right">{member.securityCoins.toLocaleString()}개</div>
                                        <div className="text-sm text-gray-400">{member.createdAt}</div>
                                      </div>
                                    </div>
                                  </div>
                                )

                                // 하위 회원들 (펼쳐져 있을 때만)
                                if (isMemberExpanded && subMembers.length > 0) {
                                  subMembers.forEach(subMember => {
                                    elements.push(...renderMemberTree(subMember, depth + 1))
                                  })
                                }

                                return elements
                              }

                              return (
                                <div>
                                  {/* 헤더 */}
                                  <div className="bg-gray-700 px-4 py-3">
                                    <div className="grid grid-cols-7 gap-4 text-xs font-medium text-gray-300">
                                      <div>회원번호</div>
                                      <div>이름</div>
                                      <div>휴대폰</div>
                                      <div className="text-right">추천인수</div>
                                      <div className="text-right">배당코인</div>
                                      <div className="text-right">증권코인</div>
                                      <div>가입일</div>
                                    </div>
                                  </div>
                                  {/* 회원 트리 */}
                                  {teamMembers.map(member => renderMemberTree(member, 0))}
                                </div>
                              )
                            })()}
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )}

        {/* 회원 상세 정보 모달 */}
        {isDetailModalOpen && selectedUserDetail && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-2xl p-6 max-w-md w-full border border-gray-700 relative">
              {/* 닫기 버튼 */}
              <button
                onClick={closeDetailModal}
                className="absolute top-4 right-4 p-2 hover:bg-gray-700 rounded-lg transition"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>

              {/* 제목 */}
              <h2 className="text-xl font-bold text-white mb-6">선택된 회원 정보</h2>

              {/* 회원 정보 */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-400">이름</p>
                    <p className="text-lg font-semibold text-white">{selectedUserDetail.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">회원번호</p>
                    <p className="text-lg font-semibold text-yellow-400">#{selectedUserDetail.memberNumber}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-400">등급</p>
                  <p className="text-lg font-semibold text-blue-400">
                    {selectedUserDetail.role === 'ADMIN' ? '관리자' :
                     selectedUserDetail.role === 'TEAM_LEADER' ? '팀장' : '일반회원'}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-400">계정 상태</p>
                  <p className={`text-lg font-semibold ${
                    selectedUserDetail.status === 'BLOCKED' ? 'text-red-400' :
                    selectedUserDetail.status === 'DELETED' ? 'text-gray-500' :
                    'text-green-400'
                  }`}>
                    {selectedUserDetail.status === 'BLOCKED' ? '🚫 차단됨' :
                     selectedUserDetail.status === 'DELETED' ? '❌ 탈퇴' :
                     '✅ 정상'}
                  </p>
                </div>

                <div className="border-t border-gray-700 pt-4">
                  <p className="text-sm text-gray-400">휴대폰</p>
                  {isEditingUserInfo ? (
                    <input
                      type="text"
                      value={userEditForm.phone}
                      onChange={(e) => setUserEditForm({ ...userEditForm, phone: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                      placeholder="01012345678"
                    />
                  ) : (
                    <p className="text-base font-medium text-white">{selectedUserDetail.phone}</p>
                  )}
                </div>

                <div>
                  <p className="text-sm text-gray-400">주민등록번호</p>
                  {isEditingUserInfo ? (
                    <input
                      type="text"
                      value={userEditForm.idNumber}
                      onChange={(e) => setUserEditForm({ ...userEditForm, idNumber: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                      placeholder="900101-1"
                      maxLength={8}
                    />
                  ) : selectedUserDetail.idNumber ? (
                    <p className="text-base font-medium text-white">
                      {(() => {
                        const idNum = selectedUserDetail.idNumber
                        const parts = idNum.split('-')
                        if (parts.length === 2 && parts[1].length > 0) {
                          // 뒷자리 첫째 자리만 표시 (나머지는 * 처리)
                          return `${parts[0]}-${parts[1][0]}******`
                        }
                        return idNum
                      })()}
                    </p>
                  ) : (
                    <p className="text-base font-medium text-gray-500">없음</p>
                  )}
                </div>

                <div>
                  <p className="text-sm text-gray-400">비밀번호</p>
                  <p className="text-base font-medium text-yellow-400">{selectedUserDetail.password}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-400">가입일</p>
                  <p className="text-base font-medium text-white">
                    {selectedUserDetail.createdAt}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-400">추천인</p>
                  <p className="text-base font-medium text-white">
                    {(() => {
                      // referrerId는 USER ID 또는 추천코드일 수 있음
                      const referrer = selectedUserDetail.referrerId
                        ? users.find(u => u.id === selectedUserDetail.referrerId || u.referralCode === selectedUserDetail.referrerId)
                        : null
                      return referrer ? `${referrer.name} (회원번호: ${referrer.memberNumber})` : '없음'
                    })()}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-400">추천한 인원</p>
                  <p className="text-base font-medium text-green-400">
                    {users.filter(u => u.referrerId === selectedUserDetail.referralCode).length}명
                  </p>
                </div>

                <div className="border-t border-gray-700 pt-4 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-400">증권코인</p>
                    <p className="text-2xl font-bold text-blue-400">
                      {selectedUserDetail.securityCoins.toLocaleString()}개
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">배당코인</p>
                    <p className="text-2xl font-bold text-yellow-400">
                      {selectedUserDetail.dividendCoins.toLocaleString()}개
                    </p>
                  </div>
                </div>

                {/* 관리 버튼 */}
                {selectedUserDetail.role !== 'ADMIN' && (
                  <div className="border-t border-gray-700 pt-4 mt-4 space-y-3">
                    {/* 회원 정보 수정 버튼 */}
                    {isEditingUserInfo ? (
                      <div className="flex space-x-2">
                        <button
                          onClick={handleUpdateUserInfo}
                          className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
                        >
                          💾 저장
                        </button>
                        <button
                          onClick={() => {
                            setIsEditingUserInfo(false)
                            setUserEditForm({
                              phone: selectedUserDetail.phone || '',
                              idNumber: selectedUserDetail.idNumber || ''
                            })
                          }}
                          className="flex-1 px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition"
                        >
                          ❌ 취소
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setIsEditingUserInfo(true)}
                        className="w-full px-4 py-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-medium transition"
                      >
                        ✏️ 회원 정보 수정
                      </button>
                    )}

                    <button
                      onClick={() => handlePermanentlyDeleteUser(selectedUserDetail.id)}
                      className="w-full px-4 py-3 bg-red-900 hover:bg-red-950 text-white rounded-lg font-medium transition border-2 border-red-500"
                    >
                      ⚠️ 회원 영구 삭제
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 공지사항 작성 모달 */}
      {isNoticeModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl p-6 max-w-2xl w-full border border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center">
                <Bell className="w-6 h-6 mr-2 text-yellow-400" />
                새 공지사항 작성
              </h2>
              <button
                onClick={() => setIsNoticeModalOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              {/* 타입 선택 */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  공지사항 타입 *
                </label>
                <select
                  value={noticeForm.type}
                  onChange={(e) => setNoticeForm({ ...noticeForm, type: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                >
                  <option value="IMPORTANT">🔴 중요</option>
                  <option value="NOTICE">🟡 공지</option>
                  <option value="INFO">🔵 안내</option>
                  <option value="EVENT">🟢 이벤트</option>
                  <option value="UPDATE">🟣 업데이트</option>
                </select>
              </div>

              {/* 제목 */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  제목 *
                </label>
                <input
                  type="text"
                  value={noticeForm.title}
                  onChange={(e) => setNoticeForm({ ...noticeForm, title: e.target.value })}
                  placeholder="공지사항 제목을 입력하세요"
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  maxLength={100}
                />
              </div>

              {/* 내용 */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  내용 *
                </label>
                <textarea
                  value={noticeForm.content}
                  onChange={(e) => setNoticeForm({ ...noticeForm, content: e.target.value })}
                  placeholder="공지사항 내용을 입력하세요"
                  rows={6}
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-yellow-500 focus:border-transparent resize-none"
                  maxLength={1000}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {noticeForm.content.length} / 1000자
                </p>
              </div>

              {/* 알림 안내 */}
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                <p className="text-blue-400 text-sm">
                  📢 공지사항을 작성하면 모든 회원에게 실시간 알림이 전송됩니다.
                </p>
              </div>

              {/* 버튼 */}
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setIsNoticeModalOpen(false)
                    setEditingNoticeId(null)
                    setNoticeForm({ type: 'NOTICE', title: '', content: '' })
                  }}
                  className="flex-1 px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition"
                >
                  취소
                </button>
                <button
                  onClick={editingNoticeId ? handleUpdateNotice : handleCreateNotice}
                  className="flex-1 px-6 py-3 bg-yellow-500 text-gray-900 rounded-lg font-semibold hover:bg-yellow-400 transition"
                >
                  {editingNoticeId ? '수정 완료' : '작성하고 알림 전송'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
