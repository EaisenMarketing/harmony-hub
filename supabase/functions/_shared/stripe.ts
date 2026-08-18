/* =========================================================================
   DOS CUENTAS DE STRIPE, SEPARADAS A PROPÓSITO
   -------------------------------------------------------------------------
   1) PLATAFORMA (Acorde Live): cobra la suscripción SaaS a los maestros B2B
      y las membresías de los alumnos de la escuela. Usa `platformStripe()`.
   2) CONECTADA (cada estudio): cobra a LOS ALUMNOS DE ESE MAESTRO. Usa
      `connectedStripe(acct_...)`, que enruta la petición a su cuenta Express.
   Nunca uses un cliente "genérico": elige explícitamente cuál cuenta cobra.
   ========================================================================= */

const API = "https://api.stripe.com/v1";

const secretKey = (): string => {
  const key = Deno.env.get("STRIPE_SECRET_KEY");
  if (!key) throw new Error("STRIPE_SECRET_KEY is not configured");
  return key;
};

/** Serializa objetos anidados al formato form-encoded de Stripe. */
const encode = (data: Record<string, unknown>, prefix = ""): string[] => {
  const out: string[] = [];
  for (const [rawKey, value] of Object.entries(data)) {
    if (value === undefined || value === null) continue;
    const key = prefix ? `${prefix}[${rawKey}]` : rawKey;
    if (typeof value === "object" && !Array.isArray(value)) {
      out.push(...encode(value as Record<string, unknown>, key));
    } else if (Array.isArray(value)) {
      value.forEach((item, i) => {
        if (typeof item === "object" && item !== null) {
          out.push(...encode(item as Record<string, unknown>, `${key}[${i}]`));
        } else {
          out.push(`${encodeURIComponent(`${key}[${i}]`)}=${encodeURIComponent(String(item))}`);
        }
      });
    } else {
      out.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
    }
  }
  return out;
};

export interface StripeClient {
  request<T = Record<string, unknown>>(
    method: "GET" | "POST",
    path: string,
    body?: Record<string, unknown>,
  ): Promise<T>;
  /** `undefined` = cuenta de la plataforma. */
  readonly stripeAccount?: string;
}

const client = (stripeAccount?: string): StripeClient => ({
  stripeAccount,
  async request(method, path, body) {
    const payload = body ? encode(body).join("&") : undefined;
    const url = method === "GET" && payload ? `${API}${path}?${payload}` : `${API}${path}`;

    const res = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${secretKey()}`,
        "Content-Type": "application/x-www-form-urlencoded",
        // Enruta la operación a la cuenta conectada del maestro.
        ...(stripeAccount ? { "Stripe-Account": stripeAccount } : {}),
      },
      ...(method === "POST" && payload ? { body: payload } : {}),
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      const message = json?.error?.message ?? `Stripe error ${res.status}`;
      throw new Error(message);
    }
    return json;
  },
});

/** Cuenta principal de Acorde Live: SOLO suscripciones SaaS y escuela propia. */
export const platformStripe = (): StripeClient => client();

/** Cuenta conectada de un maestro: SOLO cobros a sus propios alumnos. */
export const connectedStripe = (stripeAccountId: string): StripeClient => {
  if (!stripeAccountId?.startsWith("acct_")) {
    throw new Error("invalid_connected_account");
  }
  return client(stripeAccountId);
};

/**
 * Comisión de plataforma sobre las ventas del maestro.
 * Hoy siempre 0 (el maestro recibe el 100%). La arquitectura ya está lista:
 * cuando se quiera cobrar comisión basta subir `application_fee_bps` en
 * public.teacher_stripe_accounts, sin refactorizar el checkout.
 */
export const applicationFeeAmount = (amountInCents: number, bps: number): number =>
  bps > 0 ? Math.round((amountInCents * bps) / 10_000) : 0;

export const stripeAccountStatus = (account: {
  charges_enabled?: boolean;
  details_submitted?: boolean;
}): "pending" | "connected" =>
  account.charges_enabled && account.details_submitted ? "connected" : "pending";
