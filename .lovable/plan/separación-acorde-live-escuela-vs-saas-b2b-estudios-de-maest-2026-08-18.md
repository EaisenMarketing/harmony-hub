# Separación Acorde Live (escuela) vs. SaaS B2B (estudios de maestros)

## Cómo entendí la arquitectura

**Negocio 1 — Acorde Live (tu escuela).** Tus instructores (`instructor_applications`, `instructor_profiles`, `/aplicar-maestro`, `/admin/instructores`), tus alumnos (`profiles`, `enrollments`), tus cursos/clases (`courses`, `live_classes`), tu Stripe principal y tus correos como "Acorde Live". `/admin` es exclusivamente tuyo.

**Negocio 2 — SaaS B2B.** Cada maestro cliente es un tenant: `teacher_accounts` (+ `teacher_students`, `teacher_courses`, `teacher_lessons`, `teacher_live_classes`, `teacher_assignments`, `teacher_leads`). Paga su suscripción de plataforma con TU Stripe. Sus alumnos le pagan a ÉL con SU Stripe conectado. Sus correos salen con su nombre de remitente y su reply-to, con un "Powered by Acorde Live" discreto en el pie.

Estos dos mundos ya viven en tablas separadas (`courses` vs `teacher_courses`, `profiles/enrollments` vs `teacher_students`) y no se cruzan. El trabajo es completar el módulo B2B y arreglar el router del admin.

## A. Router del admin (arreglo de fallback silencioso)

Hoy `/admin/suscripciones` y `/admin/configuracion` caen en el dashboard genérico. `/admin/alumnos` y `/admin/estadisticas` no existen como tal (el sidebar usa `/admin/estudiantes`, que sí funciona).

- `/admin/suscripciones` → montar `SubscriptionsDashboard` (el componente ya existe, nunca se conectó).
- `/admin/configuracion` → nueva pantalla `AdminSettings` con lo que ya es real (correo de la plataforma, identidad, enlaces) y bloques marcados "Próximamente" donde aún no hay lógica.
- `/admin/alumnos` → alias explícito que redirige a `/admin/estudiantes` (evita 404 silencioso).
- Fallback: cualquier `/admin/*` no reconocido muestra una tarjeta "Sección no disponible" con enlace al dashboard, en vez de renderizar el dashboard como si fuera esa sección.

## B. Panel del maestro B2B

Se mantiene `/estudio` (ya existe `StudioPanel` con dashboard, alumnos, cursos, clases, tareas, avisos, CRM, campañas, herramientas y configuración; vive fuera de `/admin` y de `/portal`). No creo una ruta nueva: consolido esta. Todas sus consultas ya filtran por `teacher_account_id` del maestro autenticado.

Dentro de `/estudio/configuracion` quedan dos secciones claras:
- **Pagos** (nueva, reemplaza el formulario de claves manuales).
- **Correo** (nueva).

## C. Pagos con Stripe Connect (Express) por maestro

Reemplazo el esquema actual (el maestro pega su `sk_live_`, riesgoso y sin KYC) por Stripe Connect Express.

Tabla `teacher_stripe_accounts` (una por estudio):
- `account_id` → `teacher_accounts.id` (único)
- `stripe_account_id` (acct_...), `status` (`not_connected` | `pending` | `connected`)
- `charges_enabled`, `payouts_enabled`, `details_submitted`
- `default_currency`, `monthly_price`
- `application_fee_bps` (0 por defecto — deja lista la comisión futura sin refactor)
- timestamps

Sin claves secretas del maestro en la base ni en el frontend. Solo el `acct_...` se muestra.

Funciones edge nuevas, con una capa `_shared/stripe.ts` que expone dos clientes distintos y explícitos: `platformStripe()` (tu cuenta, solo para la suscripción B2B) y `connectedStripe(stripeAccountId)` (cobros del maestro a sus alumnos). Nunca un cliente ambiguo.
- `studio-stripe-onboard`: crea la cuenta Express y devuelve el link de onboarding.
- `studio-stripe-status`: sincroniza `charges_enabled` / `payouts_enabled` desde Stripe.
- `studio-checkout`: crea el Checkout del alumno **contra la cuenta conectada** (`stripeAccount` header), con el hook de `application_fee_amount` presente pero en 0.

UI: `StudioPayments.tsx` se reescribe → botón "Conectar con Stripe", badge de estado (No conectado / Pendiente de verificación / Conectado), `acct_...` visible, precio mensual y moneda, botón "Abrir panel de Stripe".

El checkout de la suscripción del maestro a tu plataforma queda en archivos separados y sigue usando `platformStripe()`.

## D. Correo por maestro

Tabla `teacher_email_settings`:
- `account_id` (único), `from_name`, `reply_to_email`, `logo_url`, `brand_color`, timestamps.

`supabase/functions/_shared/resend.ts` ya distingue identidad de plataforma vs. estudio; lo cambio para que la identidad de estudio lea `teacher_email_settings` (from_name y reply_to del maestro) con fallback al nombre del estudio. Remitente técnico sigue siendo `estudios@acordelive.com` (sin DNS por maestro, como pediste), mostrado como "Estudio de Amanda". El layout B2B lleva "Powered by Acorde Live" pequeño en el pie. Los correos de tu escuela no se tocan.

UI: `StudioEmailSettings.tsx` dentro de `/estudio/configuracion`.

## E. Aislamiento de datos

- RLS de las tablas nuevas: solo el dueño del estudio (`owns_teacher_account`) lee/escribe; `service_role` para las funciones edge.
- El admin solo ve un booleano de conexión vía RPC `admin_studio_payment_status` (conectado sí/no, cobros habilitados sí/no). Sin `acct_id`, sin claves, sin capacidad de gestionar el Stripe del maestro.
- Repaso de las policies de `teacher_*` para confirmar que ningún maestro ve datos de otro.

## Notas técnicas

- Requiere tu `STRIPE_SECRET_KEY` de plataforma (la pediré como secreto cuando llegue el paso) y tener Connect habilitado en tu cuenta de Stripe.
- Migración: `teacher_stripe_settings` (esquema viejo con claves) se deja de usar y se limpian las columnas de claves secretas.
- No implemento comisión de plataforma ni dominios de correo por maestro en esta iteración.
