import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const raw = await request.text()
  const secret = request.headers.get('x-webhook-secret') ?? request.headers.get('x-onixpay-secret')
  if (process.env.ONIXPAY_WEBHOOK_SECRET && secret !== process.env.ONIXPAY_WEBHOOK_SECRET) return NextResponse.json({ message: 'Webhook não autorizado.' }, { status: 401 })
  console.log('[v0] OnixPay webhook recebido', raw.slice(0, 500))
  return NextResponse.json({ received: true })
}
