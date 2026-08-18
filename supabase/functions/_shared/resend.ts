import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/resend";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

export const adminClient = (): SupabaseClient =>
  createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

export const userClient = (authHeader: string): SupabaseClient =>
  createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } }, auth: { persistSession: false } },
  );

/** Remitente por defecto (dominio verificado en Resend). */
export const defaultFrom = () =>
  Deno.env.get("ACORDE_FROM_EMAIL") ?? "Acorde Live <hola@acordelive.com>";

/** Dirección de respuesta por defecto. */
export const defaultReplyTo = () => Deno.env.get("ACORDE_REPLY_TO") ?? undefined;

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
  template: string;
  idempotencyKey?: string;
  teacherAccountId?: string | null;
  campaignId?: string | null;
  leadId?: string | null;
  userId?: string | null;
  /** Los correos de marketing respetan la lista de bajas. */
  marketing?: boolean;
}

export interface SendEmailResult {
  ok: boolean;
  status: "sent" | "failed" | "suppressed" | "duplicate";
  error?: string;
}

/**
 * Envía un email por Resend (a través del gateway de Lovable) y lo registra
 * en public.email_log. Usa el service role: sólo debe llamarse desde el servidor.
 */
export async function sendEmail(
  db: SupabaseClient,
  input: SendEmailInput,
): Promise<SendEmailResult> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");
  if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY is not configured");

  const recipient = input.to.trim().toLowerCase();

  const logRow = {
    teacher_account_id: input.teacherAccountId ?? null,
    campaign_id: input.campaignId ?? null,
    lead_id: input.leadId ?? null,
    user_id: input.userId ?? null,
    template: input.template,
    recipient_email: recipient,
    subject: input.subject,
    idempotency_key: input.idempotencyKey ?? null,
  };

  // Evita duplicados cuando hay clave de idempotencia.
  if (input.idempotencyKey) {
    const { data: existing } = await db
      .from("email_log")
      .select("id")
      .eq("idempotency_key", input.idempotencyKey)
      .maybeSingle();
    if (existing) return { ok: true, status: "duplicate" };
  }

  if (input.marketing) {
    const { data: unsub } = await db
      .from("email_unsubscribes")
      .select("email")
      .eq("email", recipient)
      .maybeSingle();
    if (unsub) {
      await db.from("email_log").insert({ ...logRow, status: "suppressed" });
      return { ok: false, status: "suppressed", error: "unsubscribed" };
    }
  }

  const response = await fetch(`${GATEWAY_URL}/emails`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "X-Connection-Api-Key": RESEND_API_KEY,
    },
    body: JSON.stringify({
      from: input.from ?? defaultFrom(),
      to: [recipient],
      subject: input.subject,
      html: input.html,
      ...(input.replyTo ?? defaultReplyTo()
        ? { reply_to: input.replyTo ?? defaultReplyTo() }
        : {}),
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error(`Resend request failed [${response.status}]: ${errorBody}`);
    await db.from("email_log").insert({
      ...logRow,
      status: "failed",
      error_message: `[${response.status}] ${errorBody}`.slice(0, 1000),
    });
    return { ok: false, status: "failed", error: `[${response.status}] ${errorBody}` };
  }

  const payload = await response.json().catch(() => ({}));
  await db.from("email_log").insert({
    ...logRow,
    status: "sent",
    provider_id: payload?.id ?? null,
  });

  return { ok: true, status: "sent" };
}
