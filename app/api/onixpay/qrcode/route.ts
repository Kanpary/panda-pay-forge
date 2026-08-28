import { NextResponse } from 'next/server'
import { insertDeposit } from '../../../../lib/onixpay-db'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const userId = typeof body.user_id === 'string' ? body.user_id : ''
    const amount = Number(body.amount)
    if (!userId || !Number.isFinite(amount) || amount <= 0) return NextResponse.json({ message: 'user_id e amount são obrigatórios.' }, { status: 400 })

    const response = await fetch('https://onixpay.space/api/v2/pix/qrcode.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: process.env.ONIXPAY_CLIENT_ID,
        client_secret: process.env.ONIXPAY_CLIENT_SECRET,
        amount,
        webhook_url: `${new URL(request.url).origin}/api/onixpay/webhook`,
      }),
      cache: 'no-store',
    })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) return NextResponse.json(data, { status: response.status })

    await insertDeposit({
      userId,
      amount,
      transactionId: data.idTransaction ?? data.transaction_id ?? null,
      externalId: data.id ?? null,
      pixCode: data.qrcode ?? data.pix_code ?? null,
      response: data,
    })
    return NextResponse.json(data)
  } catch (error) {
    console.error('[v0] OnixPay QR error', error)
    return NextResponse.json({ message: 'Não foi possível criar o PIX.' }, { status: 500 })
  }
}
