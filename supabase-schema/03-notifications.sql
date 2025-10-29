-- 알림(notifications) 테이블 생성
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('REFERRAL_SIGNUP', 'COIN_GRANTED', 'SYSTEM')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  related_user_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- user_id에 대한 인덱스 (빠른 조회)
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);

-- 푸시 구독(push_subscriptions) 테이블 생성
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- user_id에 대한 인덱스
  CONSTRAINT fk_user_push FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,

  -- endpoint는 유니크해야 함 (같은 디바이스 중복 방지)
  CONSTRAINT unique_endpoint UNIQUE(endpoint)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON public.push_subscriptions(user_id);

COMMENT ON TABLE public.notifications IS '사용자 알림 테이블';
COMMENT ON TABLE public.push_subscriptions IS '푸시 알림 구독 정보 테이블';
