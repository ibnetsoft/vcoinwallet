# 안드로이드 서명 키 생성 가이드

## 문제: keytool을 찾을 수 없음

`keytool` 명령어를 사용하려면 **JDK(Java Development Kit)**가 필요합니다.
현재 JRE(Java Runtime Environment)만 설치되어 있습니다.

## 해결 방법 (2가지 중 선택)

---

## 방법 1: Android Studio에서 생성 (추천 ⭐)

가장 쉬운 방법입니다!

### 1단계: Android Studio 설치
- [Android Studio 다운로드](https://developer.android.com/studio)
- 설치 시 JDK도 함께 설치됩니다

### 2단계: 프로젝트 열기
```bash
npm run android:open
```

### 3단계: 서명 키 생성
1. Android Studio 메뉴: **Build** → **Generate Signed Bundle / APK**
2. **Android App Bundle** 또는 **APK** 선택 → **Next**
3. **Create new...** 클릭

### 4단계: 키 정보 입력
- **Key store path**: 저장 위치 선택 (예: `C:\Users\kimse\Downloads\vcoin\vcoin-wallet\vcoin-release-key.jks`)
- **Password**: 강력한 비밀번호 입력 (예: `VCoin2025!@#$`)
- **Confirm**: 비밀번호 재입력
- **Alias**: `vcoin-key-alias`
- **Password**: 위와 동일한 비밀번호
- **Validity**: `10000` (일)

**Certificate 정보:**
- **First and Last Name**: `V COIN`
- **Organizational Unit**: `Development`
- **Organization**: `3D SUN TECH`
- **City or Locality**: `Seoul`
- **State or Province**: `Seoul`
- **Country Code**: `KR`

### 5단계: OK → Next
서명 키가 생성되고 APK/AAB 빌드도 함께 진행됩니다!

---

## 방법 2: JDK 설치 후 명령줄 사용

### 1단계: JDK 17 다운로드
**Option A: Oracle JDK (무료)**
- https://www.oracle.com/java/technologies/downloads/#java17
- Windows x64 Installer 다운로드

**Option B: OpenJDK (무료, 오픈소스)**
- https://adoptium.net/temurin/releases/
- Version: 17 (LTS)
- Operating System: Windows
- Architecture: x64
- Package Type: JDK
- **.msi** 파일 다운로드

### 2단계: JDK 설치
1. 다운로드한 파일 실행
2. 설치 경로 확인 (예: `C:\Program Files\Java\jdk-17`)
3. **"Set JAVA_HOME variable"** 옵션 체크
4. 설치 완료

### 3단계: 환경변수 확인 (자동 설정 안 된 경우)
1. Windows 검색 → "환경 변수" 입력
2. "시스템 환경 변수 편집" 클릭
3. **시스템 변수**에서 **Path** 선택 → **편집**
4. **새로 만들기** → `C:\Program Files\Java\jdk-17\bin` 추가
5. **확인** → **확인**

### 4단계: CMD 재시작 후 확인
```bash
java -version
keytool
```

둘 다 정상적으로 실행되면 성공!

### 5단계: 서명 키 생성
```bash
cd c:\Users\kimse\Downloads\vcoin\vcoin-wallet

keytool -genkey -v -keystore vcoin-release-key.keystore -alias vcoin-key-alias -keyalg RSA -keysize 2048 -validity 10000
```

질문에 답변:
1. **키 저장소 비밀번호**: 강력한 비밀번호 입력 (예: `VCoin2025!@#$`)
2. **이름과 성**: `V COIN`
3. **조직 단위**: `Development`
4. **조직**: `3D SUN TECH`
5. **구/군/시**: `Seoul`
6. **시/도**: `Seoul`
7. **국가 코드**: `KR`
8. **확인**: `예` 또는 `y`
9. **키 비밀번호**: 엔터 (키 저장소 비밀번호와 동일)

---

## 빠른 JDK 설치 링크

### Windows용 직접 다운로드
- **Oracle JDK 17**: https://download.oracle.com/java/17/latest/jdk-17_windows-x64_bin.exe
- **OpenJDK 17**: https://github.com/adoptium/temurin17-binaries/releases/download/jdk-17.0.12%2B7/OpenJDK17U-jdk_x64_windows_hotspot_17.0.12_7.msi

---

## 생성된 파일 확인

성공하면 다음 파일이 생성됩니다:
- `vcoin-release-key.keystore` 또는 `vcoin-release-key.jks`

## ⚠️ 매우 중요!

**반드시 백업하세요:**
1. 생성된 키 파일 (`vcoin-release-key.keystore`)
2. 비밀번호 (안전한 곳에 메모)

**분실 시:**
- 앱 업데이트 불가능
- 새로운 앱으로 다시 출시해야 함
- 기존 사용자들이 새로 설치해야 함

---

## 다음 단계

키 생성 후:
1. Android Studio에서 `Build → Generate Signed Bundle / APK`
2. 생성한 키 선택
3. Release 빌드 생성
4. `android/app/build/outputs/` 폴더에서 APK/AAB 파일 확인

---

## 문제 해결

### keytool이 여전히 작동하지 않는 경우
1. CMD를 완전히 닫고 다시 열기
2. 컴퓨터 재부팅
3. JDK 재설치

### Android Studio를 사용할 수 없는 경우
JDK 설치는 필수입니다. 위 방법 2를 따라 진행하세요.
