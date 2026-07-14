## Objetivo

Cambiar el modelo de suscripción: en lugar de planes por tier (basic/standard/pro/production) con acceso a todos los instrumentos, cada plan da acceso a **UN solo instrumento**. Precio único **$75/mes** para instrumentos y **$99/mes** para Producción Musical. El estudiante ve solo su instrumento y sus herramientas IA; los demás quedan bloqueados. Nuevo dashboard dedicado a Producción.

## Instrumentos disponibles

Piano · Guitarra acústica · Guitarra eléctrica · Bajo · Batería · Trompeta · **Producción Musical** ($99).

## Cambios en base de datos

- Añadir columna `primary_instrument` (text) a `profiles`. Este es el instrumento activo del usuario.
- Reutilizar `enabled_instruments` (ya existe) sincronizándolo con `primary_instrument` (un solo elemento).
- Nueva función `has_instrument_access(_user_id, _instrument)` (SECURITY DEFINER) que devuelve true si `profiles.primary_instrument = _instrument` o admin.
- Actualizar `has_course_access` para exigir que `courses.instrument` coincida con el instrumento del usuario (además del plan).
- Migrar usuarios existentes: `primary_instrument = NULL` → forzar selección al entrar.
- Mantener `subscription_plan` para diferenciar precio (`instrument` = $75, `production` = $99), pero **ya no otorga acceso multi-instrumento**.

## Frontend

### 1. Selector de instrumento obligatorio
- Nuevo modal/página `SelectInstrumentGate` que aparece en `/portal` si `primary_instrument` es null. Bloquea la app hasta elegir uno.
- Reemplaza al selector actual multi-select en `InstrumentSettings` por un radio-select de 1 instrumento (cambiar requiere confirmación, misma UI).

### 2. Dashboard filtrado por instrumento
- `StudentSidebar`: ocultar "Producción" salvo que el instrumento sea `production`. Los cursos/clases live/comunidad se filtran por `courses.instrument = primary_instrument`.
- `CoursesSection`, `ActiveCourses`, `ClassCalendar`, `LiveClassCard`: aplicar filtro por instrumento.
- Tarjetas de otros instrumentos → mostrar candado + CTA "Cambiar de plan".

### 3. Herramientas IA bloqueadas por instrumento
- Generador de acordes / diagramas / detector por foto:
  - Piano → solo visible si `primary_instrument = piano`
  - Guitarra (acústica/eléctrica/bajo) → solo visible para esos
  - Otros instrumentos → herramientas ocultas o bloqueadas con mensaje
- Analizador de canciones y asistente de teoría: disponibles para todos (no bloquear).
- Ajustar `PracticeSection`, `ChordGeneratorModal`, `ChordPhotoDetector`, `ChordSheet`, `ChordProgressions`.

### 4. Nuevo Dashboard de Producción
- Nueva ruta `/portal/produccion` (reemplaza actual `ProductionClassesSection`) con secciones:
  - **Cursos de Producción Musical** (courses con `instrument='production'`)
  - **Herramientas DAW / Mezcla** (sección con recursos y plugins recomendados — contenido estático inicial)
  - **Clases en vivo de Producción** (live_classes con `instrument='production'`)
  - **Biblioteca de Samples / Presets** (lista desde nuevo bucket `production-assets` o placeholder si aún no hay contenido)
- Sidebar del portal solo muestra "Producción" y oculta el resto de secciones de instrumento cuando `primary_instrument = production`.
- Header propio "Producción Musical" con branding diferenciado.

### 5. Pricing público
- `PricingSection` y `PricingPage`: rediseñar en 7 tarjetas (una por instrumento) todas a **$75/mes**, más **Producción $99/mes**. Eliminar los tiers actuales basic/standard/pro. Cada tarjeta muestra el instrumento, sus beneficios y CTA "Empezar con [instrumento]".
- En Auth/registro, si viene de una tarjeta, prellenar `primary_instrument`.

### 6. Migración de usuarios actuales
- Al iniciar sesión, si `primary_instrument` es null, se muestra el `SelectInstrumentGate`.
- El instrumento elegido se guarda; el `subscription_plan` se remapea (standard/pro → `instrument`, production sigue `production`).

## Detalles técnicos

- `src/lib/plans.ts`: reemplazar por `src/lib/instrument-access.ts` con helpers `hasInstrumentAccess(user, instrument)`, `getUserInstrument(profile)`, `isAiToolEnabled(profile, tool)`.
- `src/lib/instruments.ts`: ya existe; añadir `price` por instrumento.
- Hook nuevo `useUserInstrument()` reemplaza uso multi de `useEnabledInstruments`.
- RLS: actualizar policies de `courses`, `live_classes` con la nueva función.
- **Pagos y Stripe se dejan para el final** (no se tocan en esta iteración, según lo pediste).

## Orden de implementación

1. Migración DB (`primary_instrument`, función, backfill NULL, actualizar `has_course_access`).
2. Hook + helpers + gate de selección de instrumento.
3. Filtrado en sidebar, cursos, clases live, comunidad.
4. Bloqueo de herramientas IA por instrumento.
5. Nuevo dashboard `/portal/produccion` con las 4 secciones.
6. Rediseño de `PricingSection` / `PricingPage`.
7. Actualizar `InstrumentSettings` a selección única.

## Fuera de alcance (para más tarde)

- Integración de pagos Stripe/Paddle (queda pendiente como pediste).
- Contenido real de samples/presets del dashboard de Producción (se deja sección con placeholder para subir después).
- Posibilidad de suscribirse a múltiples instrumentos simultáneamente.
