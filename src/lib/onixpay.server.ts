import { createHmac, timingSafeEqual } from "node:crypto";

const ONIXPAY_CLIENT_ID = process.env["ONIXPAY_CLIENT_ID"];
const ONIXPAY_CLIENT_SECRET = process.env["ONIXPAY_CLIENT_SECRET"];
const ONIXPAY_WEBHOOK_SECRET = process.env["ONIXPAY_WEBHOOK_SECRET"];
const ONIXPAY_API_URL = "https://onixpay.space/api/v2";

function requireConfig() {
  if (!ONIXPAY_CLIENT_ID || !ONIXPAY_CLIENT_SECRET) {
    throw new Error("Credenciais OnixPay não configuradas no ambiente do servidor.");
  }
}

async function onixRequest<T>(path: string, init: RequestInit = {}) {
  requireConfig();
  const response = await fetch(`${ONIXPAY_API_URL}${path}`, init);
  const body = (await response.json().catch(() => null)) as T | { message?: string } | null;
  if (!response.ok)
    throw new Error(
      (body as { message?: string } | null)?.message ?? `OnixPay falhou (${response.status}).`,
    );
  return body as T;
}

function formBody(values: Record<string, string | number | undefined>) {
  return new URLSearchParams(
    Object.entries(values)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => [key, String(value)]),
  );
}

export type PixCharge = {
  qrcode?: string;
  transactionId?: string;
  reference_code?: string;
  status?: string;
  amount?: number;
};
export type PixTransfer = { transactionId?: string; external_id?: string; status?: string };
export type PixStatus = {
  transaction?: { transactionId?: string; external_id?: string; status?: string; amount?: number };
};

export function createPixCharge(input: {
  amount: number;
  externalId: string;
  callbackUrl: string;
  name: string;
  cpf: string;
}) {
  return onixRequest<PixCharge>("/pix/qrcode.php", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: formBody({
      client_id: ONIXPAY_CLIENT_ID,
      client_secret: ONIXPAY_CLIENT_SECRET,
      nome: input.name,
      cpf: input.cpf,
      valor: input.amount,
      external_id: input.externalId,
      descricao: `Depósito ${input.externalId}`,
      urlnoty: input.callbackUrl,
    }),
  });
}

export function getPixStatus(transactionId: string) {
  return onixRequest<PixStatus>(
    `/pix/status.php?${formBody({ client_id: ONIXPAY_CLIENT_ID, client_secret: ONIXPAY_CLIENT_SECRET, transaction_id: transactionId })}`,
  );
}

export function createPixTransfer(input: {
  amount: number;
  pixType: string;
  pixKey: string;
  externalId: string;
  name: string;
  cpf: string;
  callbackUrl: string;
}) {
  return onixRequest<PixTransfer>("/pix/payment.php", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: formBody({
      client_id: ONIXPAY_CLIENT_ID,
      client_secret: ONIXPAY_CLIENT_SECRET,
      nome: input.name,
      cpf: input.cpf,
      valor: input.amount,
      chave_pix: input.pixKey,
      external_id: input.externalId,
      descricao: `Saque ${input.externalId}`,
      urlnoty: input.callbackUrl,
    }),
  });
}

export function verifyOnixPaySignature(payload: string, signature: string | null) {
  if (!ONIXPAY_WEBHOOK_SECRET || !signature) return false;
  const expected = createHmac("sha256", ONIXPAY_WEBHOOK_SECRET).update(payload).digest("hex");
  const provided = signature.replace(/^sha256=/, "");
  const expectedBuffer = Buffer.from(expected, "utf8");
  const providedBuffer = Buffer.from(provided, "utf8");
  return (
    expectedBuffer.length === providedBuffer.length &&
    timingSafeEqual(expectedBuffer, providedBuffer)
  );
}

export { ONIXPAY_WEBHOOK_SECRET };

export function isOnixPayConfigured() {
  return Boolean(ONIXPAY_API_URL && ONIXPAY_CLIENT_ID && ONIXPAY_CLIENT_SECRET);
}
