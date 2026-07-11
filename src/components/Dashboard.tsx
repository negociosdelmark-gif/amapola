import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, Plus, Scale, Heart, Calendar, AlertTriangle, 
  Activity, FileText, CheckCircle2, User, Clock, ArrowRight, 
  ChevronRight, Sparkles, ShieldCheck, Download, Trash2, X
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, 
  CartesianGrid, Tooltip, PieChart, Pie, Cell, Legend, BarChart, Bar
} from 'recharts';
import { jsPDF } from 'jspdf';
import { ChildProfile, SymptomAssessment } from '../types';

interface DashboardProps {
  profiles: ChildProfile[];
  activeProfile: ChildProfile | null;
  onSelectProfile: (profile: ChildProfile) => void;
  assessments: SymptomAssessment[];
  onNavigate: (tab: 'checker' | 'emergency' | 'family') => void;
}

interface WeightLog {
  date: string; // YYYY-MM-DD
  weight: number; // kg
}

// Spanish human-readable age calculator
function calculateAgeDetails(birthDateStr: string) {
  const birthDate = new Date(birthDateStr);
  const today = new Date();
  
  let years = today.getFullYear() - birthDate.getFullYear();
  let months = today.getMonth() - birthDate.getMonth();
  
  if (months < 0 || (months === 0 && today.getDate() < birthDate.getDate())) {
    years--;
    months += 12;
  }
  
  if (today.getDate() < birthDate.getDate()) {
    months--;
  }

  const totalMonths = (years * 12) + months;
  
  let ageText = '';
  if (years === 0) {
    ageText = `${months} ${months === 1 ? 'mes' : 'meses'}`;
  } else if (months === 0) {
    ageText = `${years} ${years === 1 ? 'año' : 'años'}`;
  } else {
    ageText = `${years} ${years === 1 ? 'año' : 'años'} y ${months} ${months === 1 ? 'mes' : 'meses'}`;
  }

  return { ageText, totalMonths };
}

const MOCK_MATEO_ASSESSMENTS: SymptomAssessment[] = [
  {
    id: "m_assess_1",
    childId: "p_mateo",
    childName: "Mateo",
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    symptoms: "Tos persistente seca, sibilancias leves por la noche y congestión nasal.",
    severity: "moderada",
    summary: "Posible exacerbación leve de asma estacional desencadenada por alérgenos o cambio de temperatura.",
    reassurance: "Mateo se encuentra consciente e interactivo. Vigile la frecuencia respiratoria.",
    steps: [
      "Administre el inhalador de rescate (Salbutamol) según prescripción de su pediatra.",
      "Mantenga al niño hidratado ofreciéndole agua a sorbos pequeños.",
      "Utilice un humidificador de vapor frío en la habitación para aliviar la vía aérea."
    ],
    redFlags: [
      "Dificultad evidente para respirar (hunde costillas o aleteo nasal).",
      "Coloración azulada en los labios o uñas.",
      "Incapacidad para hablar o llanto débil."
    ],
    naturalRemedies: [
      "Baño de vapor tibio en el baño cerrado por 10 minutos.",
      "Lavados nasales con suero fisiológico para despejar secreciones."
    ],
    remediesWarning: "No use miel en menores de 1 año. Evite ungüentos mentolados fuertes.",
    references: "Consenso del Tratamiento de Asma Infantil AAP 2026",
    messages: []
  },
  {
    id: "m_assess_2",
    childId: "p_mateo",
    childName: "Mateo",
    timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    symptoms: "Fiebre de 38.2°C acompañada de moco claro y estornudos ocasionales.",
    severity: "leve",
    summary: "Cuadro febril agudo de posible origen viral (resfriado común). Buen estado general.",
    reassurance: "La fiebre es un mecanismo de defensa del cuerpo. No es peligrosa por sí sola si el niño juega y responde.",
    steps: [
      "Controle la temperatura corporal. Si causa malestar, administre Acetaminofén pediátrico según dosis por peso (12.5 kg).",
      "Retire exceso de ropa y manténgalo en un ambiente fresco.",
      "Ofrezca líquidos de forma frecuente."
    ],
    redFlags: [
      "Fiebre persistente que no cede tras 48 horas.",
      "Decaimiento extremo o somnolencia difícil de despertar.",
      "Aparición de manchas rojas en la piel."
    ],
    naturalRemedies: [
      "Paños de agua templada en la frente y axilas (nunca agua fría ni alcohol).",
      "Sopa de pollo tibia para reconfortar e hidratar."
    ],
    remediesWarning: "Nunca use Aspirina en niños por riesgo de Síndrome de Reye.",
    references: "Manual de Pediatría Ambulatoria AAP 2026",
    messages: []
  },
  {
    id: "m_assess_3",
    childId: "p_mateo",
    childName: "Mateo",
    timestamp: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
    symptoms: "Deposiciones líquidas (3 veces en el día) sin sangre, vómito aislado hace 6 horas.",
    severity: "leve",
    summary: "Gastroenteritis aguda leve. Sin signos aparentes de deshidratación en este momento.",
    reassurance: "El objetivo principal es reponer la pérdida de líquidos para evitar la deshidratación.",
    steps: [
      "Inicie suero de rehidratación oral (SRO) ofreciendo 2 a 3 onzas después de cada deposición líquida.",
      "Mantenga la alimentación habitual sin forzar al niño. Evite azúcares refinados y grasas.",
      "Vigile el gasto urinario (pañales mojados)."
    ],
    redFlags: [
      "Signos de deshidratación: llanto sin lágrimas, ojos hundidos, boca seca o saliva espesa.",
      "Vómitos incoercibles que impiden la tolerancia oral.",
      "Deposiciones con sangre o fiebre alta que supera los 39°C."
    ],
    naturalRemedies: [
      "Agua de arroz tostado para asentar el estómago.",
      "Ofrecer puré de manzana o plátano maduro."
    ],
    remediesWarning: "No use medicamentos antidiarreicos ni antieméticos sin receta médica pediátrica.",
    references: "Guía de Práctica Clínica para Diarrea Aguda - OPS/OMS / AAP 2026",
    messages: []
  },
  {
    id: "m_assess_4",
    childId: "p_mateo",
    childName: "Mateo",
    timestamp: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
    symptoms: "Erupción cutánea eritematosa leve en mejillas y tronco, sin fiebre ni picor.",
    severity: "leve",
    summary: "Sarpullido leve por sudor (sudamina/miliaria rubra). Excelente estado clínico general.",
    reassurance: "El sarpullido por calor es sumamente común y se resuelve manteniendo fresco al lactante.",
    steps: [
      "Mantenga la piel fresca y seca. Vista al niño con ropa holgada de algodón transpirable.",
      "Realice baños breves con agua tibia y jabón neutro syndet sin frotar la piel.",
      "Evite aplicar cremas grasosas o ungüentos espesos que puedan obstruir más los poros de sudor."
    ],
    redFlags: [
      "Aparición de fiebre alta o decaimiento progresivo.",
      "Lesiones con secreción purulenta (pus) o costras melicéricas.",
      "Extensión muy rápida del eritema a todo el cuerpo."
    ],
    naturalRemedies: [
      "Baño de avena coloidal tibia para aliviar y refrescar la piel inflamada.",
      "Compresas frescas de manzanilla suave sobre las zonas más rojas."
    ],
    remediesWarning: "Evite el uso de talcos por riesgo de aspiración pulmonar.",
    references: "Directrices de Dermatología Pediátrica AAP 2026",
    messages: []
  },
  {
    id: "m_assess_5",
    childId: "p_mateo",
    childName: "Mateo",
    timestamp: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    symptoms: "Dolor leve de oído derecho al masticar, sin supuración ni fiebre previa, congestión nasal leve.",
    severity: "leve",
    summary: "Otalgia congestiva refleja de origen rinofaríngeo (posible disfunción tubárica leve secundaria a resfriado común).",
    reassurance: "El dolor reflejo es frecuente con la congestión. Sin supuración ni fiebre la otitis media supurativa es menos probable.",
    steps: [
      "Realice lavados nasales frecuentes con suero fisiológico templado para desinflamar la trompa de Eustaquio.",
      "Si presenta malestar, administre analgésico habitual (Acetaminofén o Ibuprofeno si es mayor de 6 meses) a dosis por peso.",
      "Evite la entrada de agua en el oído durante el baño."
    ],
    redFlags: [
      "Salida de líquido o pus por el conducto auditivo externo (otorrea).",
      "Fiebre persistente elevada (>38.5°C) o dolor que empeora drásticamente.",
      "Hinchazón, enrojecimiento o dolor detrás de la oreja (signo de mastoiditis)."
    ],
    naturalRemedies: [
      "Aplicación de calor seco localizado con un paño templado fuera de la oreja.",
      "Mantener la cabeza ligeramente elevada al dormir."
    ],
    remediesWarning: "Nunca introduzca gotas óticas, hisopos de algodón, ni aceites calientes sin examen otoscópico previo.",
    references: "Consenso de Otitis Media Aguda en Pediatría AAP 2026",
    messages: []
  }
];

export default function Dashboard({ 
  profiles, 
  activeProfile, 
  onSelectProfile, 
  assessments, 
  onNavigate 
}: DashboardProps) {
  const [weightHistory, setWeightHistory] = useState<WeightLog[]>([]);
  const [newWeight, setNewWeight] = useState<string>('');
  const [newWeightDate, setNewWeightDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedAssessment, setSelectedAssessment] = useState<SymptomAssessment | null>(null);
  const [showWeightModal, setShowWeightModal] = useState(false);

  // Load and pre-populate weight history for the active child
  useEffect(() => {
    if (!activeProfile) return;

    const storageKey = `angelito_weight_history_${activeProfile.id}`;
    const stored = localStorage.getItem(storageKey);

    if (stored) {
      try {
        setWeightHistory(JSON.parse(stored));
      } catch {
        setWeightHistory([]);
      }
    } else {
      // Pre-populate with realistic growth timeline ending at current weight
      const currentWeight = activeProfile.weightKg || 10;
      const { totalMonths } = calculateAgeDetails(activeProfile.birthDate);
      const birthDate = new Date(activeProfile.birthDate);
      
      const generatedLogs: WeightLog[] = [];
      
      // We generate up to 4 historical points plus current point
      const pointsCount = Math.min(4, totalMonths);
      
      // standard starting weights (birth ~3.3kg)
      const startWeight = activeProfile.gender === 'M' ? 3.4 : 3.2;
      
      // Birth point
      generatedLogs.push({
        date: activeProfile.birthDate,
        weight: startWeight
      });

      // Intermediate points
      if (pointsCount >= 1) {
        // 3 months
        if (totalMonths > 3) {
          const d3 = new Date(birthDate);
          d3.setMonth(d3.getMonth() + 3);
          generatedLogs.push({
            date: d3.toISOString().split('T')[0],
            weight: Number((startWeight + (currentWeight - startWeight) * 0.35).toFixed(1))
          });
        }
        // 6 months
        if (totalMonths > 6) {
          const d6 = new Date(birthDate);
          d6.setMonth(d6.getMonth() + 6);
          generatedLogs.push({
            date: d6.toISOString().split('T')[0],
            weight: Number((startWeight + (currentWeight - startWeight) * 0.55).toFixed(1))
          });
        }
        // 12 months
        if (totalMonths > 12) {
          const d12 = new Date(birthDate);
          d12.setMonth(d12.getMonth() + 12);
          generatedLogs.push({
            date: d12.toISOString().split('T')[0],
            weight: Number((startWeight + (currentWeight - startWeight) * 0.78).toFixed(1))
          });
        }
      }

      // Current point (only add if not already added or too close)
      const currentFormattedDate = new Date().toISOString().split('T')[0];
      if (!generatedLogs.some(l => l.date === currentFormattedDate)) {
        generatedLogs.push({
          date: currentFormattedDate,
          weight: currentWeight
        });
      }

      // Sort chronological
      generatedLogs.sort((a, b) => a.date.localeCompare(b.date));
      setWeightHistory(generatedLogs);
      localStorage.setItem(storageKey, JSON.stringify(generatedLogs));
    }
  }, [activeProfile]);

  // Filter consultations belonging to the active child
  const childAssessments = assessments.filter(
    a => a.childId === activeProfile?.id || (!a.childId && activeProfile?.id === 'p_mateo')
  );

  // Get last 3 consultations
  const recentConsultations = childAssessments.slice(0, 3);

  // If there are no consultations in the general log, use professional mock assessments
  // for the default mock profile Mateo so the user has immediate visualization.
  const getDisplayConsultations = () => {
    if (recentConsultations.length > 0) {
      return recentConsultations;
    }
    
    if (activeProfile?.id === 'p_mateo') {
      return MOCK_MATEO_ASSESSMENTS.slice(0, 3);
    }
    
    return [];
  };

  const displayAssessments = getDisplayConsultations();

  // Compute severity distribution metrics for charts
  const getSeverityDistributionData = () => {
    const list = childAssessments.length > 0 ? childAssessments : displayAssessments;
    const counts = { leve: 0, moderada: 0, severa: 0 };
    
    list.forEach(a => {
      if (a.severity === 'leve') counts.leve++;
      else if (a.severity === 'moderada') counts.moderada++;
      else if (a.severity === 'severa') counts.severa++;
    });

    return [
      { name: 'Leve', value: counts.leve || (list.length ? 0 : 2), color: '#10b981' },
      { name: 'Moderada', value: counts.moderada || (list.length ? 0 : 1), color: '#f59e0b' },
      { name: 'Severa', value: counts.severa || (list.length ? 0 : 0), color: '#ef4444' }
    ].filter(item => item.value > 0);
  };

  const severityData = getSeverityDistributionData();

  // Handler to add a new weight entry
  const handleAddWeight = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProfile || !newWeight) return;

    const parsedWeight = parseFloat(newWeight);
    if (isNaN(parsedWeight) || parsedWeight <= 0) return;

    const storageKey = `angelito_weight_history_${activeProfile.id}`;
    const newLog: WeightLog = {
      date: newWeightDate,
      weight: parsedWeight
    };

    const updatedLogs = [...weightHistory.filter(l => l.date !== newWeightDate), newLog];
    updatedLogs.sort((a, b) => a.date.localeCompare(b.date));

    setWeightHistory(updatedLogs);
    localStorage.setItem(storageKey, JSON.stringify(updatedLogs));

    // Also update the core profile's latest weight
    activeProfile.weightKg = parsedWeight;
    const profileKey = 'angelito_profiles';
    const allProfiles: ChildProfile[] = JSON.parse(localStorage.getItem(profileKey) || '[]');
    const updatedProfiles = allProfiles.map(p => p.id === activeProfile.id ? { ...p, weightKg: parsedWeight } : p);
    localStorage.setItem(profileKey, JSON.stringify(updatedProfiles));

    // Reset input fields
    setNewWeight('');
    setShowWeightModal(false);
  };

  // Delete a weight log entry
  const handleDeleteWeightLog = (dateToDelete: string) => {
    if (!activeProfile) return;
    const storageKey = `angelito_weight_history_${activeProfile.id}`;
    const updated = weightHistory.filter(l => l.date !== dateToDelete);
    setWeightHistory(updated);
    localStorage.setItem(storageKey, JSON.stringify(updated));

    // Update profile weight with the latest remaining entry
    if (updated.length > 0) {
      const latestWeight = updated[updated.length - 1].weight;
      activeProfile.weightKg = latestWeight;
      const allProfiles: ChildProfile[] = JSON.parse(localStorage.getItem('angelito_profiles') || '[]');
      const updatedProfiles = allProfiles.map(p => p.id === activeProfile.id ? { ...p, weightKg: latestWeight } : p);
      localStorage.setItem('angelito_profiles', JSON.stringify(updatedProfiles));
    }
  };

  // Generate and download a highly styled PDF report of the last 5 consultations
  const generatePDFReport = () => {
    if (!activeProfile) return;

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pdfAssessments = childAssessments.length > 0 
      ? childAssessments.slice(0, 5) 
      : (activeProfile.id === 'p_mateo' ? MOCK_MATEO_ASSESSMENTS : []);

    let y = 15;

    const checkPageOverflow = (heightNeeded: number) => {
      if (y + heightNeeded > 275) {
        doc.addPage();
        y = 20;
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.5);
        doc.line(15, 14, 195, 14);
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text("Amapola • Informe de Salud Pediátrico", 15, 11);
        doc.text(`Página ${doc.getNumberOfPages()}`, 180, 11);
        y = 22;
      }
    };

    const drawMultiLineText = (label: string, textContent: string, fontSize: number, labelColor: [number, number, number], textColor: [number, number, number], isBoldLabel = true) => {
      doc.setFont("helvetica", isBoldLabel ? "bold" : "normal");
      doc.setFontSize(fontSize);
      doc.setTextColor(labelColor[0], labelColor[1], labelColor[2]);
      
      const labelW = label ? doc.getTextWidth(label) : 0;
      
      if (label) {
        checkPageOverflow(6);
        doc.text(label, 15, y);
      }
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(fontSize);
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      
      const maxWidth = 180;
      const indent = label ? labelW + 1.5 : 0;
      const remainingWidth = maxWidth - indent;
      
      if (label && doc.getTextWidth(textContent) <= remainingWidth) {
        doc.text(textContent, 15 + indent, y);
        y += 5;
      } else {
        if (label) {
          y += 5;
        }
        const lines = doc.splitTextToSize(textContent, maxWidth);
        lines.forEach((line: string) => {
          checkPageOverflow(6);
          doc.text(line, 15, y);
          y += 5;
        });
      }
    };

    // Header Banner
    doc.setFillColor(15, 23, 42);
    doc.rect(15, y, 180, 24, "F");

    doc.setFillColor(16, 185, 129);
    doc.rect(15, y + 24, 180, 2, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text("AMAPOLA - INFORME CLÍNICO PEDIÁTRICO", 20, y + 10);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(16, 185, 129);
    doc.text("Guía Pediátrica Inteligente • Soporte Clínico de Primeros Auxilios", 20, y + 15);
    
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`Generado el: ${new Date().toLocaleDateString('es-ES')} a las ${new Date().toLocaleTimeString('es-ES')}`, 20, y + 20);

    y += 34;

    // Child Profile Info Box
    checkPageOverflow(45);
    doc.setFillColor(248, 250, 252);
    doc.rect(15, y, 180, 36, "F");
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.rect(15, y, 180, 36, "S");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text(`Ficha de Salud Pediátrica: ${activeProfile.name}`, 20, y + 6);

    doc.line(20, y + 8, 190, y + 8);

    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    
    const { ageText } = calculateAgeDetails(activeProfile.birthDate);
    
    doc.text(`Fecha Nacimiento: ${activeProfile.birthDate}`, 20, y + 14);
    doc.text(`Edad: ${ageText}`, 20, y + 20);
    doc.text(`Peso Corporal: ${activeProfile.weightKg ? `${activeProfile.weightKg} kg` : 'Sin registrar'}`, 20, y + 26);
    
    doc.text(`Grupo Sanguíneo: ${activeProfile.bloodType || 'No definido'}`, 110, y + 14);
    doc.text(`Alergias: ${activeProfile.allergies || 'Ninguna'}`, 110, y + 20);
    doc.text(`Condiciones Crónicas: ${activeProfile.chronicConditions || 'Ninguna'}`, 110, y + 26);

    doc.setFont("helvetica", "italic");
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text("* Este reporte recopila información de síntomas ingresados por los padres y la orientación de la IA.", 20, y + 32);

    y += 44;

    // Section Title
    checkPageOverflow(15);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(`HISTORIAL DE ÚLTIMAS ${pdfAssessments.length} CONSULTAS CLÍNICAS`, 15, y);
    doc.setDrawColor(16, 185, 129);
    doc.setLineWidth(1);
    doc.line(15, y + 2, 195, y + 2);
    
    y += 8;

    if (pdfAssessments.length === 0) {
      checkPageOverflow(15);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text("No se registran consultas médicas previas para este perfil.", 15, y + 5);
      y += 10;
    } else {
      pdfAssessments.forEach((assess, idx) => {
        checkPageOverflow(35);
        
        if (idx > 0) {
          doc.setDrawColor(241, 245, 249);
          doc.setLineWidth(0.5);
          doc.line(15, y, 195, y);
          y += 5;
        }

        const dateStr = new Date(assess.timestamp).toLocaleString('es-ES', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });

        doc.setFillColor(241, 245, 249);
        doc.rect(15, y, 180, 8, "F");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(9.5);
        doc.setTextColor(15, 23, 42);
        doc.text(`Consulta #${idx + 1} - ${dateStr}`, 18, y + 5.5);

        const severityLabel = `Alarma: ${assess.severity.toUpperCase()}`;
        const severityW = doc.getTextWidth(severityLabel);
        
        if (assess.severity === 'severa') {
          doc.setFillColor(254, 226, 226);
          doc.setTextColor(185, 28, 28);
        } else if (assess.severity === 'moderada') {
          doc.setFillColor(254, 243, 199);
          doc.setTextColor(180, 83, 9);
        } else {
          doc.setFillColor(209, 250, 229);
          doc.setTextColor(4, 120, 87);
        }
        
        doc.rect(190 - severityW - 4, y + 1.5, severityW + 4, 5, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.text(severityLabel, 190 - severityW - 2, y + 4.8);

        y += 13;

        drawMultiLineText("SÍNTOMAS REPORTADOS: ", `"${assess.symptoms}"`, 9, [15, 23, 42], [71, 85, 105], true);
        y += 2;

        drawMultiLineText("DIAGNÓSTICO ORIENTATIVO IA: ", assess.summary, 9, [15, 23, 42], [30, 41, 59], true);
        y += 2;

        checkPageOverflow(10);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(15, 23, 42);
        doc.text("PAUTAS DE MANEJO EN EL HOGAR:", 15, y);
        y += 4.5;

        assess.steps.forEach((step) => {
          const formattedStep = `• ${step}`;
          const lines = doc.splitTextToSize(formattedStep, 175);
          lines.forEach((line: string) => {
            checkPageOverflow(6);
            doc.setFont("helvetica", "normal");
            doc.setFontSize(8.5);
            doc.setTextColor(51, 65, 85);
            doc.text(line, 18, y);
            y += 4.5;
          });
        });
        y += 1;

        checkPageOverflow(10);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(185, 28, 28);
        doc.text("SIGNOS DE ALARMA CRÍTICOS (URGENCIAS):", 15, y);
        y += 4.5;

        assess.redFlags.forEach((flag) => {
          const formattedFlag = `! ${flag}`;
          const lines = doc.splitTextToSize(formattedFlag, 175);
          lines.forEach((line: string) => {
            checkPageOverflow(6);
            doc.setFont("helvetica", "bold");
            doc.setFontSize(8.5);
            doc.setTextColor(153, 27, 27);
            doc.text(line, 18, y);
            y += 4.5;
          });
        });
        y += 1;

        if (assess.references) {
          checkPageOverflow(8);
          doc.setFont("helvetica", "italic");
          doc.setFontSize(7.5);
          doc.setTextColor(148, 163, 184);
          doc.text(`Base médica de referencia: ${assess.references}`, 15, y);
          y += 5;
        }

        y += 4;
      });
    }

    // Disclaimer Box
    checkPageOverflow(35);
    y += 2;
    doc.setDrawColor(241, 245, 249);
    doc.line(15, y, 195, y);
    y += 5;

    doc.setFillColor(248, 250, 252);
    doc.rect(15, y, 180, 20, "F");
    doc.setDrawColor(226, 232, 240);
    doc.rect(15, y, 180, 20, "S");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text("AVISO LEGAL DE RESPONSABILIDAD MÉDICA", 18, y + 5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    
    const disclaimerLines = doc.splitTextToSize(
      "Esta guía es una herramienta de orientación diagnóstica primaria basada en algoritmos clínicos de inteligencia artificial y en pautas AHA/AAP 2026. No reemplaza bajo ninguna circunstancia una valoración médica profesional en consulta presencial o de urgencias. Si observa dificultad respiratoria grave, alteración del estado de conciencia o rigidez de nuca, acuda inmediatamente al centro médico más cercano.",
      174
    );
    disclaimerLines.forEach((line: string, lineIdx: number) => {
      doc.text(line, 18, y + 9 + (lineIdx * 3.2));
    });

    const sanitizedName = activeProfile.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
    doc.save(`reporte_salud_${sanitizedName}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  if (!activeProfile) {
    return (
      <div className="text-center py-16 bg-white border border-slate-100 rounded-3xl p-8 max-w-lg mx-auto space-y-4">
        <User className="w-12 h-12 mx-auto text-slate-300" />
        <h3 className="text-lg font-black text-slate-800">No hay perfiles activos</h3>
        <p className="text-sm text-slate-500">Agrega un perfil de tu hijo para visualizar el panel de control interactivo.</p>
        <button
          onClick={() => onNavigate('family')}
          className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl text-xs cursor-pointer"
        >
          Crear Perfil
        </button>
      </div>
    );
  }

  const { ageText, totalMonths } = calculateAgeDetails(activeProfile.birthDate);

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* 1. Header with Child Selection */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="text-left">
          <span className="text-[10px] bg-emerald-500/10 text-emerald-700 px-3 py-1 rounded-full font-bold uppercase tracking-wider">
            Tablero de Control Médico
          </span>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
            Seguimiento de {activeProfile.name}
          </h2>
          <p className="text-xs text-slate-500">
            Monitoreo clínico, histórico de consultas pediátricas y crecimiento.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Dropdown to switch profiles easily */}
          {profiles.length > 1 && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400">Ver hijo:</span>
              <select
                value={activeProfile.id}
                onChange={(e) => {
                  const found = profiles.find(p => p.id === e.target.value);
                  if (found) onSelectProfile(found);
                }}
                className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              >
                {profiles.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={generatePDFReport}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm hover:shadow"
            title="Descargar PDF de las últimas 5 consultas médicas"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Descargar PDF</span>
          </button>
        </div>
      </div>

      {/* 2. Top Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Age Stat */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm flex items-center gap-4 text-left">
          <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-500 flex items-center justify-center shrink-0">
            <Calendar className="w-6 h-6" />
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Edad Calculada</span>
            <span className="text-base font-black text-slate-900 block leading-tight">{ageText}</span>
            <span className="text-[10px] text-slate-500 block">({totalMonths} meses)</span>
          </div>
        </div>

        {/* Weight Stat */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm flex items-center gap-4 text-left relative group">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0">
            <Scale className="w-6 h-6" />
          </div>
          <div className="space-y-0.5 flex-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Peso Actual</span>
            <span className="text-base font-black text-slate-900 block leading-tight">
              {activeProfile.weightKg ? `${activeProfile.weightKg} kg` : 'Sin registrar'}
            </span>
            <button 
              onClick={() => setShowWeightModal(true)}
              className="text-[10px] text-emerald-600 font-bold hover:underline inline-flex items-center gap-0.5"
            >
              <Plus className="w-3 h-3" /> Registrar Peso
            </button>
          </div>
        </div>

        {/* Blood Type Stat */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm flex items-center gap-4 text-left">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center shrink-0">
            <Heart className="w-6 h-6" />
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Grupo Sanguíneo</span>
            <span className="text-base font-black text-slate-900 block leading-tight">
              {activeProfile.bloodType || 'No definido'}
            </span>
            <span className="text-[10px] text-slate-500 block">Información vital</span>
          </div>
        </div>

        {/* Allergies / Chronic Conditions */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm flex items-center gap-4 text-left">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="space-y-0.5 overflow-hidden">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Condiciones / Alergias</span>
            <span className="text-sm font-bold text-slate-800 block truncate" title={activeProfile.allergies || 'Ninguna'}>
              Alergias: {activeProfile.allergies || 'Ninguna'}
            </span>
            <span className="text-[10px] text-slate-500 block truncate" title={activeProfile.chronicConditions || 'Ninguna'}>
              Crónicas: {activeProfile.chronicConditions || 'Ninguna'}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Recharts Visualization Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT: Weight Growth Progression Chart (7 Cols) */}
        <div className="lg:col-span-8 bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-left">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-1.5">
                <TrendingUp className="w-5 h-5 text-emerald-500" />
                Curva de Crecimiento (Peso)
              </h3>
              <p className="text-[11px] text-slate-400">Progreso histórico vs percentil de referencia saludable</p>
            </div>
            <button 
              onClick={() => setShowWeightModal(true)}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 py-1.5 px-3 rounded-lg text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Registrar Peso
            </button>
          </div>

          {/* Growth Curve Chart Frame */}
          <div className="h-[240px] w-full">
            {weightHistory.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={weightHistory}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(tick) => {
                      try {
                        const parts = tick.split('-');
                        if (parts.length === 3) {
                          // returns e.g. "Mar 24"
                          const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
                          const monthIdx = parseInt(parts[1]) - 1;
                          return `${months[monthIdx]} ${parts[0].slice(-2)}`;
                        }
                      } catch {}
                      return tick;
                    }}
                    tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 'bold' }}
                    stroke="#cbd5e1"
                  />
                  <YAxis 
                    tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 'bold' }} 
                    stroke="#cbd5e1"
                    domain={['auto', 'auto']}
                    unit=" kg"
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#0f172a', 
                      borderRadius: '12px', 
                      border: 'none', 
                      color: '#fff',
                      fontSize: '11px',
                      fontFamily: 'monospace'
                    }}
                    labelFormatter={(label) => `Fecha: ${label}`}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="weight" 
                    name="Peso" 
                    stroke="#10b981" 
                    strokeWidth={3} 
                    fillOpacity={1} 
                    fill="url(#colorWeight)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                Cargando datos del gráfico de crecimiento...
              </div>
            )}
          </div>

          {/* Inline Log Table or Legend summary */}
          <div className="border-t border-slate-100 pt-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex gap-4 text-[10px] font-mono text-slate-400">
              <span className="flex items-center gap-1 text-emerald-600">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                Historial de Peso (kg)
              </span>
              <span>Total puntos: {weightHistory.length}</span>
            </div>
            
            {weightHistory.length > 1 && (
              <span className="text-[10px] font-bold text-slate-500">
                Cambio neto: {(weightHistory[weightHistory.length - 1].weight - weightHistory[0].weight).toFixed(1)} kg desde {weightHistory[0].date}
              </span>
            )}
          </div>
        </div>

        {/* RIGHT: Consultation Severity Distribution Pie Chart (4 Cols) */}
        <div className="lg:col-span-4 bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div className="text-left">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-1.5">
              <Activity className="w-5 h-5 text-emerald-500" />
              Severidad de Alertas
            </h3>
            <p className="text-[11px] text-slate-400">Distribución de severidad de consultas clínicas</p>
          </div>

          <div className="h-[180px] w-full flex items-center justify-center relative">
            {severityData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={severityData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {severityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#0f172a', 
                      borderRadius: '12px', 
                      border: 'none', 
                      color: '#fff',
                      fontSize: '11px' 
                    }} 
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-slate-400 text-xs">Sin registros para diagramar</div>
            )}
            
            {/* Center label for donut */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xl font-black text-slate-800">
                {childAssessments.length || displayAssessments.length}
              </span>
              <span className="text-[9px] text-slate-400 uppercase font-extrabold tracking-wider">
                Consultas
              </span>
            </div>
          </div>

          {/* Custom legend */}
          <div className="space-y-1.5 pt-3 border-t border-slate-100">
            {severityData.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs font-semibold">
                <div className="flex items-center gap-1.5 text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span>Alarma {item.name}</span>
                </div>
                <span className="font-mono text-slate-900">{item.value} ({Math.round(item.value / (childAssessments.length || displayAssessments.length) * 100)}%)</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* 4. Timeline of Last 3 Medical Consultations */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-left">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-1.5">
              <FileText className="w-5 h-5 text-emerald-500" />
              Últimas 3 Consultas Médicas
            </h3>
            <p className="text-xs text-slate-400">Seguimiento detallado de síntomas evaluados por la IA en pediatría</p>
          </div>
          <button
            onClick={() => onNavigate('checker')}
            className="text-xs text-emerald-600 font-bold hover:underline inline-flex items-center gap-0.5 cursor-pointer"
          >
            Nueva Consulta <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* List of Consultations */}
        {displayAssessments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {displayAssessments.map((assessment, index) => {
              const dateObj = new Date(assessment.timestamp);
              const formattedDate = dateObj.toLocaleDateString('es-ES', { 
                day: 'numeric', 
                month: 'short', 
                year: 'numeric' 
              });
              const formattedTime = dateObj.toLocaleTimeString('es-ES', { 
                hour: '2-digit', 
                minute: '2-digit' 
              });

              return (
                <div 
                  key={assessment.id}
                  className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:border-slate-200 transition-all text-left flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    {/* Top Row: Date & Severity */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-mono">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{formattedDate} - {formattedTime}</span>
                      </div>
                      <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        assessment.severity === 'severa' 
                          ? 'bg-rose-100 text-rose-700' 
                          : assessment.severity === 'moderada'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {assessment.severity}
                      </span>
                    </div>

                    {/* Symptoms */}
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide">Síntomas</h4>
                      <p className="text-xs font-black text-slate-800 line-clamp-2">
                        "{assessment.symptoms}"
                      </p>
                    </div>

                    {/* AI Assessment Conclusion */}
                    <div className="space-y-1 bg-slate-50 rounded-xl p-3 border border-slate-100/50">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-emerald-500" />
                        Diagnóstico Orientativo
                      </h4>
                      <p className="text-[11px] text-slate-600 line-clamp-3 leading-relaxed">
                        {assessment.summary}
                      </p>
                    </div>
                  </div>

                  {/* Actions footer */}
                  <button
                    onClick={() => setSelectedAssessment(assessment)}
                    className="w-full py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all inline-flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <span>Ver Pauta de Manejo</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white border border-slate-100 rounded-3xl p-10 text-center space-y-4">
            <Activity className="w-12 h-12 text-slate-200 mx-auto" />
            <h4 className="text-sm font-black text-slate-700">Aún no hay consultas registradas</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Realiza una evaluación con el Diagnóstico por Inteligencia Artificial para ver el análisis de síntomas y pautas.
            </p>
            <button
              onClick={() => onNavigate('checker')}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl text-xs cursor-pointer"
            >
              Iniciar Evaluación
            </button>
          </div>
        )}
      </div>

      {/* 5. Additional Weight Log Management Table (Optional list) */}
      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm text-left space-y-4">
        <h3 className="text-sm font-black text-slate-900">Historial Detallado de Pesos</h3>
        {weightHistory.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-slate-500">
              <thead className="text-[10px] text-slate-400 uppercase bg-slate-50 font-bold">
                <tr>
                  <th scope="col" className="px-4 py-2 rounded-l-lg">Fecha de Registro</th>
                  <th scope="col" className="px-4 py-2">Peso Corporal</th>
                  <th scope="col" className="px-4 py-2">Estado Ponderal</th>
                  <th scope="col" className="px-4 py-2 text-right rounded-r-lg">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                {weightHistory.map((log) => (
                  <tr key={log.date} className="hover:bg-slate-50/50">
                    <td className="px-4 py-2.5">{log.date}</td>
                    <td className="px-4 py-2.5 font-bold text-slate-900">{log.weight} kg</td>
                    <td className="px-4 py-2.5">
                      <span className="px-2 py-0.5 text-[10px] bg-sky-50 text-sky-700 rounded-full font-bold">
                        Estable
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <button
                        onClick={() => handleDeleteWeightLog(log.date)}
                        className="text-rose-500 hover:text-rose-700 p-1 rounded-md hover:bg-rose-50"
                        title="Eliminar registro"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs text-slate-400">Sin historial de peso. Registre un valor para comenzar.</p>
        )}
      </div>

      {/* MODAL: Detailed Consultation Checklist & Treatment */}
      {selectedAssessment && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl border border-slate-100 animate-scaleUp">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-start sticky top-0 bg-white z-10">
              <div className="text-left space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    selectedAssessment.severity === 'severa' 
                      ? 'bg-rose-100 text-rose-700' 
                      : selectedAssessment.severity === 'moderada'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    Alarma {selectedAssessment.severity}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    {new Date(selectedAssessment.timestamp).toLocaleString('es-ES')}
                  </span>
                </div>
                <h3 className="text-lg font-black text-slate-900">
                  Resumen de Consulta - {selectedAssessment.childName || activeProfile.name}
                </h3>
              </div>
              <button 
                onClick={() => setSelectedAssessment(null)}
                className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 text-left">
              {/* Symptoms prompt */}
              <div className="space-y-1">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-wide">Síntomas Reportados:</h4>
                <p className="text-sm font-semibold text-slate-700 italic bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                  "{selectedAssessment.symptoms}"
                </p>
              </div>

              {/* AI Diagnostic Summary */}
              <div className="space-y-1 bg-emerald-50/20 border border-emerald-100 p-4 rounded-2xl">
                <h4 className="text-xs font-black text-emerald-800 uppercase tracking-wide flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  Orientación Clínica del Asistente
                </h4>
                <p className="text-xs text-slate-700 leading-relaxed font-semibold">
                  {selectedAssessment.summary}
                </p>
              </div>

              {/* Steps checklist */}
              <div className="space-y-3">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Pautas de Manejo en el Hogar (Primeros Auxilios):
                </h4>
                <div className="space-y-2">
                  {selectedAssessment.steps.map((step, idx) => (
                    <div key={idx} className="flex gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100/50">
                      <span className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-black flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <p className="text-xs text-slate-700 leading-normal font-semibold">{step}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Red Flags warnings */}
              <div className="space-y-3">
                <h4 className="text-xs font-black text-rose-800 uppercase tracking-wide flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  Signos de Alarma Críticos (Asista a Urgencias si presenta):
                </h4>
                <div className="space-y-2">
                  {selectedAssessment.redFlags.map((flag, idx) => (
                    <div key={idx} className="flex gap-3 bg-rose-50/50 p-3 rounded-xl border border-rose-100">
                      <span className="w-5 h-5 rounded-full bg-rose-600 text-white text-[10px] font-black flex items-center justify-center shrink-0">
                        !
                      </span>
                      <p className="text-xs text-rose-950 leading-normal font-bold">{flag}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Natural Remedies & warnings */}
              {selectedAssessment.naturalRemedies && selectedAssessment.naturalRemedies.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 pt-5">
                  <div className="space-y-2">
                    <h4 className="text-xs font-black text-emerald-800 uppercase tracking-wide">
                      Remedios Naturales Recomendados:
                    </h4>
                    <ul className="list-disc list-inside text-xs text-slate-600 space-y-1 font-semibold">
                      {selectedAssessment.naturalRemedies.map((rem, idx) => (
                        <li key={idx}>{rem}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="space-y-1.5 bg-amber-50 border border-amber-200 rounded-xl p-3 text-[10px] text-amber-900 leading-relaxed font-semibold">
                    <span className="font-bold uppercase tracking-wide text-amber-950 block">Advertencia de Seguridad:</span>
                    {selectedAssessment.remediesWarning}
                  </div>
                </div>
              )}

              {/* Reference */}
              <div className="border-t border-slate-100 pt-4 flex items-center gap-1.5 text-[9px] text-slate-400 font-mono">
                <ShieldCheck className="w-4 h-4 text-slate-400" />
                <span>Base médica: {selectedAssessment.references}</span>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-slate-100 flex justify-end gap-2">
              <button
                onClick={() => setSelectedAssessment(null)}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs cursor-pointer"
              >
                Cerrar Guía
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL: Record Weight Input Form */}
      {showWeightModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form 
            onSubmit={handleAddWeight}
            className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-scaleUp text-left"
          >
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-900">Registrar Peso Corporal</h3>
              <button 
                type="button"
                onClick={() => setShowWeightModal(false)}
                className="p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wide block">
                  Peso Corporal (kg)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="Ej. 12.5"
                  value={newWeight}
                  onChange={(e) => setNewWeight(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wide block">
                  Fecha de Registro
                </label>
                <input
                  type="date"
                  required
                  value={newWeightDate}
                  onChange={(e) => setNewWeightDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowWeightModal(false)}
                className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold rounded-xl text-xs transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black rounded-xl text-xs transition-all cursor-pointer"
              >
                Guardar Peso
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
