/**
 * Checkout de un ALUMNO pagándole a SU MAESTRO B2B.
 * El cobro se procesa SIEMPRE contra la cuenta de Stripe CONECTADA del maestro
 * (Stripe-Account), nunca contra la cuenta principal de Acorde Live.
 * La suscripción del maestro a la plataforma vive en otro flujo aparte.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { applicationFeeAmount, connectedStripe } from "../_shared/stripe.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const appUrl = () => (Deno.env.get("APP_URL") ?? "https://acordelive.com").replace(/\/+$/, "");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader) return json({ error: "not_authenticated" }, 401);

    const body = await req.json().catch(() => ({}));
    const accountId = typeof body?.account_id === "string" ? body.account_id : null;
    const mode = body?.mode === "payment" ? "payment" : "subscription";
    if (!accountId) return json({ error: "account_id_required" }, 400);

    const db = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );
    const asUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } }, auth: { persistSession: false } },
    );

    const { data: userData } = await asUser.auth.getUser();
    const user = userData?.user;
    if (!user) return json({ error: "not_authenticated" }, 401);

    // El alumno debe pertenecer a ese estudio: nada de pagar a un tenant ajeno.
    const { data: membership } = await db
      .from("teacher_students")
      .select("id")
      .eq("teacher_account_id", accountId)
      .eq("student_user_id", user.id)
      .maybeSingle();
    if (!membership) return json({ error: "not_a_student_of_studio" }, 403);

    const { data: settings } = await db
      .from("teacher_stripe_accounts")
      .select("stripe_account_id, status, charges_enabled, monthly_price, default_currency, application_fee_bps")
      .eq("account_id", accountId)
      .maybeSingle();

    if (!settings?.stripe_account_id || !settings.charges_enabled) {
      return json({ error: "studio_payments_not_ready" }, 409);
    }
    if (!settings.monthly_price || Number(settings.monthly_price) <= 0) {
      return json({ error: "studio_price_not_set" }, 409);
    }

    const { data: account } = await db
      .from("teacher_accounts")
      .select("studio_name")
      .eq("id", accountId)
      .maybeSingle();

    const amount = Math.round(Number(settings.monthly_price) * 100);
    const currency = (settings.default_currency ?? "USD").toLowerCase();
    const fee = applicationFeeAmount(amount, settings.application_fee_bps ?? 0);

    const stripe = connectedStripe(settings.stripe_account_id);

    const session = await stripe.request<{ id: string; url: string }>(
      "POST",
      "/checkout/sessions",
      {
        mode,
        customer_email: user.email ?? undefined,
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency,
              unit_amount: amount,
              product_data: { name: `Clases con ${account?.studio_name ?? "tu maestro"}` },
              ...(mode === "subscription" ? { recurring: { interval: "month" } } : {}),
            },
          },
        ],
        success_url: `${appUrl()}/mi-estudio?pago=ok`,
        cancel_url: `${appUrl()}/mi-estudio?pago=cancelado`,
        metadata: { teacher_account_id: accountId, student_user_id: user.id },
        // Comisión de plataforma: hoy 0. Queda listo para activarla sin refactor.
        ...(fee > 0
          ? mode === "subscription"
            ? { subscription_data: { application_fee_percent: (settings.application_fee_bps ?? 0) / 100 } }
            : { payment_intent_data: { application_fee_amount: fee } }
          : {}),
      },
    );

    return json({ url: session.url });
  } catch (error) {
    console.error("studio-checkout failed:", error);
    return json({ error: error instanceof Error ? error.message : "unknown_error" }, 400);
  }
});
