const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY

export async function getOnixPaySandbox() {
  if (!supabaseUrl || !serviceKey) return false
  const response = await fetch(`${supabaseUrl}/rest/v1/app_settings?key=eq.onixpay_sandbox&select=value&limit=1`, {
    headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
    cache: 'no-store',
  })
  if (!response.ok) return false
  const rows = await response.json().catch(() => [])
  return rows[0]?.value === true || rows[0]?.value === 'true'
}

export function getOnixPayUrl(sandbox: boolean) {
  return sandbox
    ? process.env.ONIXPAY_SANDBOX_API_URL ?? 'https://onixpay.space/api/v2'
    : process.env.ONIXPAY_API_URL ?? 'https://onixpay.space/api/v2'
}

export function getOnixPayCredentials() {
  return { client_id: process.env.ONIXPAY_CLIENT_ID, client_secret: process.env.ONIXPAY_CLIENT_SECRET }
}
