import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { adminClient, corsHeaders, json, sendEmail, userClient } from "../_shared/resend.ts";
import { emailLayout } from "../_shared/email-layout.ts";

const appUrl = () => Deno.env.get("APP_URL") ?? "https://chord-crafters-academy.lovable.app";

const fmt = (iso: string) =>
  new Date(iso).toLocaleString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/New_York",
  }) + " (hora del Este de EE.UU.)";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const db = adminClient();

    // Autorización: header con CRON_SECRET (para el programador) o un admin autenticado.
    const cronSecret = Deno.env.get("CRON_SECRET");
    const providedSecret = req.headers.get("x-cron-secret");
    let authorized = !!cronSecret && providedSecret === cronSecret;

    if (!authorized) {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader) return json({ error: "Unauthorized" }, 401);
      const { data: { user } } = await userClient(authHeader).auth.getUser();
      if (!user) return json({ error: "Unauthorized" }, 401);
      const { data: isAdmin } = await db.rpc("has_role", { _user_id: user.id, _role: "admin" });
      const { data: teacher } = await db
        .from("teacher_accounts")
        .select("id")
        .eq("owner_user_id", user.id)
        .maybeSingle();
      authorized = !!isAdmin || !!teacher;
    }
    if (!authorized) return json({ error: "Forbidden" }, 403);

    const now = Date.now();
    const summary = { trial_ending: 0, class_reminders: 0, studio_class_reminders: 0, lead_followups: 0 };

    const emailOf = async (userId: string) => {
      const { data } = await db.auth.admin.getUserById(userId);
      return data?.user?.email ?? null;
    };

    /* ---------------- 1. Prueba que termina en menos de 24 h ---------------- */
    const { data: trials } = await db
      .from("trials")
      .select("id, user_id, plan_key, instrument_slug, ends_at")
      .eq("status", "trialing")
      .gt("ends_at", new Date(now).toISOString())
      .lt("ends_at", new Date(now + 24 * 3600 * 1000).toISOString());

    for (const t of trials ?? []) {
      const email = await emailOf(t.user_id);
      if (!email) continue;
      const r = await sendEmail(db, {
        to: email,
        subject: "Tu prueba de Acorde Live termina mañana",
        template: "trial_ending",
        userId: t.user_id,
        idempotencyKey: `trial-ending-${t.id}`,
        html: emailLayout({
          heading: "Tu prueba termina mañana",
          paragraphs: [
            `Tu prueba del plan ${t.plan_key} termina el ${fmt(t.ends_at)}.`,
            "Si continúas, conservas tu instrumento, tu grupo y todo tu progreso. Si prefieres cancelar, puedes hacerlo desde tu membresía sin ningún cargo.",
          ],
          ctaLabel: "Ver mi membresía",
          ctaUrl: `${appUrl()}/portal/membresia`,
        }),
      });
      if (r.ok) summary.trial_ending++;
    }

    /* ------------- 2. Recordatorio de clases en vivo de Acorde Live ---------- */
    const { data: classes } = await db
      .from("live_classes")
      .select("id, title, scheduled_at, zoom_join_url")
      .gt("scheduled_at", new Date(now).toISOString())
      .lt("scheduled_at", new Date(now + 24 * 3600 * 1000).toISOString());

    for (const c of classes ?? []) {
      const { data: regs } = await db
        .from("live_class_registrations")
        .select("user_id")
        .eq("live_class_id", c.id);
      for (const reg of regs ?? []) {
        const email = await emailOf(reg.user_id);
        if (!email) continue;
        const r = await sendEmail(db, {
          to: email,
          subject: `Recordatorio: ${c.title}`,
          template: "class_reminder",
          userId: reg.user_id,
          idempotencyKey: `class-reminder-${c.id}-${reg.user_id}`,
          html: emailLayout({
            heading: "Tu clase es muy pronto",
            paragraphs: [`${c.title} — ${fmt(c.scheduled_at)}.`, "Ten tu instrumento listo y entra unos minutos antes."],
            ctaLabel: c.zoom_join_url ? "Entrar a la clase" : "Ver mi calendario",
            ctaUrl: c.zoom_join_url ?? `${appUrl()}/portal/calendario`,
          }),
        });
        if (r.ok) summary.class_reminders++;
      }
    }

    /* --------- 3. Recordatorio de clases de los estudios de maestros -------- */
    const { data: studioClasses } = await db
      .from("teacher_live_classes")
      .select("id, teacher_account_id, title, scheduled_at, join_url, is_published")
      .eq("is_published", true)
      .gt("scheduled_at", new Date(now).toISOString())
      .lt("scheduled_at", new Date(now + 24 * 3600 * 1000).toISOString());

    for (const c of studioClasses ?? []) {
      const { data: account } = await db
        .from("teacher_accounts")
        .select("studio_name, contact_email")
        .eq("id", c.teacher_account_id)
        .maybeSingle();
      const { data: students } = await db
        .from("teacher_students")
        .select("id, email, full_name")
        .eq("teacher_account_id", c.teacher_account_id)
        .eq("status", "active")
        .not("email", "is", null);

      for (const s of students ?? []) {
        if (!s.email) continue;
        const r = await sendEmail(db, {
          to: s.email,
          subject: `Recordatorio de clase: ${c.title}`,
          template: "studio_class_reminder",
          teacherAccountId: c.teacher_account_id,
          replyTo: account?.contact_email ?? undefined,
          idempotencyKey: `studio-class-reminder-${c.id}-${s.id}`,
          html: emailLayout({
            brand: account?.studio_name ?? "Acorde Live",
            heading: "Tu clase es muy pronto",
            intro: s.full_name ? `Hola ${s.full_name},` : undefined,
            paragraphs: [`${c.title} — ${fmt(c.scheduled_at)}.`],
            ctaLabel: c.join_url ? "Entrar a la clase" : "Ver mi estudio",
            ctaUrl: c.join_url ?? `${appUrl()}/mi-estudio`,
            footerNote: `${account?.studio_name ?? "Acorde Live"} · Enviado con Acorde Live`,
          }),
        });
        if (r.ok) summary.studio_class_reminders++;
      }
    }

    /* ---------- 4. Seguimiento de leads sin contacto (aviso al maestro) ------ */
    const threeDaysAgo = new Date(now - 3 * 24 * 3600 * 1000).toISOString();
    const { data: staleLeads } = await db
      .from("teacher_leads")
      .select("id, teacher_account_id, full_name, email, stage, created_at, last_contacted_at")
      .in("stage", ["new", "contacted"])
      .or(`last_contacted_at.is.null,last_contacted_at.lt.${threeDaysAgo}`)
      .lt("created_at", threeDaysAgo);

    const byAccount = new Map<string, typeof staleLeads>();
    for (const l of staleLeads ?? []) {
      const arr = byAccount.get(l.teacher_account_id) ?? [];
      arr.push(l);
      byAccount.set(l.teacher_account_id, arr as never);
    }

    const dayKey = new Date(now).toISOString().slice(0, 10);
    for (const [accountId, leads] of byAccount) {
      const { data: account } = await db
        .from("teacher_accounts")
        .select("studio_name, contact_email, owner_user_id")
        .eq("id", accountId)
        .maybeSingle();
      const to = account?.contact_email ?? (account ? await emailOf(account.owner_user_id) : null);
      if (!to || !leads) continue;

      const rows = leads
        .slice(0, 20)
        .map(
          (l) =>
            `<tr><td style="padding:6px 10px;border-bottom:1px solid #e4e4e7;font-size:14px">${l.full_name}</td><td style="padding:6px 10px;border-bottom:1px solid #e4e4e7;font-size:14px;color:#71717a">${l.email ?? "-"}</td><td style="padding:6px 10px;border-bottom:1px solid #e4e4e7;font-size:14px">${l.stage === "new" ? "Nuevo" : "Contactado"}</td></tr>`,
        )
        .join("");

      const r = await sendEmail(db, {
        to,
        subject: `Tienes ${leads.length} prospecto(s) sin seguimiento`,
        template: "lead_followup_digest",
        teacherAccountId: accountId,
        idempotencyKey: `lead-digest-${accountId}-${dayKey}`,
        html: emailLayout({
          brand: account?.studio_name ?? "Acorde Live",
          heading: "Prospectos esperando respuesta",
          paragraphs: ["Estos prospectos llevan más de 3 días sin contacto. Un mensaje rápido suele convertirlos en alumnos."],
          bodyHtml: `<table style="width:100%;border-collapse:collapse">${rows}</table>`,
          ctaLabel: "Abrir mi CRM",
          ctaUrl: `${appUrl()}/estudio/crm`,
        }),
      });
      if (r.ok) summary.lead_followups++;
    }

    return json({ ok: true, summary });
  } catch (e) {
    console.error("email-automations error", e);
    return json({ error: e instanceof Error ? e.message : "unknown_error" }, 500);
  }
});
