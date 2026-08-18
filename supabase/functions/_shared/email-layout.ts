const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export interface LayoutOptions {
  brand?: string;
  heading: string;
  intro?: string;
  bodyHtml?: string;
  paragraphs?: string[];
  ctaLabel?: string | null;
  ctaUrl?: string | null;
  footerNote?: string;
  unsubscribeUrl?: string | null;
}

/** Plantilla HTML de marca (fondo blanco, acentos Acorde Live). */
export function emailLayout(o: LayoutOptions): string {
  const brand = o.brand ?? "Acorde Live";
  const paragraphs = (o.paragraphs ?? [])
    .map(
      (p) =>
        `<p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#3f3f46">${esc(p)}</p>`,
    )
    .join("");

  const cta = o.ctaUrl && o.ctaLabel
    ? `<p style="margin:24px 0 8px"><a href="${esc(o.ctaUrl)}" style="display:inline-block;background:#10b981;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 22px;border-radius:10px">${esc(o.ctaLabel)}</a></p>`
    : "";

  const unsub = o.unsubscribeUrl
    ? `<p style="margin:8px 0 0;font-size:11px;color:#a1a1aa">Si ya no quieres recibir estos correos, <a href="${esc(o.unsubscribeUrl)}" style="color:#71717a">da clic aquí</a>.</p>`
    : "";

  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(o.heading)}</title></head>
<body style="margin:0;padding:0;background-color:#ffffff;font-family:Arial,Helvetica,sans-serif">
  <div style="max-width:600px;margin:0 auto;padding:28px 24px">
    <div style="padding:14px 18px;border-radius:14px;background:#0b0b0f">
      <span style="color:#10b981;font-size:12px;letter-spacing:2px;text-transform:uppercase">${esc(brand)}</span>
      <div style="color:#ffffff;font-size:20px;font-weight:700;margin-top:4px">${esc(o.heading)}</div>
    </div>
    <div style="padding:24px 4px 8px">
      ${o.intro ? `<p style="margin:0 0 14px;font-size:16px;line-height:1.6;color:#18181b">${esc(o.intro)}</p>` : ""}
      ${paragraphs}
      ${o.bodyHtml ?? ""}
      ${cta}
    </div>
    <hr style="border:none;border-top:1px solid #e4e4e7;margin:24px 0 12px">
    <p style="margin:0;font-size:12px;color:#71717a">${esc(o.footerNote ?? `${brand} · Clases de música en vivo`)}</p>
    ${unsub}
  </div>
</body></html>`;
}

/** Convierte texto plano escrito por el maestro en párrafos HTML seguros. */
export function textToHtml(text: string): string {
  return text
    .split(/\n{2,}/)
    .map(
      (block) =>
        `<p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#3f3f46">${esc(block).replace(/\n/g, "<br>")}</p>`,
    )
    .join("");
}
