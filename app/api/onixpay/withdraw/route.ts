import { createHmac as createHmacDigest } from 'node:crypto'
import { NextResponse } from 'next/server'

function createHmac(payload: string, secret?: string) {
  return createHmacDigest('sha512', secret ?? '').update(payload).digest('hex')
}
import { getOnixPayCredentials, getOnixPaySandbox, getOnixPayUrl } from '../../../../lib/onixpay-environment'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const userId = typeof body.user_id === 'string' ? body.user_id.trim() : ''
    const amount = Number(body.amount)
    const pixKey = typeof body.pix_key === 'string' ? body.pix_key.trim() : ''
    const pixKeyType = typeof body.pix_key_type === 'string' ? body.pix_key_type.trim() : ''

    if (!userId || !Number.isFinite(amount) || amount <= 0 || !pixKey) {
      return NextResponse.json({ message: 'user_id, amount e pix_key são obrigatórios.' }, { status: 400 })
    }

    const sandbox = await getOnixPaySandbox()
    const payload = JSON.stringify({
      user_id: userId,
      amount,
      pix_key: pixKey,
      ...(pixKeyType ? { pix_key_type: pixKeyType } : {}),
      webhook_url: `${new URL(request.url).origin}/api/onixpay/webhook`,
      sandbox,
    })
    const { client_id, client_secret } = getOnixPayCredentials()
    const response = await fetch(`${getOnixPayUrl(sandbox)}/pix/withdraw.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `ApiKey ${client_id}:${client_secret}`,
        hmac: createHmac(payload, client_secret),
      },
      body: payload,
      cache: 'no-store',
    })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) return NextResponse.json(data, { status: response.status })
    return NextResponse.json(data)
  } catch (error) {
    console.error('[v0] OnixPay withdraw error', error)
    return NextResponse.json({ message: 'Não foi possível solicitar o saque.' }, { status: 500 })
  }
}
