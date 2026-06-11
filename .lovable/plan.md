
# Plan — Acorde Live: Terminar la web app

Trabajo dividido en **4 fases**. Tú apruebas cada una antes de la siguiente. Nada se rompe en producción mientras avanzamos.

---

## FASE 1 — Separación de herramientas por instrumento

Cada alumno tiene en su perfil los instrumentos habilitados. Solo ve y puede usar las herramientas de IA de su(s) instrumento(s).

**Qué cambia para el alumno:**
- Nuevo selector "Mis instrumentos" en su perfil (guitarra, piano, ambos).
- En el primer login se le pregunta una vez con un modal de bienvenida.
- El menú de "Herramientas IA" filtra automáticamente:
  - Solo guitarra → Generador de acordes de guitarra, Sheet de guitarra, Afinador estándar guitarra.
  - Solo piano → Generador de acordes de piano, Sheet de piano.
  - Ambos → Todo.
- Tools compartidos (metrónomo, analizador de canciones, sala de práctica) siguen disponibles para todos.

**Qué cambia para el admin:**
- Desde el panel admin puedes editar los instrumentos habilitados de cualquier alumno.

**Técnico:**
- Columna `enabled_instruments text[]` en `profiles` con default `{}`.
- Hook `useEnabledInstruments()` que también respeta plan (production sigue siendo el tope).
- Componente `<InstrumentGate instrument="guitar">` que envuelve cada tool y muestra mensaje "Esta herramienta es parte del curso de guitarra" si no aplica.

---

## FASE 2 — Reconocedor de acordes con foto + IA

Nueva sección "Detectar acorde por foto" con dos modos: subir desde galería o tomar foto con la cámara (funciona en móvil y desktop).

**Flujo:**
1. Alumno abre la sección (filtrada por instrumento igual que Fase 1).
2. Toma foto de su mano en el instrumento, o sube una imagen.
3. La imagen se envía a Gemini Vision (`google/gemini-2.5-pro`) vía edge function.
4. La IA devuelve: nombre del acorde, nivel de confianza, posición/dedos detectados, y sugerencias si la mano está mal posicionada.
5. Se guarda en historial (`chord_detections`) para que pueda revisarlas después.

**Técnico:**
- Edge function `detect-chord-from-image` (multimodal input a Lovable AI Gateway).
- Tabla `chord_detections` con RLS.
- Bucket `chord-photos` (privado, por usuario).
- Componentes: `ChordPhotoDetector.tsx`, `ChordPhotoHistory.tsx`.
- Compatible con cámara nativa de Capacitor (cuando empaqueten a iOS/Android funciona sin cambios).

---

## FASE 3 — Página pública "Aplicar como maestro"

Página `/aplicar-maestro` con formulario público (sin login) donde cualquiera puede aplicar.

**Formulario:**
- Datos personales, instrumento(s), años de experiencia, biografía.
- Video de presentación (URL de YouTube/Vimeo).
- Sample de clase grabada (URL).
- Disponibilidad horaria y zona horaria.
- Acepta términos.

**Flujo de aprobación:**
1. Aplica → se guarda en `instructor_applications` con estado `pending`.
2. Admin recibe la aplicación en su panel (nuevo tab "Aplicaciones").
3. Admin aprueba → se crea automáticamente la cuenta del maestro (email con contraseña temporal vía Resend), se le da rol `instructor`, se crea `instructor_profile`.
4. Maestro entra al panel de instructor existente y ya puede programar sus clases de Zoom (la infra ya existe).

**Técnico:**
- Tabla `instructor_applications` con RLS (cualquiera puede insertar, solo admin lee).
- Edge function `approve-instructor-application` (crea user vía service role, envía email).
- Página `/aplicar-maestro` con SEO (título, meta, JSON-LD).
- Nueva sección "Aplicaciones" en `AdminPanel`.

---

## FASE 4 — Pulido final (mobile-ready)

Asegura que todo funciona perfecto antes de empaquetar a iOS/Android y conectar Stripe.

- Auditoría de safe-areas en todas las páginas (notch + bottom nav).
- Auditoría de permisos: cámara, micrófono (afinador, foto IA), storage.
- Estados vacíos y de error consistentes en todas las secciones nuevas.
- Loading skeletons en tools que llaman IA.
- Test de flujo completo: registro → elegir instrumento → usar tool → guardar.
- Verificación de RLS en todas las tablas nuevas (corro el linter de Supabase).
- README breve con los pasos para empaquetar con Capacitor (ya está la guía en memoria).
- Checklist de Stripe: confirmo que `enable_stripe_payments` puede conectarse limpiamente cuando lo decidas (solo dejo todo listo, no lo activo).

---

## Lo que NO incluye este plan (a propósito)

- No toco el modelo de negocio "Maestro SaaS" que discutimos antes — sigues como escuela.
- No activo Stripe todavía (tú lo harás cuando estés listo).
- No empaqueto la app móvil (eso es paso final con Capacitor).

---

## Siguiente paso

Si apruebas, empiezo con **Fase 1** (separación por instrumento). Es la base sobre la que se monta la Fase 2 (foto IA).
