import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    let query = supabase.from('employees').select('*')
    
    if (id) {
      query = query.eq('id', id)
    }
    
    const { data, error } = await query
    
    if (error) throw error
    
    return NextResponse.json(data)
  } catch (error: any) {
    console.error('API Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const { data, error } = await supabase
      .from('employees')
      .insert(body)
      .select()
    
    if (error) throw error
    
    return NextResponse.json(data)
  } catch (error: any) {
    console.error('API Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
