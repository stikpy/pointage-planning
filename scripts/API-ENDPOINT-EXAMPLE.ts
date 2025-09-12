
// Créer app/api/employees/route.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
    
    if (error) throw error
    
    return Response.json(data)
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const body = await request.json()
    const { data, error } = await supabase
      .from('employees')
      .insert(body)
      .select()
    
    if (error) throw error
    
    return Response.json(data)
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}
      