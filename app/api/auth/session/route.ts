import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ user: null, session: null }, { headers: { 'Cache-Control': 'no-store' } })
}
