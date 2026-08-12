import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { CourseWithProgress, UpcomingClass } from '@/hooks/useStudentData';
import type { InstrumentPlanInfo } from '@/lib/instrument-access';

interface ReportInput {
  studentName: string;
  studentEmail: string;
  plan: InstrumentPlanInfo | null;
  courses: CourseWithProgress[];
  upcoming: UpcomingClass[];
  recentCompleted: Array<{ lessonTitle: string; courseTitle: string; date: string | null }>;
  totalCompletedLessons: number;
  totalHours: number;
  streakDays: number;
}

const LINE_HEIGHT = 6;

export const generateProgressReportPdf = (input: ReportInput) => {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 15;
  let y = 20;

  const ensureSpace = (needed = LINE_HEIGHT) => {
    if (y + needed > pageHeight - 15) {
      doc.addPage();
      y = 20;
    }
  };

  const title = (text: string, size = 16) => {
    ensureSpace(10);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(size);
    doc.setTextColor(20, 20, 20);
    doc.text(text, marginX, y);
    y += size * 0.5 + 2;
  };

  const subtitle = (text: string) => {
    ensureSpace(8);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(80, 80, 80);
    doc.text(text, marginX, y);
    y += 6;
  };

  const paragraph = (text: string) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(50, 50, 50);
    const lines = doc.splitTextToSize(text, pageWidth - marginX * 2);
    lines.forEach((line: string) => {
      ensureSpace();
      doc.text(line, marginX, y);
      y += LINE_HEIGHT;
    });
  };

  const divider = () => {
    ensureSpace(4);
    doc.setDrawColor(220, 220, 220);
    doc.line(marginX, y, pageWidth - marginX, y);
    y += 4;
  };

  // Header
  doc.setFillColor(10, 10, 15);
  doc.rect(0, 0, pageWidth, 14, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Acorde Live · Historial de progreso', marginX, 9);
  y = 22;

  title('Historial de progreso');
  paragraph(`Estudiante: ${input.studentName}`);
  paragraph(`Email: ${input.studentEmail}`);
  paragraph(`Plan: ${input.plan ? input.plan.label : 'Sin instrumento seleccionado'}`);
  paragraph(`Generado el ${format(new Date(), "d 'de' MMMM yyyy, HH:mm", { locale: es })}`);
  y += 2;
  divider();

  // Resumen
  subtitle('Resumen');
  paragraph(`Lecciones completadas: ${input.totalCompletedLessons}`);
  paragraph(`Horas estimadas de estudio: ${input.totalHours} h`);
  paragraph(`Racha actual: ${input.streakDays} día(s)`);
  const total = input.courses.reduce((a, c) => a + c.totalLessons, 0);
  const done = input.courses.reduce((a, c) => a + c.completedLessons, 0);
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  paragraph(`Progreso global: ${pct}% (${done}/${total} lecciones)`);
  y += 2;
  divider();

  // Cursos
  subtitle('Progreso por curso');
  if (input.courses.length === 0) {
    paragraph('No hay cursos disponibles aún para tu plan.');
  } else {
    input.courses.forEach((c) => {
      ensureSpace(14);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(20, 20, 20);
      doc.text(c.title, marginX, y);
      y += 5;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(90, 90, 90);
      doc.text(
        `${c.completedLessons}/${c.totalLessons} lecciones · ${c.level} · ${c.progress}%`,
        marginX,
        y,
      );
      y += 4;
      // Progress bar
      const barX = marginX;
      const barY = y;
      const barW = pageWidth - marginX * 2;
      const barH = 3;
      doc.setFillColor(230, 230, 230);
      doc.rect(barX, barY, barW, barH, 'F');
      doc.setFillColor(80, 130, 240);
      doc.rect(barX, barY, (barW * c.progress) / 100, barH, 'F');
      y += barH + 5;
    });
  }
  y += 2;
  divider();

  // Lecciones completadas recientes
  subtitle('Lecciones completadas recientemente');
  if (input.recentCompleted.length === 0) {
    paragraph('Aún no has completado lecciones.');
  } else {
    input.recentCompleted.forEach((r, i) => {
      paragraph(`${i + 1}. ${r.lessonTitle} — ${r.courseTitle}${r.date ? ` (${r.date})` : ''}`);
    });
  }
  y += 2;
  divider();

  // Próximas clases
  subtitle('Próximas clases en vivo');
  if (input.upcoming.length === 0) {
    paragraph('No tienes clases próximas programadas.');
  } else {
    input.upcoming.forEach((cls) => {
      const when = format(new Date(cls.scheduled_at), "EEEE d 'de' MMMM, HH:mm", { locale: es });
      paragraph(`• ${cls.title} — ${when}${cls.duration_minutes ? ` (${cls.duration_minutes} min)` : ''}${cls.isRegistered ? ' · Inscrito' : ''}`);
    });
  }

  // Footer numeración
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text(`Página ${i} de ${pages} · Acorde Live`, pageWidth / 2, pageHeight - 8, { align: 'center' });
  }

  const filename = `progreso-acorde-live-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
  doc.save(filename);
};
