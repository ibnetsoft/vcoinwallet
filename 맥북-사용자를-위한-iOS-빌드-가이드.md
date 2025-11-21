# 맥북 사용자를 위한 iOS 앱 빌드 가이드

안녕하세요! V COIN 앱의 iOS 버전을 빌드해주셔서 감사합니다.

---

## 📦 받은 파일 / 저장소 정보

**GitHub 저장소:**
```
https://github.com/ibnetsoft/vcoinwallet.git
```

**또는 ZIP 파일:**
- vcoin-wallet.zip 압축 해제

---

## ⚡ 빠른 시작 (5단계)

### 1️⃣ 프로젝트 준비

```bash
# GitHub에서 클론 (또는 ZIP 압축 해제)
git clone https://github.com/ibnetsoft/vcoinwallet.git
cd vcoinwallet/vcoin-wallet

# 의존성 설치
npm install

# iOS 플랫폼 자동 설정
npm run ios:init
```

### 2️⃣ Xcode로 프로젝트 열기

```bash
npm run ios:open
```

또는:
```bash
open ios/App/App.xcworkspace
```

### 3️⃣ Apple Developer 계정 연결

Xcode에서:
1. 프로젝트 선택 (왼쪽 패널)
2. **TARGETS** → **App** 선택
3. **Signing & Capabilities** 탭
4. **Team**: Apple Developer 계정 선택
   - 없으면: Xcode → Preferences → Accounts → "+" → Apple ID 추가
5. **Automatically manage signing** 체크

### 4️⃣ 앱 아이콘 설정 (선택사항)

1. Xcode에서 **Assets.xcassets** 선택
2. **AppIcon** 선택
3. 앱 아이콘 이미지 드래그 앤 드롭 (1024x1024 PNG)
   - 이미지는 프로젝트의 `public/vcoin_logo.png` 사용 가능

### 5️⃣ 빌드!

**시뮬레이터로 테스트:**
1. 상단에서 시뮬레이터 선택 (예: iPhone 15 Pro)
2. ⌘R (또는 Product → Run)

**실제 iPhone으로 테스트:**
1. iPhone USB 연결
2. 상단에서 연결된 iPhone 선택
3. ⌘R (또는 Product → Run)
4. iPhone에서: 설정 → 일반 → VPN 및 기기 관리 → 개발자 앱 신뢰

**App Store 배포용 빌드:**
1. 상단에서 **Any iOS Device (arm64)** 선택
2. **Product** → **Archive**
3. Archive 완료 후 **Distribute App**
4. **App Store Connect** 선택
5. 다음 단계 진행

---

## 📋 앱 정보

- **앱 이름**: V COIN
- **Bundle ID**: com.vcoin.wallet
- **버전**: 1.0.0
- **설명**: 3D SOLAR 태양광 발전 투자 시스템

---

## 🎯 빌드 결과물

### IPA 파일 (직접 설치용)

1. **Product** → **Archive**
2. Organizer에서 **Distribute App**
3. **Ad Hoc** 또는 **Development** 선택
4. **Export**
5. 저장 위치 선택 → IPA 파일 생성

**생성된 파일을 저에게 보내주세요:**
- `V COIN.ipa` 파일

### App Store Connect 업로드

1. **Product** → **Archive**
2. **Distribute App**
3. **App Store Connect** 선택
4. 업로드 완료 시 알려주세요!

---

## ❗ 문제 발생 시

### "No provisioning profile" 에러
```bash
# Xcode에서
Signing & Capabilities → Team 선택 → Automatically manage signing 체크
```

### 빌드 실패 시
```bash
# 터미널에서 캐시 삭제
cd ios/App
rm -rf Pods Podfile.lock
pod install
cd ../..
npm run ios:sync
```

### 기타 문제
IOS-BUILD-GUIDE.md 파일 참조

---

## 📞 연락처

문제가 있거나 완료했을 때 연락주세요!

---

## ✅ 체크리스트

- [ ] Xcode 설치됨 (App Store에서)
- [ ] Apple Developer 계정 있음
- [ ] 프로젝트 다운로드 완료
- [ ] `npm install` 완료
- [ ] `npm run ios:init` 완료
- [ ] Xcode에서 프로젝트 열림
- [ ] Signing 설정 완료
- [ ] 시뮬레이터 테스트 완료
- [ ] IPA 파일 생성 또는 App Store Connect 업로드 완료

---

## 🙏 감사합니다!

도움 주셔서 정말 감사합니다!
