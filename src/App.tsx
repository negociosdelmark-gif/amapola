import { useState, useEffect, useRef } from 'react';
import { 
  Heart, Calendar, ShieldCheck, CheckCircle2, Sparkles, BookOpen,
  TrendingUp, Plus, Trash2, RotateCcw, BarChart3, Lightbulb, Download,
  Bell, BellOff, Share2, Search, Award, Star, Medal, Trophy,
  Wind, Flame, Activity, Stethoscope, ChevronRight, ChevronDown, Maximize, Minimize,
  Timer, Play, Pause, Square, Mic, MicOff, Volume2, Zap, Dumbbell, Moon, Sun,
  Bath, BedDouble, Sofa, Utensils, Baby, Droplet, Car, TreePine, Home, Edit3, 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ResponsiveContainer, PieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  AreaChart, Area
} from 'recharts';
import EmergencyPanel from './components/EmergencyPanel';
import VaccineTracker from './components/VaccineTracker';
import MaternalWellbeing from './components/MaternalWellbeing';
import GrandmaTips from './components/GrandmaTips';
import { logAnalyticsEvent } from './lib/firebase';
import confetti from 'canvas-confetti';

type TabType = 'emergency' | 'vaccines' | 'prevention' | 'wellbeing' | 'tips';

interface PreventionTopic {
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

interface FocusSession {
  id: string;
  topicId: string;
  topicName: string;
  durationSeconds: number;
  tasksCompleted: number;
  timestamp: number;
}

const INITIAL_PREVENTION: PreventionTopic[] = [
  {
    id: '1',
    room: 'Cocina',
    selectedIcon: 'Utensils',
    title: 'Seguridad en la Cocina',
    image: 'https://images.unsplash.com/photo-1556910103-1c02745a828?auto=format&fit=crop&q=80&w=300&h=300',
    effort: 'Difícil',
    guideline: 'La cocina es el lugar más riesgoso para quemaduras y envenenamientos. Mantenga siempre los mangos de los sartenes hacia adentro y guarde los químicos bajo llave.',
    expandedInfo: 'Según las guías pediátricas, más del 40% de los accidentes domésticos en niños menores de 5 años ocurren en la cocina. El riesgo de escaldaduras por líquidos calientes es la causa número uno de quemaduras. Además, la ingesta accidental de productos de limpieza puede causar daños cáusticos graves en el esófago. Mantener barreras físicas y hábitos como cocinar en los quemadores traseros reduce drásticamente estos incidentes.',
    hazards: [
      { id: 'c1', text: 'Mangos de ollas/sartenes orientados hacia la parte trasera de la estufa.', completed: false, urgency: 'Alta', rationale: 'Previene quemaduras graves por derrames de líquidos o alimentos calientes si el niño intenta alcanzar la estufa.' },
      { id: 'c2', text: 'Cuchillos, tijeras y utensilios afilados fuera del alcance de los niños.', completed: false, urgency: 'Media', rationale: 'Evita cortes profundos y heridas punzantes que pueden requerir suturas o dañar tendones.' },
      { id: 'c3', text: 'Artículos de limpieza y detergentes químicos en gabinetes altos o bajo llave.', completed: false, urgency: 'Alta', rationale: 'Reduce drásticamente el riesgo de intoxicación grave o quemaduras químicas en el tracto digestivo.' },
      { id: 'c4', text: 'Electrodomésticos pequeños desconectados cuando no están en uso.', completed: false, urgency: 'Baja', rationale: 'Previene descargas eléctricas accidentales y posibles quemaduras si se activan de forma indebida.' }
    ]
  },
  {
    id: '2',
    room: 'Baño',
    selectedIcon: 'Bath',
    title: 'Prevención de Ahogamientos y Caídas',
    image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=300&h=300',
    effort: 'Medio',
    guideline: 'Los niños pequeños pueden ahogarse en menos de 5 centímetros de agua en cuestión de segundos. NUNCA los deje solos en la bañera, ni por un instante.',
    expandedInfo: 'El ahogamiento es una de las principales causas de muerte accidental en la primera infancia y suele ser silencioso. Un niño pequeño puede perder el conocimiento bajo el agua en menos de dos minutos. Adicionalmente, las superficies mojadas representan un alto riesgo de traumatismos craneoencefálicos por caídas. La supervisión visual constante y el aseguramiento del entorno (como bloquear tapas de inodoros) son medidas no negociables.',
    hazards: [
      { id: 'b1', text: 'Alfombrillas antideslizantes dentro y fuera de la tina o ducha.', completed: false, urgency: 'Media', rationale: 'Mitiga el riesgo de resbalones y caídas que pueden ocasionar traumatismos craneales severos.' },
      { id: 'b2', text: 'Medicamentos y cosméticos guardados en un botiquín con cerradura.', completed: false, urgency: 'Alta', rationale: 'Los medicamentos son la principal causa de intoxicación accidental en niños; su almacenamiento seguro salva vidas.' },
      { id: 'b3', text: 'Tapa del inodoro siempre cerrada (con seguro si hay niños menores de 2 años).', completed: false, urgency: 'Media', rationale: 'Impide el acceso al agua del inodoro, previniendo el riesgo de ahogamiento en niños pequeños.' },
      { id: 'b4', text: 'Ausencia total de recipientes con agua estancada (baldes o poncheras).', completed: false, urgency: 'Alta', rationale: 'Un niño pequeño puede ahogarse en pocos centímetros de agua; eliminar recipientes estancados es vital.' }
    ]
  },
  {
    id: '3',
    room: 'Sala y Dormitorio',
    selectedIcon: 'Sofa',
    title: 'Evitar Golpes y Caídas Altas',
    image: 'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?auto=format&fit=crop&q=80&w=300&h=300',
    effort: 'Fácil',
    guideline: 'Proteja las esquinas de los muebles bajos y asegure las estanterías pesadas a la pared para evitar aplastamientos por escalamiento.',
    expandedInfo: 'El síndrome de aplastamiento por muebles no anclados (como televisores de tubo viejo o estanterías pesadas) ha sido documentado como una causa crítica de lesiones torácicas y craneales en pediatría. Al aprender a caminar y trepar, los niños utilizan los muebles como escaleras. Asimismo, las caídas desde ventanas, incluso desde un primer piso, generan un alto riesgo de politraumatismos. Limitar el acceso a ventanas y asegurar mobiliario previene tragedias.',
    hazards: [
      { id: 's1', text: 'Protectores plásticos de esquinas en mesas bajas de centro.', completed: false, urgency: 'Baja', rationale: 'Evita contusiones y cortes en el rostro y cabeza cuando los niños aprenden a caminar o juegan cerca.' },
      { id: 's2', text: 'Muebles pesados (televisores, bibliotecas) anclados firmemente a la pared.', completed: false, urgency: 'Alta', rationale: 'Previene el aplastamiento si un niño intenta trepar por los cajones o estantes, evitando lesiones letales.' },
      { id: 's3', text: 'Tapas de seguridad puestas en todos los tomacorrientes no utilizados.', completed: false, urgency: 'Media', rationale: 'Protege contra descargas eléctricas que pueden ocurrir si los niños introducen objetos metálicos en los enchufes.' },
      { id: 's4', text: 'Bloqueadores o mallas de seguridad instaladas en ventanas de pisos altos.', completed: false, urgency: 'Alta', rationale: 'Evita caídas desde alturas que representan un peligro extremo de lesiones múltiples y traumatismo craneoencefálico.' }
    ]
  }
];

interface SafetyHistoryRecord {
  weekLabel: string;
  percentage: number;
  date: string;
}


const AMAPOLA_ICONS: Record<string, { icon: any, label: string, color: string, bgColor: string }> = {
  Utensils: { icon: Utensils, label: 'Cocina', color: 'text-amber-500', bgColor: 'bg-amber-100' },
  Bath: { icon: Bath, label: 'Baño', color: 'text-cyan-500', bgColor: 'bg-cyan-100' },
  Sofa: { icon: Sofa, label: 'Sala', color: 'text-indigo-500', bgColor: 'bg-indigo-100' },
  BedDouble: { icon: BedDouble, label: 'Dormitorio', color: 'text-violet-500', bgColor: 'bg-violet-100' },
  Baby: { icon: Baby, label: 'Bebé', color: 'text-rose-500', bgColor: 'bg-rose-100' },
  Droplet: { icon: Droplet, label: 'Agua/Limpieza', color: 'text-blue-500', bgColor: 'bg-blue-100' },
  Flame: { icon: Flame, label: 'Calor/Fuego', color: 'text-orange-500', bgColor: 'bg-orange-100' },
  Zap: { icon: Zap, label: 'Eléctrico', color: 'text-yellow-500', bgColor: 'bg-yellow-100' },
  Car: { icon: Car, label: 'Garaje/Auto', color: 'text-slate-500', bgColor: 'bg-slate-100' },
  TreePine: { icon: TreePine, label: 'Jardín', color: 'text-emerald-500', bgColor: 'bg-emerald-100' },
  Home: { icon: Home, label: 'General', color: 'text-rose-500', bgColor: 'bg-rose-100' },
  ShieldCheck: { icon: ShieldCheck, label: 'Seguridad', color: 'text-blue-500', bgColor: 'bg-blue-100' }
};

const INITIAL_HISTORY: SafetyHistoryRecord[] = [
  { weekLabel: 'Semana 1', percentage: 25, date: '2026-06-15' },
  { weekLabel: 'Semana 2', percentage: 42, date: '2026-06-22' },
  { weekLabel: 'Semana 3', percentage: 58, date: '2026-06-29' },
  { weekLabel: 'Semana 4', percentage: 75, date: '2026-07-06' }
];

const WEEKLY_TIPS = [
  "Corta los alimentos redondos, como uvas o salchichas, a lo largo antes de dárselos a los niños pequeños para prevenir asfixia.",
  "La posición más segura para que duerma un bebé es boca arriba, sobre un colchón firme y sin almohadas ni peluches en la cuna.",
  "Guarda las baterías de botón y los imanes pequeños en lugares completamente inaccesibles; su ingestión es una emergencia médica grave.",
  "Nunca dejes a un niño solo en la bañera, ni siquiera por un minuto. Los ahogamientos pueden ocurrir rápido y en silencio.",
  "Revisa los detectores de humo y monóxido de carbono una vez al mes para asegurar que funcionen correctamente.",
  "Mantén los cordones de las persianas y cortinas fuera del alcance de los niños para evitar el riesgo de estrangulamiento."
];

const FIRST_AID_GUIDES = [
  {
    id: 'atragantamiento',
    title: 'Atragantamiento',
    icon: Wind,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 border-blue-200',
    iconBg: 'bg-blue-100',
    steps: [
      'Si tose fuerte, anímalo a seguir tosiendo.',
      'Si no respira o la tos es débil: da 5 golpes secos en la espalda (entre los omóplatos).',
      'Si el objeto no sale: da 5 compresiones abdominales (maniobra de Heimlich).',
      'Llama a emergencias (112) de inmediato si no recobra la respiración.'
    ]
  },
  {
    id: 'quemaduras',
    title: 'Quemaduras Leves',
    icon: Flame,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50 border-orange-200',
    iconBg: 'bg-orange-100',
    steps: [
      'Enfría la zona con agua tibia o fresca (no helada) durante al menos 10 minutos.',
      'Retira ropa o joyas cercanas, a menos que estén pegadas a la piel.',
      'Cubre la quemadura con un paño limpio o gasa estéril húmeda.',
      'Nunca revientes ampollas ni apliques remedios caseros como pasta dental.'
    ]
  },
  {
    id: 'heridas',
    title: 'Cortes y Heridas',
    icon: Activity,
    color: 'text-rose-600',
    bgColor: 'bg-rose-50 border-rose-200',
    iconBg: 'bg-rose-100',
    steps: [
      'Lávate bien las manos antes de tocar la herida.',
      'Detén el sangrado presionando firmemente con un paño limpio o gasa.',
      'Lava la herida suavemente con agua y jabón neutro.',
      'Aplica un antiséptico y cubre la zona con una tirita o vendaje limpio.'
    ]
  },
  {
    id: 'golpes',
    title: 'Golpes en la Cabeza',
    icon: Stethoscope,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 border-purple-200',
    iconBg: 'bg-purple-100',
    steps: [
      'Aplica hielo envuelto en un paño fino durante 15 minutos para reducir la hinchazón.',
      'Observa al niño durante las próximas 24-48 horas.',
      'Acude a urgencias si hay vómitos, pérdida de conocimiento, somnolencia inusual o sangrado.',
      'Mantén al niño en reposo, evitando actividad física intensa.'
    ]
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('emergency');
  const [chartView, setChartView] = useState<'evolution' | 'comparison'>('evolution');
  const [activeFirstAidId, setActiveFirstAidId] = useState<string | null>(null);
  
  // Search and Filter state
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [preventionSearch, setPreventionSearch] = useState('');
  const [effortFilter, setEffortFilter] = useState<'Todos' | 'Fácil' | 'Medio' | 'Difícil'>('Todos');
  const [statusFilter, setStatusFilter] = useState<'Todos' | 'Pendientes'>('Todos');
  const [urgencySort, setUrgencySort] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'Checklists' | 'Historial'>('Checklists');
  const [annualRange, setAnnualRange] = useState<'6' | '12'>('12');
  const [isNightMode, setIsNightMode] = useState(false);
  const [isAccessibilityMode, setIsAccessibilityMode] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, topicId: string } | null>(null);
  const [hazardDetailModalData, setHazardDetailModalData] = useState<{isOpen: boolean, hazard: any, topicName: string}>({isOpen: false, hazard: null, topicName: ''});
  const [isListening, setIsListening] = useState(false);

  const startVoiceSearch = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.lang = 'es-ES';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setPreventionSearch(transcript);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } else {
      alert("Tu navegador no soporta búsqueda por voz.");
    }
  };

  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);
  
  const annualHistoryData = [
    { month: 'Ene', current: 65, previous: 40 },
    { month: 'Feb', current: 70, previous: 42 },
    { month: 'Mar', current: 68, previous: 45 },
    { month: 'Abr', current: 75, previous: 50 },
    { month: 'May', current: 82, previous: 55 },
    { month: 'Jun', current: 85, previous: 60 },
    { month: 'Jul', current: 88, previous: 62 },
    { month: 'Ago', current: 90, previous: 65 },
    { month: 'Sep', current: 92, previous: 68 },
    { month: 'Oct', current: 95, previous: 70 },
    { month: 'Nov', current: 96, previous: 72 },
    { month: 'Dic', current: 98, previous: 75 }
  ];

  
  // Weekly tip state
  const [weeklyTip, setWeeklyTip] = useState('');
  useEffect(() => {
    const today = new Date();
    // Use the week number of the year to select a tip so it changes weekly, but for simplicity here we can just use the day of the year
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24);
    const weekNumber = Math.floor(dayOfYear / 7);
    setWeeklyTip(WEEKLY_TIPS[weekNumber % WEEKLY_TIPS.length]);
  }, []);
  
  // Prevention check lists
  const [preventionTopics, setPreventionTopics] = useState<PreventionTopic[]>(() => {
    const saved = localStorage.getItem('amapola_prevention');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Merge missing properties from INITIAL_PREVENTION
        return parsed.map((topic: PreventionTopic) => {
          let updatedTopic = { ...topic };
          const initialTopic = INITIAL_PREVENTION.find(t => t.id === topic.id);
          
          if (!topic.image && initialTopic) {
            updatedTopic.image = initialTopic.image;
          }
          if (!topic.effort && initialTopic) {
            updatedTopic.effort = initialTopic.effort;
          }
          if (!topic.expandedInfo && initialTopic) {
            updatedTopic.expandedInfo = initialTopic.expandedInfo;
          }
          
          if (initialTopic) {
            updatedTopic.hazards = updatedTopic.hazards.map(h => {
              const initialHazard = initialTopic.hazards.find(ih => ih.id === h.id);
              if (initialHazard && !h.urgency) {
                return { ...h, urgency: initialHazard.urgency };
              }
              return h;
            });
          }
          
          return updatedTopic;
        });
      } catch (e) { return INITIAL_PREVENTION; }
    }
    return INITIAL_PREVENTION;
  });

  useEffect(() => {
    localStorage.setItem('amapola_prevention', JSON.stringify(preventionTopics));
  }, [preventionTopics]);

  const [isLoadingPrevention, setIsLoadingPrevention] = useState(true);
  useEffect(() => {
    // Simulate loading to show skeleton and avoid jumps
    const timer = setTimeout(() => {
      setIsLoadingPrevention(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  // Safety history state
  const [safetyHistory, setSafetyHistory] = useState<SafetyHistoryRecord[]>(() => {
    const saved = localStorage.getItem('amapola_safety_history');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return INITIAL_HISTORY; }
    }
    return INITIAL_HISTORY;
  });

  useEffect(() => {
    localStorage.setItem('amapola_safety_history', JSON.stringify(safetyHistory));
  }, [safetyHistory]);

  const [focusSessions, setFocusSessions] = useState<FocusSession[]>(() => {
    const saved = localStorage.getItem('amapola_focus_sessions');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return []; }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('amapola_focus_sessions', JSON.stringify(focusSessions));
  }, [focusSessions]);

  // Track parent navigation flows via Firebase Analytics
  useEffect(() => {
    logAnalyticsEvent('view_screen', { screen_name: activeTab });
  }, [activeTab]);

  // Local Notifications state
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(() => {
    return localStorage.getItem('amapola_notifications_enabled') === 'true';
  });

  const toggleNotifications = async () => {
    if (!notificationsEnabled) {
      if (!('Notification' in window)) {
        alert('Este navegador no soporta notificaciones de escritorio.');
        return;
      }
      
      let permission = Notification.permission;
      if (permission !== 'granted') {
        permission = await Notification.requestPermission();
      }
      
      if (permission === 'granted') {
        setNotificationsEnabled(true);
        localStorage.setItem('amapola_notifications_enabled', 'true');
        // Register current date as starting point if not set
        if (!localStorage.getItem('amapola_last_reminder')) {
          localStorage.setItem('amapola_last_reminder', new Date().toISOString());
        }
        logAnalyticsEvent('enable_safety_reminders', {});
      } else {
        alert('Se requiere permiso para enviar notificaciones.');
      }
    } else {
      setNotificationsEnabled(false);
      localStorage.setItem('amapola_notifications_enabled', 'false');
      logAnalyticsEvent('disable_safety_reminders', {});
    }
  };

  // Check for weekly reminder on load
  useEffect(() => {
    if (notificationsEnabled && 'Notification' in window && Notification.permission === 'granted') {
      const lastReminder = localStorage.getItem('amapola_last_reminder');
      const now = new Date().getTime();
      const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;
      
      let shouldNotify = false;
      if (!lastReminder) {
        localStorage.setItem('amapola_last_reminder', new Date().toISOString());
      } else {
        const lastTime = new Date(lastReminder).getTime();
        if (now - lastTime > ONE_WEEK_MS) {
          shouldNotify = true;
        }
      }

      if (shouldNotify) {
        new Notification('Amapola Alerta: Revisión Semanal', {
          body: 'Es momento de revisar tu lista de prevención de seguridad infantil. ¡Tu progreso te espera!',
          icon: '/vite.svg'
        });
        localStorage.setItem('amapola_last_reminder', new Date().toISOString());
      }
    }
  }, [notificationsEnabled]);

  const handleShareArea = async (topic: PreventionTopic, securedCount: number) => {
    const isSecured = securedCount === topic.hazards.length;
    const text = `Seguridad en ${topic.room}: ${securedCount}/${topic.hazards.length} tareas completadas.${isSecured ? ' ¡Área 100% segura! 🎉' : ''} #AmapolaAlerta`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Amapola Alerta - ${topic.title}`,
          text: text,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Error compartiendo:', err);
      }
    } else {
      navigator.clipboard.writeText(text);
      alert('Texto copiado al portapapeles');
    }
  };

  const [recheckModalData, setRecheckModalData] = useState<{ isOpen: boolean; topicName: string }>({ isOpen: false, topicName: '' });
  const [proTipsModalData, setProTipsModalData] = useState<{ isOpen: boolean; topicName: string; tips: string; isLoading: boolean }>({ isOpen: false, topicName: '', tips: '', isLoading: false });

  const handleOpenProTips = async (topic: PreventionTopic) => {
    setProTipsModalData({ isOpen: true, topicName: topic.room, tips: '', isLoading: true });
    try {
      const response = await fetch('/api/generate-pro-tips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topicName: topic.room,
          expandedInfo: topic.expandedInfo,
          guideline: topic.guideline
        })
      });
      const data = await response.json();
      setProTipsModalData({ isOpen: true, topicName: topic.room, tips: data.tips || 'No se pudieron cargar los tips.', isLoading: false });
    } catch (e) {
      setProTipsModalData({ isOpen: true, topicName: topic.room, tips: 'No se pudieron cargar los tips.', isLoading: false });
    }
  };

  const [completedAreaId, setCompletedAreaId] = useState<string | null>(null);
  const [iconModalOpenId, setIconModalOpenId] = useState<string | null>(null);
  const [expandedInfoId, setExpandedInfoId] = useState<string | null>(null);
  const [focusModeTopicId, setFocusModeTopicId] = useState<string | null>(null);
  
  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+F or Cmd+F for search
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      
      // Esc to close modals/expanders
      if (e.key === 'Escape') {
        if (proTipsModalData.isOpen) {
          setProTipsModalData(prev => ({ ...prev, isOpen: false }));
        } else if (recheckModalData.isOpen) {
          setRecheckModalData(prev => ({ ...prev, isOpen: false }));
        } else if (focusModeTopicId !== null) {
          setFocusModeTopicId(null);
        } else if (expandedInfoId !== null) {
          setExpandedInfoId(null);
        } else if (activeFirstAidId !== null) {
          setActiveFirstAidId(null);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [proTipsModalData.isOpen, recheckModalData.isOpen, focusModeTopicId, expandedInfoId, activeFirstAidId]);
  
  const [autoCompletingId, setAutoCompletingId] = useState<string | null>(null);

  const [focusTimerSeconds, setFocusTimerSeconds] = useState(0);
  const [isFocusTimerRunning, setIsFocusTimerRunning] = useState(false);
  const [selectedFocusTimerMinutes, setSelectedFocusTimerMinutes] = useState<5 | 10 | 15>(5);

  const [currentFocusSessionStartTime, setCurrentFocusSessionStartTime] = useState<number | null>(null);
  const [currentFocusSessionTasksCompleted, setCurrentFocusSessionTasksCompleted] = useState<number>(0);

  const [isListeningForVoice, setIsListeningForVoice] = useState(false);
  const [voiceFeedbackMessage, setVoiceFeedbackMessage] = useState<string | null>(null);
  
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isGeneratingVoiceText, setIsGeneratingVoiceText] = useState(false);

  const handleSpeakText = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES';
    
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleGenerateAndSpeak = async (topic: PreventionTopic) => {
    if (isSpeaking || isGeneratingVoiceText) {
      if (isSpeaking) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
      }
      return;
    }

    setIsGeneratingVoiceText(true);
    try {
      const response = await fetch('/api/generate-educational-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          topicName: topic.room,
          expandedInfo: topic.expandedInfo,
          guideline: topic.guideline
        })
      });
      
      const data = await response.json();
      const textToSpeak = data.text || topic.expandedInfo || topic.guideline;
      handleSpeakText(textToSpeak);
    } catch (e) {
      console.error("Error generating voice text", e);
      handleSpeakText(topic.expandedInfo || topic.guideline);
    } finally {
      setIsGeneratingVoiceText(false);
    }
  };

  const handleStartVoiceRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceFeedbackMessage('Tu navegador no soporta el reconocimiento de voz.');
      setTimeout(() => setVoiceFeedbackMessage(null), 3000);
      return;
    }
    
    const recognition = new SpeechRecognition();
    recognition.lang = 'es-ES';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListeningForVoice(true);
      setVoiceFeedbackMessage('Escuchando...');
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript.toLowerCase();
      
      if (focusModeTopicId) {
         setPreventionTopics(prevTopics => {
           let foundMatch = false;
           const newTopics = prevTopics.map(topic => {
             if (topic.id === focusModeTopicId) {
               let newHazards = [...topic.hazards];
               const uncompleted = newHazards.filter(h => !h.completed);
               
               // Attempt to find a hazard whose text shares significant words with transcript
               let targetHazard = uncompleted.find(h => {
                 const hazardWords = h.text.toLowerCase().split(' ').filter(w => w.length > 4);
                 return hazardWords.some(w => transcript.includes(w));
               });
               
               // Fallback: If transcript says "completar todo" or "siguiente" complete the first uncompleted one
               if (!targetHazard && (transcript.includes('completar todo') || transcript.includes('siguiente') || transcript.includes('listo'))) {
                 targetHazard = uncompleted[0];
               }
               
               if (targetHazard) {
                 foundMatch = true;
                 newHazards = newHazards.map(h => 
                   h.id === targetHazard!.id ? { ...h, completed: true } : h
                 );
               }
               
               return { ...topic, hazards: newHazards };
             }
             return topic;
           });
           
           if (foundMatch) {
             setVoiceFeedbackMessage('¡Tarea completada por voz!');
             setCurrentFocusSessionTasksCompleted(prev => prev + 1);
             setTimeout(() => setVoiceFeedbackMessage(null), 3000);
           } else {
             setVoiceFeedbackMessage('No se entendió el comando.');
             setTimeout(() => setVoiceFeedbackMessage(null), 3000);
           }
           
           return newTopics;
         });
      }
    };

    recognition.onerror = () => {
      setVoiceFeedbackMessage('Error al escuchar. Intenta de nuevo.');
      setIsListeningForVoice(false);
      setTimeout(() => setVoiceFeedbackMessage(null), 3000);
    };

    recognition.onend = () => {
      setIsListeningForVoice(false);
      if (voiceFeedbackMessage === 'Escuchando...') {
         setVoiceFeedbackMessage(null);
      }
    };

    recognition.start();
  };

  useEffect(() => {
    let interval: any;
    if (isFocusTimerRunning && focusTimerSeconds > 0) {
      interval = setInterval(() => {
        setFocusTimerSeconds(prev => prev - 1);
      }, 1000);
    } else if (focusTimerSeconds === 0) {
      setIsFocusTimerRunning(false);
    }
    return () => clearInterval(interval);
  }, [isFocusTimerRunning, focusTimerSeconds]);

  // Handle entering/exiting focus mode
  useEffect(() => {
    if (focusModeTopicId) {
      setFocusTimerSeconds(0);
      setIsFocusTimerRunning(false);
      setCurrentFocusSessionStartTime(Date.now());
      setCurrentFocusSessionTasksCompleted(0);
    }
  }, [focusModeTopicId]);

  const handleStartFocusTimer = (minutes: 5 | 10 | 15) => {
    setSelectedFocusTimerMinutes(minutes);
    setFocusTimerSeconds(minutes * 60);
    setIsFocusTimerRunning(true);
  };

  const handleToggleFocusTimer = () => {
    setIsFocusTimerRunning(prev => !prev);
  };

  const handleResetFocusTimer = () => {
    setIsFocusTimerRunning(false);
    setFocusTimerSeconds(selectedFocusTimerMinutes * 60);
  };

  const handleExitFocusMode = () => {
    if (currentFocusSessionStartTime && focusModeTopicId) {
      const durationSeconds = Math.floor((Date.now() - currentFocusSessionStartTime) / 1000);
      
      if (durationSeconds > 5 || currentFocusSessionTasksCompleted > 0) {
        const topic = preventionTopics.find(t => t.id === focusModeTopicId);
        if (topic) {
          const newSession: FocusSession = {
            id: Math.random().toString(36).substring(2, 9),
            topicId: topic.id,
            topicName: topic.room,
            durationSeconds,
            tasksCompleted: currentFocusSessionTasksCompleted,
            timestamp: Date.now()
          };
          setFocusSessions(prev => [newSession, ...prev]);
        }
      }
    }
    setFocusModeTopicId(null);
  };

  const formatTimer = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const toggleHazard = (topicId: string, hazardId: string) => {
    let newlyCompletedTopicName = '';
    let justCompletedTopicId = '';
    
    setPreventionTopics(prev => {
      return prev.map(topic => {
        if (topic.id === topicId) {
          const newHazards = topic.hazards.map(h => {
            if (h.id === hazardId) {
              const nextVal = !h.completed;
              logAnalyticsEvent('toggle_babyproofing_hazard', { 
                room: topic.room, 
                hazard: h.text, 
                completed: nextVal 
              });
              
              if (focusModeTopicId === topicId) {
                if (nextVal) {
                  setCurrentFocusSessionTasksCompleted(prevCount => prevCount + 1);
                } else {
                  setCurrentFocusSessionTasksCompleted(prevCount => Math.max(0, prevCount - 1));
                }
              }

              return { ...h, completed: nextVal };
            }
            return h;
          });
          
          // Check if this topic became 100% complete just now
          const wasComplete = topic.hazards.every(h => h.completed);
          const isCompleteNow = newHazards.every(h => h.completed);
          if (!wasComplete && isCompleteNow) {
            newlyCompletedTopicName = topic.room;
            justCompletedTopicId = topic.id;
          }
          
          return { ...topic, hazards: newHazards };
        }
        return topic;
      });
    });

    if (newlyCompletedTopicName) {
      setCompletedAreaId(justCompletedTopicId);
      setTimeout(() => setCompletedAreaId(null), 2500); // Glow for 2.5s
      
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6']
      });

      setTimeout(() => {
         setRecheckModalData({ isOpen: true, topicName: newlyCompletedTopicName });
      }, 2000); // Delay modal a bit more so confetti can be enjoyed
    }
  };

  const handleAutoCompleteArea = (topicId: string) => {
    setAutoCompletingId(topicId);
    
    // Animación breve antes de completar
    setTimeout(() => {
      let newlyCompletedTopicName = '';
      let justCompletedTopicId = '';
      
      setPreventionTopics(prev => {
        return prev.map(topic => {
          if (topic.id === topicId) {
            const newHazards = topic.hazards.map(h => {
              if (!h.completed) {
                logAnalyticsEvent('toggle_babyproofing_hazard', { 
                  room: topic.room, 
                  hazard: h.text, 
                  completed: true 
                });
              }
              return { ...h, completed: true };
            });
            const wasComplete = topic.hazards.every(h => h.completed);
            
            if (!wasComplete) {
              newlyCompletedTopicName = topic.room;
              justCompletedTopicId = topic.id;
            }
            return { ...topic, hazards: newHazards };
          }
          return topic;
        });
      });
      
      setAutoCompletingId(null);
      
      if (newlyCompletedTopicName) {
        setCompletedAreaId(justCompletedTopicId);
        setTimeout(() => setCompletedAreaId(null), 2500);
        
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6']
        });

        setTimeout(() => {
           setRecheckModalData({ isOpen: true, topicName: newlyCompletedTopicName });
        }, 2000);
      }
    }, 800);
  };

  const handleDownloadTaskICS = (taskName: string, roomName: string, frequencyMonths: number = 1) => {
    const eventName = `Mantenimiento: ${roomName}`;
    const description = `Verificar medida de seguridad: ${taskName}`;
    
    // Start tomorrow
    const now = new Date();
    now.setDate(now.getDate() + 1);
    
    const start = now.toISOString().replace(/-|:|\.\d+/g, '');
    const end = new Date(now.getTime() + 60 * 60 * 1000).toISOString().replace(/-|:|\.\d+/g, '');

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Amapola Alerta//ES',
      'BEGIN:VEVENT',
      `UID:${now.getTime()}@amapola-alerta.local`,
      `DTSTAMP:${start}`,
      `DTSTART:${start}`,
      `DTEND:${end}`,
      `RRULE:FREQ=MONTHLY;INTERVAL=${frequencyMonths}`,
      `SUMMARY:${eventName}`,
      `DESCRIPTION:${description}`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `recordatorio-${roomName.toLowerCase().replace(/\s+/g, '-')}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };
  
  const handleDownloadICS = (roomName: string) => {
    const eventName = `Re-verificar seguridad: ${roomName}`;
    const description = `Es momento de revisar nuevamente el área de ${roomName} para asegurar que las medidas de prevención infantil siguen vigentes.`;
    
    // Set date 3 months from now
    const now = new Date();
    now.setMonth(now.getMonth() + 3);
    
    const start = now.toISOString().replace(/-|:|\.\d+/g, '');
    const end = new Date(now.getTime() + 60 * 60 * 1000).toISOString().replace(/-|:|\.\d+/g, '');

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Amapola Alerta//ES',
      'BEGIN:VEVENT',
      `UID:${now.getTime()}@amapola-alerta.local`,
      `DTSTAMP:${start}`,
      `DTSTART:${start}`,
      `DTEND:${end}`,
      `SUMMARY:${eventName}`,
      `DESCRIPTION:${description}`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `reverificacion-${roomName.replace(/\\s+/g, '-').toLowerCase()}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    setRecheckModalData({ isOpen: false, topicName: '' });
    logAnalyticsEvent('download_ics_reminder', { room: roomName });
  };

  // Summary Metrics for Safety Prevention Checklist
  const totalHazards = preventionTopics.reduce((acc, t) => acc + t.hazards.length, 0);
  const completedHazards = preventionTopics.reduce((acc, t) => acc + t.hazards.filter(h => h.completed).length, 0);
  const percentSecured = totalHazards ? Math.round((completedHazards / totalHazards) * 100) : 0;

  const badges = [
    {
      id: 'primer-paso',
      title: 'Primer Paso',
      description: 'Iniciaste la prevención',
      icon: <Star className="w-5 h-5" />,
      unlocked: percentSecured > 0,
      color: 'bg-amber-500 text-amber-50',
      bgColor: 'bg-amber-50 border-amber-200'
    },
    {
      id: 'mitad-camino',
      title: 'Hogar 50% Seguro',
      description: 'Avanzaste a la mitad',
      icon: <Medal className="w-5 h-5" />,
      unlocked: percentSecured >= 50,
      color: 'bg-blue-500 text-blue-50',
      bgColor: 'bg-blue-50 border-blue-200'
    },
    {
      id: 'hogar-seguro',
      title: 'Hogar Casi Seguro',
      description: 'Más del 80% protegido',
      icon: <ShieldCheck className="w-5 h-5" />,
      unlocked: percentSecured >= 80,
      color: 'bg-emerald-500 text-emerald-50',
      bgColor: 'bg-emerald-50 border-emerald-200'
    },
    {
      id: 'experto',
      title: 'Experto en Prevención',
      description: '100% de áreas aseguradas',
      icon: <Trophy className="w-5 h-5" />,
      unlocked: percentSecured === 100,
      color: 'bg-purple-500 text-purple-50',
      bgColor: 'bg-purple-50 border-purple-200'
    }
  ];

  // History action handlers
  const [newEntryLabel, setNewEntryLabel] = useState('');

  const handleAddHistoryEntry = () => {
    const label = newEntryLabel.trim() || `Semana ${safetyHistory.length + 1}`;
    const today = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    const newRecord: SafetyHistoryRecord = {
      weekLabel: `${label} (${today})`,
      percentage: percentSecured,
      date: new Date().toISOString().split('T')[0]
    };
    setSafetyHistory(prev => [...prev, newRecord]);
    setNewEntryLabel('');
    logAnalyticsEvent('add_safety_history', { label: newRecord.weekLabel, percentage: percentSecured });
  };

  const handleResetHistory = () => {
    if (window.confirm('¿Está seguro de que desea reiniciar el historial a los valores predeterminados de ejemplo?')) {
      setSafetyHistory(INITIAL_HISTORY);
    }
  };

  const handleClearHistory = () => {
    if (window.confirm('¿Está seguro de que desea limpiar todo el historial?')) {
      setSafetyHistory([]);
    }
  };

  const handleDeleteHistoryEntry = (indexToDelete: number) => {
    setSafetyHistory(prev => prev.filter((_, idx) => idx !== indexToDelete));
  };

  const handleExportCSV = () => {
    // Generate CSV content
    const headers = ['Tipo', 'Etiqueta / Habitación', 'Detalle', 'Estado / Porcentaje', 'Fecha'];
    const rows: string[][] = [];

    // History data
    safetyHistory.forEach(record => {
      rows.push(['Historial', record.weekLabel, 'Registro de Seguridad', `${record.percentage}%`, record.date]);
    });

    // Prevention Checklist
    preventionTopics.forEach(topic => {
      topic.hazards.forEach(hazard => {
        rows.push(['Prevención', topic.room, hazard.text, hazard.completed ? 'Asegurado' : 'Pendiente', new Date().toISOString().split('T')[0]]);
      });
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    // Trigger download
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' }); // Add BOM for excel support
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `reporte-seguridad-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    logAnalyticsEvent('export_safety_report', { format: 'csv' });
  };

  const handleShareProgress = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Mi progreso en Seguridad Infantil',
          text: `¡Hola! He alcanzado un ${percentSecured}% de prevención de accidentes en mi hogar según Amapola Alerta.`,
          url: window.location.href,
        });
        logAnalyticsEvent('share_safety_progress', { percentage: percentSecured });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      alert('Tu navegador no soporta la función de compartir (Web Share API).');
    }
  };

  // Smart Suggestion Logic (RAG heuristic)
  const getSuggestedTask = () => {
    const uncompletedHazards = preventionTopics.flatMap(topic => 
      topic.hazards.filter(h => !h.completed).map(h => ({ topic, hazard: h }))
    );

    if (uncompletedHazards.length === 0) return null;

    const CRITICAL_KEYWORDS = ['químicos', 'medicamentos', 'agua', 'tomacorrientes', 'cuchillos', 'ventanas'];
    
    for (const item of uncompletedHazards) {
      if (CRITICAL_KEYWORDS.some(kw => item.hazard.text.toLowerCase().includes(kw))) {
        return { ...item, reason: 'Peligro Crítico (Prioridad Alta)' };
      }
    }
    
    const QUICK_KEYWORDS = ['desconectados', 'cerrada', 'tapas', 'guardados', 'cordones'];
    for (const item of uncompletedHazards) {
      if (QUICK_KEYWORDS.some(kw => item.hazard.text.toLowerCase().includes(kw))) {
        return { ...item, reason: 'Acción Rápida (Fácil de completar)' };
      }
    }

    return { ...uncompletedHazards[0], reason: 'Siguiente paso recomendado' };
  };

  const suggestedTask = getSuggestedTask();

  const comparativeData = safetyHistory.map((item) => {
    // Generate previous month data based on current data for illustrative comparison
    const lastMonthVal = Math.max(0, item.percentage - 15 - Math.floor(Math.random() * 10));
    return {
      weekLabel: item.weekLabel,
      thisMonth: item.percentage,
      lastMonth: lastMonthVal
    };
  });

  const filteredPreventionTopics = preventionTopics.map(topic => {
    const query = preventionSearch.toLowerCase();
    
    // First, filter hazards by status
    let currentHazards = statusFilter === 'Pendientes' 
      ? topic.hazards.filter(h => !h.completed)
      : topic.hazards;

    // Then, filter by search query if present
    if (query) {
      const topicMatches = topic.title.toLowerCase().includes(query) || topic.room.toLowerCase().includes(query);
      const matchingHazards = currentHazards.filter(h => h.text.toLowerCase().includes(query));
      
      currentHazards = topicMatches ? currentHazards : matchingHazards;
    }

    if (urgencySort) {
      const urgencyWeight: Record<string, number> = { 'Alta': 3, 'Media': 2, 'Baja': 1 };
      currentHazards = [...currentHazards].sort((a, b) => {
        const weightA = a.urgency ? urgencyWeight[a.urgency] : 0;
        const weightB = b.urgency ? urgencyWeight[b.urgency] : 0;
        return weightB - weightA;
      });
    }

    return {
      ...topic,
      hazards: currentHazards
    };
  }).filter(topic => topic.hazards.length > 0).filter(topic => effortFilter === 'Todos' || topic.effort === effortFilter);

  if (urgencySort) {
    const urgencyWeight: Record<string, number> = { 'Alta': 3, 'Media': 2, 'Baja': 1 };
    filteredPreventionTopics.sort((a, b) => {
      const maxUrgencyA = Math.max(...a.hazards.filter(h => !h.completed).map(h => h.urgency ? urgencyWeight[h.urgency] : 0), 0);
      const maxUrgencyB = Math.max(...b.hazards.filter(h => !h.completed).map(h => h.urgency ? urgencyWeight[h.urgency] : 0), 0);
      return maxUrgencyB - maxUrgencyA;
    });
  }

  return (
    <div id="app-shell" className="min-h-screen bg-slate-50 flex flex-col justify-between selection:bg-rose-100 selection:text-rose-900">
      
      {/* Upper Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-slate-100/80 transition-all">
        <div className="max-w-6xl mx-auto px-4 py-3 md:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-rose-600 flex items-center justify-center text-white shadow-sm shadow-rose-600/20">
              <Heart className="w-4.5 h-4.5 fill-white" />
            </div>
            <div>
              <span className="text-sm font-black text-slate-900 tracking-tight block">Amapola Alerta</span>
              <span className="text-xs text-slate-400 font-bold tracking-widest uppercase block">Urgencias Pediátricas</span>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl no-print">
            <button
              onClick={() => setActiveTab('emergency')}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'emergency'
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              <Heart className="w-3.5 h-3.5 text-rose-500 fill-current" />
              <span className="hidden sm:inline">Urgencias</span>
            </button>
            <button
              onClick={() => setActiveTab('vaccines')}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'vaccines'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 text-emerald-500" />
              <span className="hidden sm:inline">Vacunas</span>
            </button>
            <button
              onClick={() => setActiveTab('prevention')}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'prevention'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
              <span className="hidden sm:inline">Prevención</span>
            </button>
            <button
              onClick={() => setActiveTab('wellbeing')}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'wellbeing'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              <Heart className="w-3.5 h-3.5 text-purple-500" />
              <span className="hidden md:inline">Mamá</span>
            </button>
            <button
              onClick={() => setActiveTab('tips')}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'tips'
                  ? 'bg-amber-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              <Star className="w-3.5 h-3.5 text-amber-300" />
              <span className="hidden md:inline">Abuela</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container Stage */}
      <main className="max-w-6xl w-full mx-auto px-4 py-6 flex-1 relative">
        <AnimatePresence mode="wait">
          {activeTab === 'emergency' && (
            <motion.div
              key="emergency"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              <EmergencyPanel />
            </motion.div>
          )}

          {activeTab === 'vaccines' && (
            <motion.div
              key="vaccines"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              <VaccineTracker />
            </motion.div>
          )}

          {activeTab === 'prevention' && (
            <motion.div
              key="prevention"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="space-y-6"
            >
              {/* Prevention Board Cover */}
              <div className="bg-blue-600 text-white rounded-3xl p-6 md:p-8 relative overflow-hidden shadow-lg border border-blue-500">
                <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-6 translate-y-6 pointer-events-none">
                  <ShieldCheck className="w-64 h-64 fill-white" />
                </div>
                <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6 text-left">
                  <div className="space-y-4 max-w-2xl flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Sparkles className="w-4.5 h-4.5 text-blue-200 animate-pulse" />
                      <span className="text-xs font-black uppercase tracking-widest bg-blue-700/60 text-blue-100 px-2.5 py-1 rounded-full border border-blue-500/50">
                        Cuidado Infantil Preventivo
                      </span>
                      
                      <button
                        onClick={toggleNotifications}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-black uppercase tracking-widest rounded-full border transition-all cursor-pointer ${
                          notificationsEnabled
                            ? 'bg-emerald-500/20 text-emerald-100 border-emerald-400/50 hover:bg-emerald-500/30'
                            : 'bg-white/10 text-white/70 border-white/20 hover:bg-white/20'
                        }`}
                      >
                        {notificationsEnabled ? <Bell className="w-3.5 h-3.5 fill-emerald-400 text-emerald-400" /> : <BellOff className="w-3.5 h-3.5" />}
                        {notificationsEnabled ? 'Avisos Activos' : 'Activar Recordatorio Semanal'}
                      </button>
                    </div>
                    <div className="space-y-1.5">
                      <h2 className="text-2xl md:text-3xl font-black tracking-tight leading-none">Hogar Seguro contra Accidentes</h2>
                      <div className="space-y-3 mt-4">
                        <p className="text-sm md:text-base text-white leading-relaxed font-semibold">
                          👋 <strong>¿Para qué sirve esta sección?</strong> Aquí puedes realizar una auditoría de seguridad de tu hogar. 
                        </p>
                        <p className="text-xs md:text-sm text-blue-100 leading-relaxed bg-blue-900/50 p-3 rounded-xl border border-blue-500/30">
                          <strong>Cómo usarla:</strong> Desplázate hacia abajo y selecciona las diferentes habitaciones (Cocina, Baño, Sala). Lee las sugerencias de seguridad y marca la casilla cuando hayas asegurado ese elemento en la vida real. Tu progreso se guardará automáticamente y verás cómo tu hogar se vuelve más seguro.
                        </p>
                      </div>
                    </div>

                    {/* Numeric stats list */}
                    <div className="grid grid-cols-2 gap-4 pt-1 max-w-md">
                      <div className="bg-blue-700/40 border border-blue-500/30 rounded-2xl p-3.5">
                        <span className="text-xs text-blue-200 font-bold uppercase tracking-wider block">Peligros Asegurados</span>
                        <p className="text-lg font-black text-white">{completedHazards} <span className="text-xs text-blue-200 font-semibold">/ {totalHazards}</span></p>
                      </div>
                      <div className="bg-blue-700/40 border border-blue-500/30 rounded-2xl p-3.5">
                        <span className="text-xs text-blue-200 font-bold uppercase tracking-wider block">Áreas Completas</span>
                        <p className="text-lg font-black text-white">
                          {preventionTopics.filter(t => t.hazards.every(h => h.completed)).length} <span className="text-xs text-blue-200 font-semibold">/ {preventionTopics.length}</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Circular Donut Gauge Container using Recharts */}
                  <div className="shrink-0 flex flex-col items-center justify-center bg-blue-700/40 border border-blue-500/30 rounded-3xl p-4 w-full md:w-52 h-52 relative shadow-inner mx-auto md:mx-0">
                    <div className="w-full h-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'Asegurado', value: percentSecured, color: '#10B981' }, // Emerald 500
                              { name: 'Pendiente', value: 100 - percentSecured, color: 'rgba(255, 255, 255, 0.12)' }
                            ]}
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={70}
                            startAngle={90}
                            endAngle={-270}
                            paddingAngle={percentSecured > 0 && percentSecured < 100 ? 3 : 0}
                            dataKey="value"
                            stroke="none"
                          >
                            {[
                              { name: 'Asegurado', value: percentSecured, color: '#10B981' },
                              { name: 'Pendiente', value: 100 - percentSecured, color: 'rgba(255, 255, 255, 0.12)' }
                            ].map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    {/* Absolute positioned centered label */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                      <span className="text-2xl font-black text-white tracking-tight">{percentSecured}%</span>
                      <span className="text-xs font-bold text-blue-200 uppercase tracking-widest">Seguridad</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tip de la semana */}
              <div className="bg-amber-50 border border-amber-200/60 rounded-3xl p-6 md:p-8 shadow-sm flex items-start gap-4 text-left">
                <div className="shrink-0 w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center text-amber-500 shadow-inner">
                  <Lightbulb className="w-6 h-6 fill-amber-500/20" />
                </div>
                <div className="space-y-1.5 flex-1">
                  <span className="text-xs font-black uppercase tracking-widest text-amber-600">Tip de la Semana</span>
                  <p className="text-sm font-semibold text-slate-800 leading-relaxed">
                    {weeklyTip}
                  </p>
                </div>
              </div>

              {/* Sugerencia Inteligente (RAG Context) */}
              {suggestedTask && (
                <div className="bg-purple-50 border border-purple-200/60 rounded-3xl p-6 md:p-8 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-left">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="shrink-0 w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 shadow-inner">
                      <Sparkles className="w-6 h-6 fill-purple-500/20" />
                    </div>
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black uppercase tracking-widest text-purple-700">Sugerencia Inteligente</span>
                        <span className="text-xs font-black uppercase tracking-wider text-purple-500 bg-purple-100 px-2 py-0.5 rounded-full">
                          {suggestedTask.reason}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-slate-800 leading-relaxed max-w-2xl">
                        En <span className="font-bold text-purple-900">{suggestedTask.topic.room}</span>: {suggestedTask.hazard.text}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleHazard(suggestedTask.topic.id, suggestedTask.hazard.id)}
                    className="shrink-0 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors mt-2 md:mt-0 flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Marcar como asegurado
                  </button>
                </div>
              )}

              {/* Logros y Recompensas */}
              <div className="bg-white border-0 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl p-6 md:p-8 shadow-sm flex flex-col gap-4 text-left">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-widest text-slate-800 flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-amber-500" /> Logros Desbloqueados
                  </span>
                  <span className="text-xs font-bold text-slate-400">
                    {badges.filter(b => b.unlocked).length} de {badges.length}
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {badges.map((badge) => (
                    <div 
                      key={badge.id}
                      className={`relative overflow-hidden p-3 rounded-2xl border transition-all duration-300 ${
                        badge.unlocked 
                          ? `${badge.bgColor} opacity-100` 
                          : 'bg-slate-50 border-slate-100 opacity-60 grayscale'
                      }`}
                    >
                      <div className="flex flex-col gap-2 relative z-10">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-inner ${
                          badge.unlocked ? badge.color : 'bg-slate-200 text-slate-400'
                        }`}>
                          {badge.icon}
                        </div>
                        <div>
                          <h4 className={`text-xs font-bold leading-tight ${badge.unlocked ? 'text-slate-900' : 'text-slate-500'}`}>
                            {badge.title}
                          </h4>
                          <p className={`text-xs font-semibold mt-0.5 ${badge.unlocked ? 'text-slate-600' : 'text-slate-400'}`}>
                            {badge.description}
                          </p>
                        </div>
                      </div>
                      {badge.unlocked && (
                        <div className="absolute -right-4 -bottom-4 opacity-5 pointer-events-none">
                          <Award className="w-20 h-20" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Filters */}
              <div className="flex flex-col md:flex-row gap-4 items-center mb-6">
                {/* Search Bar */}
                <div className="relative w-full max-w-md md:mb-0">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Buscar área o peligro (ej. cocina, enchufe...)"
                    className="w-full pl-10 pr-12 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-sm"
                    value={preventionSearch}
                    onChange={(e) => setPreventionSearch(e.target.value)}
                  />
                  <button
                    onClick={startVoiceSearch}
                    className={`absolute inset-y-0 right-0 pr-3.5 flex items-center transition-colors focus:outline-none ${isListening ? 'text-blue-500' : 'text-slate-400 hover:text-slate-600'}`}
                    title="Búsqueda por voz"
                  >
                    {isListening ? (
                      <span className="relative flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                        <Mic className="relative inline-flex rounded-full h-4 w-4" />
                      </span>
                    ) : (
                      <Mic className="h-4 w-4" />
                    )}
                  </button>
                </div>
                
                {/* Effort and Status Filters, and Night Mode */}
                <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
                  <div className="flex bg-slate-200/50 p-1.5 rounded-2xl w-full md:w-auto overflow-x-auto">
                    {['Checklists', 'Vista Anual'].map((view) => (
                      <button
                        key={view}
                        onClick={() => setViewMode(view as any)}
                        className={`flex-1 md:flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                          viewMode === view 
                            ? 'bg-white text-slate-800 shadow-sm' 
                            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                        }`}
                      >
                        {view}
                      </button>
                    ))}
                  </div>

                  <div className="flex bg-slate-200/50 p-1.5 rounded-2xl w-full md:w-auto">
                    <select
                      value={urgencySort ? 'urgencia' : 'predeterminado'}
                      onChange={(e) => setUrgencySort(e.target.value === 'urgencia')}
                      className="w-full md:w-auto px-4 py-2 pr-8 rounded-xl text-xs font-bold transition-all bg-white text-slate-800 shadow-sm border-none focus:ring-0 focus:outline-none"
                    >
                      <option value="predeterminado">Predeterminado</option>
                      <option value="urgencia">Por Urgencia</option>
                    </select>
                  </div>

                  <div className="flex bg-slate-200/50 p-1.5 rounded-2xl w-full md:w-auto overflow-x-auto">
                    {['Todos', 'Pendientes'].map((status) => (
                      <button
                        key={status}
                        onClick={() => setStatusFilter(status as any)}
                        className={`flex-1 md:flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                          statusFilter === status 
                            ? 'bg-white text-slate-800 shadow-sm' 
                            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>

                  <div className="flex bg-slate-200/50 p-1.5 rounded-2xl w-full md:w-auto overflow-x-auto">
                    {['Todos', 'Fácil', 'Medio', 'Difícil'].map((level) => (
                      <button
                        key={level}
                        onClick={() => setEffortFilter(level as any)}
                        className={`flex-1 md:flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                          effortFilter === level 
                            ? 'bg-white text-slate-800 shadow-sm' 
                            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => setIsAccessibilityMode(!isAccessibilityMode)}
                      className={`p-2.5 rounded-2xl transition-all shadow-sm border ${
                        isAccessibilityMode 
                          ? 'bg-slate-800 text-white border-black hover:bg-black' 
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                      title="Modo Accesibilidad (Alto Contraste)"
                    >
                      <Zap className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setIsNightMode(!isNightMode)}
                      className={`p-2.5 rounded-2xl transition-all shadow-sm border ${
                        isNightMode 
                          ? 'bg-slate-800 text-amber-300 border-slate-700 hover:bg-slate-700' 
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                      title="Modo Lectura Nocturna"
                    >
                      {isNightMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Room-by-Room Checklists */}
              {isLoadingPrevention ? (
                <motion.div 
                  initial={false}
                  animate={{
                    backgroundColor: isNightMode ? '#0f172a' : 'rgba(255,255,255,0)',
                    padding: isNightMode ? '1.5rem' : '0rem',
                    borderRadius: isNightMode ? '1.5rem' : '0rem'
                  }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                  className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start"
                >
                  {[1, 2, 3].map((skeleton) => (
                    <div key={skeleton} className={`border rounded-3xl p-5 shadow-sm space-y-6 text-left flex flex-col justify-between min-h-[300px] animate-pulse ${isNightMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                           <div className={`h-6 w-24 rounded-full ${isNightMode ? 'bg-slate-700' : 'bg-slate-200'}`}></div>
                           <div className={`h-6 w-16 rounded-full ${isNightMode ? 'bg-slate-700' : 'bg-slate-200'}`}></div>
                        </div>
                        <div className="space-y-2">
                           <div className={`h-4 w-3/4 rounded-md ${isNightMode ? 'bg-slate-700' : 'bg-slate-200'}`}></div>
                           <div className={`h-4 w-5/6 rounded-md ${isNightMode ? 'bg-slate-700' : 'bg-slate-200'}`}></div>
                           <div className={`h-4 w-1/2 rounded-md ${isNightMode ? 'bg-slate-700' : 'bg-slate-200'}`}></div>
                        </div>
                      </div>
                      <div className="space-y-3">
                         <div className={`h-8 w-full rounded-xl ${isNightMode ? 'bg-slate-700' : 'bg-slate-100'}`}></div>
                         <div className={`h-8 w-full rounded-xl ${isNightMode ? 'bg-slate-700' : 'bg-slate-100'}`}></div>
                      </div>
                    </div>
                  ))}
                </motion.div>
              ) : filteredPreventionTopics.length === 0 ? (
                <div className={`text-center py-12 rounded-3xl border shadow-sm ${isNightMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                  <p className={`text-sm font-semibold ${isNightMode ? 'text-slate-400' : 'text-slate-500'}`}>No se encontraron áreas o peligros que coincidan con tu búsqueda.</p>
                </div>
              ) : (
                <motion.div 
                  initial={false}
                  animate={{
                    backgroundColor: isNightMode ? '#020617' : 'rgba(255,255,255,0)',
                    padding: isNightMode ? '1.5rem' : '0rem',
                    borderRadius: isNightMode ? '2.5rem' : '0rem'
                  }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                  className={`grid grid-cols-1 md:grid-cols-3 gap-6 items-start ${isNightMode ? 'shadow-inner' : ''}`}
                >
                  {viewMode === 'Historial' ? (
                    <div className={`col-span-1 md:col-span-3 border rounded-3xl p-6 shadow-sm flex flex-col min-h-[450px] ${isNightMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                      <div className="flex justify-between items-center mb-6">
                        <h3 className={`font-bold text-lg ${isNightMode ? 'text-white' : 'text-slate-800'}`}>Rendimiento de Seguridad Anual</h3>
                        <select 
                          className={`border-none rounded-lg px-3 py-1.5 text-sm font-semibold focus:ring-0 ${isNightMode ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-700'}`}
                          value={annualRange}
                          onChange={(e) => setAnnualRange(e.target.value as any)}
                        >
                          <option value="6">Últimos 6 Meses</option>
                          <option value="12">Últimos 12 Meses</option>
                        </select>
                      </div>
                      
                      <div className="flex-1 min-h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={annualRange === '6' ? annualHistoryData.slice(6) : annualHistoryData} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                            <defs>
                              <linearGradient id="colorCurrentYear" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                              </linearGradient>
                              <linearGradient id="colorLastYear" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#94A3B8" stopOpacity={0.5}/>
                                <stop offset="95%" stopColor="#94A3B8" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke={isNightMode ? '#334155' : '#F1F5F9'} vertical={false} />
                            <XAxis dataKey="month" stroke="#94A3B8" fontSize={10} fontWeight="bold" tickLine={false} />
                            <YAxis stroke="#94A3B8" fontSize={10} fontWeight="bold" domain={[0, 100]} tickLine={false} axisLine={false} />
                            <Tooltip 
                               contentStyle={{ backgroundColor: '#1E293B', border: 'none', borderRadius: '12px', color: '#FFF', fontSize: '10px', fontWeight: 'bold' }}
                               itemStyle={{ color: '#10B981' }}
                               labelStyle={{ color: '#94A3B8', marginBottom: '4px' }}
                            />
                            <Area type="monotone" dataKey="current" name="Año Actual" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorCurrentYear)" />
                            <Area type="monotone" dataKey="previous" name="Año Anterior" stroke="#94A3B8" strokeWidth={2} strokeDasharray="5 5" fillOpacity={1} fill="url(#colorLastYear)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  ) : (
                    filteredPreventionTopics.map((topic) => {
                      const securedCount = topic.hazards.filter(h => h.completed).length;
                      const isFullySecured = securedCount === topic.hazards.length;

                  return (
                    <motion.div 
                      key={topic.id} 
                      tabIndex={0}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        setContextMenu({ x: e.pageX, y: e.pageY, topicId: topic.id });
                      }}
                      onKeyDown={(e) => {
                        if (e.key.toLowerCase() === 'f') {
                          e.preventDefault();
                          setFocusModeTopicId(topic.id);
                        }
                      }}
                      animate={completedAreaId === topic.id ? { 
                        scale: [1, 1.02, 1],
                        boxShadow: [
                          "0px 4px 6px -1px rgba(0,0,0,0.1)",
                          "0px 10px 25px rgba(59, 130, 246, 0.4)",
                          "0px 4px 6px -1px rgba(0,0,0,0.1)"
                        ],
                        borderColor: ["#f1f5f9", "#60a5fa", "#f1f5f9"]
                      } : {}}
                      transition={{ duration: 1.5, ease: "easeInOut" }}
                      className={`rounded-3xl p-5 shadow-sm space-y-4 text-left flex flex-col justify-between h-full overflow-hidden relative transition-all duration-300 hover:scale-[1.02] hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${isNightMode ? 'bg-slate-900 border border-slate-800' : isAccessibilityMode ? 'bg-white border-[3px] border-black' : 'bg-white border-0 shadow-[0_8px_30px_rgb(0,0,0,0.04)]'}`}
                    >
                      <AnimatePresence>
                        {completedAreaId === topic.id && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.5, rotate: -45 }}
                            animate={{ opacity: 1, scale: 1, rotate: 0 }}
                            exit={{ opacity: 0, scale: 0.5, rotate: 45 }}
                            transition={{ duration: 0.5 }}
                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20 text-blue-400"
                          >
                            <Sparkles className="w-16 h-16 drop-shadow-xl opacity-80" />
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {topic.selectedIcon && AMAPOLA_ICONS[topic.selectedIcon] ? (
                        <div className="absolute top-0 right-0 w-32 h-32 opacity-[0.03] pointer-events-none -mr-6 -mt-6">
                           {(() => {
                             const BigIcon = AMAPOLA_ICONS[topic.selectedIcon].icon;
                             return <BigIcon className="w-full h-full text-slate-900" />;
                           })()}
                        </div>
                      ) : topic.image && (
                        <div className="absolute top-0 right-0 w-24 h-24 opacity-10 pointer-events-none -mr-4 -mt-4">
                           <img src={topic.image} alt={topic.room} className="w-full h-full object-cover rounded-full" referrerPolicy="no-referrer" />
                        </div>
                      )}
                      
                      <button 
                        onClick={(e) => { e.stopPropagation(); setIconModalOpenId(topic.id); }}
                        className={`absolute top-3 right-3 z-20 w-8 h-8 rounded-full flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 ${isNightMode ? 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white' : 'bg-white text-slate-400 hover:bg-slate-100 hover:text-slate-700 shadow-sm border border-slate-100'}`}
                        title="Cambiar icono ilustrado"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <div className="space-y-3 relative z-10">
                        <div className="flex items-center justify-between mt-1">
                          <span className="flex items-center gap-2">
                            {topic.selectedIcon && AMAPOLA_ICONS[topic.selectedIcon] ? (
                               (() => {
                                 const SmallIcon = AMAPOLA_ICONS[topic.selectedIcon].icon;
                                 const color = AMAPOLA_ICONS[topic.selectedIcon].color;
                                 const bg = AMAPOLA_ICONS[topic.selectedIcon].bgColor;
                                 return (
                                   <div className={`w-7 h-7 rounded-full flex items-center justify-center ${bg} shadow-sm border border-white`}>
                                     <SmallIcon className={`w-3.5 h-3.5 ${color}`} />
                                   </div>
                                 );
                               })()
                            ) : topic.image && (
                              <img src={topic.image} alt="" className="w-7 h-7 rounded-full object-cover shadow-sm" referrerPolicy="no-referrer" />
                            )}
                            <span className="text-xs font-black text-blue-500 bg-blue-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
                              {topic.room}
                            </span>
                            {topic.effort && (
                              <span className={`flex items-center justify-center p-1.5 rounded-full ${
                                topic.effort === 'Fácil' ? 'text-emerald-600 bg-emerald-50' : 
                                topic.effort === 'Medio' ? 'text-amber-600 bg-amber-50' : 
                                'text-rose-600 bg-rose-50'
                              }`} title={`Esfuerzo: ${topic.effort}`}>
                                {topic.effort === 'Fácil' && <Zap className="w-3.5 h-3.5" />}
                                {topic.effort === 'Medio' && <Timer className="w-3.5 h-3.5" />}
                                {topic.effort === 'Difícil' && <Dumbbell className="w-3.5 h-3.5" />}
                              </span>
                            )}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-mono font-bold ${isNightMode ? 'text-slate-500' : 'text-slate-400'}`}>
                              {securedCount} / {topic.hazards.length} Asegurado
                            </span>
                            <button
                              onClick={() => handleOpenProTips(topic)}
                              className="p-1.5 text-amber-500 hover:bg-amber-100 bg-amber-50 rounded-full transition-colors focus:outline-none"
                              title={`Ver Pro-tips para ${topic.room}`}
                            >
                              <Lightbulb className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <h4 className={`font-black ${isAccessibilityMode ? 'text-base text-black' : 'text-sm ' + (isNightMode ? 'text-white' : 'text-slate-900')}`}>{topic.title}</h4>
                          <div className={`w-full rounded-full h-1.5 mt-2 mb-3 overflow-hidden ${isNightMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
                            <motion.div 
                              className={`h-1.5 rounded-full ${isFullySecured ? 'bg-emerald-500' : 'bg-blue-500'}`}
                              initial={{ width: 0 }}
                              animate={{ width: `${(securedCount / topic.hazards.length) * 100}%` }}
                              transition={{ duration: 0.5, ease: "easeOut" }}
                            />
                          </div>
                          <p className={`leading-relaxed ${isAccessibilityMode ? 'text-sm font-black text-black' : 'text-xs font-semibold ' + (isNightMode ? 'text-slate-400' : 'text-slate-500')}`}>
                            {topic.guideline}
                          </p>
                          <button
                            onClick={() => setExpandedInfoId(expandedInfoId === topic.id ? null : topic.id)}
                            className="text-xs font-bold text-blue-500 hover:text-blue-600 flex items-center gap-1 mt-1 transition-colors focus:outline-none"
                          >
                            {expandedInfoId === topic.id ? 'Ocultar info' : 'Ver más acerca de este riesgo'}
                            <ChevronDown className={`w-3 h-3 transition-transform ${expandedInfoId === topic.id ? 'rotate-180' : ''}`} />
                          </button>
                          
                          <AnimatePresence>
                            {expandedInfoId === topic.id && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                              >
                                <div className={`mt-2 p-3 rounded-xl border ${isNightMode ? 'bg-blue-900/20 border-blue-900/50' : isAccessibilityMode ? 'bg-blue-50 border-2 border-black' : 'bg-blue-50/50 border-blue-100/50'}`}>
                                  <div className="flex gap-2 items-start">
                                    <BookOpen className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                                    <p className={`leading-relaxed ${isAccessibilityMode ? 'text-sm font-black text-black' : 'text-xs font-medium ' + (isNightMode ? 'text-slate-300' : 'text-slate-600')}`}>
                                      <span className={`font-black ${isNightMode ? 'text-white' : 'text-slate-800'}`}>Contexto Pediátrico:</span> {topic.expandedInfo}
                                    </p>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          
          

          
          </AnimatePresence>
                        </div>

                        {/* List of checks */}
                        <div className="space-y-2 pt-2">
                          {topic.hazards.map((h) => (
                            <div
                              key={h.id}
                              className={`w-full p-3 rounded-xl border text-left transition-all flex items-start gap-2.5 group relative ${
                                h.completed
                                  ? (isNightMode ? 'bg-emerald-900/20 border-emerald-900/50' : isAccessibilityMode ? 'bg-emerald-100 border-2 border-black' : 'bg-emerald-50/20 border-emerald-100')
                                  : (isNightMode ? 'bg-slate-800/50 border-slate-800 hover:border-slate-700' : isAccessibilityMode ? 'bg-white border-2 border-black' : 'bg-slate-50/50 border-slate-100')
                              }`}
                            >
                              <button
                                onClick={(e) => { e.stopPropagation(); toggleHazard(topic.id, h.id); }}
                                className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-all focus:outline-none cursor-pointer ${
                                h.completed
                                  ? (isNightMode ? 'bg-emerald-600 border-emerald-600 text-white' : isAccessibilityMode ? 'bg-emerald-600 border-black text-white' : 'bg-emerald-500 border-emerald-500 text-white')
                                  : (isNightMode ? 'border-slate-600 bg-slate-800' : isAccessibilityMode ? 'border-2 border-black bg-white' : 'border-slate-300 bg-white')
                              }`}>
                                {h.completed && <CheckCircle2 className={`w-3 h-3 ${isAccessibilityMode ? 'text-white stroke-[3px]' : 'text-white'}`} />}
                              </button>
                              <div className="flex-1">
                                <button 
                                  onClick={() => setHazardDetailModalData({ isOpen: true, hazard: h, topicName: topic.room })}
                                  className="flex flex-col gap-1.5 items-start text-left cursor-pointer focus:outline-none w-full"
                                  title="Ver detalles del peligro"
                                >
                                  <span className={`leading-snug ${isAccessibilityMode ? 'text-sm font-black' : 'text-sm font-medium'} ${
                                    h.completed 
                                      ? (isNightMode ? 'text-slate-500 line-through decoration-slate-600' : isAccessibilityMode ? 'text-slate-600 line-through decoration-black' : 'text-slate-500 line-through decoration-slate-300') 
                                      : (isNightMode ? 'text-slate-200 hover:text-white' : isAccessibilityMode ? 'text-black hover:text-blue-700' : 'text-slate-700 hover:text-blue-600')
                                  }`}>
                                    {h.text}
                                  </span>
                                  {h.urgency && (
                                    <span className={`font-black px-1.5 py-0.5 rounded uppercase tracking-wider ${isAccessibilityMode ? 'text-xs border-2 border-black' : 'text-xs'} ${
                                      h.urgency === 'Alta' 
                                        ? (isNightMode ? 'bg-red-900/40 text-red-400' : isAccessibilityMode ? 'bg-red-200 text-black' : 'bg-red-100 text-red-700')
                                        : h.urgency === 'Media'
                                        ? (isNightMode ? 'bg-amber-900/40 text-amber-400' : isAccessibilityMode ? 'bg-amber-200 text-black' : 'bg-amber-100 text-amber-700')
                                        : (isNightMode ? 'bg-emerald-900/40 text-emerald-400' : isAccessibilityMode ? 'bg-emerald-200 text-black' : 'bg-emerald-100 text-emerald-700')
                                    }`}>
                                      {h.urgency}
                                    </span>
                                  )}
                                </button>
                              </div>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDownloadTaskICS(h.text, topic.room, 1); }}
                                className={`shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md focus:outline-none focus:opacity-100 ${
                                  isNightMode ? 'hover:bg-slate-700 text-slate-400' : isAccessibilityMode ? 'hover:bg-slate-200 text-black border border-transparent hover:border-black' : 'hover:bg-slate-200 text-slate-500'
                                }`}
                                title="Añadir recordatorio mensual al calendario"
                              >
                                <Calendar className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      {isFullySecured && (
                        <div className={`px-3 py-2 rounded-xl text-xs font-bold text-center border ${isNightMode ? 'bg-emerald-900/30 text-emerald-400 border-emerald-800' : 'bg-emerald-50 text-emerald-800 border-emerald-100'}`}>
                          🎉 ¡Área de {topic.room} Completamente Asegurada!
                        </div>
                      )}
                      
                      <div className="flex flex-col gap-2 mt-2">
                        {!isFullySecured && (
                          <button
                            onClick={() => handleAutoCompleteArea(topic.id)}
                            disabled={autoCompletingId === topic.id}
                            className={`w-full py-2.5 font-bold text-sm rounded-xl transition-colors flex items-center justify-center gap-1.5 border focus:outline-none focus:ring-2 focus:ring-indigo-500/50 disabled:opacity-70 disabled:cursor-not-allowed ${
                              isNightMode ? 'bg-indigo-900/30 hover:bg-indigo-900/50 text-indigo-300 border-indigo-800' : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200'
                            }`}
                          >
                            {autoCompletingId === topic.id ? (
                              <Sparkles className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Sparkles className="w-3.5 h-3.5" />
                            )}
                            {autoCompletingId === topic.id ? 'Completando...' : 'Autocompletar área'}
                          </button>
                        )}
                        <div className="flex gap-2">
                          <button
                            onClick={() => setFocusModeTopicId(topic.id)}
                            className={`flex-1 py-2.5 font-bold text-sm rounded-xl transition-colors flex items-center justify-center gap-1.5 border focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
                              isNightMode ? 'bg-blue-900/30 hover:bg-blue-900/50 text-blue-400 border-blue-800' : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200'
                            }`}
                          >
                            <Maximize className="w-3.5 h-3.5" />
                            Modo Enfoque
                          </button>
                          <button
                            onClick={() => handleShareArea(topic, securedCount)}
                            className={`flex-1 py-2.5 font-bold text-sm rounded-xl transition-colors flex items-center justify-center gap-1.5 border focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
                              isNightMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700' : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            <Share2 className="w-3.5 h-3.5" />
                            Compartir
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                }))}
                </motion.div>
              )}
              
              {/* Registro de Actividad (Modo Enfoque) */}
              {focusSessions.length > 0 && (
                <div className="bg-white border-0 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl p-6 md:p-8 shadow-sm space-y-4 text-left">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                        <Timer className="w-5 h-5 text-blue-500" />
                        Registro de Enfoque
                      </h3>
                      <p className="text-sm text-slate-500 leading-relaxed font-medium">
                        Tiempo invertido en tareas específicas
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {focusSessions.slice(0, 6).map((session) => (
                      <div key={session.id} className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col gap-2">
                        <div className="flex justify-between items-start">
                          <span className="text-xs font-bold text-slate-700 bg-white px-2 py-1 rounded-md shadow-sm border border-slate-100">
                            {session.topicName}
                          </span>
                          <span className="text-xs text-slate-400 font-medium">
                            {new Date(session.timestamp).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex gap-4 mt-1">
                          <div>
                            <span className="block text-xs text-slate-500 uppercase tracking-wider font-bold mb-0.5">Tiempo</span>
                            <span className="text-sm font-black text-slate-800">{Math.floor(session.durationSeconds / 60)}m {session.durationSeconds % 60}s</span>
                          </div>
                          <div>
                            <span className="block text-xs text-slate-500 uppercase tracking-wider font-bold mb-0.5">Tareas</span>
                            <span className="text-sm font-black text-blue-600">{session.tasksCompleted}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Guías de Primeros Auxilios Básicos */}
              <div className="bg-white border-0 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl p-6 md:p-8 shadow-sm space-y-6 text-left">
                <div className="space-y-1">
                  <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <Heart className="w-5 h-5 text-rose-500" />
                    Guías de Acción Rápida (Primeros Auxilios)
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                    Instrucciones paso a paso para actuar ante accidentes comunes. Pulsa en cada tarjeta para ver los detalles.
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {FIRST_AID_GUIDES.map((guide) => (
                    <div 
                      key={guide.id}
                      className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
                        activeFirstAidId === guide.id ? guide.bgColor : 'bg-slate-50 border-slate-100 hover:border-slate-200 cursor-pointer'
                      }`}
                    >
                      <button 
                        onClick={() => setActiveFirstAidId(activeFirstAidId === guide.id ? null : guide.id)}
                        className="w-full text-left p-4 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-inner ${guide.iconBg}`}>
                            <guide.icon className={`w-5 h-5 ${guide.color}`} />
                          </div>
                          <span className={`font-bold text-sm ${activeFirstAidId === guide.id ? 'text-slate-900' : 'text-slate-700'}`}>
                            {guide.title}
                          </span>
                        </div>
                        {activeFirstAidId === guide.id ? (
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-slate-400" />
                        )}
                      </button>
                      
                      <AnimatePresence>
                        {activeFirstAidId === guide.id && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="px-4 pb-4 overflow-hidden"
                          >
                            <div className="space-y-3 pt-2 border-t border-slate-200/50 mt-2">
                              {guide.steps.map((step, idx) => (
                                <div key={idx} className="flex gap-3 text-sm">
                                  <span className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-black ${guide.color} bg-white shadow-sm border border-slate-100`}>
                                    {idx + 1}
                                  </span>
                                  <p className="text-slate-700 leading-snug font-medium pt-0.5">
                                    {step}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              </div>

              {/* Historial de Progreso Semanal Section */}
              <div id="weekly-progress-history" className="bg-white border-0 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl p-6 md:p-8 shadow-sm space-y-6 text-left">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div className="space-y-1">
                    <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-blue-500" />
                      Historial de Progreso Semanal
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                      Lleva un registro de cómo va mejorando la seguridad de tu hogar. ¡Apunta al 100% libre de peligros!
                    </p>
                  </div>
                  <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
                    <button
                      onClick={handleShareProgress}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                      title="Compartir Progreso"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      Compartir
                    </button>
                    <button
                      onClick={handleExportCSV}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                      title="Descargar Reporte CSV"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Exportar
                    </button>
                    <button
                      onClick={handleResetHistory}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                      title="Restaurar valores de ejemplo"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Reestablecer
                    </button>
                    <button
                      onClick={handleClearHistory}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                      title="Borrar todo el historial"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Limpiar Todo
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
                  {/* Chart Panel */}
                  <div className="lg:col-span-2 bg-slate-50/50 border border-slate-100 rounded-2xl p-4 flex flex-col justify-between h-[300px]">
                    <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                      <span className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-500" /> Gráfico de Evolución
                      </span>
                      
                      <div className="flex items-center bg-white border border-slate-200 rounded-xl p-0.5 shadow-sm">
                        <button
                          onClick={() => setChartView('evolution')}
                          className={`px-3 py-1 rounded-lg text-xs font-black uppercase transition-all ${
                            chartView === 'evolution' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'
                          }`}
                        >
                          Actual
                        </button>
                        <button
                          onClick={() => setChartView('comparison')}
                          className={`px-3 py-1 rounded-lg text-xs font-black uppercase transition-all ${
                            chartView === 'comparison' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'
                          }`}
                        >
                          Comparativa
                        </button>
                      </div>
                    </div>
                    
                    <div className="w-full flex-1 min-h-[220px]">
                      {safetyHistory.length === 0 ? (
                        <div className="w-full h-full flex flex-col items-center justify-center text-center p-4">
                          <BarChart3 className="w-10 h-10 text-slate-300 stroke-[1.5] mb-2" />
                          <p className="text-xs font-bold text-slate-400">Sin registros en el historial</p>
                          <p className="text-xs text-slate-400 max-w-xs mt-1">
                            Utiliza el panel lateral para guardar tu puntuación de seguridad actual.
                          </p>
                        </div>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          {chartView === 'evolution' ? (
                            <BarChart data={safetyHistory} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                              <XAxis 
                                dataKey="weekLabel" 
                                stroke="#94A3B8" 
                                fontSize={9} 
                                fontWeight="bold"
                                tickLine={false} 
                              />
                              <YAxis 
                                stroke="#94A3B8" 
                                fontSize={9} 
                                fontWeight="bold"
                                domain={[0, 100]} 
                                tickLine={false} 
                                axisLine={false}
                              />
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: '#1E293B',
                                  border: 'none',
                                  borderRadius: '12px',
                                  color: '#FFF',
                                  fontSize: '10px',
                                  fontWeight: 'bold',
                                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                }}
                                itemStyle={{ color: '#F43F5E' }}
                                labelStyle={{ color: '#94A3B8', marginBottom: '4px' }}
                                formatter={(value: any) => [`${value}% Seguro`, 'Porcentaje']}
                              />
                              <Bar 
                                dataKey="percentage" 
                                fill="#3B82F6" 
                                radius={[6, 6, 0, 0]}
                                maxBarSize={45}
                              >
                                {safetyHistory.map((entry, index) => (
                                  <Cell 
                                    key={`cell-${index}`} 
                                    fill={entry.percentage === 100 ? '#10B981' : index === safetyHistory.length - 1 ? '#F43F5E' : '#3B82F6'} 
                                  />
                                ))}
                              </Bar>
                            </BarChart>
                          ) : (
                            <AreaChart data={comparativeData} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                              <defs>
                                <linearGradient id="colorThis" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                                </linearGradient>
                                <linearGradient id="colorLast" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#94A3B8" stopOpacity={0.5}/>
                                  <stop offset="95%" stopColor="#94A3B8" stopOpacity={0}/>
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                              <XAxis 
                                dataKey="weekLabel" 
                                stroke="#94A3B8" 
                                fontSize={9} 
                                fontWeight="bold"
                                tickLine={false} 
                              />
                              <YAxis 
                                stroke="#94A3B8" 
                                fontSize={9} 
                                fontWeight="bold"
                                domain={[0, 100]} 
                                tickLine={false} 
                                axisLine={false}
                              />
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: '#1E293B',
                                  border: 'none',
                                  borderRadius: '12px',
                                  color: '#FFF',
                                  fontSize: '10px',
                                  fontWeight: 'bold',
                                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                }}
                                itemStyle={{ fontWeight: 'bold' }}
                                labelStyle={{ color: '#94A3B8', marginBottom: '4px' }}
                                formatter={(value: any, name: string) => {
                                  return [`${value}%`, name === 'thisMonth' ? 'Este Mes' : 'Mes Anterior']
                                }}
                              />
                              <Area type="monotone" dataKey="lastMonth" name="Mes Anterior" stroke="#94A3B8" fillOpacity={1} fill="url(#colorLast)" />
                              <Area type="monotone" dataKey="thisMonth" name="Este Mes" stroke="#3B82F6" fillOpacity={1} fill="url(#colorThis)" />
                            </AreaChart>
                          )}
                        </ResponsiveContainer>
                      )}
                    </div>
                  </div>

                  {/* Register and Action controls Panel */}
                  <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4 flex flex-col justify-between space-y-4">
                    <div className="space-y-3 text-left">
                      <span className="text-xs font-black uppercase tracking-widest text-slate-400 block">
                        Registrar Estado Actual
                      </span>
                      
                      <div className="bg-white border border-slate-200/60 rounded-xl p-3 flex items-center justify-between gap-3 shadow-xs">
                        <div className="text-left">
                          <span className="text-xs text-slate-400 font-bold uppercase block">Puntuación Actual</span>
                          <span className="text-base font-black text-slate-900">{percentSecured}% Protegido</span>
                        </div>
                        <div className={`px-2.5 py-1 rounded-full text-xs font-black uppercase ${
                          percentSecured === 100 ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {percentSecured === 100 ? 'Hogar Seguro' : 'En progreso'}
                        </div>
                      </div>

                      <div className="space-y-1.5 text-left">
                        <label className="text-xs text-slate-500 font-bold uppercase block">
                          Etiqueta de Registro (Opcional)
                        </label>
                        <input
                          type="text"
                          value={newEntryLabel}
                          onChange={(e) => setNewEntryLabel(e.target.value)}
                          placeholder={`Ej. Semana ${safetyHistory.length + 1}, Post-limpieza...`}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500 transition-all placeholder:text-slate-400"
                        />
                      </div>
                    </div>

                    <div className="space-y-2 pt-2">
                      <button
                        onClick={handleAddHistoryEntry}
                        className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        Registrar Puntuación {percentSecured}%
                      </button>
                      <p className="text-xs text-center text-slate-400 font-medium">
                        Se registrará el progreso actual de tu lista de verificación de prevención.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Micro record logs list in collapsible details or small scroller */}
                {safetyHistory.length > 0 && (
                  <div className="border-t border-slate-100 pt-4">
                    <span className="text-xs font-black uppercase tracking-widest text-slate-400 block mb-2.5">
                      Historial Detallado ({safetyHistory.length} registros)
                    </span>
                    <div className="flex flex-wrap gap-2 max-h-[110px] overflow-y-auto pr-1 pb-1">
                      {safetyHistory.map((item, idx) => (
                        <div 
                          key={idx} 
                          className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded-xl transition-all"
                        >
                          <div className={`w-2 h-2 rounded-full ${
                            item.percentage === 100 ? 'bg-emerald-500' : 'bg-blue-500'
                          }`} />
                          <div className="flex flex-col text-left">
                            <span className="text-xs font-black text-slate-800">{item.weekLabel}</span>
                            <span className="text-xs text-slate-400 font-bold">{item.percentage}% asegurado</span>
                          </div>
                          <button
                            onClick={() => handleDeleteHistoryEntry(idx)}
                            className="p-1 hover:bg-rose-100 rounded text-slate-400 hover:text-rose-600 transition-all ml-1 cursor-pointer"
                            title="Eliminar este registro"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Informative Guides Section */}
              <div className="bg-white border-0 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl p-6 md:p-8 shadow-sm space-y-4 text-left">
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-blue-500" />
                  Manual de Prevención Rápida
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-2xl space-y-1.5">
                    <h4 className="text-xs font-black text-rose-800 uppercase tracking-wider">Prevención de Quemaduras</h4>
                    <p className="text-sm text-slate-600 leading-relaxed font-medium">
                      Evite cargar al bebé mientras cocina o bebe líquidos calientes. Instale barreras de seguridad si utiliza calentadores ambientales y vigile siempre las tomas de corriente eléctrica.
                    </p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl space-y-1.5">
                    <h4 className="text-xs font-black text-blue-800 uppercase tracking-wider">Prevención de Intoxicaciones</h4>
                    <p className="text-sm text-slate-600 leading-relaxed font-medium">
                      Nunca coloque venenos para plagas en el piso de la cocina o dormitorios. Guarde pastillas, jarabes y medicamentos en su empaque original, elevados y rotulados correctamente.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          

          

          {activeTab === 'wellbeing' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <MaternalWellbeing />
            </motion.div>
          )}

          {activeTab === 'tips' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <GrandmaTips />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      
      {/* Icon Management Modal */}
      <AnimatePresence>
        {iconModalOpenId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setIconModalOpenId(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className={`rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-6 relative ${isNightMode ? 'bg-slate-900 border border-slate-800' : 'bg-white'}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className={`text-lg font-black ${isNightMode ? 'text-white' : 'text-slate-900'}`}>Asignar Icono</h3>
                  <p className="text-xs text-slate-500 font-medium">Personaliza la identidad visual de la habitación</p>
                </div>
                <button
                  onClick={() => setIconModalOpenId(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors"
                >
                  <Plus className="w-4 h-4 rotate-45" />
                </button>
              </div>

              <div className="grid grid-cols-4 gap-3">
                {Object.entries(AMAPOLA_ICONS).map(([key, config]) => {
                  const IconComp = config.icon;
                  const isSelected = preventionTopics.find(t => t.id === iconModalOpenId)?.selectedIcon === key;
                  
                  return (
                    <button
                      key={key}
                      onClick={() => {
                        setPreventionTopics(prev => prev.map(t => 
                          t.id === iconModalOpenId ? { ...t, selectedIcon: key } : t
                        ));
                        setIconModalOpenId(null);
                      }}
                      className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all ${
                        isSelected 
                          ? 'border-blue-500 bg-blue-50' 
                          : isNightMode 
                            ? 'border-slate-800 hover:border-slate-700 bg-slate-800/50' 
                            : 'border-slate-100 hover:border-blue-100 bg-white'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${config.bgColor}`}>
                        <IconComp className={`w-5 h-5 ${config.color}`} />
                      </div>
                      <span className={`text-[9px] font-bold uppercase tracking-wider ${isNightMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        {config.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {hazardDetailModalData.isOpen && hazardDetailModalData.hazard && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4`}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className={`rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl space-y-6 relative ${isNightMode ? 'bg-slate-900 border border-slate-800' : isAccessibilityMode ? 'bg-white border-[3px] border-black' : 'bg-white'}`}
            >
              <div className="absolute top-0 right-0 -mr-3 -mt-3 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center border-4 border-white shadow-sm">
                <ShieldCheck className="w-5 h-5 text-blue-500" />
              </div>

              <div className="space-y-4">
                <h3 className={`text-xl font-black ${isNightMode ? 'text-white' : 'text-slate-900'}`}>Detalle de Prevención</h3>
                <div className={`p-4 rounded-xl ${isNightMode ? 'bg-slate-800' : isAccessibilityMode ? 'bg-slate-100 border border-black' : 'bg-slate-50'}`}>
                  <p className={`font-semibold ${isAccessibilityMode ? 'text-sm text-black' : 'text-sm ' + (isNightMode ? 'text-slate-300' : 'text-slate-700')}`}>
                    {hazardDetailModalData.hazard.text}
                  </p>
                </div>
                {hazardDetailModalData.hazard.rationale && (
                  <div className={`p-4 rounded-xl border ${isNightMode ? 'bg-blue-900/20 border-blue-900/50' : isAccessibilityMode ? 'bg-blue-50 border-2 border-black' : 'bg-blue-50/50 border-blue-100/50'}`}>
                    <div className="flex gap-2 items-start">
                      <BookOpen className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                      <div>
                        <span className={`block font-black mb-1 ${isNightMode ? 'text-white' : 'text-slate-800'}`}>Por qué es importante:</span>
                        <p className={`leading-relaxed ${isAccessibilityMode ? 'text-sm font-black text-black' : 'text-sm font-medium ' + (isNightMode ? 'text-slate-300' : 'text-slate-600')}`}>
                          {hazardDetailModalData.hazard.rationale}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={() => {
                    const eventDate = new Date();
                    eventDate.setDate(eventDate.getDate() + 7); // Schedule maintenance in 7 days
                    const dateStr = eventDate.toISOString().split('T')[0].replace(/-/g, '');
                    const endStr = new Date(eventDate.getTime() + 60 * 60 * 1000).toISOString().split('T')[0].replace(/-/g, '');
                    
                    const icsContent = [
                      'BEGIN:VCALENDAR',
                      'VERSION:2.0',
                      'BEGIN:VEVENT',
                      `DTSTART:${dateStr}T100000Z`,
                      `DTEND:${endStr}T110000Z`,
                      `SUMMARY:Mantenimiento: ${hazardDetailModalData.topicName}`,
                      `DESCRIPTION:Verificar: ${hazardDetailModalData.hazard.text}`,
                      'END:VEVENT',
                      'END:VCALENDAR'
                    ].join('\n');
                    
                    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
                    const url = window.URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.setAttribute('download', 'mantenimiento-seguridad.ics');
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    window.URL.revokeObjectURL(url);
                    setHazardDetailModalData({ isOpen: false, hazard: null, topicName: '' });
                  }}
                  className={`w-full py-3 font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm text-sm ${isAccessibilityMode ? 'bg-blue-600 text-white border-2 border-black hover:bg-blue-700' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                >
                  <Calendar className="w-4 h-4" />
                  Añadir al Calendario
                </button>
                <button
                  onClick={() => setHazardDetailModalData({ isOpen: false, hazard: null, topicName: '' })}
                  className={`w-full py-3 font-bold rounded-xl transition-colors text-sm ${isNightMode ? 'text-slate-300 bg-slate-800 hover:bg-slate-700' : isAccessibilityMode ? 'bg-white text-black border-2 border-black hover:bg-slate-200' : 'text-slate-600 bg-slate-100 hover:bg-slate-200'}`}
                >
                  Cerrar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recheck Reminder Modal */}
      <AnimatePresence>
        {recheckModalData.isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-2xl space-y-6 text-center"
            >
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black text-slate-900">¡Área Asegurada!</h3>
                <p className="text-sm font-medium text-slate-600 leading-relaxed">
                  Has completado todas las medidas de prevención en <span className="font-bold text-slate-800">{recheckModalData.topicName}</span>. ¿Deseas agendar un recordatorio en 3 meses para re-verificar esta área?
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => handleDownloadICS(recheckModalData.topicName)}
                  className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm text-sm"
                >
                  <Calendar className="w-4 h-4" />
                  Descargar Recordatorio (.ics)
                </button>
                <button
                  onClick={() => setRecheckModalData({ isOpen: false, topicName: '' })}
                  className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all cursor-pointer text-sm"
                >
                  No, gracias
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pro-Tips Modal */}
      <AnimatePresence>
        {proTipsModalData.isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl relative"
            >
              <div className="absolute top-0 right-0 -mr-3 -mt-3 w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center border-4 border-white shadow-sm">
                <Lightbulb className="w-5 h-5 text-amber-500" />
              </div>
              
              <h2 className="text-xl font-black text-slate-800 mb-2">Pro-Tips: {proTipsModalData.topicName}</h2>
              <p className="text-sm text-slate-500 mb-6 font-medium">Consejos de seguridad avanzados basados en guías pediátricas.</p>
              
              <div className="bg-amber-50 rounded-2xl p-5 mb-6 border border-amber-100 min-h-[120px] flex items-center justify-center">
                {proTipsModalData.isLoading ? (
                   <div className="flex flex-col items-center gap-3">
                     <Sparkles className="w-6 h-6 text-amber-500 animate-spin" />
                     <p className="text-sm font-semibold text-amber-700">Generando consejos expertos...</p>
                   </div>
                ) : (
                  <div className="text-sm text-slate-700 font-medium leading-relaxed w-full whitespace-pre-wrap">
                    {proTipsModalData.tips}
                  </div>
                )}
              </div>
              
              <button
                onClick={() => setProTipsModalData({ isOpen: false, topicName: '', tips: '', isLoading: false })}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-all shadow-sm cursor-pointer"
              >
                Entendido
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {focusModeTopicId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col bg-white overflow-hidden"
          >
            {(() => {
              const topic = preventionTopics.find(t => t.id === focusModeTopicId);
              if (!topic) return null;
              
              const securedCount = topic.hazards.filter(h => h.completed).length;
              const isFullySecured = securedCount === topic.hazards.length;
              
              return (
                <div className="flex-1 overflow-y-auto flex flex-col">
                  {/* Focus Header */}
                  <div className="bg-slate-900 text-white p-4 flex items-center justify-between sticky top-0 z-10 shrink-0">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                        <ShieldCheck className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <h2 className="font-bold text-lg leading-tight">{topic.room}</h2>
                        <p className="text-xs text-slate-300 font-medium">Modo Enfoque</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleExitFocusMode()}
                      className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors text-slate-300 hover:text-white"
                    >
                      <Minimize className="w-5 h-5" />
                    </button>
                  </div>
                  
                  {/* Focus Content */}
                  <div className="flex-1 max-w-3xl w-full mx-auto p-6 md:p-12">
                    <div className="mb-8">
                      <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">{topic.title}</h1>
                      <div className="flex items-center gap-2 mb-6">
                        <span className={`px-2.5 py-1 text-xs font-bold rounded-lg ${
                          topic.effort === 'Fácil' ? 'bg-green-100 text-green-700' :
                          topic.effort === 'Medio' ? 'bg-amber-100 text-amber-700' :
                          'bg-rose-100 text-rose-700'
                        }`}>
                          Esfuerzo: {topic.effort}
                        </span>
                        <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-blue-100 text-blue-700">
                          {securedCount} de {topic.hazards.length} tareas
                        </span>
                      </div>

                      {/* Timer UI */}
                      <div className="bg-slate-100 border border-slate-200 rounded-3xl p-5 mb-8 flex flex-col items-center justify-center relative overflow-hidden">
                        <div className="flex items-center gap-2 mb-3 z-10">
                          <Timer className="w-5 h-5 text-slate-500" />
                          <span className="text-sm font-bold text-slate-700">Temporizador de Enfoque</span>
                        </div>
                        
                        {focusTimerSeconds === 0 && !isFocusTimerRunning ? (
                          <div className="flex gap-3 z-10">
                            {[5, 10, 15].map((min) => (
                              <button
                                key={min}
                                onClick={() => handleStartFocusTimer(min as 5|10|15)}
                                className="px-5 py-2.5 bg-white border border-slate-200 hover:border-blue-400 hover:shadow-md rounded-xl text-sm font-bold text-slate-700 hover:text-blue-600 transition-all"
                              >
                                {min} min
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div className="flex flex-col items-center z-10">
                            <div className={`text-5xl font-mono font-black tracking-tight mb-4 ${focusTimerSeconds < 60 ? 'text-rose-500' : 'text-slate-800'}`}>
                              {formatTimer(focusTimerSeconds)}
                            </div>
                            <div className="flex gap-3">
                              <button
                                onClick={handleToggleFocusTimer}
                                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all shadow-sm flex items-center justify-center"
                              >
                                {isFocusTimerRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                              </button>
                              <button
                                onClick={handleResetFocusTimer}
                                className="px-4 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl transition-all shadow-sm flex items-center justify-center"
                              >
                                <Square className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        )}
                        
                        {/* Progress Bar Background for Timer */}
                        {isFocusTimerRunning && focusTimerSeconds > 0 && (
                           <div 
                             className="absolute bottom-0 left-0 h-1.5 bg-blue-500 transition-all duration-1000 ease-linear"
                             style={{ width: `${(focusTimerSeconds / (selectedFocusTimerMinutes * 60)) * 100}%` }}
                           />
                        )}
                      </div>

                      {/* Voice Control UI */}
                      <div className="bg-indigo-50 border border-indigo-100 rounded-3xl p-5 mb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${isListeningForVoice ? 'bg-indigo-500 animate-pulse text-white shadow-lg shadow-indigo-500/30' : 'bg-white border border-indigo-200 text-indigo-500'}`}>
                            {isListeningForVoice ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-800">Control por Voz</h4>
                            <p className="text-xs text-slate-500 font-medium max-w-[200px]">Di parte de la tarea para completarla mientras tienes las manos ocupadas.</p>
                          </div>
                        </div>
                        <div className="flex flex-col items-center sm:items-end gap-2 w-full sm:w-auto">
                           <button
                             onClick={isListeningForVoice ? undefined : handleStartVoiceRecognition}
                             disabled={isListeningForVoice}
                             className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-bold rounded-xl transition-all shadow-sm text-sm"
                           >
                             {isListeningForVoice ? 'Escuchando...' : 'Activar Micrófono'}
                           </button>
                           {voiceFeedbackMessage && (
                             <span className="text-sm font-bold text-indigo-600 animate-pulse bg-indigo-100 px-2 py-1 rounded-md">
                               {voiceFeedbackMessage}
                             </span>
                           )}
                        </div>
                      </div>
                      
                      <div className="p-5 bg-blue-50/50 border border-blue-100 rounded-2xl mb-8 relative pr-16">
                        <p className="text-sm text-slate-700 font-medium leading-relaxed">
                          {topic.expandedInfo || topic.guideline}
                        </p>
                        <button
                          onClick={() => handleGenerateAndSpeak(topic)}
                          disabled={isGeneratingVoiceText}
                          className={`absolute top-4 right-4 p-2.5 rounded-full shadow-sm border transition-colors ${isSpeaking ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-blue-600 border-blue-200 hover:bg-blue-50'} disabled:opacity-50`}
                          title="Leer en voz alta (IA)"
                        >
                          {isGeneratingVoiceText ? (
                            <Sparkles className="w-5 h-5 animate-spin" />
                          ) : (
                            <Volume2 className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      {topic.hazards.map(h => (
                        <button
                          key={h.id}
                          title={`Contexto pediátrico: ${topic.guideline}`}
                          onClick={() => toggleHazard(topic.id, h.id)}
                          className={`w-full text-left p-5 rounded-2xl border-2 transition-all flex items-start gap-4 hover:scale-[1.01] hover:shadow-md ${
                            h.completed
                              ? 'bg-emerald-50 border-emerald-200'
                              : 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-md'
                          }`}
                        >
                          <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                            h.completed
                              ? 'bg-emerald-500 border-emerald-500 text-white'
                              : 'border-slate-300 bg-white'
                          }`}>
                            {h.completed && <CheckCircle2 className="w-4 h-4 text-white" />}
                          </div>
                          <div className="flex flex-col gap-1.5 items-start">
                            <span className={`text-base md:text-lg font-medium leading-snug ${h.completed ? 'text-slate-500 line-through decoration-slate-300' : 'text-slate-800'}`}>
                              {h.text}
                            </span>
                            {h.urgency && (
                              <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                                h.urgency === 'Alta' 
                                  ? 'bg-red-100 text-red-700'
                                  : h.urgency === 'Media'
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-emerald-100 text-emerald-700'
                              }`}>
                                {h.urgency}
                              </span>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                    
                    {isFullySecured && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="mt-10 p-6 bg-emerald-500 rounded-3xl text-white text-center shadow-lg shadow-emerald-500/20"
                      >
                        <Trophy className="w-12 h-12 mx-auto mb-3 text-emerald-100" />
                        <h3 className="text-2xl font-black mb-2">¡Área Completada!</h3>
                        <p className="text-emerald-50 font-medium mb-6">Has asegurado todos los puntos críticos de esta zona.</p>
                        
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                          <button
                            onClick={() => handleShareArea(topic, securedCount)}
                            className="px-6 py-3 bg-white text-emerald-600 font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-emerald-50 transition-colors"
                          >
                            <Share2 className="w-4 h-4" />
                            Compartir Logro
                          </button>
                          <button
                            onClick={() => handleExitFocusMode()}
                            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors"
                          >
                            Volver al panel
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>
              );
            })()}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {contextMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.1 }}
            style={{ top: contextMenu.y, left: contextMenu.x }}
            className={`fixed z-50 w-48 border rounded-xl shadow-xl overflow-hidden py-1 ${isNightMode ? 'bg-slate-800 border-slate-700' : isAccessibilityMode ? 'bg-white border-2 border-black' : 'bg-white border-slate-200'}`}
          >
            <button
              onClick={() => {
                setFocusModeTopicId(contextMenu.topicId);
                setContextMenu(null);
              }}
              className={`w-full text-left px-4 py-2 text-sm font-bold flex items-center gap-2 transition-colors ${isNightMode ? 'text-slate-300 hover:bg-slate-700' : isAccessibilityMode ? 'text-black hover:bg-slate-200' : 'text-slate-700 hover:bg-slate-50'}`}
            >
              <Maximize className="w-4 h-4 text-blue-500" />
              Enfoque
            </button>
            <button
              onClick={() => {
                handleAutoCompleteArea(contextMenu.topicId);
                setContextMenu(null);
              }}
              className={`w-full text-left px-4 py-2 text-sm font-bold flex items-center gap-2 transition-colors ${isNightMode ? 'text-slate-300 hover:bg-slate-700' : isAccessibilityMode ? 'text-black hover:bg-slate-200' : 'text-slate-700 hover:bg-slate-50'}`}
            >
              <Sparkles className="w-4 h-4 text-indigo-500" />
              Completar Todo
            </button>
            <button
              onClick={() => {
                const topic = preventionTopics.find(t => t.id === contextMenu.topicId);
                if (topic) {
                  const securedCount = topic.hazards.filter(h => h.completed).length;
                  handleShareArea(topic, securedCount);
                }
                setContextMenu(null);
              }}
              className={`w-full text-left px-4 py-2 text-sm font-bold flex items-center gap-2 transition-colors ${isNightMode ? 'text-slate-300 hover:bg-slate-700' : isAccessibilityMode ? 'text-black hover:bg-slate-200' : 'text-slate-700 hover:bg-slate-50'}`}
            >
              <Share2 className="w-4 h-4 text-slate-500" />
              Compartir
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer Section */}
      <footer className="bg-slate-900 text-slate-400 text-xs py-8 border-t border-slate-800/60 mt-12 text-center md:text-left">
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 justify-center md:justify-start">
              <div className="w-6 h-6 rounded-full bg-rose-600 flex items-center justify-center text-white font-bold">
                <Heart className="w-3.5 h-3.5 fill-white" />
              </div>
              <span className="font-black text-white text-sm">Amapola Alerta</span>
            </div>
            <p className="text-xs text-slate-400 max-w-md leading-relaxed font-semibold">
              Portal interactivo para el empoderamiento y acompañamiento de padres de familia en prevención, vacunación y reanimación pediátrica.
            </p>
          </div>

          <div className="flex flex-col md:items-end justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-black uppercase tracking-wider text-slate-300 block">Privacidad del Usuario</span>
              <p className="text-xs text-slate-500 font-medium">
                La aplicación funciona de manera segura y respeta tu confidencialidad. Los registros de vacunas e historial se almacenan de manera local y cifrada en tu navegador de forma predeterminada.
              </p>
            </div>
            <p className="text-xs text-slate-600 font-bold uppercase tracking-widest">
              © 2026 Amapola Alerta. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
