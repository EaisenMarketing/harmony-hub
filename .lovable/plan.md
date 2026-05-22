# Plan: Consultas a Maestros + Comunidad Pro

Voy a añadir dos nuevas secciones al portal del estudiante.

## 1. Consultas a Maestros (todos los alumnos)

Nueva sección **"Pregunta al Maestro"** en el sidebar (`/portal/consultas`).

- Formulario: instrumento (Piano / Guitarra / Producción), maestro destinatario (lista de instructores aprobados de ese instrumento, o "Cualquier maestro"), título de la pregunta, descripción, opcional adjuntar imagen.
- Al enviar:
  - Se guarda en tabla `teacher_questions` (status: open / answered).
  - Se envía un email al/los maestros con la pregunta y un enlace al panel del instructor.
  - El maestro puede responder desde el panel; la respuesta queda visible para el alumno y se le envía un email de aviso.
- Vista "Mis consultas": historial con estado y respuesta.
- Nueva pestaña en el **Panel de Instructor** → "Consultas" con bandeja entrante, responder, marcar resuelta.

### Emails
Para que los emails salgan desde tu dominio (`@tudominio.com`) necesito configurar el dominio de correo de Lovable. Te pediré el dominio al final del plan; mientras tanto, las consultas igual se guardan y se ven en el panel del instructor.

## 2. Comunidad Pro (solo plan Pro y superior)

Nueva sección **"Comunidad"** en el sidebar (`/portal/comunidad`), bloqueada con upgrade card para planes inferiores a **Pro**.

Feed estilo red social:
- **Publicar**: texto (hasta 2000 chars) + imagen opcional (subida a bucket `community-media`).
- **Categorías/Tags**: Avance, Pregunta, Cover, Tip, General.
- **Like** y **Comentarios** (texto, hasta 500 chars).
- Avatar y nombre del autor, fecha relativa ("hace 2h").
- Filtro por tag y orden por recientes / más populares.
- Botón eliminar en tus propios posts/comentarios.
- Admins pueden moderar (eliminar cualquier post/comentario).

## Cambios técnicos

**DB (migración)**
- `teacher_questions` (student_id, instructor_id nullable, instrument, title, body, image_url, status, answer, answered_at)
- `community_posts` (user_id, content, image_url, tag)
- `community_comments` (post_id, user_id, content)
- `community_likes` (post_id, user_id) unique
- Bucket público `community-media`
- RLS:
  - `teacher_questions`: alumno ve las suyas; instructor aprobado ve las dirigidas a él o sin destinatario de su instrumento; admin ve todo.
  - `community_*`: SELECT solo si `get_user_plan(auth.uid())` ∈ {pro, production}; INSERT solo el propio user_id con mismo gate de plan; DELETE propio o admin.

**Edge functions**
- `notify-teacher-question`: envía email al/los maestros cuando se crea una consulta (vía cola de Lovable Emails).
- `notify-question-answered`: avisa al alumno cuando hay respuesta.

**Frontend nuevo**
- `src/components/student/TeacherConsultSection.tsx` + formulario + lista "Mis consultas".
- `src/components/student/CommunitySection.tsx` + `PostCard`, `PostComposer`, `CommentList`.
- `src/components/instructor/InstructorQuestionsInbox.tsx`.
- Rutas en `StudentPortal.tsx` (`/portal/consultas`, `/portal/comunidad`) y enlaces en `StudentSidebar.tsx` + `MobileBottomNav.tsx`.
- Pestaña en `InstructorPanel.tsx`.

**Hooks**
- `useTeacherQuestions`, `useCommunityFeed`, `usePostInteractions` con React Query + Realtime para feed.

## Después de tu aprobación
1. Corro la migración (te pediré confirmación).
2. Te muestro el botón para configurar el dominio de correo (necesario para que los emails salgan).
3. Implemento UI + edge functions y despliego.

¿Procedo con este plan?