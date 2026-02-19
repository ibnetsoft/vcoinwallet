import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { db } from '@/lib/db'
import { supabaseAdmin } from '@/lib/supabase'

const MALL_CHARGE_URL = process.env.MALL_CHARGE_API_URL || 'https://back.iming365.com/internal/points/charge'
const MALL_CHARGE_API_KEY = process.env.MALL_CHARGE_API_KEY
const MALL_CHARGE_TIMEOUT_MS = Number(process.env.MALL_CHARGE_TIMEOUT_MS) || 8000

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '').trim()
    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json(
        { error: '유효하지 않은 토큰입니다.' },
        { status: 401 }
      )
    }

    const userId = payload.userId
    const body = await request.json()
    const referralCode = typeof body.referralCode === 'string' ? body.referralCode.trim() : ''
    const amount = typeof body.amount === 'number' ? body.amount : parseInt(body.amount, 10)

    if (!referralCode) {
      return NextResponse.json(
        { error: '쇼핑몰 회원코드를 입력해주세요.' },
        { status: 400 }
      )
    }

    if (!Number.isInteger(amount) || amount <= 0) {
      return NextResponse.json(
        { error: '전환 수량은 1 이상의 정수여야 합니다.' },
        { status: 400 }
      )
    }

    const user = await db.findUserById(userId)
    if (!user) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    const balance = user.securityCoins ?? 0
    if (balance < amount) {
      return NextResponse.json(
        { error: `증권코인이 부족합니다. (보유: ${balance}개)` },
        { status: 400 }
      )
    }

    if (!MALL_CHARGE_API_KEY) {
      console.error('MALL_CHARGE_API_KEY is not set')
      return NextResponse.json(
        { error: '쇼핑몰 연동 설정이 없습니다.' },
        { status: 500 }
      )
    }

    // 1. 잔액 차감 및 거래 기록 (먼저 내부 반영)
    const newBalance = balance - amount
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ security_coins: newBalance })
      .eq('id', userId)

    if (updateError) {
      console.error('Transfer to mall: user update failed', updateError)
      return NextResponse.json(
        { error: '코인 차감에 실패했습니다.' },
        { status: 500 }
      )
    }

    const txId = Date.now().toString() + Math.random().toString(36).substr(2, 9)
    const { error: insertTxError } = await supabaseAdmin.from('transactions').insert({
      id: txId,
      user_id: userId,
      type: 'MALL_TRANSFER',
      coin_type: 'SECURITY',
      amount: -amount,
      balance: newBalance,
      description: `쇼핑몰 마일리지 전환 (1:10000) - ${amount}개`,
      created_at: new Date().toISOString(),
    })

    if (insertTxError) {
      console.error('Transfer to mall: transaction insert failed', insertTxError)
      await supabaseAdmin.from('users').update({ security_coins: balance }).eq('id', userId)
      return NextResponse.json(
        { error: '거래 내역 저장에 실패했습니다. 관리자에게 문의하세요. (DB에 MALL_TRANSFER 타입 추가 필요)' },
        { status: 500 }
      )
    }

    // 2. 외부 마일리지 충전 호출 (실패 시 롤백)
    const rollback = async () => {
      await supabaseAdmin.from('users').update({ security_coins: balance }).eq('id', userId)
      await supabaseAdmin.from('transactions').delete().eq('id', txId)
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), MALL_CHARGE_TIMEOUT_MS)

    console.log('[transfer-to-mall] 쇼핑몰 API 호출:', {
      url: MALL_CHARGE_URL,
      method: 'POST',
      referralCode,
      coinAmount: amount,
    })

    let mallRes: Response
    try {
      mallRes = await fetch(MALL_CHARGE_URL, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${MALL_CHARGE_API_KEY}`,
        },
        body: JSON.stringify({
          referralCode,
          coinAmount: amount,
        }),
      })
    } catch (fetchError: unknown) {
      clearTimeout(timeoutId)
      const isAbort = fetchError instanceof Error && fetchError.name === 'AbortError'
      console.error('[transfer-to-mall] 쇼핑몰 API 호출 실패:', {
        url: MALL_CHARGE_URL,
        error: fetchError instanceof Error ? fetchError.message : String(fetchError),
        timeout: isAbort,
      })
      await rollback().catch((e) => console.error('Transfer to mall: rollback failed', e))
      return NextResponse.json(
        { error: isAbort ? '쇼핑몰 서버 응답 시간이 초과되었습니다. 잠시 후 다시 시도해 주세요.' : '쇼핑몰 연동에 실패했습니다.' },
        { status: 502 }
      )
    }
    clearTimeout(timeoutId)

    console.log('[transfer-to-mall] 쇼핑몰 API 응답:', {
      url: MALL_CHARGE_URL,
      status: mallRes.status,
      statusText: mallRes.statusText,
    })

    const mallData = await mallRes.json().catch(() => ({}))
    if (!mallRes.ok) {
      const message = (mallData?.error as string) || mallRes.statusText || '쇼핑몰 연동에 실패했습니다.'
      await rollback().catch((e) => console.error('Transfer to mall: rollback failed', e))
      return NextResponse.json(
        { error: message },
        { status: 502 }
      )
    }

    const grantedMileage = typeof mallData.grantedMileage === 'number' ? mallData.grantedMileage : amount * 10000
    return NextResponse.json({
      success: true,
      grantedMileage,
      message: `쇼핑몰 마일리지 ${grantedMileage.toLocaleString()}P가 적립되었습니다.`,
    })
  } catch (error) {
    console.error('Transfer to mall error:', error)
    return NextResponse.json(
      { error: '전환 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
