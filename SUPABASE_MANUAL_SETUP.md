# Supabase 수동 설정 가이드

Prisma 마이그레이션이 연결 문제로 작동하지 않을 때 사용하는 수동 설정 방법입니다.

## 1단계: Supabase SQL Editor 열기

1. 브라우저에서 다음 링크로 이동:
   https://supabase.com/dashboard/project/owudrvqzcsjbfnrenveg/sql/new

2. 또는:
   - Supabase 대시보드 접속
   - 왼쪽 메뉴에서 **"SQL Editor"** 클릭
   - **"New query"** 버튼 클릭

## 2단계: SQL 스크립트 실행

1. 프로젝트 폴더의 `supabase_schema.sql` 파일을 엽니다

2. 파일 내용 전체를 복사합니다 (Ctrl+A, Ctrl+C)

3. Supabase SQL Editor에 붙여넣습니다 (Ctrl+V)

4. 오른쪽 하단의 **"Run"** 버튼을 클릭합니다

5. 성공 메시지 확인:
   - "Success. No rows returned" 또는
   - "Success" 메시지가 표시되면 성공!

## 3단계: 테이블 생성 확인

1. 왼쪽 메뉴에서 **"Table Editor"** 클릭

2. 다음 테이블들이 생성되었는지 확인:
   - ✅ User
   - ✅ Transaction
   - ✅ Dividend
   - ✅ SystemConfig

## 4단계: Prisma 클라이언트 생성

터미널에서 다음 명령어 실행:

```bash
cd vcoin-wallet
npx prisma db pull
npx prisma generate
```

`prisma db pull`은 Supabase 데이터베이스 스키마를 읽어서 Prisma 스키마 파일을 자동으로 업데이트합니다.

## 5단계: 애플리케이션 실행

```bash
npm run dev
```

브라우저에서 http://localhost:3000 접속

## 6단계: 첫 번째 사용자(관리자) 생성

1. 회원가입 페이지로 이동
2. 다음 정보로 회원가입:
   - **이름:** 관리자
   - **휴대폰:** 01000000000
   - **이메일:** admin@3dvcoin.com (선택)
   - **비밀번호:** admin1234

3. 회원가입 후 Supabase Table Editor로 돌아가기

4. **User 테이블** 열기

5. 방금 생성한 사용자 찾기 (phone: 01000000000)

6. 해당 행 클릭 후 `isAdmin` 필드를 `false`에서 `true`로 변경

7. **Save** 클릭

## 트러블슈팅

### SQL 실행 시 에러 발생
- 이미 테이블이 존재하면 "already exists" 에러가 나올 수 있습니다
- 이 경우 정상입니다. 테이블이 이미 생성된 것입니다

### `prisma db pull` 실패
- `.env` 파일의 DATABASE_URL이 올바른지 확인
- Supabase 프로젝트가 활성화되어 있는지 확인

### 연결 오류 계속 발생
- Windows 방화벽이 PostgreSQL 연결을 차단하고 있을 수 있습니다
- VPN을 사용 중이라면 비활성화 후 재시도

## 대안: 로컬 개발용 SQLite 사용

Supabase 연결이 계속 문제가 되면 로컬 개발은 SQLite로 하고 프로덕션만 Supabase를 사용할 수 있습니다:

1. `.env` 파일 백업
2. `prisma/schema.prisma`의 datasource를 SQLite로 변경
3. `npx prisma migrate dev --name init`
4. 로컬 개발 진행
5. 배포 시 Supabase 설정으로 전환

## 주의사항

- **비밀번호 보안:** 프로덕션 배포 전 관리자 비밀번호를 반드시 변경하세요
- **환경 변수:** `.env` 파일을 Git에 커밋하지 마세요
- **Row Level Security (RLS):** 프로덕션 배포 전 Supabase RLS 정책 설정 필요

## 다음 단계

데이터베이스가 설정되었으면:
1. ✅ 회원가입 테스트
2. ✅ 로그인 테스트
3. ✅ 지갑 대시보드 확인
4. ✅ 관리자 기능 테스트
5. ✅ 추천인 코드 기능 테스트
