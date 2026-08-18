import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { adminClient, corsHeaders, json, sendEmail, resolveStudioIdentity, userClient } from "../_shared/resend.ts";
import { emailLayout, textToHtml } from "../_shared/email-layout.ts";

const appUrl = () => Deno.env.get("APP_URL") ?? "https://acordelive.com";

interface Recipient {
  email: string;
  name: string | null;
  leadId: string | null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Unauthorized" }, 401);

    const asUser = userClient(authHeader);
    const { data: { user } } = await asUser.auth.getUser();
    if (!user) return json({ error: "Unauthorized" }, 401);

    const body = await req.json().catch(() => ({}));
    const accountId = String(body?.accountId ?? "");
    const mode = body?.campaignId ? "campaign" : "single";
    if (!accountId) return json({ error: "accountId es requerido" }, 400);

    const db = adminClient();

    // Autorización: sólo el dueño del estudio (o un admin) puede enviar.
    const { data: account } = await db
      .from("teacher_accounts")
      .select("id, owner_user_id, studio_name, contact_email, status, trial_ends_at, subscription_expires_at")
      .eq("id", accountId)
      .maybeSingle();
    if (!account) return json({ error: "Estudio no encontrado" }, 404);

    const { data: isAdmin } = await db.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (account.owner_user_id !== user.id && !isAdmin) return json({ error: "Forbidden" }, 403);

    const studioActive =
      account.status === "active" ||
      (account.status === "trial" && account.trial_ends_at && new Date(account.trial_ends_at) > new Date());
    if (!studioActive && !isAdmin) {
      return json({ error: "Tu plan de maestro no está activo." }, 402);
    }

    // Identidad del maestro: su nombre visible, respuestas a su correo.
    const identity = await resolveStudioIdentity(db, accountId, account);
    const replyTo = identity.replyTo;
    const from = identity.from;
    const footer = identity.footerNote;

    /* --------------------------- Email individual --------------------------- */
    if (mode === "single") {
      const leadId = String(body?.leadId ?? "");
      const subject = String(body?.subject ?? "").trim();
      const message = String(body?.message ?? "").trim();
      if (!leadId || subject.length < 2 || message.length < 2) {
        return json({ error: "leadId, subject y message son requeridos" }, 400);
      }

      const { data: lead } = await db
        .from("teacher_leads")
        .select("id, full_name, email, teacher_account_id")
        .eq("id", leadId)
        .eq("teacher_account_id", accountId)
        .maybeSingle();
      if (!lead?.email) return json({ error: "El lead no tiene email" }, 400);

      const html = emailLayout({
        brand: identity.brand,
        heading: subject,
        intro: lead.full_name ? `Hola ${lead.full_name},` : undefined,
        bodyHtml: textToHtml(message),
        ctaLabel: body?.ctaLabel ?? null,
        ctaUrl: body?.ctaUrl ?? null,
        footerNote: footer,
      });

      const result = await sendEmail(db, {
        to: lead.email,
        subject,
        html,
        from,
        replyTo,
        template: "studio_crm_lead",
        teacherAccountId: accountId,
        leadId: lead.id,
      });

      if (result.ok) {
        await db.from("teacher_leads").update({ last_contacted_at: new Date().toISOString() }).eq("id", lead.id);
        await db.from("teacher_lead_activities").insert({
          lead_id: lead.id,
          teacher_account_id: accountId,
          type: "email",
          note: subject,
          created_by: user.id,
        });
      }

      return json({ ok: result.ok, status: result.status, error: result.error });
    }

    /* ----------------------------- Campaña masiva ---------------------------- */
    const campaignId = String(body?.campaignId ?? "");
    const { data: campaign } = await db
      .from("teacher_campaigns")
      .select("*")
      .eq("id", campaignId)
      .eq("teacher_account_id", accountId)
      .maybeSingle();
    if (!campaign) return json({ error: "Campaña no encontrada" }, 404);
    if (campaign.status === "sent") return json({ error: "Esta campaña ya fue enviada" }, 409);

    const recipients: Recipient[] = [];

    if (campaign.audience === "leads" || campaign.audience === "all") {
      let q = db
        .from("teacher_leads")
        .select("id, full_name, email, stage, marketing_opt_in")
        .eq("teacher_account_id", accountId)
        .eq("marketing_opt_in", true)
        .not("email", "is", null);
      if (campaign.stage_filter) q = q.eq("stage", campaign.stage_filter);
      const { data: leads } = await q;
      for (const l of leads ?? []) {
        if (l.email) recipients.push({ email: l.email, name: l.full_name, leadId: l.id });
      }
    }

    if (campaign.audience === "students" || campaign.audience === "all") {
      const { data: students } = await db
        .from("teacher_students")
        .select("id, full_name, email, status")
        .eq("teacher_account_id", accountId)
        .neq("status", "inactive")
        .not("email", "is", null);
      for (const s of students ?? []) {
        if (s.email) recipients.push({ email: s.email, name: s.full_name, leadId: null });
      }
    }

    // Deduplica por email
    const unique = new Map<string, Recipient>();
    for (const r of recipients) unique.set(r.email.toLowerCase(), r);
    const list = [...unique.values()];

    if (list.length === 0) return json({ error: "No hay destinatarios con email" }, 400);

    let sent = 0;
    let failed = 0;

    for (const r of list) {
      const html = emailLayout({
        brand: identity.brand,
        heading: campaign.subject,
        intro: r.name ? `Hola ${r.name},` : undefined,
        bodyHtml: textToHtml(campaign.body),
        ctaLabel: campaign.cta_label,
        ctaUrl: campaign.cta_url,
        footerNote: footer,
        unsubscribeUrl: `${appUrl()}/baja?e=${encodeURIComponent(r.email)}`,
      });

      const result = await sendEmail(db, {
        to: r.email,
        subject: campaign.subject,
        html,
        from,
        replyTo,
        template: "studio_crm_campaign",
        marketing: true,
        teacherAccountId: accountId,
        campaignId: campaign.id,
        leadId: r.leadId,
        idempotencyKey: `campaign-${campaign.id}-${r.email.toLowerCase()}`,
      });

      if (result.ok) sent++;
      else failed++;

      // Cuida el rate limit de Resend (~2 req/s)
      await new Promise((res) => setTimeout(res, 550));
    }

    await db
      .from("teacher_campaigns")
      .update({
        status: "sent",
        recipients_count: list.length,
        sent_count: sent,
        failed_count: failed,
        sent_at: new Date().toISOString(),
      })
      .eq("id", campaign.id);

    return json({ ok: true, recipients: list.length, sent, failed });
  } catch (e) {
    console.error("send-crm-email error", e);
    return json({ error: e instanceof Error ? e.message : "unknown_error" }, 500);
  }
});
