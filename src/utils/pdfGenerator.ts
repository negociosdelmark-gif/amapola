import { jsPDF } from 'jspdf';

interface HealthRecord {
  id: string;
  date: string;
  weight: number;
  height: number;
}

interface ChildProfile {
  id: string;
  name: string;
  birthdate: string;
  allergies: string[];
  history: HealthRecord[];
}

// Age helper
const getAgeText = (birthdate: string, referenceDateStr?: string) => {
  if (!birthdate) return '';
  const bDate = new Date(birthdate);
  const refDate = referenceDateStr ? new Date(referenceDateStr) : new Date();
  
  let years = refDate.getFullYear() - bDate.getFullYear();
  let months = refDate.getMonth() - bDate.getMonth();
  
  if (months < 0 || (months === 0 && refDate.getDate() < bDate.getDate())) {
    years--;
    months += 12;
  }
  
  if (years === 0) {
    if (months === 0) {
      const diffTime = Math.abs(refDate.getTime() - bDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return `${diffDays} días`;
    }
    return `${months} ${months === 1 ? 'mes' : 'meses'}`;
  }
  
  return `${years} ${years === 1 ? 'año' : 'años'} ${months > 0 ? `y ${months} ${months === 1 ? 'mes' : 'meses'}` : ''}`;
};

// Date formatting helper
const formatDate = (dateStr: string) => {
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch (e) {
    return dateStr;
  }
};

export const exportChildHealthPDF = (child: ChildProfile): void => {
  // Create document
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  let currentY = 15;

  // Primary colors
  const tealColor = [13, 148, 136]; // Teal-600
  const darkSlateColor = [30, 41, 59]; // Slate-800
  const lightSlateColor = [100, 116, 139]; // Slate-500
  const dangerRoseColor = [244, 63, 94]; // Rose-500
  const lightBgColor = [248, 250, 252]; // Slate-50

  // Helper to draw horizontal line
  const drawLine = (y: number, r = 226, g = 232, b = 240) => {
    doc.setDrawColor(r, g, b);
    doc.setLineWidth(0.3);
    doc.line(margin, y, pageWidth - margin, y);
  };

  // --- HEADER SECTION ---
  // Background colored accent header bar
  doc.setFillColor(tealColor[0], tealColor[1], tealColor[2]);
  doc.rect(0, 0, pageWidth, 40, 'F');

  // App Logo Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(255, 255, 255);
  doc.text('AMAPOLA ALERTA', margin, 18);

  // Subtitle
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(204, 251, 241); // light teal-50
  doc.text('Informe de Control de Crecimiento y Salud Infantil', margin, 24);

  // Print Date
  const today = new Date().toLocaleDateString('es-ES', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });
  doc.setFontSize(9);
  doc.text(`Fecha de emisión: ${today}`, pageWidth - margin, 18, { align: 'right' });
  doc.text(`Generado para consulta pediátrica`, pageWidth - margin, 24, { align: 'right' });

  // Move cursor below the banner
  currentY = 50;

  // --- CHILD PROFILE CARD ---
  doc.setFillColor(lightBgColor[0], lightBgColor[1], lightBgColor[2]);
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(0.5);
  doc.rect(margin, currentY, pageWidth - (margin * 2), 32, 'FD');

  // Profile icon representation (Teal circle)
  doc.setFillColor(tealColor[0], tealColor[1], tealColor[2]);
  doc.circle(margin + 12, currentY + 16, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text(child.name.charAt(0).toUpperCase(), margin + 12, currentY + 19.5, { align: 'center' });

  // Child Info Text
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(darkSlateColor[0], darkSlateColor[1], darkSlateColor[2]);
  doc.text(child.name, margin + 24, currentY + 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(lightSlateColor[0], lightSlateColor[1], lightSlateColor[2]);
  doc.text('PACIENTE INFANTIL', margin + 24, currentY + 17);

  // Details column 1
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(darkSlateColor[0], darkSlateColor[1], darkSlateColor[2]);
  doc.text('Fecha de Nacimiento:', margin + 85, currentY + 12);
  doc.setFont('helvetica', 'normal');
  doc.text(formatDate(child.birthdate), margin + 126, currentY + 12);

  // Details column 2
  doc.setFont('helvetica', 'bold');
  doc.text('Edad Actual:', margin + 85, currentY + 19);
  doc.setFont('helvetica', 'normal');
  doc.text(getAgeText(child.birthdate), margin + 126, currentY + 19);

  // Details row 2 - pediatric measurements count
  doc.setFont('helvetica', 'bold');
  doc.text('Controles Registrados:', margin + 85, currentY + 26);
  doc.setFont('helvetica', 'normal');
  doc.text(`${child.history.length} tomas históricas`, margin + 126, currentY + 26);

  currentY += 40;

  // --- ALLERGIES SECTION ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(darkSlateColor[0], darkSlateColor[1], darkSlateColor[2]);
  doc.text('1. Alergias Conocidas y Alertas Médicas', margin, currentY);
  currentY += 4;
  drawLine(currentY, tealColor[0], tealColor[1], tealColor[2]);
  currentY += 6;

  if (child.allergies.length > 0) {
    // Red-tinted caution block
    const boxHeight = 10 + (child.allergies.length * 6);
    doc.setFillColor(255, 241, 242); // rose-50
    doc.setDrawColor(254, 205, 211); // rose-200
    doc.rect(margin, currentY, pageWidth - (margin * 2), boxHeight, 'FD');

    // Warning Accent line
    doc.setFillColor(dangerRoseColor[0], dangerRoseColor[1], dangerRoseColor[2]);
    doc.rect(margin, currentY, 3, boxHeight, 'F');

    // Section title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(dangerRoseColor[0], dangerRoseColor[1], dangerRoseColor[2]);
    doc.text('¡ATENCIÓN! Alergias informadas por los padres:', margin + 8, currentY + 6);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(darkSlateColor[0], darkSlateColor[1], darkSlateColor[2]);
    
    child.allergies.forEach((allergy, index) => {
      doc.text(`• ${allergy}`, margin + 12, currentY + 13 + (index * 6));
    });

    currentY += boxHeight + 10;
  } else {
    // Green-tinted clear block
    doc.setFillColor(240, 253, 244); // emerald-50
    doc.setDrawColor(187, 247, 208); // emerald-200
    doc.rect(margin, currentY, pageWidth - (margin * 2), 15, 'FD');

    doc.setFillColor(22, 163, 74); // emerald-600
    doc.rect(margin, currentY, 3, 15, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(22, 163, 74);
    doc.text('No se han registrado alergias conocidas para este paciente.', margin + 8, currentY + 9);

    currentY += 25;
  }

  // --- GROWTH HISTORY TABLE ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(darkSlateColor[0], darkSlateColor[1], darkSlateColor[2]);
  doc.text('2. Historial Clínico de Crecimiento (Peso y Talla)', margin, currentY);
  currentY += 4;
  drawLine(currentY, tealColor[0], tealColor[1], tealColor[2]);
  currentY += 6;

  if (child.history.length > 0) {
    // Table Header
    doc.setFillColor(tealColor[0], tealColor[1], tealColor[2]);
    doc.rect(margin, currentY, pageWidth - (margin * 2), 8, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text('Fecha de Registro', margin + 6, currentY + 5.5);
    doc.text('Edad al Registro', margin + 45, currentY + 5.5);
    doc.text('Peso (kg)', margin + 90, currentY + 5.5);
    doc.text('Talla (cm)', margin + 130, currentY + 5.5);

    currentY += 8;

    doc.setTextColor(darkSlateColor[0], darkSlateColor[1], darkSlateColor[2]);
    doc.setFont('helvetica', 'normal');

    // Render history rows
    // Sort rows from newest to oldest for medical visits
    const sortedHistory = [...child.history].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    sortedHistory.forEach((record, index) => {
      // Alternating row background colors
      if (index % 2 === 0) {
        doc.setFillColor(250, 250, 250);
      } else {
        doc.setFillColor(255, 255, 255);
      }
      doc.rect(margin, currentY, pageWidth - (margin * 2), 8, 'F');
      drawLine(currentY + 8);

      doc.setFont('helvetica', 'bold');
      doc.text(formatDate(record.date), margin + 6, currentY + 5.5);
      doc.setFont('helvetica', 'normal');
      doc.text(getAgeText(child.birthdate, record.date), margin + 45, currentY + 5.5);
      
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(tealColor[0], tealColor[1], tealColor[2]);
      doc.text(`${record.weight.toFixed(2)} kg`, margin + 90, currentY + 5.5);
      
      doc.setTextColor(37, 99, 235); // Blue
      doc.text(`${record.height.toFixed(1)} cm`, margin + 130, currentY + 5.5);

      doc.setTextColor(darkSlateColor[0], darkSlateColor[1], darkSlateColor[2]);
      doc.setFont('helvetica', 'normal');
      currentY += 8;
    });

    currentY += 10;
  } else {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(lightSlateColor[0], lightSlateColor[1], lightSlateColor[2]);
    doc.text('Sin registros de peso y talla guardados aún.', margin, currentY + 5);
    currentY += 15;
  }

  // --- CLINIC NOTES / PEDIATRICIAN SECTION (To be written by hand or during consultation) ---
  // Ensure we don't overflow page height. If so, create a new page, but we have plenty of room on A4 (297mm height)
  if (currentY > pageHeight - 75) {
    doc.addPage();
    currentY = 20;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(darkSlateColor[0], darkSlateColor[1], darkSlateColor[2]);
  doc.text('3. Anotaciones de la Consulta Pediatra', margin, currentY);
  currentY += 4;
  drawLine(currentY, tealColor[0], tealColor[1], tealColor[2]);
  currentY += 6;

  // Blank lines for notes
  doc.setDrawColor(203, 213, 225); // slate-300
  doc.setLineWidth(0.2);
  
  for (let i = 0; i < 4; i++) {
    doc.line(margin, currentY + 8 + (i * 10), pageWidth - margin, currentY + 8 + (i * 10));
  }
  
  currentY += 45;

  // --- SIGNATURES ---
  if (currentY > pageHeight - 35) {
    doc.addPage();
    currentY = 20;
  }

  const signY = pageHeight - 35;
  
  // Parent Signature line
  doc.setDrawColor(148, 163, 184); // slate-400
  doc.line(margin + 10, signY, margin + 70, signY);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(lightSlateColor[0], lightSlateColor[1], lightSlateColor[2]);
  doc.text('Firma del Padre / Madre / Tutor', margin + 40, signY + 5, { align: 'center' });

  // Pediatrician Signature line
  doc.line(pageWidth - margin - 70, signY, pageWidth - margin - 10, signY);
  doc.text('Firma y Sello del Pediatra', pageWidth - margin - 40, signY + 5, { align: 'center' });

  // Footer Note
  doc.setFontSize(7.5);
  doc.text('Este documento fue generado por Amapola Alerta, una aplicación para la prevención infantil y el cuidado de la salud del bebé.', pageWidth / 2, pageHeight - 10, { align: 'center' });

  // Save the PDF
  const cleanName = child.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
  doc.save(`informe_pediatra_${cleanName}_${Date.now().toString().slice(-6)}.pdf`);
};

export interface PreventionTopic {
  id: string;
  room: string;
  title: string;
  image: string;
  effort: 'Fácil' | 'Medio' | 'Difícil';
  hazards: { id: string; text: string; completed: boolean; urgency?: 'Alta' | 'Media' | 'Baja'; rationale?: string }[];
  guideline: string;
  expandedInfo: string;
  selectedIcon?: string;
}

export const exportSafetyChecklistPDF = (preventionTopics: PreventionTopic[], scheduledDateStr: string): void => {
  // Create document
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  let currentY = 15;

  // Primary colors
  const tealColor = [13, 148, 136]; // Teal-600
  const darkSlateColor = [30, 41, 59]; // Slate-800
  const lightSlateColor = [100, 116, 139]; // Slate-500
  const dangerRoseColor = [244, 63, 94]; // Rose-500
  const lightBgColor = [248, 250, 252]; // Slate-50

  // Helper to draw horizontal line
  const drawLine = (y: number, r = 226, g = 232, b = 240) => {
    doc.setDrawColor(r, g, b);
    doc.setLineWidth(0.3);
    doc.line(margin, y, pageWidth - margin, y);
  };

  const checkPageOverflow = (neededHeight: number) => {
    if (currentY + neededHeight > pageHeight - 20) {
      doc.addPage();
      currentY = 20;
      return true;
    }
    return false;
  };

  // --- HEADER SECTION ---
  // Background colored accent header bar
  doc.setFillColor(tealColor[0], tealColor[1], tealColor[2]);
  doc.rect(0, 0, pageWidth, 40, 'F');

  // App Logo Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(255, 255, 255);
  doc.text('AMAPOLA ALERTA', margin, 18);

  // Subtitle
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(204, 251, 241); // light teal-50
  doc.text('Reporte de Inspección y Checklist Completo de Seguridad Infantil', margin, 24);

  // Dates
  const today = new Date().toLocaleDateString('es-ES', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text(`Fecha de emisión: ${today}`, pageWidth - margin, 18, { align: 'right' });
  
  let formattedScheduledDate = scheduledDateStr;
  try {
    const [year, month, day] = scheduledDateStr.split('-').map(Number);
    const months = [
      'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ];
    formattedScheduledDate = `${day} de ${months[month - 1]} de ${year}`;
  } catch (e) {
    // Fallback to original string
  }
  doc.text(`Próxima Inspección: ${formattedScheduledDate}`, pageWidth - margin, 24, { align: 'right' });

  // Move cursor below the banner
  currentY = 50;

  // --- OVERALL SUMMARY CARD ---
  doc.setFillColor(lightBgColor[0], lightBgColor[1], lightBgColor[2]);
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(0.5);
  doc.rect(margin, currentY, pageWidth - (margin * 2), 32, 'FD');

  // Calculate totals
  const totalHazards = preventionTopics.reduce((acc, t) => acc + t.hazards.length, 0);
  const completedHazards = preventionTopics.reduce((acc, t) => acc + t.hazards.filter(h => h.completed).length, 0);
  const completionPercentage = totalHazards > 0 ? Math.round((completedHazards / totalHazards) * 100) : 0;
  const pendingHazards = totalHazards - completedHazards;

  // Circle with completion percentage
  doc.setFillColor(tealColor[0], tealColor[1], tealColor[2]);
  doc.circle(margin + 15, currentY + 16, 10, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text(`${completionPercentage}%`, margin + 15, currentY + 19.5, { align: 'center' });

  // Summary Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(darkSlateColor[0], darkSlateColor[1], darkSlateColor[2]);
  doc.text('Estado Global de Seguridad', margin + 30, currentY + 13);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(lightSlateColor[0], lightSlateColor[1], lightSlateColor[2]);
  doc.text('RESUMEN DE MEDIDAS PREVENTIVAS EN EL HOGAR', margin + 30, currentY + 18);

  // Statistics columns
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(darkSlateColor[0], darkSlateColor[1], darkSlateColor[2]);
  doc.text('Total Medidas:', margin + 110, currentY + 12);
  doc.setFont('helvetica', 'normal');
  doc.text(`${totalHazards}`, margin + 145, currentY + 12);

  doc.setFont('helvetica', 'bold');
  doc.text('Verificadas [OK]:', margin + 110, currentY + 19);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(16, 185, 129); // Emerald-500
  doc.text(`${completedHazards}`, margin + 145, currentY + 19);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(darkSlateColor[0], darkSlateColor[1], darkSlateColor[2]);
  doc.text('Pendientes:', margin + 110, currentY + 26);
  doc.setFont('helvetica', 'normal');
  if (pendingHazards > 0) {
    doc.setTextColor(dangerRoseColor[0], dangerRoseColor[1], dangerRoseColor[2]);
  } else {
    doc.setTextColor(16, 185, 129);
  }
  doc.text(`${pendingHazards}`, margin + 145, currentY + 26);

  currentY += 42;

  // Title for Details section
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(darkSlateColor[0], darkSlateColor[1], darkSlateColor[2]);
  doc.text('Detalle de Checklist por Área / Habitación', margin, currentY);
  currentY += 4;
  drawLine(currentY, tealColor[0], tealColor[1], tealColor[2]);
  currentY += 8;

  // Print rooms & checklist details
  preventionTopics.forEach((topic) => {
    // Estimate height needed for this section
    // Header is 10mm, each hazard row is ~7mm
    const sectionHeightNeeded = 12 + (topic.hazards.length * 7) + 5;
    checkPageOverflow(sectionHeightNeeded);

    // Room Header bar
    doc.setFillColor(241, 245, 249); // slate-100
    doc.rect(margin, currentY, pageWidth - (margin * 2), 8, 'F');
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.setLineWidth(0.3);
    doc.line(margin, currentY, pageWidth - margin, currentY);
    doc.line(margin, currentY + 8, pageWidth - margin, currentY + 8);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(darkSlateColor[0], darkSlateColor[1], darkSlateColor[2]);
    const roomCompleted = topic.hazards.filter(h => h.completed).length;
    doc.text(`${topic.room.toUpperCase()} (${roomCompleted}/${topic.hazards.length} OK)`, margin + 4, currentY + 5.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(lightSlateColor[0], lightSlateColor[1], lightSlateColor[2]);
    doc.text(`Prioridad de Área: ${topic.effort === 'Fácil' ? 'Esfuerzo Bajo' : topic.effort === 'Medio' ? 'Esfuerzo Medio' : 'Esfuerzo Alto'}`, pageWidth - margin - 4, currentY + 5.5, { align: 'right' });

    currentY += 10;

    // Hazards list
    topic.hazards.forEach((hazard) => {
      checkPageOverflow(8);

      // Checkbox visual
      if (hazard.completed) {
        doc.setFillColor(209, 250, 229); // emerald-100
        doc.setDrawColor(16, 185, 129); // emerald-500
        doc.rect(margin + 2, currentY, 4, 4, 'FD');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(16, 185, 129);
        doc.text('v', margin + 4, currentY + 3.2, { align: 'center' });
      } else {
        doc.setFillColor(254, 242, 242); // rose-50
        doc.setDrawColor(239, 68, 68); // rose-500
        doc.rect(margin + 2, currentY, 4, 4, 'FD');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(239, 68, 68);
        doc.text('x', margin + 4, currentY + 3, { align: 'center' });
      }

      // Hazard Text (supports auto-wrapping in case of long text)
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      if (hazard.completed) {
        doc.setTextColor(darkSlateColor[0], darkSlateColor[1], darkSlateColor[2]);
      } else {
        doc.setTextColor(127, 29, 29); // dark red for pending hazards
      }

      const textX = margin + 10;
      const maxTextWidth = pageWidth - margin - textX - 35; // 35mm reserved for urgency label
      const lines = doc.splitTextToSize(hazard.text, maxTextWidth);
      doc.text(lines, textX, currentY + 3.2);

      // Urgency badge
      if (hazard.urgency) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        if (hazard.urgency === 'Alta') {
          doc.setFillColor(254, 226, 226); // red-100
          doc.setTextColor(220, 38, 38); // red-600
          doc.rect(pageWidth - margin - 28, currentY - 0.5, 26, 5, 'F');
          doc.text('PRIORIDAD ALTA', pageWidth - margin - 15, currentY + 3, { align: 'center' });
        } else if (hazard.urgency === 'Media') {
          doc.setFillColor(254, 243, 199); // amber-100
          doc.setTextColor(217, 119, 6); // amber-600
          doc.rect(pageWidth - margin - 28, currentY - 0.5, 26, 5, 'F');
          doc.text('PRIORIDAD MEDIA', pageWidth - margin - 15, currentY + 3, { align: 'center' });
        } else {
          doc.setFillColor(219, 234, 254); // blue-100
          doc.setTextColor(37, 99, 235); // blue-600
          doc.rect(pageWidth - margin - 28, currentY - 0.5, 26, 5, 'F');
          doc.text('PRIORIDAD BAJA', pageWidth - margin - 15, currentY + 3, { align: 'center' });
        }
      }

      // Calculate new Y offset based on number of lines
      currentY += (lines.length * 4) + 2;
    });

    currentY += 4; // Spacing between rooms
  });

  // Footer on last page or pages
  const totalPages = doc.internal.pages.length - 1; // getNumberOfPages
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(lightSlateColor[0], lightSlateColor[1], lightSlateColor[2]);
    doc.text(`Amapola Alerta - Reporte de Seguridad Infantil | Página ${i} de ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
  }

  // Save document
  doc.save(`checklist_seguridad_${scheduledDateStr.replace(/-/g, '')}.pdf`);
};
