/**
 * Sincroniza el estado de la cuenta de Stripe CONECTADA del maestro.
 * Solo lee de Stripe y actualiza la fila del estudio del usuario autenticado.
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

    const { data: account } = await db
      .from("teacher_accounts")
      .select("id")
      .eq("owner_user_id", user.id)
      .maybeSingle();
    if (!account) return json({ error: "no_studio" }, 404);

    const { data: row } = await db
      .from("teacher_stripe_accounts")
      .select("stripe_account_id")
      .eq("account_id", account.id)
      .maybeSingle();

    if (!row?.stripe_account_id) return json({ status: "not_connected" });

    const state = await platformStripe().request<{
      charges_enabled: boolean;
      payouts_enabled: boolean;
      details_submitted: boolean;
    }>("GET", `/accounts/${row.stripe_account_id}`);

    const status = stripeAccountStatus(state);

    await db
      .from("teacher_stripe_accounts")
      .update({
        charges_enabled: !!state.charges_enabled,
        payouts_enabled: !!state.payouts_enabled,
        details_submitted: !!state.details_submitted,
        status,
      })
      .eq("account_id", account.id);

    return json({
      status,
      charges_enabled: !!state.charges_enabled,
      payouts_enabled: !!state.payouts_enabled,
      details_submitted: !!state.details_submitted,
    });
  } catch (error) {
    console.error("studio-stripe-status failed:", error);
    return json({ error: error instanceof Error ? error.message : "unknown_error" }, 400);
  }
});
