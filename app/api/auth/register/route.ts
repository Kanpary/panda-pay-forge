import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabaseClient() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_PUBLISHABLE_KEY
  if (!url || !key) throw new Error('Supabase client configuration is missing')
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    const password = typeof body.password === 'string' ? body.password : ''
    const username = typeof body.username === 'string' ? body.username.trim() : ''
    if (!email || !password) return NextResponse.json({ success: false, error: 'E-mail e senha são obrigatórios.' }, { status: 400 })
    if (password.length < 6) return NextResponse.json({ success: false, error: 'A senha deve ter pelo menos 6 caracteres.' }, { status: 400 })

    const { data, error } = await getSupabaseClient().auth.signUp({ email, password, options: { data: username ? { username } : undefined } })
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 400 })

    return NextResponse.json({ success: true, user: data.user, session: data.session, data: { user: data.user, session: data.session }, error: null })
  } catch {
    return NextResponse.json({ success: false, error: 'Não foi possível conectar à API de autenticação.' }, { status: 500 })
  }
}
