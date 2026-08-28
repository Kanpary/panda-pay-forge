import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const valor = Number(body?.valor)
  if (!body?.nome || !/^\d{11}$/.test(String(body?.cpf ?? '')) || !Number.isFinite(valor) || valor <= 0) return NextResponse.json({ message: 'Dados inválidos.' }, { status: 400 })
  const form = new URLSearchParams({ client_id: process.env.ONIXPAY_CLIENT_ID ?? '', client_secret: process.env.ONIXPAY_CLIENT_SECRET ?? '', nome: String(body.nome), cpf: String(body.cpf), valor: valor.toFixed(2), descricao: String(body.descricao ?? 'Depósito'), urlnoty: `${new URL(request.url).origin}/api/onixpay/webhook` })
  const response = await fetch('https://onixpay.space/api/v2/pix/qrcode.php', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: form, cache: 'no-store' })
  const data = await response.json().catch(() => ({ message: 'Resposta inválida da OnixPay.' }))
  return NextResponse.json(data, { status: response.status })
}
