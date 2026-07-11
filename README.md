# Acorde Live

SaaS de escuela de música en vivo: piano, guitarra y producción musical, con clases en Zoom, herramientas de IA (generador y detector de acordes por foto, analizador de canciones, teoría musical) y panel de instructores/admin.

Stack: React 18 + Vite + Tailwind + shadcn/ui + Lovable Cloud (Supabase Auth, DB con RLS, Storage, Edge Functions) + Resend para emails.

---

## Desarrollo

```bash
bun install
bun run dev      # http://localhost:8080
bun run build
```

Rutas principales: `/` landing, `/auth` login, `/portal` alumno, `/instructor` maestro, `/admin` admin, `/aplicar-maestro` aplicación pública de maestros.

---

## Empaquetar como app móvil (Capacitor)

La app ya está mobile-ready (safe-areas, bottom nav, cámara nativa vía `<input capture>`, sin dependencias de `window` bloqueantes).

```bash
# 1. Instalar Capacitor
bun add @capacitor/core @capacitor/cli @capacitor/ios @capacitor/android

# 2. Inicializar (una sola vez)
bunx cap init "Acorde Live" com.acordelive.app --web-dir=dist

# 3. Añadir plataformas
bunx cap add ios
bunx cap add android

# 4. Cada vez que despliegues cambios:
bun run build
bunx cap sync

# 5. Abrir en Xcode / Android Studio
bunx cap open ios
bunx cap open android
```

En `capacitor.config.ts` apunta `server.url` a la URL publicada (`https://chord-crafters-academy.lovable.app`) durante desarrollo si prefieres hot-reload en el dispositivo. Para producción quítalo y usa el bundle local.

Permisos que la app pide:
- **Cámara**: detector de acordes por foto.
- **Micrófono**: afinador y metrónomo.
- **Almacenamiento**: subida de foto desde galería.

Añade las claves correspondientes en `ios/App/App/Info.plist` (`NSCameraUsageDescription`, `NSMicrophoneUsageDescription`, `NSPhotoLibraryUsageDescription`) y en `android/app/src/main/AndroidManifest.xml`.

---

## Pagos (Stripe)

Cuando quieras cobrar suscripciones, activa Stripe desde el chat de Lovable con "activar Stripe". El flujo es:

1. Se abre el formulario integrado (email + datos de negocio).
2. Se crea la conexión gestionada — no se necesita cuenta previa de Stripe.
3. Los planes ya están definidos en `src/lib/plans.ts` (basic / standard / pro / production).
4. Se conectan los precios y se habilita el checkout en `PaymentsSection`.

No se activa automáticamente — se hace solo cuando lo indiques.

---

## Estructura

```
src/
  components/
    student/     # portal del alumno
    instructor/  # panel del maestro
    admin/       # panel de admin
    landing/     # efectos de la home
  hooks/         # data hooks (React Query + Supabase)
  pages/         # rutas top-level
  integrations/  # cliente Supabase autogenerado (no editar)
supabase/
  functions/     # edge functions (IA, aprobación de maestros)
  migrations/    # esquema versionado
```
