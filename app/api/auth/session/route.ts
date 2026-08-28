import { NextResponse } from 'next/server'

export async function GET() {
  const session = null
  const payload = { authenticated: false, user: null, session }

  // Mantém o formato legado e o formato { data } esperado pelo jogo.
  return NextResponse.json(
    { success: true, ...payload, data: payload, error: null },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
