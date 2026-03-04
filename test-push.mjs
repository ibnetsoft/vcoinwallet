// 푸시 알림 테스트 스크립트
import { createClient } from '@supabase/supabase-js'
import webpush from 'web-push'

const supabaseUrl = 'https://kowjnxjfpdkkgtxaogls.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtvd2pueGpmcGRra2d0eGFvZ2xzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMDk2MjU4NywiZXhwIjoyMDQ2NTM4NTg3fQ.lulXIMnFuED6lLgfxRB5rmBFKssNBu0j5sJq--8Dn5k'

const supabase = createClient(supabaseUrl, supabaseKey)

// VAPID 키
const VAPID_PUBLIC_KEY = 'BNcMBhLhJzghPT3kz75xdJPH_fBwgGvPmd7joVNKMOZW6bXNqDhglox-k56aNfeAs2t8FYocWG-6SeOMZFKu34g'
const VAPID_PRIVATE_KEY = '4C7pqNdTXX6n65zi-Y3mVFxyfpVdbrGMAPLMfPDGh5o'

webpush.setVapidDetails(
  'mailto:admin@3vcoin.com',
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
)

async function testPush() {
  console.log('=== 푸시 알림 테스트 ===\n')

  // 1. 푸시 구독 목록 확인
  const { data: subscriptions, error } = await supabase
    .from('push_subscriptions')
    .select('*')

  if (error) {
    console.error('구독 목록 조회 실패:', error)
    return
  }

  console.log(`총 ${subscriptions.length}개의 푸시 구독이 등록되어 있습니다.\n`)

  if (subscriptions.length === 0) {
    console.log('등록된 푸시 구독이 없습니다.')
    console.log('웹사이트에서 알림 허용을 해야 푸시 구독이 등록됩니다.')
    return
  }

  // 2. 테스트 푸시 발송
  console.log('테스트 푸시 발송 중...\n')

  let successCount = 0
  let failCount = 0

  for (const sub of subscriptions) {
    try {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth
        }
      }

      const payload = JSON.stringify({
        title: '🔔 푸시 테스트',
        body: '푸시 알림이 정상적으로 작동합니다!',
        icon: '/icon-192.png',
        url: '/'
      })

      await webpush.sendNotification(pushSubscription, payload)
      console.log(`✅ 성공: ${sub.user_id}`)
      successCount++
    } catch (err) {
      console.log(`❌ 실패: ${sub.user_id} - ${err.message}`)
      failCount++

      // 만료된 구독 삭제
      if (err.statusCode === 410 || err.statusCode === 404) {
        await supabase
          .from('push_subscriptions')
          .delete()
          .eq('id', sub.id)
        console.log(`   (만료된 구독 삭제됨)`)
      }
    }
  }

  console.log(`\n=== 결과 ===`)
  console.log(`성공: ${successCount}개`)
  console.log(`실패: ${failCount}개`)
}

testPush()
