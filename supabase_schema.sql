-- V COIN Wallet Database Schema for Supabase
-- 이 SQL을 Supabase Studio의 SQL Editor에서 실행하세요
-- https://supabase.com/dashboard/project/owudrvqzcsjbfnrenveg/sql/new

-- 1. User 테이블 생성
CREATE TABLE IF NOT EXISTS "User" (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT UNIQUE NOT NULL,
    email TEXT,
    password TEXT NOT NULL,
    "referralCode" TEXT UNIQUE NOT NULL,
    "referrerId" TEXT,
    "securityCoins" INTEGER NOT NULL DEFAULT 0,
    "dividendCoins" INTEGER NOT NULL DEFAULT 0,
    "memberNumber" INTEGER UNIQUE NOT NULL,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_referrerId_fkey" FOREIGN KEY ("referrerId")
        REFERENCES "User"(id) ON DELETE SET NULL ON UPDATE CASCADE
);

-- 2. Transaction 테이블 생성
CREATE TABLE IF NOT EXISTS "Transaction" (
    id TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL,
    type TEXT NOT NULL,
    "coinType" TEXT NOT NULL,
    amount INTEGER NOT NULL,
    balance INTEGER NOT NULL,
    description TEXT,
    "referralId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId")
        REFERENCES "User"(id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- 3. Dividend 테이블 생성
CREATE TABLE IF NOT EXISTS "Dividend" (
    id TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL,
    amount DOUBLE PRECISION NOT NULL,
    coins INTEGER NOT NULL,
    rate DOUBLE PRECISION NOT NULL,
    period TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING',
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Dividend_userId_fkey" FOREIGN KEY ("userId")
        REFERENCES "User"(id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- 4. SystemConfig 테이블 생성
CREATE TABLE IF NOT EXISTS "SystemConfig" (
    id TEXT PRIMARY KEY DEFAULT 'config',
    "currentMemberCount" INTEGER NOT NULL DEFAULT 0,
    "securityCoinNewUser" INTEGER NOT NULL DEFAULT 500,
    "securityCoinReferral" INTEGER NOT NULL DEFAULT 1000,
    "dividendCoinPer100" INTEGER NOT NULL DEFAULT 10000,
    "dividendCoinReferral" INTEGER NOT NULL DEFAULT 1000,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 5. 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS "Transaction_userId_idx" ON "Transaction"("userId");
CREATE INDEX IF NOT EXISTS "Transaction_createdAt_idx" ON "Transaction"("createdAt");
CREATE INDEX IF NOT EXISTS "Dividend_userId_idx" ON "Dividend"("userId");
CREATE INDEX IF NOT EXISTS "Dividend_status_idx" ON "Dividend"(status);
CREATE INDEX IF NOT EXISTS "User_phone_idx" ON "User"(phone);
CREATE INDEX IF NOT EXISTS "User_email_idx" ON "User"(email);
CREATE INDEX IF NOT EXISTS "User_referralCode_idx" ON "User"("referralCode");

-- 6. SystemConfig 초기 데이터 삽입
INSERT INTO "SystemConfig" (id, "currentMemberCount", "securityCoinNewUser", "securityCoinReferral", "dividendCoinPer100", "dividendCoinReferral")
VALUES ('config', 0, 500, 1000, 10000, 1000)
ON CONFLICT (id) DO NOTHING;

-- 7. 관리자 계정 생성 (비밀번호: admin1234, bcrypt 해시)
-- 주의: 실제 bcrypt 해시는 애플리케이션에서 생성해야 합니다
-- 아래는 임시 플레이스홀더입니다. 첫 회원가입 후 수동으로 isAdmin을 true로 변경하거나
-- 애플리케이션 시작 시 자동으로 생성되도록 합니다

-- 완료!
-- 다음 단계:
-- 1. 이 SQL을 Supabase SQL Editor에 복사
-- 2. "Run" 버튼 클릭
-- 3. 성공 메시지 확인
-- 4. 애플리케이션에서 회원가입 테스트
