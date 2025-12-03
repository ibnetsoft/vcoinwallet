'use client'

import { useEffect, useState } from 'react'

export default function FCMTokenHandler() {
  const [debug, setDebug] = useState<string[]>([])

  const addLog = (msg: string) => {
    console.log('[FCM]', msg)
    setDebug(prev => [...prev.slice(-20), `${new Date().toLocaleTimeString()}: ${msg}`])
  }

  useEffect(() => {
    if (typeof window === 'undefined') return

    addLog('FCMTokenHandler 시작')

    // FCM 토큰 저장 함수
    const saveFCMToken = async (fcmToken: string) => {
      if (!fcmToken || fcmToken.length < 10) {
        addLog('유효하지 않은 토큰')
        return false
      }

      // 이미 저장한 토큰인지 확인
      const savedToken = localStorage.getItem('fcm_token_saved')
      if (savedToken === fcmToken) {
        addLog('이미 저장된 토큰')
        // @ts-ignore
        if (typeof window.AndroidFCM?.tokenSaved === 'function') {
          // @ts-ignore
          window.AndroidFCM.tokenSaved()
        }
        return true
      }

      // 인증 토큰 가져오기
      const authToken = localStorage.getItem('token')
      if (!authToken) {
        addLog('인증 토큰 없음 - 나중에 저장')
        // 인증 토큰이 없으면 FCM 토큰만 임시 저장
        localStorage.setItem('pending_fcm_token', fcmToken)
        return false
      }

      try {
        addLog('API 호출: ' + fcmToken.substring(0, 20) + '...')
        const response = await fetch('/api/notifications/fcm-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({ fcmToken })
        })

        if (response.ok) {
          addLog('저장 성공!')
          localStorage.setItem('fcm_token_saved', fcmToken)
          localStorage.removeItem('pending_fcm_token')
          // @ts-ignore
          if (typeof window.AndroidFCM?.tokenSaved === 'function') {
            // @ts-ignore
            window.AndroidFCM.tokenSaved()
          }
          return true
        } else {
          const errText = await response.text()
          addLog('저장 실패: ' + response.status + ' ' + errText)
          return false
        }
      } catch (err: any) {
        addLog('오류: ' + err.message)
        return false
      }
    }

    // 콜백 등록
    // @ts-ignore
    window.onFCMToken = async (token: string) => {
      addLog('onFCMToken 콜백')
      await saveFCMToken(token)
    }

    // 이벤트 리스너
    const handleFCMEvent = async (event: any) => {
      addLog('nativeFCMToken 이벤트')
      if (event.detail) {
        await saveFCMToken(event.detail)
      }
    }
    window.addEventListener('nativeFCMToken', handleFCMEvent)

    // 폴링 시작
    let tokenSaved = false
    let pollCount = 0
    const maxPolls = 60 // 30초간

    const pollForToken = async () => {
      if (tokenSaved) return

      // 방법 1: JavaScript Interface
      // @ts-ignore
      if (typeof window.AndroidFCM?.getFCMToken === 'function') {
        try {
          // @ts-ignore
          const token = window.AndroidFCM.getFCMToken()
          if (token && token.length > 10) {
            addLog('Interface로 토큰 획득')
            const saved = await saveFCMToken(token)
            if (saved) {
              tokenSaved = true
              return
            }
          }
        } catch (e: any) {
          addLog('Interface 오류: ' + e.message)
        }
      }

      // 방법 2: window 변수
      // @ts-ignore
      const nativeToken = window.NATIVE_FCM_TOKEN || window.FCM_TOKEN
      if (nativeToken && nativeToken.length > 10) {
        addLog('window 변수로 토큰 획득')
        const saved = await saveFCMToken(nativeToken)
        if (saved) {
          tokenSaved = true
          return
        }
      }

      pollCount++
      if (pollCount < maxPolls) {
        setTimeout(pollForToken, 500)
      } else {
        addLog('폴링 종료')
      }
    }

    // 네이티브 앱 여부 확인
    // @ts-ignore
    const hasInterface = typeof window.AndroidFCM !== 'undefined'
    const isAndroid = navigator.userAgent.includes('Android')

    addLog(`Interface: ${hasInterface}, Android: ${isAndroid}`)
    addLog(`UA: ${navigator.userAgent.substring(0, 50)}...`)

    if (hasInterface || isAndroid) {
      addLog('폴링 시작')
      setTimeout(pollForToken, 1000)
    }

    // 로그인 후 pending 토큰 처리
    const checkPendingToken = () => {
      const pendingToken = localStorage.getItem('pending_fcm_token')
      const authToken = localStorage.getItem('token')
      if (pendingToken && authToken) {
        addLog('pending 토큰 처리')
        saveFCMToken(pendingToken)
      }
    }

    // 1초마다 pending 토큰 체크 (로그인 감지)
    const pendingInterval = setInterval(checkPendingToken, 1000)

    return () => {
      window.removeEventListener('nativeFCMToken', handleFCMEvent)
      clearInterval(pendingInterval)
    }
  }, [])

  // 디버그 UI (개발용 - 나중에 제거)
  if (typeof window !== 'undefined' && navigator.userAgent.includes('Android')) {
    return (
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'rgba(0,0,0,0.9)',
          color: '#0f0',
          fontSize: '10px',
          padding: '4px',
          maxHeight: '100px',
          overflow: 'auto',
          zIndex: 99999,
          fontFamily: 'monospace'
        }}
      >
        {debug.map((log, i) => (
          <div key={i}>{log}</div>
        ))}
      </div>
    )
  }

  return null
}
