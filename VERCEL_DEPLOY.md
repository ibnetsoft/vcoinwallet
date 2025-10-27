# V COIN Wallet - Vercel 배포 가이드

이 가이드는 V COIN Wallet을 Vercel에 배포하는 방법을 설명합니다.

## ✅ 배포 가능 여부

**네, Vercel에 배포 가능합니다!**

- Next.js 16 기반 애플리케이션
- Supabase 데이터베이스 연동
- 서버리스 API 라우트
- 자동 SSL 인증서

## 📋 배포 전 준비사항

### 1. GitHub 저장소 생성

프로젝트를 GitHub에 업로드해야 합니다:

```bash
# Git 초기화 (아직 안 했다면)
git init

# 첫 커밋
git add .
git commit -m "Initial commit: V COIN Wallet"

# GitHub 저장소 연결
git remote add origin https://github.com/your-username/vcoin-wallet.git
git branch -M main
git push -u origin main
```

### 2. Supabase 설정 확인

Supabase 프로젝트가 이미 생성되어 있어야 합니다:
- ✅ 프로젝트 URL: `https://owudrvqzcsjbfnrenveg.supabase.co`
- ✅ 데이터베이스 마이그레이션 완료
- ✅ 3명의 사용자, 6건의 거래 데이터

## 🚀 Vercel 배포 단계

### 방법 1: Vercel 웹사이트에서 배포 (권장)

1. **Vercel 계정 생성/로그인**
   - https://vercel.com 접속
   - GitHub 계정으로 로그인

2. **새 프로젝트 생성**
   - "Add New..." → "Project" 클릭
   - GitHub 저장소 선택: `vcoin-wallet`
   - "Import" 클릭

3. **프로젝트 설정**
   - **Framework Preset**: Next.js (자동 감지)
   - **Root Directory**: `./` (기본값)
   - **Build Command**: `npm run build` (자동 설정)
   - **Output Directory**: `.next` (자동 설정)

4. **환경 변수 설정** ⚠️ 중요!

   "Environment Variables" 섹션에서 다음 변수를 추가:

   | Name | Value |
   |------|-------|
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://owudrvqzcsjbfnrenveg.supabase.co` |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
   | `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |

   ⚠️ **주의**: `.env.local` 파일의 값을 복사해서 붙여넣으세요!

5. **배포 시작**
   - "Deploy" 버튼 클릭
   - 배포 진행 상황 실시간 확인 (약 2-3분 소요)

6. **배포 완료**
   - 배포가 완료되면 URL 제공: `https://vcoin-wallet-xxx.vercel.app`
   - "Visit" 버튼을 클릭하여 사이트 확인

### 방법 2: Vercel CLI로 배포

```bash
# Vercel CLI 설치
npm i -g vercel

# 프로젝트 디렉토리에서 실행
cd vcoin-wallet

# 로그인
vercel login

# 배포
vercel

# 프로덕션 배포
vercel --prod
```

## ⚙️ 배포 후 설정

### 1. 도메인 설정 (선택사항)

Vercel 대시보드에서 커스텀 도메인 추가:
1. 프로젝트 → "Settings" → "Domains"
2. 도메인 입력 (예: `vcoin.yourdomain.com`)
3. DNS 설정 안내에 따라 도메인 연결

### 2. 환경 변수 확인

배포 후 환경 변수가 제대로 설정되었는지 확인:
- Vercel 대시보드 → 프로젝트 → "Settings" → "Environment Variables"

### 3. 빌드 설정 확인

자동으로 설정되지만, 확인해보세요:
- **Framework**: Next.js
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`

## 📊 배포 구성

현재 프로젝트는 다음과 같이 구성되어 있습니다:

### 파일 구조
```
vcoin-wallet/
├── app/              # Next.js 페이지 (App Router)
├── lib/              # 유틸리티 및 Supabase 클라이언트
├── public/           # 정적 파일 (로고 등)
├── data.json         # JSON 데이터베이스 (로컬 개발용)
├── .env.local        # 환경 변수 (Git에서 제외)
├── vercel.json       # Vercel 설정
└── package.json      # 의존성
```

### API 라우트
모든 API 라우트는 서버리스 함수로 자동 배포됩니다:
- `/api/auth/login` - 로그인
- `/api/auth/signup` - 회원가입
- `/api/admin/users` - 관리자: 사용자 목록
- `/api/admin/grant-dividend` - 관리자: 배당코인 지급
- `/api/transactions` - 거래 내역 조회
- 등등...

## 🔒 보안 고려사항

### 1. 환경 변수 보호
- ✅ `.env.local`은 `.gitignore`에 포함 (GitHub에 업로드 안 됨)
- ✅ `SUPABASE_SERVICE_ROLE_KEY`는 서버에서만 사용
- ✅ `NEXT_PUBLIC_*` 변수만 브라우저에 노출

### 2. Supabase Row Level Security (RLS)
- ✅ RLS 정책 활성화
- ✅ 사용자는 자신의 데이터만 조회 가능
- ✅ 관리자 작업은 서버 사이드에서만 수행

### 3. 비밀번호 암호화
- ✅ bcrypt로 해시화
- ✅ 원본 비밀번호 저장 안 함

## 🌍 리전 설정

`vercel.json`에서 서울 리전으로 설정:
```json
{
  "regions": ["icn1"]
}
```

**리전 코드:**
- `icn1` - Seoul, South Korea (서울)
- `hnd1` - Tokyo, Japan (도쿄)
- `sin1` - Singapore (싱가포르)

## 📈 성능 최적화

Vercel은 자동으로 다음을 제공합니다:

1. **Edge Network**: 전 세계 CDN
2. **자동 캐싱**: 정적 자산 및 페이지
3. **이미지 최적화**: Next.js Image 컴포넌트
4. **코드 분할**: 자동 번들 최적화
5. **서버리스 함수**: 자동 스케일링

## 🐛 배포 문제 해결

### 빌드 실패 시

1. **로컬에서 빌드 테스트**
   ```bash
   npm run build
   ```

2. **의존성 확인**
   ```bash
   npm install
   ```

3. **환경 변수 확인**
   - Vercel 대시보드에서 모든 환경 변수가 설정되었는지 확인

### 런타임 오류 시

1. **Vercel 로그 확인**
   - Vercel 대시보드 → 프로젝트 → "Deployments" → 최신 배포 클릭 → "Runtime Logs"

2. **Supabase 연결 확인**
   - Supabase 대시보드에서 프로젝트 상태 확인
   - 환경 변수의 URL과 키가 정확한지 확인

3. **API 라우트 테스트**
   - 브라우저 개발자 도구 (F12) → Network 탭에서 API 요청 확인

## 🔄 자동 배포 설정

GitHub 저장소에 푸시하면 자동으로 배포됩니다:

```bash
# 코드 수정 후
git add .
git commit -m "Update feature"
git push origin main
```

Vercel이 자동으로:
1. 새 커밋 감지
2. 빌드 시작
3. 테스트 환경 배포 (프리뷰)
4. 프로덕션 배포 (main 브랜치)

## 📱 모바일 접근

배포된 사이트는 모바일에서도 완벽하게 작동합니다:
- 반응형 디자인
- 터치 최적화
- PWA 지원 가능 (향후 추가 시)

## 💰 비용

**Vercel 무료 플랜으로 충분합니다:**
- ✅ 무제한 배포
- ✅ 자동 HTTPS
- ✅ 100GB 대역폭/월
- ✅ 서버리스 함수 실행

**Supabase 무료 플랜:**
- ✅ 500MB 데이터베이스
- ✅ 5GB 파일 저장소
- ✅ 50,000 월간 활성 사용자
- ✅ 2GB 대역폭

## ✅ 배포 체크리스트

배포 전 확인:

- [ ] GitHub 저장소 생성 및 코드 푸시
- [ ] Supabase 프로젝트 생성 및 데이터 마이그레이션
- [ ] `.env.local` 파일 내용 확인 (복사 준비)
- [ ] `data.json` 파일 Git 제외 확인
- [ ] Vercel 계정 생성/로그인
- [ ] 프로젝트 Import
- [ ] 환경 변수 3개 입력
- [ ] Deploy 클릭
- [ ] 배포된 사이트 테스트

배포 후 확인:

- [ ] 로그인/회원가입 테스트
- [ ] 관리자 패널 접근 확인
- [ ] 코인 지급/거래 테스트
- [ ] 모바일 디바이스에서 테스트
- [ ] Supabase 데이터 동기화 확인

## 🎉 완료!

배포가 완료되면:
- URL: `https://vcoin-wallet-xxx.vercel.app`
- 전 세계 어디서나 접근 가능
- HTTPS 보안 연결
- 자동 스케일링

---

문제가 발생하면:
- Vercel 지원: https://vercel.com/support
- Supabase 지원: https://supabase.com/docs
- Next.js 문서: https://nextjs.org/docs
