
# Auditoría inicial de Acorde Live

## Lo que ya existe y funciona
- **Auth**: Supabase Auth (email/password), tabla `profiles`, tabla `user_roles` (student/instructor/admin) con `has_role()` SECURITY DEFINER — RLS correcto sin recursión.
- **Cursos**: `courses`, `course_modules`, `lessons` con `required_plan`, `is_published`, `is_free_preview`. Ya cargan desde DB en admin/instructor.
- **Progreso**: `user_progress` (lesson_id, completed, progress_percent). Se usa en `CourseViewer`.
- **Clases en vivo**: `live_classes` + `live_class_registrations` con Zoom URL, `required_plan`, capacidad.
- **Instructores**: `instructor_profiles`, `instructor_applications` (Fase 3 previa), `instructor_activity_logs`.
- **Herramientas IA**: generador/detector de acordes por foto, analizador de canciones, teoría musical (edge functions con Lovable AI).
- **Panel admin**: gestión de cursos, lecciones, instructores, aplicaciones, clases en vivo, video library, estudiantes.
- **Panel instructor**: cursos propios, clases, preguntas de alumnos.
- **Comunidad**: `community_posts`, `community_comments`, `community_likes`.
- **Notas de lección**: `lesson_notes` con timestamps.

## Problemas detectados (concretos)
1. **Textos falsos**: `HeroSection` dice "Más de 10,000 estudiantes activos"; `TestimonialsSection` dice "Miles de músicos"; testimonios inventados. → Reemplazar por copy honesto.
2. **Instrumentos fuera de scope**: aparece `banjo` en varios lugares (Footer, DrumPatterns, cards) y `drums`. Tu lista oficial ahora es: guitarra acústica, guitarra eléctrica, bajo, batería, piano, trompeta + Producción Musical. Hay que ampliar (bajo/eléctrica/trompeta no existen aún como cursos) y limpiar banjo.
3. **Sin slugs en cursos**: `courses` no tiene columna `slug`. Todas las rutas van por UUID (`/portal/curso/:courseId`). Faltan rutas públicas `/cursos`, `/cursos/:slug`.
4. **Sin Stripe**: no hay `subscriptions`, `enrollments`, ni webhook. El "plan" vive en `profiles.subscription_plan` como texto — no hay fuente de verdad de pagos. Botones "Elegir plan" / "Obtén Pro" no llevan a checkout.
5. **Botones huérfanos en landing**: "Comenzar Gratis", "Ver Curso", "Clases en Vivo" del landing no navegan a rutas reales (no existen `/cursos`, `/clases-en-vivo`, `/precios`, `/nosotros`, `/contacto`, `/ser-maestro` público en Header — sí existe `/aplicar-maestro`).
6. **Sin páginas legales**: no hay `/terminos`, `/privacidad`, `/politica-de-cancelacion`.
7. **Sin certificados reales**: `CertificatesSection` muestra placeholders; no hay tabla `certificates` ni generación de PDF ni ruta `/verificar-certificado/:code`.
8. **Sin correos transaccionales**: no hay infra de emails Lovable configurada (bienvenida, pago, clase, tarea, certificado).
9. **Sin SEO por página**: `index.html` tiene un solo title global; no hay meta por ruta pública, sitemap ni JSON-LD.
10. **Sin `enrollments` explícitas**: el acceso se calcula solo por `required_plan` vs `subscription_plan`. Funciona para el modelo actual pero impide compra individual, expiración por curso y matrículas históricas.
11. **`/aplicar-maestro`**: existe pero no está enlazado desde landing como "Ser Maestro".
12. **Analítica**: no hay eventos de conversión.

---

# Plan por fases (apruebas una, ejecuto, sigues)

## FASE A — Limpieza de identidad y rutas públicas (sin DB, sin Stripe)
**Rompe nada. Solo copy, rutas y botones.**
- Eliminar banjo en todo el código y assets (Footer, DrumPatterns.ts si aplica, tipos).
- Reemplazar copy falso: "10,000 estudiantes" → "Comienza hoy tu formación musical online con maestros reales." "Certificados oficiales" → "Certificado digital de finalización emitido por Acorde Live."
- `TestimonialsSection`: quitar testimonios inventados; si mantienes la sección, dejarla vacía con CTA "Sé de los primeros" o cargar `testimonials` aprobados desde DB (creo tabla vacía).
- Crear páginas públicas mínimas con SEO real (title/meta/canonical/JSON-LD, H1 único):
  - `/cursos` (lista pública de `courses` publicados)
  - `/cursos/:slug` (detalle público de curso; requiere migración de `slug`)
  - `/clases-en-vivo` (lista pública sin URLs de Zoom)
  - `/precios` (planes)
  - `/maestros` (grid de `instructor_profiles` activos)
  - `/ser-maestro` (redirige o alias de `/aplicar-maestro`)
  - `/nosotros`, `/contacto`, `/preguntas-frecuentes`
  - `/terminos`, `/privacidad`, `/politica-de-cancelacion`
  - `/login`, `/registro`, `/recuperar-password` (alias/redirect a `/auth`)
  - `404` ya existe.
- Auditar y reparar cada botón del landing: cada CTA lleva a una ruta real, guardando `?next=` cuando requiere login.
- Añadir `sitemap.xml` y actualizar `robots.txt` (excluir `/portal`, `/admin`, `/instructor`, `/checkout`).
- Migración pequeña: `alter table courses add column slug text unique`; backfill desde `title`.

**Entrega Fase A**: navegación pública completa, sin datos falsos, con slugs y SEO. Todavía sin Stripe.

---

## FASE B — Modelo de datos "SaaS real" (DB + RLS)
- Nuevas tablas (adaptadas a las que ya existen — reutilizo `profiles`, `courses`, `lessons`, `live_classes`, `user_roles`):
  - `plans` (basic/standard/pro/production con `stripe_price_id` editable desde admin)
  - `subscriptions` (fuente de verdad Stripe; `status`, `current_period_end`, `cancel_at_period_end`)
  - `enrollments` (acceso curso a curso, con `access_source` = plan|individual, `access_expires_at`)
  - `lesson_progress` (migro `user_progress` conservando datos: nuevo campo `enrollment_id`, `watched_seconds`, `last_position_seconds`)
  - `assignments`, `assignment_submissions`, `instructor_feedback`
  - `certificates` (número único, verification_code, pdf_url)
  - `notifications` (in-app)
  - `contact_leads`
  - `testimonials` (moderadas)
- RLS estricta con `has_role()`:
  - Estudiante solo ve lo suyo.
  - Instructor solo ve sus cursos/estudiantes asignados.
  - Nadie puede promoverse a admin desde el cliente (bloqueo en `user_roles` con trigger).
  - Nadie puede insertar `subscriptions` activas desde el cliente (grants sin INSERT/UPDATE para authenticated; solo service_role).
- Función `has_course_access(user_id, course_id)` SECURITY DEFINER que combina enrollment + plan + free preview.
- Correr el linter y arreglar cualquier warning nuevo.

**Entrega Fase B**: DB lista para Stripe, sin exponer nada premium.

---

## FASE C — Stripe end-to-end (con `enable_stripe_payments`)
- Activar Stripe con la integración nativa (te abre el formulario).
- Crear productos/precios (Estándar $45, Pro $75, Producción $99) en Stripe test, guardar `stripe_price_id` en `plans`.
- Edge functions:
  - `create-checkout-session` (JWT verificado; crea sesión con `client_reference_id = user.id`)
  - `stripe-webhook` (verifica firma; procesa `checkout.session.completed`, `customer.subscription.updated/deleted`, `invoice.payment_failed`; actualiza `subscriptions`, crea `enrollments`, dispara correos)
  - `create-portal-session` (customer portal)
- Rutas: `/checkout/success`, `/checkout/cancel`, `/cuenta/suscripcion` — la fuente de verdad es la webhook, no el redirect.
- Bloqueo/desbloqueo de contenido premium: reproductor consulta `has_course_access`; si expira, muestra pantalla "actualizar método de pago" pero conserva progreso.

**Entrega Fase C**: recorrido "landing → curso → registro → checkout → confirmación → dashboard" funcionando en test mode. Yo te aviso qué claves tienes que pegar (solo el formulario de Stripe; nada de secret keys manuales).

---

## FASE D — Dashboard, reproductor protegido y clases en vivo reales
- Renombrar rutas del portal a `/dashboard/*` según pediste (o alias, sin romper `/portal/*`).
- Dashboard con datos reales: saludo, suscripción, "continuar aprendiendo" (última lección con `last_position_seconds`), progreso, próxima clase, tareas pendientes, notificaciones, certificados.
- Reproductor: guardar `last_position_seconds` cada N segundos, marcar completada, siguiente/anterior, temario lateral, recursos, envío de tarea si aplica, comentarios del maestro.
- Clases en vivo:
  - Público: solo título, curso, maestro, hora, cupos. Sin URL de Zoom.
  - Estudiante: registrarse, cancelar, hora local, "Añadir a Google Calendar", enlace visible desde 15 min antes.
  - Admin/instructor: crear, editar, cargar grabación, marcar asistencia.

---

## FASE E — Certificados, tareas, correos y notificaciones
- Certificado: al 100% de progreso, edge function genera número + `verification_code`, sube PDF a bucket `certificates` (privado), fila en `certificates`. Ruta pública `/verificar-certificado/:code` que solo muestra nombre/curso/fecha.
- Correos transaccionales via Lovable Emails: bienvenida, pago confirmado/fallido, matrícula, recordatorio de clase (24h y 1h antes con cron), nueva tarea, tarea revisada, curso completado, certificado, solicitud de maestro recibida/aprobada/rechazada.
- Notificaciones in-app (`notifications` + badge en topbar).

---

## FASE F — SEO técnico, analítica, legal, QA
- JSON-LD por página (`Organization`, `WebSite`, `Course`, `BreadcrumbList`, `FAQPage`).
- Eventos de conversión (dataLayer o `analytics.track`) sin PII: `view_course`, `select_plan`, `begin_checkout`, `purchase`, `lesson_completed`, `course_completed`, `instructor_application_submitted`, `contact_form_submitted`.
- Páginas legales con contenido real (te doy plantillas; adaptas tu razón social/país).
- Consentimiento obligatorio en registro y checkout.
- Batería de pruebas manuales (yo con Playwright headless contra el preview) para los 24 escenarios que listaste; entrego reporte con resultado por escenario.
- Correr `supabase--linter` final y dejar warnings en cero (o justificados).

---

# Lo que voy a necesitar de ti (por fase)
- **A**: nada — puedo empezar ya.
- **B**: nada — migraciones con tu aprobación en el diff.
- **C**: completar el formulario de Stripe cuando lo abra (tu email + datos de negocio). Yo creo los productos con la herramienta batch.
- **D–E**: si quieres logo/color específico en el certificado PDF, mándamelos; si no, uso el logo actual.
- **F**: razón social, país, email de contacto y (opcional) dirección física para las páginas legales.

---

# Detalles técnicos (para tu referencia)

## Cambios a `courses`
```
alter table courses add column slug text unique;
alter table courses add column short_description text;
alter table courses add column preview_video_url text;
alter table courses add column cover_image_url text;  -- alias amable de thumbnail_url
alter table courses add column access_type text default 'plan'; -- plan|individual|hybrid
alter table courses add column individual_price_cents int;
alter table courses add column stripe_price_id text;
alter table courses add column featured boolean default false;
alter table courses add column instructor_id uuid references instructor_profiles(id);
```

## Migración segura de `user_progress` → `lesson_progress`
- Añado columnas nuevas a `user_progress` sin renombrar (compat), copio a la nueva estructura, mantengo el hook viejo hasta cortar. Cero pérdida de progreso.

## Acceso a video protegido
- Bucket `course-content` pasa de público a privado; el reproductor pide URL firmada de 60s vía edge function `sign-lesson-media` que valida `has_course_access` antes de firmar.

## Bloqueo de auto-promoción a admin
```
create policy "no self role escalation" on user_roles
  for insert with check (
    role = 'student'::app_role
    or has_role(auth.uid(), 'admin'::app_role)
  );
```

---

# Recomendación

Empiezo por **Fase A** en cuanto apruebes. Es la de menos riesgo (solo copy + rutas públicas + slugs) y desbloquea todo lo demás sin tocar Stripe ni RLS.

Si prefieres invertir el orden o partir un fase en trozos (por ejemplo Fase C solo Stripe test antes que Fase B completa), dímelo y lo reorganizo.
