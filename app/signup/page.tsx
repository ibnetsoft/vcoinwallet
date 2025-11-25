'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { UserPlus, Mail, Lock, User, Phone, Gift } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'
import Link from 'next/link'
import PrivacyConsentModal from '@/components/PrivacyConsentModal'
import KakaoBrowserWarning from '@/components/KakaoBrowserWarning'

type SignupForm = {
  name: string
  phone: string
  idNumber: string
  email?: string
  password: string
  confirmPassword: string
  referralCode?: string
}

export default function SignupPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false)
  const [isPrivacyConsented, setIsPrivacyConsented] = useState(false)
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    setValue
  } = useForm<SignupForm>()

  const password = watch('password')

  // URL에서 추천 코드 읽어오기
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const refCode = params.get('ref')
    if (refCode) {
      setValue('referralCode', refCode)
      toast.success(`추천 코드 "${refCode}"가 자동으로 입력되었습니다!`)
    }
  }, [setValue])

  // 주민번호 자동 포맷팅 (6자리 입력 시 자동으로 - 추가, 뒷자리는 1자리만)
  const handleIdNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/[^0-9]/g, '') // 숫자만 추출

    if (value.length > 6) {
      value = value.slice(0, 6) + '-' + value.slice(6, 7) // 뒷자리 1자리만
    }

    setValue('idNumber', value)
  }

  const onSubmit = async (data: SignupForm) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          phone: data.phone,
          idNumber: data.idNumber,
          email: data.email || undefined,
          password: data.password,
          referralCode: data.referralCode
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || '회원가입 실패')
      }

      // 로컬 스토리지에 토큰과 사용자 정보 저장
      localStorage.setItem('token', result.token)
      localStorage.setItem('user', JSON.stringify(result.user))
      localStorage.setItem('justSignedUp', 'true') // 회원가입 완료 플래그

      toast.success(
        <div>
          <p className="font-semibold">🎉 회원가입 완료!</p>
          <p className="text-sm">증권코인 {result.user.securityCoins}개가 지급되었습니다!</p>
        </div>
      )

      // 1초 후 메인 페이지로 이동
      setTimeout(() => {
        router.push('/?welcome=true')
      }, 1000)

    } catch (error: any) {
      toast.error(error.message || '회원가입 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center py-12 px-4 pt-[env(safe-area-inset-top)]">
      <KakaoBrowserWarning />
      <Toaster position="top-center" />
      
      <div className="max-w-md w-full">
        {/* 로고 */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img src="/vcoin_logo.png" alt="V COIN Logo" className="w-32 h-32 object-contain" />
          </div>
          <h1 className="text-3xl font-bold text-white">V COIN 회원가입</h1>
          <p className="text-gray-400 mt-2">3D SOLAR 투자 플랫폼</p>
        </div>

        {/* 보너스 안내 */}
        <div className="bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 rounded-xl p-4 mb-6 border border-yellow-500/30">
          <div className="flex items-center">
            <Gift className="w-6 h-6 text-yellow-400 mr-3" />
            <div>
              <p className="text-yellow-400 font-semibold">가입 즉시 증권코인 500개 지급!</p>
              <p className="text-yellow-300/70 text-sm">추천인 등록 시 1,000개 추가</p>
            </div>
          </div>
        </div>

        {/* 회원가입 폼 */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* 이름 */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              이름 *
            </label>
            <div className="relative">
              <User className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
              <input
                type="text"
                {...register('name', {
                  required: '이름을 입력해주세요.',
                  minLength: {
                    value: 2,
                    message: '이름은 2자 이상이어야 합니다.'
                  }
                })}
                className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-white placeholder-gray-500"
                placeholder="홍길동"
              />
            </div>
            {errors.name && (
              <p className="mt-1 text-sm text-red-400">{errors.name.message}</p>
            )}
          </div>

          {/* 휴대폰 번호 */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              휴대폰 번호 *
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
              <input
                type="tel"
                {...register('phone', {
                  required: '휴대폰 번호를 입력해주세요.',
                  pattern: {
                    value: /^[0-9]{10,11}$/,
                    message: '올바른 전화번호 형식이 아닙니다. (숫자만 10-11자리)'
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

          {/* 주민등록번호 */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              주민등록번호 *
            </label>
            <div className="relative">
              <User className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
              <input
                type="text"
                {...register('idNumber', {
                  required: '주민등록번호를 입력해주세요.',
                  pattern: {
                    value: /^[0-9]{6}-[0-9]{1}$/,
                    message: '올바른 주민등록번호 형식이 아닙니다. (예: 900101-1)'
                  }
                })}
                onChange={handleIdNumberChange}
                className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-white placeholder-gray-500"
                placeholder="900101-1"
                maxLength={8}
              />
            </div>
            {errors.idNumber && (
              <p className="mt-1 text-sm text-red-400">{errors.idNumber.message}</p>
            )}
          </div>

          {/* 이메일 (선택) */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              이메일 *
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
              <input
                type="email"
                {...register('email', {
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: '올바른 이메일 형식이 아닙니다.'
                  }
                })}
                className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-white placeholder-gray-500"
                placeholder="your@email.com"
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-sm text-red-400">{errors.email.message}</p>
            )}
          </div>

          {/* 비밀번호 */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              비밀번호 *
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
              <input
                type="password"
                {...register('password', {
                  required: '비밀번호를 입력해주세요.',
                  minLength: {
                    value: 6,
                    message: '비밀번호는 6자 이상이어야 합니다.'
                  }
                })}
                className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-white placeholder-gray-500"
                placeholder="••••••••"
              />
            </div>
            {errors.password && (
              <p className="mt-1 text-sm text-red-400">{errors.password.message}</p>
            )}
          </div>

          {/* 비밀번호 확인 */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              비밀번호 확인 *
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
              <input
                type="password"
                {...register('confirmPassword', {
                  required: '비밀번호 확인을 입력해주세요.',
                  validate: value => value === password || '비밀번호가 일치하지 않습니다.'
                })}
                className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-white placeholder-gray-500"
                placeholder="••••••••"
              />
            </div>
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-400">{errors.confirmPassword.message}</p>
            )}
          </div>

          {/* 추천인 코드 */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              추천인 코드 (선택)
            </label>
            <div className="relative">
              <Gift className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
              <input
                type="text"
                {...register('referralCode')}
                className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-white placeholder-gray-500"
                placeholder="ABC123"
              />
            </div>
            <p className="mt-1 text-sm text-gray-400">
              추천인 코드 입력 시 증권코인 1,000개 추가 지급
            </p>
          </div>

          {/* 개인정보 수집/이용 동의 */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <div className="flex items-start">
              <input
                type="checkbox"
                id="privacyConsent"
                checked={isPrivacyConsented}
                onChange={(e) => setIsPrivacyConsented(e.target.checked)}
                className="mt-1 w-4 h-4 text-yellow-500 bg-gray-700 border-gray-600 rounded focus:ring-yellow-500 focus:ring-2"
              />
              <label htmlFor="privacyConsent" className="ml-3 text-sm text-gray-300">
                <span className="font-medium text-white">[필수]</span> 개인정보 수집 및 이용에 동의합니다.{' '}
                <button
                  type="button"
                  onClick={() => setIsPrivacyModalOpen(true)}
                  className="text-yellow-400 hover:text-yellow-300 underline font-medium"
                >
                  자세히 보기
                </button>
              </label>
            </div>
          </div>

          {/* 가입 버튼 */}
          <button
            type="submit"
            disabled={isLoading || !isPrivacyConsented}
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
                <UserPlus className="w-5 h-5 mr-2" />
                회원가입
              </>
            )}
          </button>
        </form>

        {/* 로그인 링크 */}
        <div className="mt-6 text-center">
          <p className="text-gray-400">
            이미 계정이 있으신가요?{' '}
            <Link href="/login" className="text-yellow-400 hover:text-yellow-300 font-medium">
              로그인
            </Link>
          </p>
        </div>
      </div>

      {/* 개인정보 수집 동의서 팝업 */}
      <PrivacyConsentModal
        isOpen={isPrivacyModalOpen}
        onClose={() => setIsPrivacyModalOpen(false)}
      />
    </div>
  )
}
