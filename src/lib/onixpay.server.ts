import { createHmac, timingSafeEqual } from "node:crypto";

const ONIXPAY_CLIENT_ID = process.env["ONIXPAY_CLIENT_ID"] ?? "lucastroy_9268056431";
const ONIXPAY_CLIENT_SECRET = process.env["secret"];
const ONIXPAY_WEBHOOK_SECRET = process.env["secret_2"];
const ONIXPAY_API_URL = process.env["ONIXPAY_API_URL"];

function requireConfig() {
  if (!ONIXPAY_CLIENT_SECRET || !ONIXPAY_WEBHOOK_SECRET) {
    throw new Error("Credenciais OnixPay não configuradas no ambiente do servidor.");
  }
  if (!ONIXPAY_API_URL) {
    throw new Error("ONIXPAY_API_URL não configurada.");
  }
}

let tokenCache: { value: string; expiresAt: number } | null = null;

async function accessToken() {
  requireConfig();
  if (tokenCache && tokenCache.expiresAt > Date.now() + 30_000) return tokenCache.value;

  const response = await fetch(`${ONIXPAY_API_URL}/oauth/token`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      grant_type: "client_credentials",
      client_id: ONIXPAY_CLIENT_ID,
      client_secret: ONIXPAY_CLIENT_SECRET,
    }),
  });
  if (!response.ok) throw new Error(`OnixPay OAuth falhou (${response.status}).`);
  const body = (await response.json()) as { access_token?: string; expires_in?: number };
  if (!body.access_token) throw new Error("OnixPay não retornou access token.");
  tokenCache = { value: body.access_token, expiresAt: Date.now() + (body.expires_in ?? 300) * 1000 };
  return body.access_token;
}

async function onixRequest<T>(path: string, init: RequestInit = {}) {
  const token = await accessToken();
  const response = await fetch(`${ONIXPAY_API_URL}${path}`, {
    ...init,
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
      ...init.headers,
    },
  });
  const body = (await response.json().catch(() => null)) as T | { message?: string } | null;
  if (!response.ok) throw new Error((body as { message?: string } | null)?.message ?? `OnixPay falhou (${response.status}).`);
  return body as T;
}

export type PixCharge = { id: string; status?: string; qr_code?: string; qr_code_url?: string; copy_paste?: string };
export type PixTransfer = { id: string; status?: string };

export function createPixCharge(input: { amount: number; externalId: string; callbackUrl: string; payer?: Record<string, string> }) {
  return onixRequest<PixCharge>("/pix/charges", { method: "POST", body: JSON.stringify(input) });
}

export function getPixCharge(id: string) {
  return onixRequest<PixCharge>(`/pix/charges/${encodeURIComponent(id)}`);
}

export function createPixTransfer(input: { amount: number; pixType: string; pixKey: string; externalId: string }) {
  return onixRequest<PixTransfer>("/pix/transfers", { method: "POST", body: JSON.stringify(input) });
}

export function verifyOnixPaySignature(payload: string, signature: string | null) {
  if (!ONIXPAY_WEBHOOK_SECRET || !signature) return false;
  const expected = createHmac("sha256", ONIXPAY_WEBHOOK_SECRET).update(payload).digest("hex");
  const provided = signature.replace(/^sha256=/, "");
  const expectedBuffer = Buffer.from(expected, "utf8");
  const providedBuffer = Buffer.from(provided, "utf8");
  return expectedBuffer.length === providedBuffer.length && timingSafeEqual(expectedBuffer, providedBuffer);
}

export { ONIXPAY_WEBHOOK_SECRET };

export function isOnixPayConfigured() {
  return Boolean(ONIXPAY_API_URL && ONIXPAY_CLIENT_SECRET && ONIXPAY_WEBHOOK_SECRET);
}
