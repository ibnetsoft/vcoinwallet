# V COIN Wallet - Supabase 연결 가이드

이 가이드는 현재 JSON 파일 기반 데이터베이스를 Supabase로 마이그레이션하는 방법을 설명합니다.

## 📋 준비사항

- Supabase 계정 (https://supabase.com)
- 현재 작동 중인 V COIN Wallet 애플리케이션
- Node.js 및 npm 설치

## 🚀 단계별 설정

### 1. Supabase 프로젝트 생성

1. [Supabase 대시보드](https://app.supabase.com)에 로그인
2. "New Project" 클릭
3. 프로젝트 정보 입력:
   - **Name**: vcoin-wallet (또는 원하는 이름)
   - **Database Password**: 강력한 비밀번호 (안전한 곳에 저장!)
   - **Region**: Northeast Asia (Seoul) - 한국에서 가장 빠름
4. "Create new project" 클릭 (1-2분 소요)

### 2. Supabase 자격 증명 확인

프로젝트가 생성되면:

1. 좌측 메뉴에서 **Settings** → **API** 클릭
2. 다음 정보를 복사:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbGc...` (긴 토큰)
   - **service_role key**: `eyJhbGc...` (긴 토큰, 비밀로 유지!)

### 3. 환경 변수 설정

프로젝트 루트의 `.env.local` 파일을 열고 복사한 값을 입력:

```env
# Supabase 설정
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...여기에_anon_key_붙여넣기
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...여기에_service_role_key_붙여넣기
```

⚠️ **중요**: `.env.local` 파일은 절대 GitHub에 올리지 마세요!

### 4. 데이터베이스 스키마 생성

1. Supabase 대시보드에서 **SQL Editor** 클릭
2. "New query" 버튼 클릭
3. `supabase-schema.sql` 파일의 내용을 복사해서 붙여넣기
4. "Run" 버튼 클릭하여 실행

완료되면 다음 테이블이 생성됩니다:
- `users` - 사용자 정보
- `transactions` - 거래 내역
- `metadata` - 메타데이터 (다음 회원번호 등)

### 5. 기존 데이터 마이그레이션

현재 JSON 파일의 데이터를 Supabase로 이동:

```bash
# 마이그레이션 스크립트 실행
npx tsx scripts/migrate-to-supabase.ts
```

성공하면 다음과 같은 메시지가 표시됩니다:
```
✅ 마이그레이션 성공!
   - 사용자: XX명
   - 거래내역: XX건
```

### 6. 데이터 확인

Supabase 대시보드에서 확인:

1. **Table Editor** 클릭
2. `users` 테이블 선택 → 사용자 데이터 확인
3. `transactions` 테이블 선택 → 거래 내역 확인

## 📁 생성된 파일 설명

### 1. `.env.local`
환경 변수 파일 (Supabase 자격 증명 저장)

### 2. `lib/supabase.ts`
Supabase 클라이언트 설정 파일
- `supabase`: 클라이언트용 (브라우저)
- `supabaseAdmin`: 서버용 (API 라우트, 관리자 권한)

### 3. `supabase-schema.sql`
데이터베이스 스키마 정의 (SQL)
- 테이블 생성
- 인덱스 생성
- Row Level Security (RLS) 설정

### 4. `scripts/migrate-to-supabase.ts`
JSON → Supabase 마이그레이션 스크립트

## 🔄 다음 단계: 애플리케이션 코드 업데이트

마이그레이션이 완료되면 `lib/db.ts`를 Supabase 버전으로 교체해야 합니다.

### 현재 구조 (JSON 파일)
```typescript
// lib/db.ts
class Database {
  readDB() { /* JSON 파일 읽기 */ }
  writeDB() { /* JSON 파일 쓰기 */ }
  // ...
}
```

### Supabase 버전으로 교체 필요
모든 데이터베이스 작업을 Supabase API로 변경:
- `readDB()` → `supabaseAdmin.from('users').select()`
- `writeDB()` → `supabaseAdmin.from('users').insert/update()`

## 🛡️ 보안 고려사항

### Row Level Security (RLS)
Supabase는 RLS를 통해 데이터 접근을 제어합니다:

- **일반 사용자**: 자신의 데이터만 조회 가능
- **API 라우트**: `supabaseAdmin` 사용 시 모든 데이터 접근 가능

### 비밀 키 관리
- `NEXT_PUBLIC_*` 키는 브라우저에 노출됨 (괜찮음)
- `SUPABASE_SERVICE_ROLE_KEY`는 절대 브라우저에 노출되면 안 됨
- API 라우트에서만 `supabaseAdmin` 사용

## 📊 성능 최적화

### 인덱스
스키마에 다음 인덱스가 자동 생성됩니다:
- 회원번호, 이메일, 추천코드 (빠른 검색)
- 사용자 ID, 거래 타입, 날짜 (거래 내역 조회)

### 쿼리 최적화
- 필요한 컬럼만 선택: `.select('id, name, email')`
- 페이지네이션 사용: `.range(0, 29)` (30개씩)
- 정렬 인덱스 활용: `.order('created_at', { ascending: false })`

## 🐛 문제 해결

### 마이그레이션 실패 시
1. `.env.local` 파일의 자격 증명 확인
2. Supabase 대시보드에서 테이블이 생성되었는지 확인
3. `data/database.json` 파일 존재 확인

### 연결 오류 시
- Supabase 프로젝트가 활성화되어 있는지 확인
- 환경 변수가 올바르게 설정되었는지 확인
- 개발 서버 재시작: `npm run dev`

### RLS 오류 시
- API 라우트에서 `supabaseAdmin` 사용 확인
- 클라이언트 사이드에서는 `supabase` 사용

## 📚 추가 자료

- [Supabase 공식 문서](https://supabase.com/docs)
- [Supabase + Next.js 가이드](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- [Row Level Security 가이드](https://supabase.com/docs/guides/auth/row-level-security)

## ✅ 체크리스트

마이그레이션 완료 후 확인:

- [ ] Supabase 프로젝트 생성
- [ ] `.env.local` 설정
- [ ] 데이터베이스 스키마 생성 (SQL 실행)
- [ ] 데이터 마이그레이션 성공
- [ ] Supabase 대시보드에서 데이터 확인
- [ ] 애플리케이션 코드 업데이트 (필요 시)
- [ ] 로컬 테스트
- [ ] 프로덕션 배포

---

문제가 발생하면 Supabase 대시보드의 Logs 섹션에서 에러 확인 가능합니다.
