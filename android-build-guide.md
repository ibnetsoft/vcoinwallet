# V COIN 안드로이드 앱 빌드 가이드

## 사전 요구사항

### 1. Android Studio 설치
- [Android Studio 다운로드](https://developer.android.com/studio)
- 설치 시 Android SDK, Android SDK Platform-Tools, Android SDK Build-Tools 포함

### 2. Java Development Kit (JDK) 설치
- JDK 17 이상 필요
- [Oracle JDK](https://www.oracle.com/java/technologies/downloads/) 또는 [OpenJDK](https://openjdk.org/) 설치

## 빌드 방법

### 1단계: Capacitor 동기화

```bash
cd c:\Users\kimse\Downloads\vcoin\vcoin-wallet
npx cap sync android
```

### 2단계: Android Studio로 프로젝트 열기

```bash
npx cap open android
```

또는 Android Studio에서 직접:
- File → Open → `c:\Users\kimse\Downloads\vcoin\vcoin-wallet\android` 폴더 선택

### 3단계: 앱 아이콘 및 정보 설정

#### 앱 이름 변경
`android/app/src/main/res/values/strings.xml`:
```xml
<resources>
    <string name="app_name">V COIN</string>
    <string name="title_activity_main">V COIN</string>
    <string name="package_name">com.vcoin.wallet</string>
    <string name="custom_url_scheme">vcoin</string>
</resources>
```

#### 앱 아이콘 교체
1. Android Studio에서 `res` 폴더 우클릭
2. New → Image Asset
3. Icon Type: Launcher Icons (Adaptive and Legacy)
4. Path: 로고 이미지 파일 선택 (`public/vcoin_logo.png`)
5. Next → Finish

### 4단계: 서명 키 생성 (Release 빌드용)

```bash
keytool -genkey -v -keystore vcoin-release-key.keystore -alias vcoin-key-alias -keyalg RSA -keysize 2048 -validity 10000
```

입력 정보:
- 비밀번호: (안전한 비밀번호 입력)
- 이름: V COIN
- 조직: 3D SUN TECH
- 위치: Seoul
- 국가: KR

### 5단계: Gradle 설정 (서명 정보 추가)

`android/app/build.gradle` 파일에 서명 정보 추가:

```gradle
android {
    ...

    signingConfigs {
        release {
            storeFile file('../../vcoin-release-key.keystore')
            storePassword 'YOUR_KEYSTORE_PASSWORD'
            keyAlias 'vcoin-key-alias'
            keyPassword 'YOUR_KEY_PASSWORD'
        }
    }

    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

### 6단계: APK 빌드

Android Studio에서:
1. Build → Generate Signed Bundle / APK
2. APK 선택 → Next
3. Key store path: `vcoin-release-key.keystore` 선택
4. 비밀번호 입력
5. Next → Release 선택 → Finish

또는 명령줄에서:
```bash
cd android
./gradlew assembleRelease
```

빌드된 APK 위치:
```
android/app/build/outputs/apk/release/app-release.apk
```

### 7단계: AAB 빌드 (Google Play Store용)

Android Studio에서:
1. Build → Generate Signed Bundle / APK
2. **Android App Bundle** 선택 → Next
3. Key store path: `vcoin-release-key.keystore` 선택
4. 비밀번호 입력
5. Next → Release 선택 → Finish

또는 명령줄에서:
```bash
cd android
./gradlew bundleRelease
```

빌드된 AAB 위치:
```
android/app/build/outputs/bundle/release/app-release.aab
```

## 앱 서명 키 정보 확인

```bash
keytool -list -v -keystore vcoin-release-key.keystore -alias vcoin-key-alias
```

SHA-1, SHA-256 해시가 표시됩니다. (Google Play Console에 필요)

## 테스트

### Debug 빌드로 테스트
```bash
cd android
./gradlew installDebug
```

### 실제 기기에서 테스트
1. 안드로이드 기기 USB 연결
2. 개발자 옵션 활성화
3. USB 디버깅 허용
4. Android Studio에서 Run (▶️) 버튼 클릭

## 주의사항

1. **서명 키 백업**: `vcoin-release-key.keystore` 파일은 절대 분실하지 말 것!
   - 분실 시 앱 업데이트 불가능
   - 안전한 곳에 백업 필수

2. **비밀번호 관리**: keystore 비밀번호를 안전하게 보관

3. **버전 관리**:
   - `android/app/build.gradle`에서 `versionCode`와 `versionName` 업데이트
   - 앱 업데이트 시마다 증가 필요

4. **권한 설정**:
   - `android/app/src/main/AndroidManifest.xml`에서 필요한 권한 확인
   - 인터넷, 카메라, 알림 등

## 앱 URL 구조

현재 설정:
- Production URL: `https://vcoinwallet.vercel.app`
- 앱이 웹뷰로 이 URL을 로드합니다
- API 호출은 자동으로 이 서버로 전송됩니다

## 문제 해결

### Gradle 빌드 실패
```bash
cd android
./gradlew clean
./gradlew assembleRelease
```

### Capacitor 동기화 오류
```bash
npx cap sync android --force
```

### 앱 권한 문제
`android/app/src/main/AndroidManifest.xml` 확인:
```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
```

## 자동 빌드 스크립트

Windows에서 빠른 빌드:
```bash
npm run build:android:apk
npm run build:android:aab
```

## 참고 자료

- [Capacitor 공식 문서](https://capacitorjs.com/)
- [Android 개발자 가이드](https://developer.android.com/guide)
- [Google Play Console](https://play.google.com/console)
