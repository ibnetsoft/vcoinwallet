const webpush = require('web-push')

// VAPID 키 생성
const vapidKeys = webpush.generateVAPIDKeys()

console.log('='.repeat(60))
console.log('VAPID Keys Generated Successfully!')
console.log('='.repeat(60))
console.log('\nAdd these to your .env file:\n')
console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`)
console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`)
console.log(`VAPID_EMAIL=admin@3dvcoin.com`)
console.log('\n' + '='.repeat(60))
console.log('\nIMPORTANT:')
console.log('1. Copy the above keys to your .env file')
console.log('2. Restart your development server')
console.log('3. Keep the private key secret and secure!')
console.log('='.repeat(60))
