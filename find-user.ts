import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://owudrvqzcsjbfnrenveg.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im93dWRydnF6Y3NqYmZucmVudmVnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTUxOTQ4MSwiZXhwIjoyMDc3MDk1NDgxfQ.koTbepOM-onzPcrFau3GJugkxyThZ_mEPB0rlSFsQ7E'

const supabase = createClient(supabaseUrl, supabaseKey)

async function findUsers() {
    const codes = ['WVADGD', 'G2TZ2T']

    for (const referralCode of codes) {
        console.log(`\nSearching for user with referral code: ${referralCode}...`)

        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('referral_code', referralCode)
            .single()

        if (error) {
            if (error.code === 'PGRST116') {
                console.log('User not found.')
            } else {
                console.error('Error fetching user:', error)
            }
        } else if (user) {
            console.log('--- User Found ---')
            console.log('Name:', user.name)
            console.log('Phone:', user.phone)
            console.log('Password:', user.password)
            console.log('Role:', user.role)
            console.log('Member Number:', user.member_number)
        }
    }
}

findUsers().then(() => process.exit(0))
