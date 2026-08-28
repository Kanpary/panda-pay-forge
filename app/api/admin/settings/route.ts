import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const admin = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { autoRefreshToken: false, persistSession: false } })

async function isAdmin(request: Request) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return false
  const { data } = await admin.auth.getUser(token)
  return data.user?.app_metadata?.role === 'admin' || data.user?.email === 'detroit.system@gmail.com'
}

export async function GET(request: Request) {
  if (!await isAdmin(request)) return NextResponse.json({ message: 'Não autorizado.' }, { status: 401 })
  const { data } = await admin.from('app_settings').select('key,value').eq('key', 'onixpay_sandbox').maybeSingle()
  return NextResponse.json({ sandbox: data?.value === 'true' })
}

export async function POST(request: Request) {
  if (!await isAdmin(request)) return NextResponse.json({ message: 'Não autorizado.' }, { status: 401 })
  const body = await request.json().catch(() => ({}))
  const sandbox = body.sandbox === true
  const { error } = await admin.from('app_settings').upsert({ key: 'onixpay_sandbox', value: String(sandbox) }, { onConflict: 'key' })
  if (error) return NextResponse.json({ message: 'Não foi possível salvar a configuração.' }, { status: 500 })
  return NextResponse.json({ sandbox })
}
