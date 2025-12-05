'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { LogIn, Phone, Lock } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'
import Link from 'next/link'
import KakaoBrowserWarning from '@/components/KakaoBrowserWarning'

type LoginForm = {
  phone: string
  password: string
}

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginForm>()

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || '로그인 실패')
      }

      // 로컬 스토리지에 토큰과 사용자 정보 저장
      localStorage.setItem('token', result.token)
      localStorage.setItem('user', JSON.stringify(result.user))

      toast.success(`환영합니다, ${result.user.name}님! 👋`)

      // 1초 후 메인 페이지로 이동 (강력한 새로고침)
      setTimeout(() => {
        window.location.href = '/'
      }, 1000)

    } catch (error: any) {
      toast.error(error.message || '로그인 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center py-12 px-4 pt-[max(22px,env(safe-area-inset-top))]">
      <KakaoBrowserWarning />
      <Toaster position="top-center" />
      
      <div className="max-w-md w-full">
        {/* 로고 */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img src="/vcoin_logo.png" alt="V COIN Logo" className="w-32 h-32 object-contain" />
          </div>
          <h1 className="text-3xl font-bold text-white">V COIN 로그인</h1>
          <p className="text-gray-400 mt-2">3D SOLAR 투자 플랫폼</p>
        </div>

        {/* 로그인 폼 */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* 휴대폰 번호 */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              휴대폰 번호
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
              <input
                type="tel"
                {...register('phone', {
                  required: '휴대폰 번호를 입력해주세요.',
                  pattern: {
                    value: /^[0-9]{10,11}$/,
                    message: '올바른 전화번호 형식이 아닙니다.'
                  }
                })}
                className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-white placeholder-gray-500"
                placeholder="01012345678"
              />
            </div>
            {errors.phone && (
              <p className="mt-1 text-sm text-red-400">{errors.phone.message}</p>
            )}
          </div>

          {/* 비밀번호 */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              비밀번호
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
              <input
                type="password"
                {...register('password', {
                  required: '비밀번호를 입력해주세요.'
                })}
                className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-white placeholder-gray-500"
                placeholder="••••••••"
              />
            </div>
            {errors.password && (
              <p className="mt-1 text-sm text-red-400">{errors.password.message}</p>
            )}
          </div>

          {/* 로그인 버튼 */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center px-4 py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 text-gray-900 font-semibold rounded-lg hover:from-yellow-400 hover:to-yellow-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {isLoading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                처리 중...
              </span>
            ) : (
              <>
                <LogIn className="w-5 h-5 mr-2" />
                로그인
              </>
            )}
          </button>
        </form>

        {/* 회원가입 링크 */}
        <div className="mt-6 text-center">
          <p className="text-gray-400">
            아직 계정이 없으신가요?{' '}
            <Link href="/signup" className="text-yellow-400 hover:text-yellow-300 font-medium">
              회원가입
            </Link>
          </p>
        </div>

        {/* 추가 안내 */}
        <div className="mt-8 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
          <h3 className="text-sm font-semibold text-yellow-400 mb-2">🎁 회원가입 혜택</h3>
          <ul className="text-sm text-gray-300 space-y-1">
            <li>• 증권코인 500개 즉시 지급</li>
            <li>• 추천인 코드 입력 시 1,000개 추가</li>
            <li>• 초기 회원 특별 혜택</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
