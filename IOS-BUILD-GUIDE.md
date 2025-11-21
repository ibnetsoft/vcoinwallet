# iOS 앱 빌드 가이드 (Mac 전용)

## 📋 사전 요구사항

- **Mac 컴퓨터** (macOS 필수)
- **Xcode** (App Store에서 무료 다운로드)
- **Apple Developer Account** (앱 배포 시 필요, 연간 $99)
- **Node.js 18 이상**

---

## 🚀 iOS 앱 빌드 단계

### 1단계: 프로젝트 설정

```bash
# 저장소 클론 (또는 ZIP 파일 압축 해제)
git clone https://github.com/ibnetsoft/vcoinwallet.git
cd vcoinwallet/vcoin-wallet

# 의존성 설치
npm install

# Capacitor iOS 플랫폼 추가
npm install @capacitor/ios
npx cap add ios

# iOS 프로젝트 동기화
npx cap sync ios
```

### 2단계: Xcode로 프로젝트 열기

```bash
npx cap open ios
```

또는:
```bash
open ios/App/App.xcworkspace
```

**⚠️ 주의**: `.xcworkspace` 파일을 열어야 합니다! (`.xcodeproj`가 아님)

### 3단계: 앱 설정

Xcode가 열리면:

#### 1) 프로젝트 설정
- 왼쪽 패널에서 **App** 프로젝트 선택
- **TARGETS** → **App** 선택

#### 2) General 탭 설정
- **Display Name**: `V COIN`
- **Bundle Identifier**: `com.vcoin.wallet`
- **Version**: `1.0`
- **Build**: `1`

#### 3) Signing & Capabilities 탭
- **Team**: Apple Developer 계정 선택
  - 없으면 "Add an Account..." 클릭하여 Apple ID 추가
- **Automatically manage signing** 체크
- 개발용 인증서가 자동 생성됩니다

#### 4) Info 탭 확인
- **Bundle name**: V COIN
- **Bundle display name**: V COIN

### 4단계: 앱 아이콘 설정

#### 방법 1: 자동 생성 (권장)
1. Xcode에서 **Assets.xcassets** 선택
2. **AppIcon** 선택
3. 로고 이미지 드래그 앤 드롭 (1024x1024 PNG)
4. Xcode가 자동으로 모든 크기 생성

#### 방법 2: 수동 설정
각 크기별로 이미지 추가:
- 20pt, 29pt, 40pt, 60pt (2x, 3x)
- 1024pt (App Store)

### 5단계: 시뮬레이터에서 테스트

1. Xcode 상단에서 시뮬레이터 선택 (예: iPhone 15 Pro)
2. **Product** → **Run** (또는 ⌘R)
3. 시뮬레이터에서 앱 실행 확인

### 6단계: 실제 기기에서 테스트

1. iPhone을 Mac에 USB 연결
2. iPhone에서 "이 컴퓨터를 신뢰하시겠습니까?" → **신뢰**
3. Xcode 상단에서 연결된 iPhone 선택
4. **Product** → **Run** (⌘R)
5. iPhone에서:
   - 설정 → 일반 → VPN 및 기기 관리
   - 개발자 앱 → 신뢰

### 7단계: Archive 빌드 (배포용)

#### TestFlight / App Store 배포용:

1. Xcode에서 **Any iOS Device (arm64)** 선택
2. **Product** → **Archive**
3. 빌드 완료 후 Organizer 창 자동 열림
4. **Distribute App** 클릭
5. 배포 방법 선택:
   - **App Store Connect**: TestFlight 및 App Store 배포
   - **Ad Hoc**: 테스트 기기에 직접 설치
   - **Development**: 개발 팀 내부 테스트
6. 다음 단계 따라가며 업로드

#### IPA 파일 생성 (직접 설치용):

1. **Product** → **Archive**
2. Organizer에서 **Distribute App**
3. **Ad Hoc** 또는 **Development** 선택
4. **Export** 선택
5. IPA 파일 저장 위치 선택

---

## 📱 앱 정보

- **앱 이름**: V COIN
- **Bundle ID**: com.vcoin.wallet
- **버전**: 1.0
- **웹 URL**: https://vcoinwallet.vercel.app

이 앱은 웹뷰 방식으로 작동합니다. Vercel에 호스팅된 웹사이트를 iOS 앱으로 감싼 형태입니다.

---

## 🍎 Apple Developer 계정 설정

### App Store Connect 설정

1. https://appstoreconnect.apple.com 접속
2. **My Apps** → **+** → **New App**
3. 정보 입력:
   - **Platforms**: iOS
   - **Name**: V COIN
   - **Primary Language**: Korean
   - **Bundle ID**: com.vcoin.wallet
   - **SKU**: vcoin-wallet-001
4. 앱 설명, 스크린샷, 개인정보 보호 정책 URL 등 입력
5. Archive 업로드 후 심사 제출

---

## 📸 필요한 스크린샷 크기

App Store 제출 시 필요:
- **6.5" Display** (iPhone 15 Pro Max): 1284 x 2778
- **5.5" Display** (iPhone 8 Plus): 1242 x 2208

각 크기별로 최소 3-5장의 스크린샷 필요

---

## 🔧 문제 해결

### "No signing certificate" 에러
- Xcode → Preferences → Accounts
- Apple ID 추가
- "Download Manual Profiles" 클릭

### "Provisioning profile" 에러
- Target 설정 → Signing & Capabilities
- "Automatically manage signing" 체크
- Team 선택

### 빌드 실패
```bash
# 캐시 삭제 후 재시도
cd ios
rm -rf Pods Podfile.lock
pod install
```

### 웹뷰가 빈 화면
- `capacitor.config.ts`에서 `server.url` 확인
- 인터넷 연결 확인

---

## 📝 중요 파일

- **ios/App/App.xcworkspace**: Xcode 프로젝트 파일
- **capacitor.config.ts**: Capacitor 설정
- **ios/App/App/Info.plist**: 앱 정보 및 권한
- **ios/App/App/Assets.xcassets/AppIcon.appiconset**: 앱 아이콘

---

## 🎯 빠른 명령어 정리

```bash
# iOS 플랫폼 추가
npm install @capacitor/ios
npx cap add ios

# 동기화
npx cap sync ios

# Xcode 열기
npx cap open ios

# 의존성 재설치 (문제 발생 시)
cd ios/App
pod install
cd ../..
npx cap sync ios
```

---

## 📞 도움이 필요하면

- [Capacitor iOS 문서](https://capacitorjs.com/docs/ios)
- [Xcode 가이드](https://developer.apple.com/xcode/)
- [App Store Connect 가이드](https://developer.apple.com/app-store-connect/)

---

## ✅ 체크리스트

빌드 전 확인사항:
- [ ] Xcode 최신 버전 설치
- [ ] Apple Developer 계정 준비
- [ ] Bundle ID 확인: com.vcoin.wallet
- [ ] 앱 아이콘 준비 (1024x1024 PNG)
- [ ] 인터넷 연결 확인
- [ ] Signing & Capabilities 설정 완료

배포 전 확인사항:
- [ ] 시뮬레이터 테스트 완료
- [ ] 실제 기기 테스트 완료
- [ ] 스크린샷 준비
- [ ] 앱 설명 작성
- [ ] 개인정보 보호 정책 URL
- [ ] App Store Connect 앱 등록
