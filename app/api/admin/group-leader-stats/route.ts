import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

// GET: 그룹장별 통계 조회
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

    if (!payload || !payload.isAdmin) {
      return NextResponse.json(
        { error: '관리자 권한이 필요합니다.' },
        { status: 403 }
      )
    }

    // 모든 사용자 조회
    const { data: allUsers, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id, name, phone, email, referral_code, referred_by, security_coins, dividend_coins, member_number, role, status, created_at')
      .order('created_at', { ascending: false })

    if (usersError) {
      console.error('Users fetch error:', usersError)
      return NextResponse.json(
        { error: '회원 목록 조회에 실패했습니다.' },
        { status: 500 }
      )
    }

    // 그룹장 목록
    const groupLeaders = allUsers.filter(u => u.role === 'GROUP_LEADER')

    // 각 그룹장별 통계 계산
    const groupLeaderStats = groupLeaders.map(gl => {
      // 그룹장이 직접 추천한 회원들 (팀장들)
      const directMembers = allUsers.filter(u => u.referred_by === gl.id)

      // 그룹장의 모든 산하 회원을 재귀적으로 찾기 (하위 그룹장은 제외)
      const findAllDescendants = (userId: string, users: any[]): string[] => {
        const directChildren = users.filter(u => u.referred_by === userId)
        let descendants = directChildren.map(u => u.id)

        for (const child of directChildren) {
          // 그룹장이면 그 그룹장의 하위는 탐색하지 않음
          if (child.role !== 'GROUP_LEADER') {
            descendants = [...descendants, ...findAllDescendants(child.id, users)]
          }
        }

        return descendants
      }

      const descendantIds = findAllDescendants(gl.id, allUsers)
      const allSubMembers = allUsers.filter(u => descendantIds.includes(u.id))

      // 직추천한 팀장 수
      const directTeamLeaders = directMembers.filter(m => m.role === 'TEAM_LEADER')

      // 총 배당코인 (산하 전체)
      const totalDividendCoins = allSubMembers.reduce((sum, u) => sum + (u.dividend_coins || 0), 0)

      // 총 증권코인 (산하 전체)
      const totalSecurityCoins = allSubMembers.reduce((sum, u) => sum + (u.security_coins || 0), 0)

      return {
        id: gl.id,
        name: gl.name,
        phone: gl.phone,
        memberNumber: gl.member_number,
        referralCode: gl.referral_code,
        totalSubMemberCount: allSubMembers.length,
        directTeamLeaderCount: directTeamLeaders.length,
        totalDividendCoins,
        totalSecurityCoins,
        directMembers: directMembers.map(m => ({
          id: m.id,
          name: m.name,
          phone: m.phone,
          memberNumber: m.member_number,
          role: m.role,
          securityCoins: m.security_coins || 0,
          dividendCoins: m.dividend_coins || 0,
          createdAt: m.created_at
        }))
      }
    })

    return NextResponse.json({
      groupLeaders: groupLeaderStats
    })

  } catch (error) {
    console.error('Group leader stats error:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
