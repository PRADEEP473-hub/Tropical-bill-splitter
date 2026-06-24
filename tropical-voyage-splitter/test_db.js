const { createClient } = require('@supabase/supabase-js')
const supabase = createClient(
  'https://janoisbtxhchqjwfuvwt.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imphbm9pc2J0eGhjaHFqd2Z1dnd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyMTE3MTYsImV4cCI6MjA5Nzc4NzcxNn0.ptGTkUkGtJViH8hQa11IfzkbEeglflXgHRiYCcPrpgI'
)

async function test() {
  const { data, error } = await supabase.from('shared_groups').select('*').limit(1)
  if (error) {
    console.error('Error querying shared_groups:', error.message)
  } else {
    console.log('Successfully queried shared_groups:', data)
  }
}

test()
