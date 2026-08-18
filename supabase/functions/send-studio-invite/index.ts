import { corsHeaders, json, adminClient, userClient, sendEmail } from "../_shared/resend.ts";
import { emailLayout } from "../_shared/email-layout.ts";

const appUrl = () => (Deno.env.get("APP_URL") ?? "https://chord-crafters-academy.lovable.app").replace(/\/+$/, "");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "not_authenticated" }, 401);

    const auth = userClient(authHeader);
    const { data: userData } = await auth.auth.getUser();
    const user = userData?.user;
    if (!user) return json({ error: "not_authenticated" }, 401);

    const body = await req.json().catch(() => ({}));
    const studentId = typeof body?.studentId === "string" ? body.studentId : null;
    if (!studentId) return json({ error: "studentId_required" }, 400);

    const db = adminClient();

    const { data: student, error: sErr } = await db
      .from("teacher_students")
      .select("id, full_name, email, teacher_account_id, instrument")
      .eq("id", studentId)
      .maybeSingle();
    if (sErr) throw sErr;
    if (!student?.email) return json({ error: "student_not_found" }, 404);

    const { data: account, error: aErr } = await db
      .from("teacher_accounts")
      .select("id, studio_name, bio, invite_code, public_slug, owner_user_id, contact_email")
      .eq("id", student.teacher_account_id)
      .maybeSingle();
    if (aErr) throw aErr;
    if (!account) return json({ error: "studio_not_found" }, 404);

    // Sólo el dueño del estudio (o un admin) puede enviar la invitación.
    if (account.owner_user_id !== user.id) {
      const { data: isAdmin } = await auth.rpc("has_role", { _user_id: user.id, _role: "admin" });
      if (!isAdmin) return json({ error: "not_authorized" }, 403);
    }

    const joinUrl = account.public_slug
      ? `${appUrl()}/${account.public_slug}/unirme`
      : `${appUrl()}/invitacion/${account.invite_code}`;

    const firstName = (student.full_name ?? "").trim().split(/\s+/)[0] || "Hola";

    const html = emailLayout({
      heading: `${account.studio_name} te invitó a sus clases`,
      intro: `${firstName}, tu maestro te dio acceso a su estudio en Acorde Live.`,
      paragraphs: [
        "Al entrar tendrás tus cursos y videos, tus tareas, tus clases en vivo y todas las herramientas de inteligencia artificial de Acorde Live (asistente de teoría, coach de práctica, entrenador de oído, generador de acordes, análisis de canciones y creador de partituras).",
        account.bio ? `Tu maestro: ${account.bio}` : "Crea tu cuenta con este correo para activar tu acceso.",
        "Si el botón no funciona, copia y pega este enlace en tu navegador: " + joinUrl,
      ],
      ctaLabel: "Activar mi acceso",
      ctaUrl: joinUrl,
      footerNote: `Invitación enviada por ${account.studio_name} a través de Acorde Live.`,
    });

    const result = await sendEmail(db, {
      to: student.email,
      subject: `${account.studio_name} te invitó a sus clases en Acorde Live`,
      html,
      template: "studio_invite",
      teacherAccountId: account.id,
      replyTo: account.contact_email ?? undefined,
    });

    if (!result.ok) return json({ error: result.error ?? "send_failed", status: result.status }, 502);

    return json({ ok: true, status: result.status, joinUrl });
  } catch (e) {
    console.error("send-studio-invite error", e);
    return json({ error: e instanceof Error ? e.message : "unexpected_error" }, 500);
  }
});
