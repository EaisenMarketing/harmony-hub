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

/* =========================================================================
   DOS IDENTIDADES DE CORREO, SEPARADAS A PROPÓSITO
   -------------------------------------------------------------------------
   1) PLATAFORMA (Acorde Live): registros, prueba gratis, suscripciones,
      clases de la academia, avisos del admin. Sale como "Acorde Live".
   2) ESTUDIO (maestro que renta el software): sus invitaciones, su CRM y sus
      campañas. Sale como "<Su Estudio> vía Acorde Live", con respuestas
      directas al correo del maestro. Nunca se mezcla con la marca principal.
   ========================================================================= */

/** Remitente de la plataforma (dominio verificado en Resend). */
export const defaultFrom = () =>
  Deno.env.get("ACORDE_FROM_EMAIL") ?? "Acorde Live <hola@acordelive.com>";

/** Dirección de respuesta por defecto de la plataforma. */
export const defaultReplyTo = () => Deno.env.get("ACORDE_REPLY_TO") ?? undefined;

/** Extrae solo la dirección de un remitente tipo `Nombre <correo@dom>`. */
const addressOf = (value: string) => value.match(/<([^>]+)>/)?.[1] ?? value.trim();

/** Dirección técnica desde la que salen los correos de los estudios. */
export const studioFromAddress = () =>
  Deno.env.get("ACORDE_STUDIO_FROM_EMAIL") ??
  `estudios@${addressOf(defaultFrom()).split("@")[1] ?? "acordelive.com"}`;

const sanitizeName = (name: string) =>
  name.replace(/["<>\r\n]/g, "").trim().slice(0, 60) || "Estudio de música";

export interface StudioIdentity {
  from: string;
  replyTo?: string;
  brand: string;
  footerNote: string;
}

/**
 * Identidad de correo de un estudio de maestro.
 * El maestro no necesita verificar dominio: enviamos por la infraestructura de
 * Acorde Live, pero con su nombre visible y sus respuestas a su propio correo.
 */
export const studioIdentity = (account: {
  studio_name: string;
  contact_email?: string | null;
  /** Overrides configurados por el maestro en /estudio/configuracion. */
  from_name?: string | null;
  reply_to_email?: string | null;
}): StudioIdentity => {
  const brand = sanitizeName(account.from_name?.trim() || account.studio_name || "");
  return {
    from: `${brand} <${studioFromAddress()}>`,
    replyTo:
      account.reply_to_email?.trim() || account.contact_email?.trim() || defaultReplyTo(),
    brand,
    footerNote: `${brand} · Powered by Acorde Live`,
  };
};

/**
 * Identidad del estudio leyendo la configuración de correo del maestro
 * (public.teacher_email_settings). Úsala siempre que tengas el account id.
 */
export const resolveStudioIdentity = async (
  db: SupabaseClient,
  accountId: string,
  fallback?: { studio_name?: string | null; contact_email?: string | null },
): Promise<StudioIdentity> => {
  const { data } = await db.rpc("studio_email_identity", { _account_id: accountId });
  const row = (data as Array<{
    studio_name: string | null;
    from_name: string | null;
    reply_to_email: string | null;
  }> | null)?.[0];

  return studioIdentity({
    studio_name: row?.studio_name ?? fallback?.studio_name ?? "Estudio de música",
    contact_email: fallback?.contact_email ?? null,
    from_name: row?.from_name ?? null,
    reply_to_email: row?.reply_to_email ?? null,
  });
};


/** Identidad de correo de la plataforma principal (Acorde Live). */
export const platformIdentity = () => ({
  from: defaultFrom(),
  replyTo: defaultReplyTo(),
  brand: "Acorde Live",
  footerNote: "Acorde Live · Clases de música en vivo",
});

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
      ...((input.replyTo ?? defaultReplyTo())
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
