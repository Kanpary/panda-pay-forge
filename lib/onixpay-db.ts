const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY

function assertConfig() {
  if (!supabaseUrl || !serviceKey) throw new Error('Supabase server configuration is missing')
}

export async function insertDeposit(input: {
  userId: string
  amount: number
  transactionId: string | null
  externalId: string | null
  pixCode: string | null
  response: unknown
}) {
  assertConfig()
  const response = await fetch(`${supabaseUrl}/rest/v1/deposits`, {
    method: 'POST',
    headers: {
      apikey: serviceKey!,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({
      user_id: input.userId,
      amount: input.amount,
      provider: 'onixpay',
      gateway: 'onixpay',
      transaction_id: input.transactionId,
      external_id: input.externalId,
      pix_code: input.pixCode,
      qrcode: input.pixCode,
      response: input.response,
      status: 'pending',
    }),
  })
  if (!response.ok) throw new Error(`Supabase deposit insert failed: ${response.status}`)
}

export async function updateDepositFromWebhook(transactionId: string, status: string, payload: unknown) {
  assertConfig()
  const normalized = status.toLowerCase() === 'paid' ? 'paid' : status.toLowerCase() === 'failed' ? 'failed' : 'pending'
  const response = await fetch(`${supabaseUrl}/rest/v1/deposits?transaction_id=eq.${encodeURIComponent(transactionId)}`, {
    method: 'PATCH',
    headers: {
      apikey: serviceKey!,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({ status: normalized, response: payload, ...(normalized === 'paid' ? { paid_at: new Date().toISOString() } : {}) }),
  })
  if (!response.ok) throw new Error(`Supabase deposit update failed: ${response.status}`)
}
