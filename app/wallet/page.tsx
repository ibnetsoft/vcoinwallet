'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Wallet, Coins, TrendingUp, History, Copy, Share2, ArrowLeft, User as UserIcon, Lock, Mail, Phone, Users, Bell, ChevronDown, ChevronUp, ArrowRightLeft } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'
import LanguageSelector from '@/components/LanguageSelector'
import { useLanguage } from '@/contexts/LanguageContext'

export default function WalletPage() {
  const router = useRouter()
  const { t } = useLanguage()
  const [user, setUser] = useState<any>(null)
  const [transactions, setTransactions] = useState<any[]>([])
  const [referredUsers, setReferredUsers] = useState<any[]>([])
  const [isTeamLeader, setIsTeamLeader] = useState(false)
  const [teamStats, setTeamStats] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'wallet' | 'transactions' | 'referral' | 'notice' | 'mypage'>('wallet')
  const [expandedReferrals, setExpandedReferrals] = useState<Set<string>>(new Set())

  // 알림 관련 상태
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [showNotifications, setShowNotifications] = useState(false)

  // 공지사항 관련 상태
  const [notices, setNotices] = useState<any[]>([])
  const [expandedNoticeId, setExpandedNoticeId] = useState<string | null>(null)

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
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)
  const [withdrawConfirmText, setWithdrawConfirmText] = useState('')

  // 스왑 요청 관련 상태
  const [showSwapModal, setShowSwapModal] = useState(false)
  const [swapAmount, setSwapAmount] = useState('')
  const [swapRequests, setSwapRequests] = useState<any[]>([])
  const [isSwapLoading, setIsSwapLoading] = useState(false)

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

    // 알림 가져오기
    fetchNotifications(token)

    // 스왑 요청 목록 가져오기
    fetchSwapRequests(token)

    // 푸시 알림 구독 요청 (웹/네이티브 분기)
    initPushNotifications(token)

    setIsLoading(false)

    // 10초마다 알림 업데이트
    const notificationInterval = setInterval(() => {
      fetchNotifications(token)
    }, 10000)

    return () => clearInterval(notificationInterval)
  }, [router])

  // 공지사항 탭이 활성화될 때 공지사항 가져오기
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

  const fetchUserInfo = async (userId: string, token: string) => {
    try {
      const response = await fetch(`/api/user?userId=${userId}&t=${Date.now()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        cache: 'no-store'
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

  const fetchNotifications = async (token: string) => {
    try {
      const response = await fetch('/api/notifications', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications || [])
        setUnreadCount(data.unreadCount || 0)
      }
    } catch (error) {
      console.error('알림 가져오기 실패:', error)
    }
  }

  const fetchSwapRequests = async (token: string) => {
    try {
      const response = await fetch('/api/swap/my-requests', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setSwapRequests(data.requests || [])
      }
    } catch (error) {
      console.error('스왑 요청 목록 가져오기 실패:', error)
    }
  }

  const handleSwapRequest = async () => {
    const amount = parseInt(swapAmount)

    if (!amount || amount <= 0) {
      toast.error('유효한 수량을 입력해주세요.')
      return
    }

    if (amount > (user?.dividendCoins || 0)) {
      toast.error('배당코인이 부족합니다.')
      return
    }

    setIsSwapLoading(true)
    const token = localStorage.getItem('token')

    try {
      const response = await fetch('/api/swap/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ amount })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || '스왑 요청 실패')
      }

      toast.success(result.message)
      setShowSwapModal(false)
      setSwapAmount('')

      // 스왑 요청 목록 새로고침
      fetchSwapRequests(token!)
    } catch (error: any) {
      toast.error(error.message || '스왑 요청 중 오류가 발생했습니다.')
    } finally {
      setIsSwapLoading(false)
    }
  }

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ notificationId })
      })

      if (response.ok) {
        await fetchNotifications(token!)
      }
    } catch (error) {
      console.error('알림 읽음 처리 실패:', error)
    }
  }

  const markAllNotificationsAsRead = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ markAllAsRead: true })
      })

      if (response.ok) {
        await fetchNotifications(token!)
        toast.success('모든 알림을 읽음 처리했습니다.')
      }
    } catch (error) {
      console.error('알림 읽음 처리 실패:', error)
    }
  }

  // 푸시 알림 초기화 (웹/네이티브 분기)
  const initPushNotifications = async (authToken: string) => {
    // 네이티브 앱에서 전달받은 FCM 토큰 처리
    const saveFCMToken = async (fcmToken: string): Promise<boolean> => {
      if (!fcmToken || fcmToken.length < 10) {
        console.log('유효하지 않은 FCM 토큰')
        return false
      }

      // 이미 저장한 토큰인지 확인
      const savedToken = localStorage.getItem('fcm_token_saved')
      if (savedToken === fcmToken) {
        console.log('FCM 토큰 이미 저장됨, 스킵')
        // 네이티브에 알림
        // @ts-ignore
        if (typeof window.AndroidFCM?.tokenSaved === 'function') {
          // @ts-ignore
          window.AndroidFCM.tokenSaved()
        }
        return true
      }

      try {
        console.log('FCM 토큰 저장 시도:', fcmToken.substring(0, 30) + '...')
        const response = await fetch('/api/notifications/fcm-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({ fcmToken })
        })
        if (response.ok) {
          console.log('FCM 토큰 저장 성공!')
          localStorage.setItem('fcm_token_saved', fcmToken)
          // 네이티브에 저장 완료 알림
          // @ts-ignore
          if (typeof window.AndroidFCM?.tokenSaved === 'function') {
            // @ts-ignore
            window.AndroidFCM.tokenSaved()
          }
          return true
        } else {
          const errText = await response.text()
          console.error('FCM 토큰 저장 실패:', response.status, errText)
          return false
        }
      } catch (err) {
        console.error('FCM 토큰 저장 오류:', err)
        return false
      }
    }

    // 네이티브 앱 여부 확인 (Android WebView)
    // @ts-ignore
    const hasAndroidInterface = typeof window.AndroidFCM !== 'undefined'
    const isNativeApp = typeof window !== 'undefined' && (
      hasAndroidInterface ||
      // @ts-ignore
      window.IS_NATIVE_APP === true ||
      navigator.userAgent.includes('wv') ||
      (navigator.userAgent.includes('Android') && navigator.userAgent.includes('Version/'))
    )

    console.log('푸시 알림 초기화 시작')
    console.log('- AndroidFCM 인터페이스:', hasAndroidInterface)
    console.log('- 네이티브 앱:', isNativeApp)
    console.log('- User-Agent:', navigator.userAgent)

    // 콜백 등록 - 네이티브에서 호출할 수 있도록
    // @ts-ignore
    window.onFCMToken = async (token: string) => {
      console.log('onFCMToken 콜백 호출됨:', token?.substring(0, 20))
      await saveFCMToken(token)
    }

    // 이벤트 리스너 등록
    window.addEventListener('nativeFCMToken', async (event: any) => {
      console.log('nativeFCMToken 이벤트 수신')
      if (event.detail) {
        await saveFCMToken(event.detail)
      }
    })

    // 네이티브 앱인 경우: JavaScript Interface 또는 폴링으로 토큰 가져오기
    if (isNativeApp || navigator.userAgent.includes('Android')) {
      console.log('네이티브 앱 감지됨 - FCM 토큰 가져오기 시작')

      let pollCount = 0
      const maxPolls = 30 // 최대 30회 (15초간)
      let tokenSaved = false

      const pollForToken = async () => {
        if (tokenSaved) return

        // 방법 1: JavaScript Interface로 직접 가져오기
        // @ts-ignore
        if (typeof window.AndroidFCM?.getFCMToken === 'function') {
          try {
            // @ts-ignore
            const token = window.AndroidFCM.getFCMToken()
            if (token && token.length > 10) {
              console.log('AndroidFCM.getFCMToken()으로 토큰 획득!')
              const saved = await saveFCMToken(token)
              if (saved) {
                tokenSaved = true
                console.log('JavaScript Interface로 FCM 토큰 저장 완료')
                return
              }
            }
          } catch (e) {
            console.error('AndroidFCM.getFCMToken() 오류:', e)
          }
        }

        // 방법 2: window 변수에서 가져오기
        // @ts-ignore
        const nativeToken = window.NATIVE_FCM_TOKEN || window.FCM_TOKEN
        if (nativeToken && nativeToken.length > 10) {
          console.log('window 변수에서 FCM 토큰 발견!')
          const saved = await saveFCMToken(nativeToken)
          if (saved) {
            tokenSaved = true
            console.log('window 변수로 FCM 토큰 저장 완료')
            return
          }
        }

        pollCount++
        if (pollCount < maxPolls) {
          setTimeout(pollForToken, 500) // 0.5초마다 체크
        } else {
          console.log('FCM 토큰 폴링 종료 (토큰 없음)')
        }
      }

      // 즉시 시작 + 2초 후 재시도
      pollForToken()
      setTimeout(pollForToken, 2000)
      setTimeout(pollForToken, 5000)
    } else {
      // 웹 브라우저: 웹 푸시
      requestPushNotificationPermission(authToken)
    }
  }

  const requestPushNotificationPermission = async (token: string) => {
    try {
      // 브라우저가 푸시 알림을 지원하는지 확인
      if (!('Notification' in window) || !('serviceWorker' in navigator)) {
        console.log('이 브라우저는 푸시 알림을 지원하지 않습니다.')
        return
      }

      // 이미 권한이 거부된 경우
      if (Notification.permission === 'denied') {
        console.log('푸시 알림 권한이 거부되었습니다.')
        return
      }

      // 이미 권한이 허용된 경우, 구독 진행
      if (Notification.permission === 'granted') {
        await subscribeToPushNotifications(token)
        return
      }

      // 권한 요청
      const permission = await Notification.requestPermission()

      if (permission === 'granted') {
        await subscribeToPushNotifications(token)
      }
    } catch (error) {
      console.error('푸시 알림 권한 요청 실패:', error)
    }
  }

  const subscribeToPushNotifications = async (token: string) => {
    try {
      // Service Worker 등록
      const registration = await navigator.serviceWorker.register('/service-worker.js')

      // 구독 확인
      let subscription = await registration.pushManager.getSubscription()

      if (!subscription) {
        // 새로운 구독 생성
        const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

        if (!vapidPublicKey) {
          console.error('VAPID public key가 설정되지 않았습니다.')
          return
        }

        try {
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
          })
        } catch (subscribeError: any) {
          // 푸시 서비스 연결 실패는 무시 (네트워크/브라우저 환경 문제)
          if (subscribeError.name === 'AbortError') {
            console.log('푸시 서비스 연결 실패 - 나중에 다시 시도됩니다.')
            return
          }
          throw subscribeError
        }
      }

      // 서버에 구독 정보 저장
      await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ subscription })
      })

      console.log('푸시 알림 구독 완료')
    } catch (error) {
      console.error('푸시 알림 구독 실패:', error)
    }
  }

  // VAPID public key를 Uint8Array로 변환
  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4)
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/')

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
  }

  // 공지사항 가져오기
  const fetchNotices = async () => {
    try {
      const response = await fetch('/api/notices')

      if (response.ok) {
        const data = await response.json()
        setNotices(data.notices || [])
      }
    } catch (error) {
      console.error('공지사항 가져오기 실패:', error)
    }
  }

  const copyReferralCode = () => {
    if (user?.referralCode) {
      const referralUrl = `${window.location.origin}/signup?ref=${user.referralCode}`
      navigator.clipboard.writeText(referralUrl)
      toast.success('추천 링크가 복사되었습니다!')
    }
  }

  const toggleReferralExpand = (userId: string) => {
    const newExpanded = new Set(expandedReferrals)
    if (newExpanded.has(userId)) {
      newExpanded.delete(userId)
    } else {
      newExpanded.add(userId)
    }
    setExpandedReferrals(newExpanded)
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
    toast.success(t('common.logout'))
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

  const handleWithdraw = async () => {
    if (withdrawConfirmText !== t('profile.withdrawConfirmKeyword')) {
      toast.error(t('profile.withdrawConfirmError'))
      return
    }

    const token = localStorage.getItem('token')

    try {
      const response = await fetch('/api/user/withdraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || '회원 탈퇴 실패')
      }

      // 로컬 스토리지 삭제
      localStorage.removeItem('token')
      localStorage.removeItem('user')

      toast.success('회원 탈퇴가 완료되었습니다.')

      // 로그인 페이지로 이동
      setTimeout(() => {
        router.push('/login')
      }, 1500)

    } catch (error: any) {
      toast.error(error.message || '회원 탈퇴 중 오류가 발생했습니다.')
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
      <header className="border-b border-gray-700 bg-gray-800/50 backdrop-blur-sm sticky top-0 z-40 pt-[max(22px,env(safe-area-inset-top))]">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/')}
                className="p-2 hover:bg-gray-700 rounded-lg transition"
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>
              <h1 className="text-xl font-bold text-white">{t('wallet.myWallet')}</h1>
            </div>
            <div className="flex items-center space-x-2">
              {/* 언어 선택 */}
              <LanguageSelector />

              {/* 알림 아이콘 */}
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 hover:bg-gray-700 rounded-lg transition relative"
              >
                <Bell className="w-5 h-5 text-white" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 알림 드롭다운 - 헤더 밖으로 이동 */}
      {showNotifications && (
        <>
          {/* 배경 오버레이 */}
          <div
            className="fixed inset-0 bg-black/80 z-[9998]"
            onClick={() => setShowNotifications(false)}
          ></div>

          {/* 알림 팝업 */}
          <div className="fixed left-4 right-4 sm:left-auto sm:right-4 top-20 w-auto sm:w-96 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-[9999] max-h-96 overflow-y-auto">
                    <div className="p-4 border-b border-gray-700 flex items-center justify-between bg-gray-900">
                      <h3 className="text-white font-semibold">{t('notification.notifications')}</h3>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllNotificationsAsRead}
                          className="text-xs text-yellow-400 hover:text-yellow-300"
                        >
                          {t('notification.markAllAsRead')}
                        </button>
                      )}
                    </div>

                    {notifications.filter(n => !n.isRead).length === 0 ? (
                      <div className="p-8 text-center text-gray-400 bg-gray-900">
                        {t('notification.noNotifications')}
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-700">
                        {notifications.filter(n => !n.isRead).map((notification) => (
                          <div
                            key={notification.id}
                            onClick={() => {
                              markNotificationAsRead(notification.id)
                            }}
                            className="p-4 hover:bg-gray-800 cursor-pointer transition bg-gray-900"
                          >
                            <div className="flex items-start space-x-3">
                              <div className="w-2 h-2 rounded-full mt-2 bg-yellow-400"></div>
                              <div className="flex-1">
                                <h4 className="text-white font-medium text-sm">{notification.title}</h4>
                                <p className="text-gray-300 text-sm mt-1">{notification.message}</p>
                                <p className="text-gray-500 text-xs mt-2">
                                  {new Date(notification.createdAt).toLocaleString('ko-KR')}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
          </div>
        </>
      )}

      {/* 탭 메뉴 */}
      <div className="container mx-auto px-4 pt-6 max-w-4xl">
        <div className="flex justify-center items-center gap-2 sm:gap-4 border-b border-gray-700">
          <button
            onClick={() => setActiveTab('wallet')}
            className={`flex-1 sm:flex-none px-4 sm:px-6 py-3 font-semibold transition-colors relative ${
              activeTab === 'wallet'
                ? 'text-yellow-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            <div className="flex flex-col sm:flex-row items-center sm:space-x-2">
              <Wallet className="w-5 h-5" />
              <span className="text-xs sm:text-base mt-1 sm:mt-0">{t('wallet.title')}</span>
            </div>
            {activeTab === 'wallet' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-yellow-400"></div>
            )}
          </button>

          <button
            onClick={() => setActiveTab('transactions')}
            className={`flex-1 sm:flex-none px-4 sm:px-6 py-3 font-semibold transition-colors relative ${
              activeTab === 'transactions'
                ? 'text-yellow-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            <div className="flex flex-col sm:flex-row items-center sm:space-x-2">
              <History className="w-5 h-5" />
              <span className="text-xs sm:text-base mt-1 sm:mt-0">{t('wallet.transaction')}</span>
            </div>
            {activeTab === 'transactions' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-yellow-400"></div>
            )}
          </button>

          <button
            onClick={() => setActiveTab('referral')}
            className={`flex-1 sm:flex-none px-4 sm:px-6 py-3 font-semibold transition-colors relative ${
              activeTab === 'referral'
                ? 'text-yellow-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            <div className="flex flex-col sm:flex-row items-center sm:space-x-2">
              <Users className="w-5 h-5" />
              <span className="text-xs sm:text-base mt-1 sm:mt-0">{t('referral.title')}</span>
            </div>
            {activeTab === 'referral' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-yellow-400"></div>
            )}
          </button>

          <button
            onClick={() => setActiveTab('notice')}
            className={`flex-1 sm:flex-none px-4 sm:px-6 py-3 font-semibold transition-colors relative ${
              activeTab === 'notice'
                ? 'text-yellow-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            <div className="flex flex-col sm:flex-row items-center sm:space-x-2">
              <Bell className="w-5 h-5" />
              <span className="text-xs sm:text-base mt-1 sm:mt-0">{t('home.notice')}</span>
            </div>
            {activeTab === 'notice' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-yellow-400"></div>
            )}
          </button>

          <button
            onClick={() => setActiveTab('mypage')}
            className={`flex-1 sm:flex-none px-4 sm:px-6 py-3 font-semibold transition-colors relative ${
              activeTab === 'mypage'
                ? 'text-yellow-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            <div className="flex flex-col sm:flex-row items-center sm:space-x-2">
              <UserIcon className="w-5 h-5" />
              <span className="text-xs sm:text-base mt-1 sm:mt-0">{t('profile.title')}</span>
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
              <p className="text-sm opacity-80">{t('common.info')}!</p>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold">{user?.name}</h2>
                {user?.role === 'TEAM_LEADER' && (
                  <span className="flex items-center gap-1 px-2 py-1 bg-yellow-600 rounded-lg text-sm font-semibold">
                    ⭐ {t('admin.role')}
                  </span>
                )}
              </div>
              <p className="text-sm opacity-80">{user?.email}</p>
            </div>
            <Wallet className="w-12 h-12 opacity-20" />
          </div>
          
          {/* 추천 코드 */}
          <div className="bg-black/20 rounded-lg p-3 flex items-center justify-between">
            <div>
              <p className="text-xs opacity-80">{t('referral.myReferralCode')}</p>
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
                  <p className="text-sm text-gray-400">{t('wallet.securityCoins')}</p>
                  <p className="text-xs text-gray-500">Security Coins</p>
                </div>
              </div>
            </div>
            <div className="text-3xl font-bold text-white">
              {user?.securityCoins?.toLocaleString() || 0}
              <span className="text-sm text-gray-400 ml-2">{t('wallet.pieces')}</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {t('wallet.companyProfit')}
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
                  <p className="text-sm text-gray-400">{t('wallet.dividendCoins')}</p>
                  <p className="text-xs text-gray-500">Dividend Coins</p>
                </div>
              </div>
            </div>
            <div className="text-3xl font-bold text-white">
              {user?.dividendCoins?.toLocaleString() || 0}
              <span className="text-sm text-gray-400 ml-2">{t('wallet.pieces')}</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {t('wallet.yearlyReturn')}
            </p>
            {/* 스왑 요청 버튼 */}
            <button
              onClick={() => setShowSwapModal(true)}
              className="mt-4 w-full px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-gray-900 rounded-lg hover:from-yellow-400 hover:to-orange-400 transition font-semibold flex items-center justify-center"
            >
              <ArrowRightLeft className="w-4 h-4 mr-2" />
              {t('wallet.swapRequest')}
            </button>
          </div>
        </div>

        {/* 스왑 요청 현황 */}
        {swapRequests.length > 0 && (
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700 mb-8">
            <div className="flex items-center mb-4">
              <ArrowRightLeft className="w-6 h-6 text-orange-400 mr-2" />
              <h3 className="text-lg font-semibold text-white">스왑 요청 현황</h3>
            </div>
            <div className="space-y-3">
              {swapRequests.slice(0, 3).map((req, index) => {
                const statusColors: Record<string, string> = {
                  'PENDING': 'bg-yellow-500/20 text-yellow-400',
                  'APPROVED': 'bg-green-500/20 text-green-400',
                  'REJECTED': 'bg-red-500/20 text-red-400'
                }
                const statusLabels: Record<string, string> = {
                  'PENDING': '대기중',
                  'APPROVED': '승인됨',
                  'REJECTED': '거절됨'
                }
                return (
                  <div key={req.id || index} className="flex items-center justify-between py-3 border-b border-gray-700 last:border-b-0">
                    <div>
                      <p className="text-sm font-medium text-white">
                        배당코인 {req.amount.toLocaleString()}개 → 증권코인
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(req.created_at).toLocaleDateString('ko-KR')}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[req.status]}`}>
                      {statusLabels[req.status]}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

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
              <h3 className="text-lg font-semibold text-white">{t('wallet.transactionHistory')}</h3>
            </div>
            <button
              onClick={() => setActiveTab('transactions')}
              className="text-sm text-yellow-400 hover:text-yellow-300 transition"
            >
              {t('wallet.viewAll')} →
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
                      <p className="text-xs text-gray-500">{tx.coinType === 'SECURITY' ? t('wallet.securityCoins') : t('wallet.dividendCoins')}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">{t('wallet.noTransactions')}</p>
            </div>
          )}
        </div>

        {/* 추천 유도 */}
        <div className="mt-8 bg-gradient-to-r from-purple-500/10 to-purple-600/10 rounded-2xl p-6 border border-purple-500/30">
          <h3 className="text-lg font-semibold text-purple-400 mb-2">🎁 {t('wallet.inviteBonus')}</h3>
          <p className="text-sm text-gray-300 mb-4">
            {t('wallet.inviteBonusDesc')}
          </p>
          <button
            onClick={shareReferralLink}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition flex items-center"
          >
            <Share2 className="w-4 h-4 mr-2" />
            {t('wallet.shareReferralLink')}
          </button>
        </div>
          </div>
        )}

        {/* 거래내역 탭 내용 */}
        {activeTab === 'transactions' && (
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700 min-h-[800px]">
              <div className="flex items-center mb-6">
                <History className="w-6 h-6 text-yellow-400 mr-2" />
                <h2 className="text-xl font-bold text-white">{t('wallet.fullTransactionHistory')}</h2>
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
                              {tx.coinType === 'SECURITY' ? t('wallet.securityCoins') : t('wallet.dividendCoins')}
                            </span>
                            <span className={`text-xs px-2 py-1 rounded ${
                              tx.type === 'SIGNUP_BONUS' ? 'bg-green-500/20 text-green-400' :
                              tx.type === 'REFERRAL_BONUS' ? 'bg-purple-500/20 text-purple-400' :
                              tx.type === 'ADMIN_GRANT' ? 'bg-orange-500/20 text-orange-400' :
                              'bg-gray-500/20 text-gray-400'
                            }`}>
                              {tx.type === 'SIGNUP_BONUS' ? t('wallet.signupBonus') :
                               tx.type === 'REFERRAL_BONUS' ? t('referral.referralBonus') :
                               tx.type === 'ADMIN_GRANT' ? t('admin.grantCoins') :
                               tx.type}
                            </span>
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <p className={`text-lg font-bold ${tx.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-500">{t('wallet.balanceLabel')} {tx.balance.toLocaleString()}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <History className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">{t('wallet.noTransactions')}</p>
                  <p className="text-sm text-gray-500 mt-2">{t('wallet.noTransactionsDesc')}</p>
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
                  <h2 className="text-2xl font-bold mb-2">{t('wallet.inviteBonus')}</h2>
                  <p className="text-sm opacity-90">{t('wallet.inviteBonusDesc').split('\n')[0]}</p>
                </div>
                <Users className="w-12 h-12 opacity-20" />
              </div>

              <div className="bg-white/20 rounded-lg p-4 backdrop-blur-sm">
                <p className="text-xs opacity-80 mb-2">{t('wallet.myReferralCode')}</p>
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
                      <span>{t('wallet.share')}</span>
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
                  <h3 className="text-lg font-semibold text-white">{t('referral.directReferrals')}</h3>
                </div>
                <p className="text-4xl font-bold text-green-400">{referredUsers.length}{t('wallet.people')}</p>
              </div>

              <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
                <div className="flex items-center mb-3">
                  <Coins className="w-6 h-6 text-blue-400 mr-2" />
                  <h3 className="text-lg font-semibold text-white">{t('referral.receivedBonus')}</h3>
                </div>
                <p className="text-4xl font-bold text-blue-400">{(referredUsers.length * 1000).toLocaleString()}{t('wallet.pieces')}</p>
                <p className="text-xs text-gray-500 mt-2">{t('wallet.securityCoins')}</p>
              </div>
            </div>

            {/* 추천한 회원 목록 - 트리 구조 */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
              <div className="flex items-center mb-6">
                <Users className="w-6 h-6 text-yellow-400 mr-2" />
                <h2 className="text-xl font-bold text-white">{t('referral.referredList')}</h2>
              </div>

              {referredUsers.length > 0 ? (
                <div className="space-y-2">
                  {referredUsers.map((referredUser, index) => {
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
                    const currentRole: string = referredUser.role || 'USER'
                    const isExpanded = expandedReferrals.has(referredUser.id)
                    const hasSubReferrals = referredUser.referrals && referredUser.referrals.length > 0

                    return (
                      <div key={referredUser.id || index} className="border border-gray-700 rounded-lg">
                        {/* 1단계: 직접 추천한 회원 */}
                        <div className="flex items-center justify-between p-4 bg-gray-800/30 hover:bg-gray-800/50 transition">
                          <div className="flex items-center flex-1">
                            {/* 펼치기/접기 버튼 */}
                            {hasSubReferrals && (
                              <button
                                onClick={() => toggleReferralExpand(referredUser.id)}
                                className="mr-2 p-1 hover:bg-gray-700 rounded transition"
                              >
                                {isExpanded ? (
                                  <ChevronDown className="w-4 h-4 text-yellow-400" />
                                ) : (
                                  <ChevronUp className="w-4 h-4 text-gray-400" />
                                )}
                              </button>
                            )}
                            {!hasSubReferrals && <div className="w-6 mr-2"></div>}

                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-1">
                                <span className="text-xs text-purple-400 font-semibold">직접</span>
                                <p className="text-sm font-medium text-white">{referredUser.name}</p>
                                <span className={`text-xs px-2 py-1 rounded ${roleColors[currentRole]}`}>
                                  {roleLabels[currentRole]}
                                </span>
                                {hasSubReferrals && (
                                  <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded">
                                    하위 {referredUser.referrals.length}명
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center space-x-3">
                                <p className="text-xs text-gray-400">{referredUser.phone}</p>
                                <p className="text-xs text-gray-500">회원번호: #{referredUser.memberNumber}</p>
                                <p className="text-xs text-gray-500">가입일: {referredUser.createdAt}</p>
                              </div>
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

                        {/* 2단계: 간접 추천한 회원들 (하위 추천) */}
                        {isExpanded && hasSubReferrals && (
                          <div className="bg-gray-900/50 border-t border-gray-700">
                            {referredUser.referrals.map((subUser: any, subIndex: number) => {
                              const subRole: string = subUser.role || 'USER'
                              return (
                                <div key={subUser.id || subIndex} className="flex items-center justify-between p-4 pl-12 border-b border-gray-700/50 last:border-b-0 hover:bg-gray-800/30 transition">
                                  <div className="flex items-center flex-1">
                                    <div className="w-4 h-4 border-l-2 border-b-2 border-gray-600 mr-2"></div>
                                    <div className="flex-1">
                                      <div className="flex items-center space-x-3 mb-1">
                                        <span className="text-xs text-blue-400 font-semibold">간접</span>
                                        <p className="text-sm font-medium text-white">{subUser.name}</p>
                                        <span className={`text-xs px-2 py-1 rounded ${roleColors[subRole]}`}>
                                          {roleLabels[subRole]}
                                        </span>
                                      </div>
                                      <div className="flex items-center space-x-3">
                                        <p className="text-xs text-gray-400">{subUser.phone}</p>
                                        <p className="text-xs text-gray-500">회원번호: #{subUser.memberNumber}</p>
                                        <p className="text-xs text-gray-500">가입일: {subUser.createdAt}</p>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="text-right ml-4">
                                    <div className="flex items-center space-x-4">
                                      <div>
                                        <p className="text-xs text-gray-500">증권코인</p>
                                        <p className="text-sm font-semibold text-blue-400">{subUser.securityCoins.toLocaleString()}개</p>
                                      </div>
                                      <div>
                                        <p className="text-xs text-gray-500">배당코인</p>
                                        <p className="text-sm font-semibold text-yellow-400">{subUser.dividendCoins.toLocaleString()}개</p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">{t('referral.noReferrals')}</p>
                  <p className="text-sm text-gray-500 mt-2">{t('referral.noReferralsDesc')}</p>
                  <button
                    onClick={shareReferralLink}
                    className="mt-4 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition flex items-center mx-auto"
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    {t('wallet.shareReferralLink')}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 공지사항 탭 내용 */}
        {activeTab === 'notice' && (
          <div className="min-h-[800px]">
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
          </div>
        )}

        {/* 마이페이지 탭 내용 */}
        {activeTab === 'mypage' && (
          <div className="min-h-[800px]">
            {/* 그룹장 관리 버튼 */}
            {user?.role === 'GROUP_LEADER' && (
              <div className="mb-6">
                <button
                  onClick={() => router.push('/group-leader')}
                  className="w-full py-4 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition"
                >
                  <Users className="w-6 h-6" />
                  그룹장 관리 페이지
                </button>
              </div>
            )}

            {/* 내 정보 카드 */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700 mb-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white flex items-center">
                  <UserIcon className="w-6 h-6 mr-2 text-yellow-400" />
                  {t('profile.myProfile')}
                </h2>
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 bg-yellow-500 text-gray-900 rounded-lg hover:bg-yellow-400 transition font-semibold"
                  >
                    {t('profile.editProfile')}
                  </button>
                )}
              </div>

              {!isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-400">{t('profile.name')}</label>
                    <p className="text-white font-medium">{user?.name}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">{t('profile.phone')}</label>
                    <p className="text-white font-medium">{user?.phone}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">{t('profile.email')}</label>
                    <p className="text-white font-medium">{user?.email || '미등록'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">{t('profile.idNumber')}</label>
                    <p className="text-white font-medium font-mono">
                      {user?.idNumber
                        ? `${user.idNumber.substring(0, 6)}-${user.idNumber.substring(7, 8)}******`
                        : '미등록'
                      }
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">{t('profile.referralCode')}</label>
                    <p className="text-yellow-400 font-mono font-bold text-lg">{user?.referralCode}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">{t('profile.memberNumber')}</label>
                    <p className="text-white font-medium">#{user?.memberNumber}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">{t('profile.joinDate')}</label>
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
                      {t('common.save')}
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
                      {t('common.cancel')}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 로그아웃 버튼 */}
            <button
              onClick={handleLogout}
              className="w-full px-4 py-3 bg-yellow-500 text-gray-900 rounded-lg hover:bg-yellow-400 transition font-semibold flex items-center justify-center space-x-2 mb-4"
              title="로그아웃"
            >
              <svg
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" strokeLinecap="round" strokeLinejoin="round"/>
                <polyline points="16 17 21 12 16 7" strokeLinecap="round" strokeLinejoin="round"/>
                <line x1="21" y1="12" x2="9" y2="12" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>{t('common.logout')}</span>
            </button>

            {/* 회원탈퇴 버튼 */}
            <button
              onClick={() => setShowWithdrawModal(true)}
              className="w-full px-4 py-3 bg-red-600/20 border border-red-500/50 text-red-400 rounded-lg hover:bg-red-600/30 transition font-semibold flex items-center justify-center space-x-2"
              title={t('profile.withdraw')}
            >
              <svg
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="8.5" cy="7" r="4" strokeLinecap="round" strokeLinejoin="round"/>
                <line x1="18" y1="8" x2="23" y2="13" strokeLinecap="round" strokeLinejoin="round"/>
                <line x1="23" y1="8" x2="18" y2="13" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>{t('profile.withdraw')}</span>
            </button>
          </div>
        )}
      </div>

      {/* 회원탈퇴 확인 모달 */}
      {showWithdrawModal && (
        <>
          {/* 배경 오버레이 */}
          <div
            className="fixed inset-0 bg-black/80 z-[9998]"
            onClick={() => {
              setShowWithdrawModal(false)
              setWithdrawConfirmText('')
            }}
          ></div>

          {/* 모달 */}
          <div className="fixed left-4 right-4 sm:left-1/2 sm:right-auto top-1/2 -translate-y-1/2 sm:-translate-x-1/2 w-auto sm:w-[500px] bg-gray-900 border border-red-500/50 rounded-xl shadow-xl z-[9999] p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-red-400"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <circle cx="12" cy="12" r="10" strokeLinecap="round" strokeLinejoin="round"/>
                  <line x1="12" y1="8" x2="12" y2="12" strokeLinecap="round" strokeLinejoin="round"/>
                  <line x1="12" y1="16" x2="12.01" y2="16" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">회원 탈퇴</h3>
              <p className="text-sm text-gray-400">정말로 탈퇴하시겠습니까?</p>
            </div>

            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
              <h4 className="text-red-400 font-semibold mb-2 flex items-center">
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" strokeLinecap="round" strokeLinejoin="round"/>
                  <line x1="12" y1="9" x2="12" y2="13" strokeLinecap="round" strokeLinejoin="round"/>
                  <line x1="12" y1="17" x2="12.01" y2="17" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                주의사항
              </h4>
              <ul className="text-sm text-gray-300 space-y-2">
                <li className="flex items-start">
                  <span className="text-red-400 mr-2">•</span>
                  <span>탈퇴 시 모든 보유 코인이 소멸되며 복구할 수 없습니다.</span>
                </li>
                <li className="flex items-start">
                  <span className="text-red-400 mr-2">•</span>
                  <span>거래 내역 및 추천 정보가 모두 삭제됩니다.</span>
                </li>
                <li className="flex items-start">
                  <span className="text-red-400 mr-2">•</span>
                  <span>동일한 정보로 재가입이 제한될 수 있습니다.</span>
                </li>
                <li className="flex items-start">
                  <span className="text-red-400 mr-2">•</span>
                  <span>탈퇴 후 7일간 계정 복구가 가능합니다.</span>
                </li>
              </ul>
            </div>

            <div className="mb-6">
              <label className="block text-sm text-gray-300 mb-2">
                {t('profile.withdrawConfirmMessage')} <span className="text-red-400 font-bold">"{t('profile.withdrawConfirmKeyword')}"</span>를 입력해주세요.
              </label>
              <input
                type="text"
                value={withdrawConfirmText}
                onChange={(e) => setWithdrawConfirmText(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-red-500 focus:outline-none"
                placeholder={t('profile.withdrawConfirmPlaceholder')}
                autoFocus
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowWithdrawModal(false)
                  setWithdrawConfirmText('')
                }}
                className="flex-1 px-4 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition font-semibold"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleWithdraw}
                disabled={withdrawConfirmText !== t('profile.withdrawConfirmKeyword')}
                className={`flex-1 px-4 py-3 rounded-lg transition font-semibold ${
                  withdrawConfirmText === t('profile.withdrawConfirmKeyword')
                    ? 'bg-red-600 text-white hover:bg-red-500'
                    : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                }`}
              >
                {t('profile.withdrawButton')}
              </button>
            </div>
          </div>
        </>
      )}

      {/* 스왑 요청 모달 */}
      {showSwapModal && (
        <>
          {/* 배경 오버레이 */}
          <div
            className="fixed inset-0 bg-black/80 z-[9998]"
            onClick={() => {
              setShowSwapModal(false)
              setSwapAmount('')
            }}
          ></div>

          {/* 모달 */}
          <div className="fixed left-4 right-4 sm:left-1/2 sm:right-auto top-1/2 -translate-y-1/2 sm:-translate-x-1/2 w-auto sm:w-[500px] bg-gray-900 border border-orange-500/50 rounded-xl shadow-xl z-[9999] p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <ArrowRightLeft className="w-8 h-8 text-orange-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">스왑 요청</h3>
              <p className="text-sm text-gray-400">배당코인을 증권코인으로 전환 요청합니다</p>
            </div>

            <div className="bg-gray-800/50 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">보유 배당코인</span>
                <span className="text-lg font-bold text-yellow-400">{user?.dividendCoins?.toLocaleString() || 0}개</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">스왑 비율</span>
                <span className="text-sm text-green-400">1:1 (배당코인 → 증권코인)</span>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm text-gray-300 mb-2">
                스왑할 배당코인 수량
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={swapAmount}
                  onChange={(e) => setSwapAmount(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-orange-500 focus:outline-none"
                  placeholder="수량 입력"
                  min="1"
                  max={user?.dividendCoins || 0}
                />
                <button
                  onClick={() => setSwapAmount(String(user?.dividendCoins || 0))}
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 bg-orange-500/20 text-orange-400 rounded text-sm hover:bg-orange-500/30 transition"
                >
                  전액
                </button>
              </div>
              {swapAmount && parseInt(swapAmount) > 0 && (
                <p className="text-sm text-green-400 mt-2">
                  → 증권코인 {parseInt(swapAmount).toLocaleString()}개로 전환됩니다
                </p>
              )}
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-6">
              <p className="text-sm text-yellow-400">
                스왑 요청은 관리자 승인 후 처리됩니다. 승인되면 알림을 받게 됩니다.
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowSwapModal(false)
                  setSwapAmount('')
                }}
                className="flex-1 px-4 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition font-semibold"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleSwapRequest}
                disabled={!swapAmount || parseInt(swapAmount) <= 0 || parseInt(swapAmount) > (user?.dividendCoins || 0) || isSwapLoading}
                className={`flex-1 px-4 py-3 rounded-lg transition font-semibold ${
                  swapAmount && parseInt(swapAmount) > 0 && parseInt(swapAmount) <= (user?.dividendCoins || 0) && !isSwapLoading
                    ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-gray-900 hover:from-yellow-400 hover:to-orange-400'
                    : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                }`}
              >
                {isSwapLoading ? '요청 중...' : '스왑 요청'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
