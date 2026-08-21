/**
 * Conecta la cuenta de Stripe PROPIA del maestro B2B (Stripe Connect Express).
 * Nunca toca la cuenta principal de Acorde Live: aquí solo se crea/renueva la
 * cuenta conectada del estudio y su enlace de onboarding (Stripe hace el KYC).
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { platformStripe, stripeAccountStatus } from "../_shared/stripe.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const appUrl = () => (Deno.env.get("APP_URL") ?? "https://chord-crafters-academy.lovable.app").replace(/\/+$/, "");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader) return json({ error: "not_authenticated" }, 401);

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

    // El estudio se deriva SIEMPRE del usuario autenticado, nunca del body.
    const { data: account } = await db
      .from("teacher_accounts")
      .select("id, studio_name, contact_email")
      .eq("owner_user_id", user.id)
      .maybeSingle();
    if (!account) return json({ error: "no_studio" }, 404);

    const stripe = platformStripe();

    const { data: existing } = await db
      .from("teacher_stripe_accounts")
      .select("stripe_account_id")
      .eq("account_id", account.id)
      .maybeSingle();

    let stripeAccountId = existing?.stripe_account_id ?? null;

    if (!stripeAccountId) {
      const created = await stripe.request<{ id: string }>("POST", "/accounts", {
        type: "express",
        email: account.contact_email ?? user.email ?? undefined,
        business_profile: { name: account.studio_name ?? undefined },
        capabilities: {
          card_payments: { requested: "true" },
          transfers: { requested: "true" },
        },
        metadata: { teacher_account_id: account.id, source: "acorde_live_b2b" },
      });
      stripeAccountId = created.id;

      await db.from("teacher_stripe_accounts").upsert(
        { account_id: account.id, stripe_account_id: stripeAccountId, status: "pending" },
        { onConflict: "account_id" },
      );
    }

    const link = await stripe.request<{ url: string }>("POST", "/account_links", {
      account: stripeAccountId,
      refresh_url: `${appUrl()}/estudio/configuracion?stripe=refresh`,
      return_url: `${appUrl()}/estudio/configuracion?stripe=done`,
      type: "account_onboarding",
    });

    const account_state = await stripe.request<{
      charges_enabled: boolean;
      payouts_enabled: boolean;
      details_submitted: boolean;
    }>("GET", `/accounts/${stripeAccountId}`);

    await db
      .from("teacher_stripe_accounts")
      .update({
        charges_enabled: !!account_state.charges_enabled,
        payouts_enabled: !!account_state.payouts_enabled,
        details_submitted: !!account_state.details_submitted,
        status: stripeAccountStatus(account_state),
      })
      .eq("account_id", account.id);

    return json({ url: link.url, stripe_account_id: stripeAccountId });
  } catch (error) {
    console.error("studio-stripe-onboard failed:", error);
    return json({ error: error instanceof Error ? error.message : "unknown_error" }, 400);
  }
});
