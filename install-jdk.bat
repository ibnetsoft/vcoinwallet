@echo off
echo ========================================
echo JDK 17 설치 가이드
echo ========================================
echo.
echo JDK(Java Development Kit)가 필요합니다.
echo keytool 명령어를 사용하려면 JDK가 설치되어야 합니다.
echo.
echo 자동 설치를 진행하시겠습니까?
echo.
pause

echo.
echo 다운로드 페이지를 엽니다...
start https://download.oracle.com/java/17/latest/jdk-17_windows-x64_bin.exe

echo.
echo ========================================
echo 설치 후 다음 단계:
echo ========================================
echo 1. 다운로드된 파일 실행
echo 2. 설치 완료 후 명령 프롬프트 재시작
echo 3. 다시 keytool 명령 실행
echo ========================================
pause
