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

async function checkUserCount() {
  console.log('Checking total user count...')

  // Count all users
  const { count, error } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })

  if (error) {
    console.error('Error:', error)
    return
  }

  console.log('Total users in database:', count)

  // Fetch with pagination
  let allUsers = []
  let page = 0
  const pageSize = 1000
  let hasMore = true

  while (hasMore) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('member_number', { ascending: true })
      .range(page * pageSize, (page + 1) * pageSize - 1)

    const fetchedCount = data ? data.length : 0
    console.log(`Page ${page}: fetched ${fetchedCount} users`)

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

  console.log('Total users fetched:', allUsers.length)
}

checkUserCount()
