import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

// GET: 그룹장의 소속 회원 목록 조회 (재귀적으로 모든 하위 회원 포함)
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    const payload = verifyToken(token)

    if (!payload) {
      return NextResponse.json(
        { error: '유효하지 않은 토큰입니다.' },
        { status: 401 }
      )
    }

    // 그룹장 ID (쿼리 파라미터 또는 토큰에서)
    const { searchParams } = new URL(request.url)
    const groupLeaderId = searchParams.get('groupLeaderId') || payload.userId

    // 그룹장 정보 확인
    const { data: groupLeader, error: leaderError } = await supabaseAdmin
      .from('users')
      .select('id, role')
      .eq('id', groupLeaderId)
      .single()

    if (leaderError || !groupLeader) {
      return NextResponse.json(
        { error: '그룹장 정보를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    if (groupLeader.role !== 'GROUP_LEADER' && !payload.isAdmin) {
      return NextResponse.json(
        { error: '그룹장 권한이 필요합니다.' },
        { status: 403 }
      )
    }

    // 모든 사용자 조회
    const { data: allUsers, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id, name, phone, email, referral_code, referrer_id, security_coins, dividend_coins, member_number, role, status, created_at')
      .order('created_at', { ascending: false })

    if (usersError) {
      console.error('Users fetch error:', usersError)
      return NextResponse.json(
        { error: '회원 목록 조회에 실패했습니다.' },
        { status: 500 }
      )
    }

    // 그룹장이 직접 추천한 회원들과 그 하위 회원들을 재귀적으로 찾기
    const findAllDescendants = (userId: string, users: any[]): string[] => {
      const directChildren = users.filter(u => u.referrer_id === userId)
      let descendants = directChildren.map(u => u.id)

      for (const child of directChildren) {
        descendants = [...descendants, ...findAllDescendants(child.id, users)]
      }

      return descendants
    }

    const descendantIds = findAllDescendants(groupLeaderId, allUsers || [])

    // 하위 회원들만 필터링
    const teamMembers = (allUsers || [])
      .filter(u => descendantIds.includes(u.id))
      .map(u => ({
        id: u.id,
        name: u.name,
        phone: u.phone,
        email: u.email,
        referralCode: u.referral_code,
        referrerId: u.referrer_id,
        securityCoins: u.security_coins || 0,
        dividendCoins: u.dividend_coins || 0,
        memberNumber: u.member_number,
        role: u.role || 'USER',
        status: u.status || 'ACTIVE',
        createdAt: u.created_at
      }))

    return NextResponse.json({
      members: teamMembers,
      total: teamMembers.length,
      teamLeaders: teamMembers.filter(m => m.role === 'TEAM_LEADER').length,
      users: teamMembers.filter(m => m.role === 'USER').length
    })

  } catch (error) {
    console.error('Group leader members error:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
