import { createHmac as createHmacDigest } from 'node:crypto'
import { NextResponse } from 'next/server'

function createHmac(payload: string, secret?: string) {
  return createHmacDigest('sha512', secret ?? '').update(payload).digest('hex')
}
import { insertDeposit } from '../../../../lib/onixpay-db'
import { getOnixPayCredentials, getOnixPaySandbox, getOnixPayUrl } from '../../../../lib/onixpay-environment'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const userId = typeof body.user_id === 'string' ? body.user_id : ''
    const amount = Number(body.amount)
    if (!userId || !Number.isFinite(amount) || amount <= 0) return NextResponse.json({ message: 'user_id e amount são obrigatórios.' }, { status: 400 })

    const sandbox = await getOnixPaySandbox()
    const { client_id, client_secret } = getOnixPayCredentials()
    const payload = new URLSearchParams({
      client_id,
      client_secret,
      nome: typeof body.nome === 'string' ? body.nome : 'Cliente Sandbox',
      cpf: typeof body.cpf === 'string' ? body.cpf : '00000000000',
      valor: amount.toFixed(2),
      descricao: typeof body.descricao === 'string' ? body.descricao : 'Depósito Pix',
      urlnoty: `${new URL(request.url).origin}/api/onixpay/webhook`,
    }).toString()
    const response = await fetch(`${getOnixPayUrl(sandbox)}/pix/qrcode.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        hmac: createHmac(payload, client_secret),
      },
      body: payload,
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
