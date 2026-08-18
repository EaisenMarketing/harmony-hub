import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { adminClient, corsHeaders, json, sendEmail, userClient } from "../_shared/resend.ts";
import { emailLayout } from "../_shared/email-layout.ts";

const appUrl = () => Deno.env.get("APP_URL") ?? "https://chord-crafters-academy.lovable.app";

type TemplateKey =
  | "welcome"
  | "trial_started"
  | "subscription_active"
  | "class_registered"
  | "admin_alert";

async function adminEmails(db: ReturnType<typeof adminClient>): Promise<string[]> {
  const { data: roles } = await db.from("user_roles").select("user_id").eq("role", "admin");
  const emails: string[] = [];
  for (const r of roles ?? []) {
    const { data } = await db.auth.admin.getUserById(r.user_id);
    if (data?.user?.email) emails.push(data.user.email);
  }
  return emails;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Unauthorized" }, 401);
    const { data: { user } } = await userClient(authHeader).auth.getUser();
    if (!user) return json({ error: "Unauthorized" }, 401);

    const body = await req.json().catch(() => ({}));
    const template = String(body?.template ?? "") as TemplateKey;
    const data = (body?.data ?? {}) as Record<string, string>;

    const db = adminClient();
    const { data: profile } = await db
      .from("profiles")
      .select("full_name")
      .eq("user_id", user.id)
      .maybeSingle();
    const name = profile?.full_name?.split(" ")[0] ?? "";

    const portal = `${appUrl()}/portal`;

    let subject = "";
    let html = "";
    let idempotencyKey: string | undefined;
    let notifyAdmins = false;
    let adminSubject = "";
    let adminHtml = "";

    switch (template) {
      case "welcome": {
        subject = "¡Bienvenido a Acorde Live! 🎶";
        html = emailLayout({
          heading: "Tu cuenta está lista",
          intro: name ? `Hola ${name},` : "Hola,",
          paragraphs: [
            "Ya puedes entrar a tu portal, elegir tu instrumento y activar tu prueba de 3 días.",
            "Dentro encontrarás tus clases en vivo, cursos grabados, partituras y las herramientas de Acorde AI.",
          ],
          ctaLabel: "Entrar a mi portal",
          ctaUrl: portal,
        });
        idempotencyKey = `welcome-${user.id}`;
        notifyAdmins = true;
        adminSubject = "Nuevo registro en Acorde Live";
        adminHtml = emailLayout({
          heading: "Nuevo alumno registrado",
          paragraphs: [`${profile?.full_name ?? user.email} (${user.email}) creó su cuenta.`],
        });
        break;
      }
      case "trial_started": {
        subject = "Tu prueba de 3 días ya empezó 🎸";
        html = emailLayout({
          heading: "Prueba activada",
          intro: name ? `Hola ${name},` : "Hola,",
          paragraphs: [
            `Tu prueba del plan ${data.plan ?? ""} está activa${data.instrument ? ` para ${data.instrument}` : ""}.`,
            data.endsAt
              ? `Termina el ${new Date(data.endsAt).toLocaleDateString("es-MX", { day: "numeric", month: "long" })}. Te avisaremos 24 horas antes de cualquier cobro.`
              : "Te avisaremos 24 horas antes de cualquier cobro.",
          ],
          ctaLabel: "Empezar mi primera clase",
          ctaUrl: portal,
        });
        idempotencyKey = `trial-started-${user.id}`;
        notifyAdmins = true;
        adminSubject = "Nueva prueba iniciada";
        adminHtml = emailLayout({
          heading: "Prueba iniciada",
          paragraphs: [`${user.email} inició prueba del plan ${data.plan ?? "-"} (${data.instrument ?? "-"}).`],
        });
        break;
      }
      case "subscription_active": {
        subject = "Tu membresía de Acorde Live está activa";
        html = emailLayout({
          heading: "Membresía activa",
          intro: name ? `Hola ${name},` : "Hola,",
          paragraphs: [
            `Gracias por suscribirte al plan ${data.plan ?? ""}. Ya tienes acceso completo a tu instrumento y a tus herramientas.`,
          ],
          ctaLabel: "Ir a mi portal",
          ctaUrl: portal,
        });
        notifyAdmins = true;
        adminSubject = "Nueva suscripción activa";
        adminHtml = emailLayout({
          heading: "Nueva suscripción",
          paragraphs: [`${user.email} activó el plan ${data.plan ?? "-"}.`],
        });
        break;
      }
      case "class_registered": {
        subject = `Estás inscrito: ${data.title ?? "clase en vivo"}`;
        html = emailLayout({
          heading: "Inscripción confirmada",
          intro: name ? `Hola ${name},` : "Hola,",
          paragraphs: [
            `${data.title ?? "Tu clase"}${data.when ? ` — ${data.when}` : ""}.`,
            "Te enviaremos un recordatorio 24 horas y 1 hora antes con el enlace para entrar.",
          ],
          ctaLabel: data.joinUrl ? "Ver mi clase" : "Ver mi calendario",
          ctaUrl: data.joinUrl ?? `${appUrl()}/portal/calendario`,
        });
        idempotencyKey = data.classId ? `class-reg-${user.id}-${data.classId}` : undefined;
        break;
      }
      case "admin_alert": {
        const emails = await adminEmails(db);
        for (const to of emails) {
          await sendEmail(db, {
            to,
            subject: data.subject ?? "Aviso de Acorde Live",
            html: emailLayout({ heading: data.subject ?? "Aviso", paragraphs: [data.message ?? ""] }),
            template: "admin-alert",
          });
        }
        return json({ ok: true, notified: emails.length });
      }
      default:
        return json({ error: "template inválido" }, 400);
    }

    const result = await sendEmail(db, {
      to: user.email!,
      subject,
      html,
      template,
      userId: user.id,
      idempotencyKey,
    });

    if (notifyAdmins) {
      for (const to of await adminEmails(db)) {
        await sendEmail(db, { to, subject: adminSubject, html: adminHtml, template: "admin-alert" });
      }
    }

    return json({ ok: result.ok, status: result.status, error: result.error });
  } catch (e) {
    console.error("send-system-email error", e);
    return json({ error: e instanceof Error ? e.message : "unknown_error" }, 500);
  }
});
