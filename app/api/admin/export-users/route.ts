import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import * as XLSX from 'xlsx'

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

    // 모든 사용자 데이터 가져오기
    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Fetch users error:', error)
      return NextResponse.json(
        { error: '사용자 데이터 조회 실패' },
        { status: 500 }
      )
    }

    // 엑셀 데이터 형식으로 변환
    const excelData = users.map((user, index) => ({
      '번호': index + 1,
      '아이디': user.id,
      '이름': user.name,
      '이메일': user.email || '-',
      '전화번호': user.phone || '-',
      '역할': user.role === 'ADMIN' ? '관리자' : '일반회원',
      '추천인 ID': user.referrer_id || '-',
      '증권코인': user.security_coin || 0,
      '배당코인': user.dividend_coin || 0,
      '총 코인': (user.security_coin || 0) + (user.dividend_coin || 0),
      '인증 여부': user.is_verified ? '인증완료' : '미인증',
      '계좌번호': user.account_number || '-',
      '은행명': user.bank_name || '-',
      '예금주': user.account_holder || '-',
      '가입일시': user.created_at ? new Date(user.created_at).toLocaleString('ko-KR') : '-',
      '최근 접속': user.last_login ? new Date(user.last_login).toLocaleString('ko-KR') : '-'
    }))

    // 엑셀 워크북 생성
    const worksheet = XLSX.utils.json_to_sheet(excelData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, '전체회원')

    // 컬럼 너비 설정
    worksheet['!cols'] = [
      { wch: 6 },  // 번호
      { wch: 15 }, // 아이디
      { wch: 12 }, // 이름
      { wch: 25 }, // 이메일
      { wch: 15 }, // 전화번호
      { wch: 10 }, // 역할
      { wch: 15 }, // 추천인 ID
      { wch: 12 }, // 증권코인
      { wch: 12 }, // 배당코인
      { wch: 12 }, // 총 코인
      { wch: 10 }, // 인증 여부
      { wch: 20 }, // 계좌번호
      { wch: 12 }, // 은행명
      { wch: 12 }, // 예금주
      { wch: 20 }, // 가입일시
      { wch: 20 }  // 최근 접속
    ]

    // 엑셀 파일 버퍼 생성
    const excelBuffer = XLSX.write(workbook, {
      type: 'buffer',
      bookType: 'xlsx'
    })

    // 현재 날짜를 파일명에 포함
    const now = new Date()
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`
    const filename = `회원목록_${dateStr}.xlsx`

    // 엑셀 파일 반환
    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`
      }
    })
  } catch (error: any) {
    console.error('Export users error:', error)
    return NextResponse.json(
      { error: '엑셀 다운로드 중 오류가 발생했습니다: ' + (error.message || error.toString()) },
      { status: 500 }
    )
  }
}
