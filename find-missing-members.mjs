import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load .env.local
dotenv.config({ path: join(__dirname, '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function findMissingMembers() {
  console.log('Fetching all users...')

  // Fetch all users
  let allUsers = []
  let page = 0
  const pageSize = 1000
  let hasMore = true

  while (hasMore) {
    const { data, error } = await supabase
      .from('users')
      .select('member_number, name, phone, status')
      .order('member_number', { ascending: true })
      .range(page * pageSize, (page + 1) * pageSize - 1)

    if (error) {
      console.error('Error:', error)
      break
    }

    if (data && data.length > 0) {
      allUsers = [...allUsers, ...data]
      hasMore = data.length === pageSize
      page++
    } else {
      hasMore = false
    }
  }

  console.log(`Total users fetched: ${allUsers.length}`)

  // Find max member number
  const maxMemberNumber = Math.max(...allUsers.map(u => u.member_number))
  console.log(`Max member number: ${maxMemberNumber}`)

  // Find missing member numbers
  const existingNumbers = new Set(allUsers.map(u => u.member_number))
  const missingNumbers = []

  for (let i = 1; i <= maxMemberNumber; i++) {
    if (!existingNumbers.has(i)) {
      missingNumbers.push(i)
    }
  }

  console.log(`\nMissing member numbers (${missingNumbers.length}):`, missingNumbers)

  // Check if there are deleted users
  const deletedUsers = allUsers.filter(u => u.status === 'DELETED')
  if (deletedUsers.length > 0) {
    console.log(`\nDeleted users (${deletedUsers.length}):`)
    deletedUsers.forEach(u => {
      console.log(`  #${u.member_number} - ${u.name} (${u.phone}) - Status: ${u.status}`)
    })
  }

  // Check if there are blocked users
  const blockedUsers = allUsers.filter(u => u.status === 'BLOCKED')
  if (blockedUsers.length > 0) {
    console.log(`\nBlocked users (${blockedUsers.length}):`)
    blockedUsers.forEach(u => {
      console.log(`  #${u.member_number} - ${u.name} (${u.phone}) - Status: ${u.status}`)
    })
  }

  console.log(`\nSummary:`)
  console.log(`  Total users in DB: ${allUsers.length}`)
  console.log(`  Max member number: ${maxMemberNumber}`)
  console.log(`  Missing member numbers: ${missingNumbers.length}`)
  console.log(`  Expected total: ${maxMemberNumber}`)
  console.log(`  Difference: ${maxMemberNumber - allUsers.length}`)
}

findMissingMembers()
