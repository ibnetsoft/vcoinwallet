import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

// 재귀적으로 모든 하위 회원을 찾는 함수 (TEAM_LEADER의 하위는 제외)
function getAllDownlineUsers(userReferralCode: string, allUsers: any[]): any[] {
  const directReferrals = allUsers.filter(u => u.referrerId === userReferralCode)
  let allDownline = [...directReferrals]

  // 각 직접 추천인의 하위 라인도 재귀적으로 추가
  // 단, TEAM_LEADER인 경우 그 하위로는 들어가지 않음
  for (const referral of directReferrals) {
    // TEAM_LEADER가 아닌 경우에만 하위 탐색
    if (referral.role !== 'TEAM_LEADER') {
      const subDownline = getAllDownlineUsers(referral.referralCode, allUsers)
      allDownline = [...allDownline, ...subDownline]
    }
  }

  return allDownline
}

export async function GET(request: NextRequest) {
  try {
    // Authorization 헤더에서 토큰 추출
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: '인증 토큰이 필요합니다.' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const decoded = verifyToken(token)

    if (!decoded) {
      return NextResponse.json(
        { error: '유효하지 않은 토큰입니다.' },
        { status: 401 }
      )
    }

    const user = await db.findUserById(decoded.userId)
    if (!user) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 해당 사용자가 추천한 회원 목록 가져오기
    const allUsers = await db.getAllUsers()

    // 디버깅: 현재 사용자 정보와 모든 사용자의 referrerId 확인
    console.log('=== 추천 데이터 디버깅 ===')
    console.log('현재 사용자 referralCode:', user.referralCode)
    console.log('전체 사용자 수:', allUsers.length)
    console.log('각 사용자의 referrerId:', allUsers.map(u => ({ name: u.name, referrerId: u.referrerId })))

    const referredUsers = allUsers.filter(u => u.referrerId === user.referralCode)
    console.log('필터링된 추천 회원 수:', referredUsers.length)
    console.log('=== 디버깅 끝 ===')

    // 가입일 기준 최신순 정렬 (최신이 먼저)
    const sortedReferredUsers = referredUsers.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )

    // 민감한 정보 제거 + 각 회원이 추천한 회원들 추가
    const safeReferredUsers = sortedReferredUsers.map(({ password, ...userData }) => {
      // 이 회원이 추천한 회원들 찾기 (2단계)
      // 단, 이 회원이 TEAM_LEADER인 경우 하위는 표시하지 않음
      let secondLevelReferrals: any[] = []

      if (userData.role !== 'TEAM_LEADER') {
        secondLevelReferrals = allUsers
          .filter(u => u.referrerId === userData.referralCode)
          .map(({ password: _, ...subUserData }) => ({
            ...subUserData,
            createdAt: new Date(subUserData.createdAt).toLocaleDateString('ko-KR')
          }))
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      }

      return {
        ...userData,
        createdAt: new Date(userData.createdAt).toLocaleDateString('ko-KR'),
        referrals: secondLevelReferrals  // 2단계 추천 회원들 (TEAM_LEADER는 빈 배열)
      }
    })

    // 팀장인 경우 산하 매출 통계 계산
    let teamStats = null
    if (user.role === 'TEAM_LEADER') {
      // 모든 산하 회원 (직접 + 간접 추천)
      // 주의: 하위 팀장(TEAM_LEADER)은 포함하되, 그 팀장의 산하는 제외됨
      const allDownline = getAllDownlineUsers(user.referralCode, allUsers)

      // 산하 총 인원 (하위 팀장의 산하 제외)
      const totalMembers = allDownline.length

      // 산하 직접 추천 인원
      const directMembers = referredUsers.length

      // 산하 간접 추천 인원 (하위 팀장의 산하 제외)
      const indirectMembers = totalMembers - directMembers

      // 산하 총 증권코인 (하위 팀장의 산하 제외)
      const totalSecurityCoins = allDownline.reduce((sum, u) => sum + (u.securityCoins || 0), 0)

      // 산하 총 배당코인 (매출) (하위 팀장의 산하 제외)
      const totalDividendCoins = allDownline.reduce((sum, u) => sum + (u.dividendCoins || 0), 0)

      // 배당코인 기준 총 매출액 (1코인 = 100원)
      const totalSales = totalDividendCoins * 100

      teamStats = {
        totalMembers,
        directMembers,
        indirectMembers,
        totalSecurityCoins,
        totalDividendCoins,
        totalSales
      }
    }

    return NextResponse.json({
      referredUsers: safeReferredUsers,
      total: safeReferredUsers.length,
      isTeamLeader: user.role === 'TEAM_LEADER',
      teamStats
    })

  } catch (error) {
    console.error('Get referrals error:', error)
    return NextResponse.json(
      { error: '추천 목록 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
