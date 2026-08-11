# Acorde Live — Suscripciones, prueba gratis de 3 días, instrumento único y accesos

## Lo que ya existe y se reutiliza
- Auth (email + Google), roles (`user_roles`, `has_role`), portal de alumno, panel admin, panel de maestro/estudio B2B.
- `profiles.primary_instrument` como instrumento activo, `SelectInstrumentGate`, `has_course_access`, `AIToolGate`.
- Cursos/módulos/lecciones, `lesson_progress`, `live_classes` + `live_class_registrations`, `subscriptions`, CRM de leads.

## Lo que cambia (decisión de negocio nueva)
Hoy el modelo es "1 plan por instrumento" a $75/$99. El nuevo modelo separa **plan** (beneficios) de **instrumento** (contenido):
- ESENCIAL $29.99 · PRO $49.99 (MÁS POPULAR) · PREMIUM $69.99 — todos con **1 instrumento**.
- Diferencia entre planes: nº de herramientas Acorde AI (1 / 3 / todas), envío de prácticas, feedback del maestro, contenido avanzado, nivel de seguimiento.
- "Producción Musical" pasa a ser un instrumento más (elegible bajo cualquier plan), no un plan aparte.

---

## Fase 1 — Base de datos y reglas de negocio (backend primero)
Nuevas tablas (todas con GRANTs + RLS):
- `plans` (key, nombre, precio_cents, ai_tool_limit, allow_practice_submissions, allow_teacher_feedback, advanced_content, orden, activo)
- `instruments` (slug, nombre, emoji, activo) y `levels` (never_played, beginner, intermediate, advanced, unsure)
- `user_instruments` (user_id, instrument, level, status active/paused, índice único parcial que **garantiza 1 instrumento activo por usuario**)
- `instrument_change_history` (+ regla de 1 cambio cada 30 días validada en función de BD)
- `trials` (user_id, plan_key, started_at, ends_at, status trialing/converted/canceled) y `profiles.trial_used boolean`
- `subscription_events` (auditoría: trial_started, converted, canceled, plan_changed, reactivated)
- `groups` (instrumento, nivel, maestro, día/hora, timezone base, capacidad, `trial_slots_limit` configurable, default 3) y `group_students` (status active/trial)
- `class_sessions` (grupo, fecha/hora UTC, join_url, estado) — reutiliza `live_classes` donde aplique
- `ai_tools` (key, nombre, instrumentos soportados, activo) y `plan_ai_tools` (permisos por plan, editable por admin)
- `private_lesson_orders` (1 sesión $39 / paquete 4 $139, ligado al instrumento activo)
- `payment_methods` (referencia al proveedor, sin datos de tarjeta)

Funciones security-definer para que el acceso **no dependa del frontend**:
- `current_entitlement(user)` → plan, estado (trialing/active/canceled/inactive), instrumento activo, nivel, límite de herramientas IA, días restantes de trial.
- `can_access_instrument(user, instrument)`, `can_use_ai_tool(user, tool_key)`, `can_start_trial(user)`, `switch_instrument(user, nuevo)` con la regla de 30 días.
- RLS: alumno ve solo lo suyo; maestro solo sus grupos/alumnos; admin todo.

## Fase 2 — Onboarding por pasos (6 pasos, con barra de progreso)
Ruta `/empezar`: 1) plan → 2) cuenta → 3) método de pago → 4) instrumento (tarjetas, solo uno, con pantalla de confirmación) → 5) nivel + grupo compatible → 6) bienvenida.
- Confirmación explícita de la prueba: "$0 hoy. Tu membresía comenzará automáticamente después de 3 días…".
- Los grupos se filtran por instrumento + nivel + cupo; se muestran ya convertidos a la zona horaria del alumno.
- Se guarda `timezone` del alumno y toda hora se almacena en UTC.

## Fase 3 — Control de acceso real
- Guard en cada ruta privada (`/portal/*`, cursos, herramientas) que consulta `current_entitlement` y las funciones de BD; escribir la URL a mano no basta.
- Pantalla "Este contenido pertenece a otro instrumento" + botón "Volver a mi instrumento".
- Herramientas de IA: cada Edge Function valida plan/instrumento antes de responder, además del gate visual.
- Admin conserva bypass total.

## Fase 4 — Dashboard "Mi Acorde Live"
Saludo + instrumento, "Continuar aprendiendo", Próxima clase (maestro, fecha/hora en su zona, botón entrar), Mi progreso, Mis prácticas, Acorde AI (herramientas habilitadas/bloqueadas según plan), Mi membresía (plan, estado, precio, próximo cobro, días de trial restantes, cambiar plan, cancelar).
Banner de trial: "Te quedan X días… Tu plan Pro comenzará el DD de MES por $49.99/mes".

## Fase 5 — Ciclo de vida de la suscripción
Cambio de plan (mantiene instrumento, no vuelve a pedirlo), cambio de instrumento (1 cada 30 días, con advertencia y progreso guardado), cancelación en trial (sin cobro) o `cancel_at_period_end` tras pago, reactivación restaurando instrumento/progreso/grupo, y **una sola prueba por cuenta** (`trial_used`).

## Fase 6 — Panel del maestro y panel admin
- Maestro: solo sus grupos, alumnos (distinguiendo ACTIVO vs TRIAL), horarios, próximas clases, prácticas y progreso. Sin pago extra por alumno en prueba (el pago es por clase/grupo).
- Admin: estudiantes, maestros, planes, suscripciones, trials, conversiones, cancelaciones, instrumentos, grupos, clases, pagos, Acorde AI (editar permisos por plan), prácticas y progreso.
- Métricas de trial: total, activos, cancelados, convertidos y tasa de conversión, segmentada por instrumento, plan, país, maestro y grupo. Exportable a CSV.

## Fase 7 — Cobros y recordatorios
- Cobro real con el proveedor de pagos (checkout con trial de 3 días, tarjeta requerida) + webhook que reconcilia estado, plan y fechas en la BD.
- Emails automáticos: bienvenida al trial, aviso 24 h antes del cobro, confirmación de cancelación. Requiere dominio verificado para envíos propios.

---

## Notas técnicas
- Todo el estado de acceso vive en BD; el frontend solo refleja `current_entitlement`.
- Migraciones incrementales, sin borrar tablas ni datos actuales; los usuarios con `primary_instrument` se migran a `user_instruments` y se les asigna un plan equivalente.
- Horas siempre en UTC en BD, formateadas con la zona del alumno.

## Preguntas antes de empezar
1. Los alumnos actuales con planes de $75/$99: ¿los migro a PRO ($49.99) y PREMIUM ($69.99) respectivamente?
2. ¿Cuál herramienta de Acorde AI es la incluida en ESENCIAL (1 sola)?
3. Para los cobros, ¿arranco ya con la integración de pagos o dejo el paso de "método de pago" simulado hasta el final, como veníamos haciendo?
