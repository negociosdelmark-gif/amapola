import React, { useState, useEffect } from 'react';
import { 
  CalendarDays, CheckCircle2, Circle, Trophy, Info, RefreshCw,
  Bell, BellRing, BellOff, Send, Sparkles, Clock, AlertCircle, ShieldCheck,
  MapPin, Navigation, Compass, Radio, Locate, ArrowUp, ArrowDown, ArrowLeft, ArrowRight
} from 'lucide-react';
import { ChildProfile, Vaccine } from '../types';
import { registerPushNotifications, triggerLocalPushNotification } from '../lib/fcm';
import { auth } from '../lib/firebase';

interface VaccineTrackerProps {
  activeProfile: ChildProfile | null;
}

const DEFAULT_VACCINES: Vaccine[] = [
  { id: "v_bcg", name: "BCG (Tuberculosis)", ageMonths: 0, ageText: "Recién Nacido", disease: "Tuberculosis extrapulmonar", dose: "Dosis única", description: "Protege contra las formas graves de tuberculosis como la meningitis tuberculosa." },
  { id: "v_hepb_0", name: "Hepatitis B (Lactante)", ageMonths: 0, ageText: "Recién Nacido", disease: "Hepatitis B", dose: "Dosis de recién nacido", description: "Previene la infección crónica por hepatitis B transmitida en el nacimiento." },
  
  { id: "v_penta_1", name: "Pentavalente (DPT+HB+Hib)", ageMonths: 2, ageText: "2 Meses", disease: "Difteria, Tétanos, Tosferina, Hepatitis B, Influenza tipo B", dose: "1ra Dosis", description: "Vacuna combinada de alta importancia contra cinco patologías infantiles comunes." },
  { id: "v_polio_1", name: "Poliomielitis", ageMonths: 2, ageText: "2 Meses", disease: "Poliomielitis (Parálisis)", dose: "1ra Dosis (Inyectable)", description: "Protege el sistema nervioso contra el virus de la polio." },
  { id: "v_neumo_1", name: "Neumococo", ageMonths: 2, ageText: "2 Meses", disease: "Neumonía, Meningitis, Otitis", dose: "1ra Dosis", description: "Vacuna conjugada contra infecciones invasivas de neumococo." },
  { id: "v_rota_1", name: "Rotavirus", ageMonths: 2, ageText: "2 Meses", disease: "Diarreas severas por Rotavirus", dose: "1ra Dosis (Oral)", description: "Protege contra deshidrataciones severas provocadas por gastroenteritis." },

  { id: "v_penta_2", name: "Pentavalente", ageMonths: 4, ageText: "4 Meses", disease: "Difteria, Tétanos, Tosferina, Hepatitis B, Influenza tipo B", dose: "2da Dosis", description: "Segunda dosis para refuerzo inmunológico primario." },
  { id: "v_polio_2", name: "Poliomielitis", ageMonths: 4, ageText: "4 Meses", disease: "Poliomielitis (Parálisis)", dose: "2da Dosis (Inyectable)", description: "Siguiente dosis de inmunidad contra la parálisis infantil." },
  { id: "v_neumo_2", name: "Neumococo", ageMonths: 4, ageText: "4 Meses", disease: "Neumonía, Meningitis, Otitis", dose: "2da Dosis", description: "Refuerzo para protección de vías respiratorias." },
  { id: "v_rota_2", name: "Rotavirus", ageMonths: 4, ageText: "4 Meses", disease: "Diarreas severas por Rotavirus", dose: "2da Dosis (Oral)", description: "Inmunidad oral contra diarreas estacionales infantiles." },

  { id: "v_penta_3", name: "Pentavalente", ageMonths: 6, ageText: "6 Meses", disease: "Difteria, Tétanos, Tosferina, Hepatitis B, Influenza tipo B", dose: "3ra Dosis", description: "Última dosis del esquema primario de pentavalente." },
  { id: "v_polio_3", name: "Poliomielitis", ageMonths: 6, ageText: "6 Meses", disease: "Poliomielitis (Parálisis)", dose: "3ra Dosis (Oral)", description: "Refuerzo oral para consolidar anticuerpos." },
  { id: "v_inf_1", name: "Influenza Estacional", ageMonths: 6, ageText: "6 Meses", disease: "Gripe común / Influenza estacional", dose: "1ra Dosis", description: "Protección anual contra cepas estacionales respiratorias." },
  { id: "v_inf_2", name: "Influenza Estacional", ageMonths: 7, ageText: "7 Meses", disease: "Gripe común / Influenza estacional", dose: "2da Dosis", description: "Segunda dosis requerida para la primera inmunización estacional." },

  { id: "v_srp_1", name: "SRP (Triple Viral)", ageMonths: 12, ageText: "12 Meses (1 Año)", disease: "Sarampión, Rubeola, Paperas", dose: "1ra Dosis", description: "Vacuna fundamental para prevenir brotes epidémicos." },
  { id: "v_neumo_3", name: "Neumococo", ageMonths: 12, ageText: "12 Meses (1 Año)", disease: "Neumonía, Meningitis, Otitis", dose: "Refuerzo", description: "Refuerzo anual para inmunidad prolongada en infantes." },
  { id: "v_var_1", name: "Varicela", ageMonths: 12, ageText: "12 Meses (1 Año)", disease: "Varicela", dose: "1ra Dosis", description: "Previene lesiones en piel, fiebre y complicaciones por varicela." },
  { id: "v_hepa", name: "Hepatitis A", ageMonths: 12, ageText: "12 Meses (1 Año)", disease: "Hepatitis A", dose: "Dosis Única", description: "Protección contra infecciones de transmisión alimentaria hepática." },

  { id: "v_dpt_r1", name: "DPT (Difteria-Tétanos-Tosferina)", ageMonths: 18, ageText: "18 Meses (1.5 Años)", disease: "Difteria, Tétanos, Tosferina", dose: "1er Refuerzo", description: "Refuerzo esencial para la inmunidad protectora persistente." },
  { id: "v_pol_r1", name: "Poliomielitis", ageMonths: 18, ageText: "18 Meses (1.5 Años)", disease: "Poliomielitis (Parálisis)", dose: "1er Refuerzo (Oral)", description: "Consolidación oral de anticuerpos contra polio." },
  { id: "v_famar", name: "Fiebre Amarilla", ageMonths: 18, ageText: "18 Meses (1.5 Años)", disease: "Fiebre Amarilla", dose: "Dosis Única", description: "Obligatoria para viajes o zonas endémicas tropicales." },

  { id: "v_dpt_r2", name: "DPT", ageMonths: 60, ageText: "5 Años", disease: "Difteria, Tétanos, Tosferina", dose: "2do Refuerzo", description: "Consolidación inmunológica antes del ingreso escolar." },
  { id: "v_pol_r2", name: "Poliomielitis", ageMonths: 60, ageText: "5 Años", disease: "Poliomielitis (Parálisis)", dose: "2do Refuerzo (Oral)", description: "Último refuerzo de polio del esquema básico." },
  { id: "v_srp_r", name: "SRP (Triple Viral)", ageMonths: 60, ageText: "5 Años", disease: "Sarampión, Rubeola, Paperas", dose: "2da Dosis (Refuerzo)", description: "Refuerzo de inmunidad para protección de por vida." },
  { id: "v_var_r", name: "Varicela", ageMonths: 60, ageText: "5 Años", disease: "Varicela", dose: "Refuerzo", description: "Segunda dosis para máxima prevención de complicaciones." },

  { id: "v_vph", name: "VPH (Papiloma Humano)", ageMonths: 108, ageText: "9 Años", disease: "Cáncer de cuello uterino / verrugas", dose: "Dosis Única", description: "Aplicación preventiva clave según esquemas nacionales actualizados." }
];

interface Clinic {
  id: string;
  name: string;
  latOffset: number;
  lngOffset: number;
  address: string;
  phone: string;
  hours: string;
}

const CLINIC_TEMPLATES: Clinic[] = [
  { 
    id: 'clinic_amapola', 
    name: "Clínica Materno Infantil Amapola", 
    latOffset: 0.0055, 
    lngOffset: 0.0062, 
    address: "Calle 45 #13-22, Sector Norte", 
    phone: "+57 (601) 890-1234", 
    hours: "24 Horas (Abierto hoy)" 
  },
  { 
    id: 'clinic_sanjose', 
    name: "Centro Pediátrico San José", 
    latOffset: -0.0078, 
    lngOffset: -0.0084, 
    address: "Av. Caracas #22-45, Centro", 
    phone: "+57 (601) 345-6789", 
    hours: "Lun - Vie: 7:00 AM - 5:00 PM, Sáb: 8:00 AM - 1:00 PM" 
  },
  { 
    id: 'clinic_parque', 
    name: "Puesto de Salud Infantil El Parque", 
    latOffset: 0.0112, 
    lngOffset: -0.0135, 
    address: "Carrera 10 #2-89, Barrio El Parque", 
    phone: "+57 (601) 567-8901", 
    hours: "Lun - Vie: 8:00 AM - 4:00 PM" 
  },
  { 
    id: 'clinic_jesus', 
    name: "Hospital Infantil del Niño Jesús", 
    latOffset: -0.0135, 
    lngOffset: 0.0121, 
    address: "Av. Suba #115-30, Sector Occidental", 
    phone: "+57 (601) 234-5678", 
    hours: "24 Horas (Emergencias Pediátricas)" 
  }
];

export default function VaccineTracker({ activeProfile }: VaccineTrackerProps) {
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [filterAge, setFilterAge] = useState<string>('todos');

  // Geofencing & Location States
  const [geofencingEnabled, setGeofencingEnabled] = useState<boolean>(true);
  const [geofenceRadius, setGeofenceRadius] = useState<number>(1.5); // in km
  const [baseLat, setBaseLat] = useState<number>(4.6097); // default center: Bogotá
  const [baseLng, setBaseLng] = useState<number>(-74.0817);
  const [userLat, setUserLat] = useState<number>(4.6097); // current simulated or real position
  const [userLng, setUserLng] = useState<number>(-74.0817);
  const [locationStatusText, setLocationStatusText] = useState<string>('Ubicación de simulación (Bogotá Centro)');
  const [locationLoading, setLocationLoading] = useState<boolean>(false);
  const [notifiedClinics, setNotifiedClinics] = useState<string[]>([]);

  // Haversine formula
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    return R * c; // Distance in km
  };

  // FCM state variables
  const [fcmEnabled, setFcmEnabled] = useState<boolean>(false);
  const [fcmToken, setFcmToken] = useState<string>('');
  const [fcmLoading, setFcmLoading] = useState<boolean>(false);
  const [isSimulated, setIsSimulated] = useState<boolean>(true);
  const [notificationStatus, setNotificationStatus] = useState<string>('');
  const [scheduledAlerts, setScheduledAlerts] = useState<Array<{ id: string, name: string, time: string, timerId: any }>>([]);

  // Check subscription status on mount/profile change
  useEffect(() => {
    const userId = auth.currentUser?.uid || 'guest';
    const isSim = localStorage.getItem(`fcm_token_simulated_${userId}`);
    const token = localStorage.getItem(`fcm_token_${userId}`) || isSim;
    const enabled = localStorage.getItem(`fcm_notifications_enabled_${userId}`) === 'true';

    if (enabled && token) {
      setFcmEnabled(true);
      setFcmToken(token || '');
      setIsSimulated(!!isSim);
    } else {
      setFcmEnabled(false);
      setFcmToken('');
    }
  }, [activeProfile]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      scheduledAlerts.forEach(item => clearTimeout(item.timerId));
    };
  }, [scheduledAlerts]);

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatusText('La geolocalización no está soportada por tu navegador.');
      return;
    }
    
    setLocationLoading(true);
    setLocationStatusText('Detectando tu posición actual...');
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setBaseLat(latitude);
        setBaseLng(longitude);
        setUserLat(latitude);
        setUserLng(longitude);
        setLocationLoading(false);
        setLocationStatusText(`¡Ubicación real sincronizada! (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`);
        triggerLocalPushNotification(
          '📍 Ubicación Sincronizada',
          `Clínicas de vacunación recalculadas con éxito.`
        );
      },
      (error) => {
        console.error("Error obteniendo ubicación:", error);
        setLocationLoading(false);
        let errorMsg = 'No se pudo acceder a tu ubicación.';
        if (error.code === error.PERMISSION_DENIED) {
          errorMsg = 'Permiso de ubicación denegado.';
        }
        setLocationStatusText(`${errorMsg} Usando ubicación de simulación.`);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  };

  const handleRegisterPush = async () => {
    setFcmLoading(true);
    setNotificationStatus('');
    try {
      const userId = auth.currentUser?.uid || null;
      const res = await registerPushNotifications(userId);
      if (res.success) {
        setFcmEnabled(true);
        setFcmToken(res.token || '');
        setIsSimulated(res.isSimulated);
        setNotificationStatus(
          res.isSimulated 
            ? '¡Suscripción simulada activa con éxito! Recibirás alertas interactivas en tiempo real.'
            : '¡Suscripción real FCM activa con éxito! Las notificaciones nativas están habilitadas.'
        );
      } else {
        setNotificationStatus(`No se pudo activar: ${res.error}`);
      }
    } catch (e: any) {
      setNotificationStatus(`Error: ${e.message}`);
    } finally {
      setFcmLoading(false);
    }
  };

  const triggerInstantAlert = (vaccine: Vaccine) => {
    const title = `🚨 Recordatorio: Vacuna de ${activeProfile?.name || 'tu hijo'}`;
    const body = `Es momento de aplicar la dosis de ${vaccine.name} (${vaccine.dose}) recomendada para la edad de ${vaccine.ageText}. Protege contra: ${vaccine.disease}.`;
    triggerLocalPushNotification(title, body);
  };

  const scheduleAlertWithTimer = (vaccine: Vaccine) => {
    const title = `🔔 Alerta de Vacunación FCM: ${activeProfile?.name || 'Vacunas'}`;
    const body = `Recordatorio urgente de vacuna: Se sugiere aplicar ${vaccine.name} (${vaccine.dose}). Prevención contra: ${vaccine.disease}.`;
    
    triggerLocalPushNotification(
      '📅 Alerta Programada', 
      `El aviso para la vacuna "${vaccine.name}" se disparará en 10 segundos. ¡Minimiza la pestaña o mantente atento!`
    );

    const timerId = setTimeout(() => {
      triggerLocalPushNotification(title, body);
      setScheduledAlerts(prev => prev.filter(item => item.id !== vaccine.id));
    }, 10000);

    const newAlert = {
      id: vaccine.id,
      name: vaccine.name,
      time: new Date(Date.now() + 10000).toLocaleTimeString(),
      timerId
    };

    setScheduledAlerts(prev => [...prev.filter(item => item.id !== vaccine.id), newAlert]);
  };

  const cancelScheduledAlert = (id: string) => {
    const found = scheduledAlerts.find(item => item.id === id);
    if (found) {
      clearTimeout(found.timerId);
      setScheduledAlerts(prev => prev.filter(item => item.id !== id));
      triggerLocalPushNotification('❌ Alerta Cancelada', 'El aviso de vacuna programado ha sido cancelado.');
    }
  };

  const getUpcomingVaccines = () => {
    if (!activeProfile) return [];
    
    // Calculate child's current age in months
    const birthDate = new Date(activeProfile.birthDate);
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
    const currentAgeMonths = (years * 12) + months;

    // Filter DEFAULT_VACCINES to get pending ones matching or exceeding current age, up to 3 points
    return DEFAULT_VACCINES
      .filter(v => v.ageMonths >= currentAgeMonths && !completedIds.includes(v.id))
      .slice(0, 3);
  };

  const upcomingVaccines = getUpcomingVaccines();

  // Geofencing Auto Trigger Effect (Edge detection to prevent alert spam)
  useEffect(() => {
    if (!geofencingEnabled || upcomingVaccines.length === 0) return;

    const clinics = CLINIC_TEMPLATES.map(c => {
      const lat = baseLat + c.latOffset;
      const lng = baseLng + c.lngOffset;
      const dist = calculateDistance(userLat, userLng, lat, lng);
      return { ...c, distance: dist };
    });

    setNotifiedClinics(prev => {
      let changed = false;
      const updated = [...prev];

      clinics.forEach(clinic => {
        const isInside = clinic.distance <= geofenceRadius;
        const wasNotified = prev.includes(clinic.id);

        if (isInside && !wasNotified) {
          updated.push(clinic.id);
          changed = true;

          const vaccineName = upcomingVaccines[0].name;
          const childName = activeProfile ? activeProfile.name : "tu hijo";
          const title = `📍 ¡Geocerca Activa: Clínica de Vacunación!`;
          const body = `Estás a ${clinic.distance.toFixed(2)} km de "${clinic.name}". Aprovecha esta cercanía para aplicar la vacuna "${vaccineName}" (${upcomingVaccines[0].dose}) pendiente para ${childName}.`;
          triggerLocalPushNotification(title, body);
        } else if (!isInside && wasNotified) {
          const index = updated.indexOf(clinic.id);
          if (index > -1) {
            updated.splice(index, 1);
            changed = true;
          }
        }
      });

      return changed ? updated : prev;
    });
  }, [userLat, userLng, geofenceRadius, geofencingEnabled, upcomingVaccines, baseLat, baseLng]);

  // Load completed vaccines for the active child profile
  useEffect(() => {
    if (activeProfile) {
      const stored = localStorage.getItem(`vaccines_${activeProfile.id}`);
      if (stored) {
        try {
          setCompletedIds(JSON.parse(stored));
        } catch {
          setCompletedIds([]);
        }
      } else {
        setCompletedIds([]);
      }
    } else {
      // General demo tracker fallback
      const storedDemo = localStorage.getItem('vaccines_demo');
      if (storedDemo) {
        try {
          setCompletedIds(JSON.parse(storedDemo));
        } catch {
          setCompletedIds([]);
        }
      } else {
        setCompletedIds([]);
      }
    }
  }, [activeProfile]);

  const toggleVaccine = (vaccineId: string) => {
    let updated: string[];
    if (completedIds.includes(vaccineId)) {
      updated = completedIds.filter(id => id !== vaccineId);
    } else {
      updated = [...completedIds, vaccineId];
    }

    setCompletedIds(updated);

    if (activeProfile) {
      localStorage.setItem(`vaccines_${activeProfile.id}`, JSON.stringify(updated));
    } else {
      localStorage.setItem('vaccines_demo', JSON.stringify(updated));
    }
  };

  const getFilteredVaccines = () => {
    if (filterAge === 'todos') return DEFAULT_VACCINES;
    if (filterAge === 'bebe') return DEFAULT_VACCINES.filter(v => v.ageMonths <= 12);
    if (filterAge === 'infante') return DEFAULT_VACCINES.filter(v => v.ageMonths > 12 && v.ageMonths <= 18);
    return DEFAULT_VACCINES.filter(v => v.ageMonths > 18);
  };

  const filteredVaccines = getFilteredVaccines();
  const completionPercentage = DEFAULT_VACCINES.length > 0 
    ? Math.round((completedIds.length / DEFAULT_VACCINES.length) * 100) 
    : 0;

  return (
    <div id="vaccine-tracker" className="space-y-6 max-w-4xl mx-auto">
      {/* Header text */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
          Calendario Nacional de Vacunación
        </h2>
        <p className="text-slate-500 text-xs md:text-sm max-w-xl mx-auto leading-relaxed">
          {activeProfile 
            ? `Lleva el control exacto de las dosis aplicadas a tu hijo/a **${activeProfile.name}**.`
            : "Registro interactivo de vacunación de 0 a 10 años. Selecciona el perfil de tu hijo para guardar los datos de forma permanente."}
        </p>
      </div>

      {/* Progress metrics and stats */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-5">
        <div className="space-y-2 text-center sm:text-left">
          <div className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
            <Trophy className="w-3.5 h-3.5" /> Esquema de Vacunas
          </div>
          <h3 className="font-extrabold text-slate-900 text-sm md:text-base">
            Progreso de {activeProfile ? activeProfile.name : "Invitado"}
          </h3>
          <p className="text-xs text-slate-600 leading-normal">
            Has completado <strong>{completedIds.length}</strong> de las <strong>{DEFAULT_VACCINES.length}</strong> dosis del esquema sugerido.
          </p>
        </div>

        {/* Circular/Linear progress display */}
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="w-full sm:w-40 bg-slate-200/60 rounded-full h-3 overflow-hidden border border-slate-300/30">
            <div 
              style={{ width: `${completionPercentage}%` }}
              className="bg-amber-500 h-full rounded-full transition-all duration-500" 
            />
          </div>
          <span className="font-black text-amber-600 text-lg md:text-xl shrink-0">{completionPercentage}%</span>
        </div>
      </div>

      {/* FCM & Vaccine Notifications Panel */}
      <div id="fcm-control-center" className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-5">
          <div className="space-y-1">
            <h3 className="text-sm md:text-base font-extrabold text-slate-900 flex items-center gap-2">
              <BellRing className="w-4.5 h-4.5 text-amber-500 animate-pulse animate-duration-1000" />
              Notificaciones Push en Tiempo Real (FCM)
            </h3>
            <p className="text-xs text-slate-500 leading-normal">
              Recibe avisos automáticos e interactivos sobre las próximas dosis e inmunización pediátrica.
            </p>
          </div>

          <button
            onClick={handleRegisterPush}
            disabled={fcmLoading}
            className={`w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              fcmEnabled 
                ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' 
                : 'bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-sm shadow-amber-500/10 font-black'
            }`}
          >
            {fcmLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Activando...</span>
              </>
            ) : fcmEnabled ? (
              <>
                <BellOff className="w-4 h-4 text-rose-500 animate-pulse" />
                <span>Reiniciar Registro</span>
              </>
            ) : (
              <>
                <Bell className="w-4 h-4 text-slate-950" />
                <span>Activar Alertas Push</span>
              </>
            )}
          </button>
        </div>

        {/* Status messages */}
        {notificationStatus && (
          <div className="p-3 bg-emerald-50 border border-emerald-100/60 rounded-xl text-[11px] text-emerald-800 font-bold flex items-start gap-2.5 animate-fadeIn">
            <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>{notificationStatus}</span>
          </div>
        )}

        {/* Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
            <span className="text-[9px] text-slate-400 uppercase font-black tracking-wider block">Estado de Suscripción</span>
            <div className="flex items-center gap-1.5 pt-0.5">
              <span className={`w-2 h-2 rounded-full ${fcmEnabled ? 'bg-emerald-500' : 'bg-slate-300'}`} />
              <span className="text-xs font-black text-slate-800">
                {fcmEnabled ? 'Registrado' : 'Inactivo'}
              </span>
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
            <span className="text-[9px] text-slate-400 uppercase font-black tracking-wider block">Canal FCM</span>
            <span className="text-xs font-bold text-slate-800 block pt-0.5">
              {fcmEnabled ? (isSimulated ? 'Simulador Inteligente' : 'Firebase Cloud Messaging') : 'Inactivo'}
            </span>
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl space-y-1 overflow-hidden">
            <span className="text-[9px] text-slate-400 uppercase font-black tracking-wider block">Token ID</span>
            <span className="text-xs font-mono text-slate-500 block truncate pt-0.5" title={fcmToken}>
              {fcmToken ? `${fcmToken.slice(0, 12)}...${fcmToken.slice(-8)}` : 'Sin registrar'}
            </span>
          </div>
        </div>

        {/* Upcoming alerts scheduler */}
        {activeProfile ? (
          <div className="space-y-4 pt-1">
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-500" />
              <h4 className="text-[10px] md:text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                Próximas vacunas sugeridas para {activeProfile.name}
              </h4>
            </div>

            {upcomingVaccines.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {upcomingVaccines.map((v) => {
                  const isScheduled = scheduledAlerts.some(item => item.id === v.id);
                  return (
                    <div 
                      key={v.id} 
                      className="bg-slate-50 border border-slate-100 hover:border-slate-200 rounded-xl p-4 flex flex-col justify-between space-y-3.5 transition-all"
                    >
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-start gap-1">
                          <span className="text-[9px] bg-slate-200/70 text-slate-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0">
                            {v.dose}
                          </span>
                          <span className="text-[10px] font-black text-amber-600 shrink-0">
                            {v.ageText}
                          </span>
                        </div>
                        <h5 className="text-xs font-black text-slate-800 tracking-tight leading-tight">
                          {v.name}
                        </h5>
                        <p className="text-[10px] text-slate-500 leading-relaxed line-clamp-2">
                          {v.description}
                        </p>
                      </div>

                      <div className="space-y-1.5 pt-2.5 border-t border-slate-200/50">
                        {isScheduled ? (
                          <div className="space-y-1.5">
                            <span className="text-[10px] text-amber-800 font-extrabold bg-amber-50 border border-amber-200/50 rounded-lg p-2.5 block text-center animate-pulse">
                              ⏰ Alerta FCM: {scheduledAlerts.find(item => item.id === v.id)?.time}
                            </span>
                            <button
                              onClick={() => cancelScheduledAlert(v.id)}
                              className="w-full py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 text-[10px] font-bold rounded-lg transition-all cursor-pointer"
                            >
                              Cancelar Recordatorio
                            </button>
                          </div>
                        ) : (
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => triggerInstantAlert(v)}
                              disabled={!fcmEnabled}
                              className="flex-1 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                              title="Recibe una notificación push de inmediato"
                            >
                              Probar Ahora
                            </button>
                            <button
                              onClick={() => scheduleAlertWithTimer(v)}
                              disabled={!fcmEnabled}
                              className="flex-1 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-[10px] font-black rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                              title="Recibe la notificación en 10 segundos en segundo plano"
                            >
                              Aviso 10s
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 bg-emerald-50/20 border border-emerald-100/50 rounded-xl flex items-center gap-3">
                <ShieldCheck className="w-8 h-8 text-emerald-500 shrink-0" />
                <div>
                  <p className="text-xs font-extrabold text-slate-800">¡Al día en su esquema de vacunación!</p>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    {activeProfile.name} ha completado todas las vacunas sugeridas para su rango de edad actual.
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 bg-amber-50/25 border border-amber-100/60 rounded-xl flex gap-3 text-xs text-slate-600">
            <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <strong>Para programar alertas personalizadas:</strong> Selecciona un perfil de hijo en la parte superior para que calculemos de forma exacta sus dosis sugeridas pendientes y programemos notificaciones a su medida.
            </div>
          </div>
        )}
      </div>

      {/* Geofencing & Near Clinics Panel */}
      <div id="geofencing-control-center" className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-5">
          <div className="space-y-1">
            <h3 className="text-sm md:text-base font-extrabold text-slate-900 flex items-center gap-2">
              <MapPin className="w-4.5 h-4.5 text-rose-500" />
              Rastreador Geográfico de Clínicas de Vacunación (Geofencing)
            </h3>
            <p className="text-xs text-slate-500 leading-normal">
              Notificaciones automatizadas al pasar cerca de clínicas pediátricas cuando se aproximen las vacunas de {activeProfile ? activeProfile.name : 'tu hijo'}.
            </p>
          </div>

          <button
            onClick={() => setGeofencingEnabled(!geofencingEnabled)}
            className={`w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              geofencingEnabled 
                ? 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100' 
                : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200'
            }`}
          >
            <Radio className={`w-4 h-4 ${geofencingEnabled ? 'text-rose-600 animate-pulse' : 'text-slate-400'}`} />
            <span>{geofencingEnabled ? 'Geocercas Activas' : 'Geocercas Apagadas'}</span>
          </button>
        </div>

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Column 1: Config, Locator & SVG Radar Widget */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-5 bg-slate-50 border border-slate-100 rounded-xl p-4">
            
            {/* Geofence Parameters */}
            <div className="space-y-3.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-700">Radio de Alerta:</span>
                <span className="font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-100">
                  {geofenceRadius.toFixed(1)} km
                </span>
              </div>
              <input 
                type="range" 
                min="0.5" 
                max="5.0" 
                step="0.5" 
                value={geofenceRadius} 
                onChange={(e) => setGeofenceRadius(parseFloat(e.target.value))}
                className="w-full accent-rose-500 cursor-pointer h-1.5 bg-slate-200 rounded-lg appearance-none"
              />
              
              {/* Geolocation Button */}
              <div className="pt-1.5 space-y-2">
                <button
                  type="button"
                  onClick={handleGetCurrentLocation}
                  disabled={locationLoading}
                  className="w-full py-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 flex items-center justify-center gap-2 transition-all disabled:opacity-75 cursor-pointer"
                >
                  <Locate className={`w-3.5 h-3.5 text-slate-500 ${locationLoading ? 'animate-spin text-rose-500' : ''}`} />
                  <span>{locationLoading ? 'Detectando...' : 'Detectar mi Ubicación Real (GPS)'}</span>
                </button>
                <div className="text-[10px] text-center font-semibold text-slate-500 truncate" title={locationStatusText}>
                  📍 {locationStatusText}
                </div>
              </div>
            </div>

            {/* Radar Animation SVG */}
            <div className="relative flex flex-col items-center justify-center py-4 bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
              
              {/* Rotating Radar Line Sweep Overlay */}
              <div 
                className="absolute w-44 h-44 rounded-full pointer-events-none opacity-20 border border-rose-500/10"
                style={{
                  background: 'conic-gradient(from 0deg, rgba(244, 63, 94, 0.2) 0deg, rgba(244, 63, 94, 0) 90deg)',
                  animation: 'spin 4s linear infinite',
                }}
              />

              {/* SVG Canvas */}
              <svg width="200" height="200" className="relative z-10 overflow-hidden">
                {/* Concentric radar circles */}
                <circle cx="100" cy="100" r="80" className="fill-none stroke-rose-500/10 stroke-[0.5]" strokeDasharray="3,3" />
                <circle cx="100" cy="100" r="55" className="fill-none stroke-rose-500/10 stroke-[0.5]" />
                <circle cx="100" cy="100" r="30" className="fill-none stroke-rose-500/10 stroke-[0.5]" />
                
                {/* Radar Grid Axes */}
                <line x1="100" y1="20" x2="100" y2="180" className="stroke-rose-500/10 stroke-[0.5]" />
                <line x1="20" y1="100" x2="180" y2="100" className="stroke-rose-500/10 stroke-[0.5]" />

                {/* Shaded Geofence Radius Circle (dynamic) */}
                <circle 
                  cx="100" 
                  cy="100" 
                  r={Math.min(80, (geofenceRadius / 3.5) * 80)} 
                  className="fill-rose-500/5 stroke-rose-500/30 stroke-[1.5] transition-all duration-300" 
                />

                {/* Plot Clinics relative to user center */}
                {CLINIC_TEMPLATES.map(c => {
                  const lat = baseLat + c.latOffset;
                  const lng = baseLng + c.lngOffset;
                  const distance = calculateDistance(userLat, userLng, lat, lng);
                  
                  // Cartesian relative km offsets
                  const dx = lng - userLng;
                  const dy = lat - userLat;
                  const distanceX = dx * 111 * Math.cos(userLat * Math.PI / 180);
                  const distanceY = dy * 111;
                  
                  // Map to SVG coordinates (200x200 canvas, center 100,100, max range is 3.5 km)
                  const pxPerKm = 80 / 3.5;
                  const x = 100 + distanceX * pxPerKm;
                  const y = 100 - distanceY * pxPerKm;
                  const isInside = distance <= geofenceRadius;

                  // Keep dot within canvas boundaries
                  const cx = Math.max(10, Math.min(190, x));
                  const cy = Math.max(10, Math.min(190, y));

                  return (
                    <g key={c.id}>
                      {/* Inner clinic dot */}
                      <circle 
                        cx={cx} 
                        cy={cy} 
                        r={isInside ? "6.5" : "5"} 
                        className={`transition-all duration-300 ${
                          isInside 
                            ? 'fill-rose-500 stroke-white stroke-2 animate-pulse' 
                            : 'fill-amber-500 stroke-white'
                        }`}
                      />
                      <circle 
                        cx={cx} 
                        cy={cy} 
                        r="3.5" 
                        className={`transition-all duration-300 ${
                          isInside ? 'fill-rose-600' : 'fill-amber-600'
                        }`}
                      />
                      
                      {/* Tiny Clinic Index Tag */}
                      <text 
                        x={cx} 
                        y={cy - 9} 
                        textAnchor="middle" 
                        className="text-[8px] font-extrabold fill-slate-300 select-none"
                      >
                        {c.id === 'clinic_amapola' ? 'Amapola' : c.id === 'clinic_sanjose' ? 'San José' : c.id === 'clinic_parque' ? 'Parque' : 'N. Jesús'}
                      </text>
                    </g>
                  );
                })}

                {/* Pulsating user center dot */}
                <circle cx="100" cy="100" r="10" className="fill-emerald-500/20 stroke-emerald-500/30 stroke-[1] animate-ping" />
                <circle cx="100" cy="100" r="4.5" className="fill-emerald-400 stroke-slate-900 stroke-2" />
              </svg>
              <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest pt-2">Radar de Cobertura</div>
            </div>

            {/* Manual coordinate simulator buttons */}
            <div className="space-y-2">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block text-center">
                Simulador de Desplazamiento
              </span>
              <div className="grid grid-cols-3 gap-1.5 max-w-[210px] mx-auto">
                <div />
                <button
                  type="button"
                  onClick={() => setUserLat(prev => prev + 0.0015)}
                  className="py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold flex items-center justify-center cursor-pointer"
                  title="Mover al Norte (aprox. 165 metros)"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <div />

                <button
                  type="button"
                  onClick={() => setUserLng(prev => prev - 0.0015)}
                  className="py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold flex items-center justify-center cursor-pointer"
                  title="Mover al Oeste (aprox. 165 metros)"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setUserLat(baseLat);
                    setUserLng(baseLng);
                  }}
                  className="py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center justify-center cursor-pointer"
                  title="Regresar a casa"
                >
                  Inicio
                </button>
                <button
                  type="button"
                  onClick={() => setUserLng(prev => prev + 0.0015)}
                  className="py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold flex items-center justify-center cursor-pointer"
                  title="Mover al Este (aprox. 165 metros)"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <div />
                <button
                  type="button"
                  onClick={() => setUserLat(prev => prev - 0.0015)}
                  className="py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold flex items-center justify-center cursor-pointer"
                  title="Mover al Sur (aprox. 165 metros)"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
                <div />
              </div>

              {/* Direct Teleport Buttons */}
              <div className="grid grid-cols-2 gap-1.5 pt-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setUserLat(baseLat + 0.0053);
                    setUserLng(baseLng + 0.0060);
                  }}
                  className="py-2 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-black uppercase rounded-lg tracking-wider text-center transition-all cursor-pointer"
                >
                  Clínica Amapola (Dentro)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setUserLat(baseLat - 0.0132);
                    setUserLng(baseLng + 0.0118);
                  }}
                  className="py-2 bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-black uppercase rounded-lg tracking-wider text-center transition-all cursor-pointer"
                >
                  Hosp. Niño Jesús (Dentro)
                </button>
              </div>
            </div>

          </div>

          {/* Column 2: Clinics List & Approaching Vaccine Reminder */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* Context Header: Approaching Vaccines Reminder */}
            {upcomingVaccines.length > 0 ? (
              <div className="bg-amber-50 border border-amber-200/60 rounded-xl p-3.5 space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-600 animate-pulse" />
                  <span className="text-[10px] font-extrabold text-amber-800 uppercase tracking-wider">
                    Siguiente Vacuna Pendiente para {activeProfile ? activeProfile.name : 'tu hijo'}
                  </span>
                </div>
                <h4 className="text-xs font-black text-slate-800">
                  {upcomingVaccines[0].name} ({upcomingVaccines[0].dose}) — Sugerida a los {upcomingVaccines[0].ageText}
                </h4>
                <p className="text-[11px] text-slate-600 leading-normal">
                  Esta dosis está pendiente. Al pasar cerca de cualquiera de las clínicas autorizadas abajo, te notificaremos para que puedas aprovechar tu recorrido y aplicarla.
                </p>
              </div>
            ) : (
              <div className="bg-emerald-50 border border-emerald-200/50 rounded-xl p-3.5 text-xs text-emerald-800 font-bold flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  No hay vacunas sugeridas pendientes. Tu esquema está al día. 
                  <p className="font-semibold text-slate-600 mt-1">
                    Puedes desmarcar alguna dosis del carné abajo para simular una dosis pendiente.
                  </p>
                </div>
              </div>
            )}

            {/* Clinics List */}
            <div className="space-y-2.5 overflow-y-auto max-h-[360px] pr-1">
              {CLINIC_TEMPLATES.map(c => {
                const lat = baseLat + c.latOffset;
                const lng = baseLng + c.lngOffset;
                const distance = calculateDistance(userLat, userLng, lat, lng);
                const isInside = distance <= geofenceRadius;
                const isClose = !isInside && distance <= geofenceRadius * 1.5;

                return (
                  <div 
                    key={c.id} 
                    className={`border rounded-xl p-3.5 space-y-2.5 transition-all bg-white shadow-sm ${
                      isInside 
                        ? 'border-rose-500 bg-rose-50/5 ring-1 ring-rose-500/10' 
                        : isClose 
                        ? 'border-amber-300 bg-amber-50/5' 
                        : 'border-slate-100 hover:border-slate-200'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="space-y-0.5">
                        <h4 className="text-xs font-black text-slate-900 tracking-tight leading-tight uppercase">
                          {c.name}
                        </h4>
                        <p className="text-[10px] text-slate-500 leading-none">
                          {c.address}
                        </p>
                      </div>
                      
                      {/* Distance & Status badge */}
                      <div className="text-right shrink-0">
                        <span className="text-xs font-black text-slate-800 block">
                          {distance.toFixed(2)} km
                        </span>
                        {isInside ? (
                          <span className="inline-block text-[8px] font-black bg-rose-600 text-white px-1.5 py-0.5 rounded uppercase tracking-wider mt-0.5 animate-pulse">
                            Dentro de Geocerca 🚨
                          </span>
                        ) : isClose ? (
                          <span className="inline-block text-[8px] font-black bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded uppercase tracking-wider mt-0.5">
                            Rango Cercano ⚠️
                          </span>
                        ) : (
                          <span className="inline-block text-[8px] font-bold bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded uppercase tracking-wider mt-0.5">
                            Fuera de Rango
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Operational Details */}
                    <div className="flex flex-wrap justify-between gap-x-4 gap-y-1 text-[10px] font-semibold text-slate-500 border-t border-slate-100 pt-2">
                      <span>🕒 {c.hours}</span>
                      <span>📞 {c.phone}</span>
                    </div>

                    {/* Alerta de Oportunidad */}
                    {isInside && upcomingVaccines.length > 0 && (
                      <div className="bg-rose-50 border border-rose-100 rounded-lg p-2.5 text-[10px] text-rose-900 font-bold flex items-center justify-between gap-2 animate-fadeIn">
                        <span>
                          💡 <strong>¡Aprovecha hoy!</strong> Estás dentro del rango. Tienes pendiente la vacuna: <em>{upcomingVaccines[0].name}</em>.
                        </span>
                        <a 
                          href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`}
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="bg-rose-600 hover:bg-rose-700 text-white px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-wider transition-all"
                        >
                          Cómo llegar ➔
                        </a>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

          </div>
        </div>
      </div>

      {/* Vaccine Age Category Filters */}
      <div className="flex border border-slate-200 rounded-xl p-1 bg-slate-50 gap-1 text-xs">
        <button
          onClick={() => setFilterAge('todos')}
          className={`flex-1 py-2 text-center rounded-lg font-bold transition-all ${
            filterAge === 'todos' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Todo el esquema
        </button>
        <button
          onClick={() => setFilterAge('bebe')}
          className={`flex-1 py-2 text-center rounded-lg font-bold transition-all ${
            filterAge === 'bebe' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Lactante (0 a 12 meses)
        </button>
        <button
          onClick={() => setFilterAge('infante')}
          className={`flex-1 py-2 text-center rounded-lg font-bold transition-all ${
            filterAge === 'infante' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          De 1 a 2 años
        </button>
        <button
          onClick={() => setFilterAge('escolar')}
          className={`flex-1 py-2 text-center rounded-lg font-bold transition-all ${
            filterAge === 'escolar' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          De 5 a 10 años
        </button>
      </div>

      {/* Vaccine Timeline & List */}
      <div className="space-y-3">
        {filteredVaccines.map((v) => {
          const isDone = completedIds.includes(v.id);
          return (
            <div
              key={v.id}
              onClick={() => toggleVaccine(v.id)}
              className={`border rounded-2xl p-4 md:p-5 bg-white flex items-start gap-4 shadow-sm hover:shadow transition-all cursor-pointer ${
                isDone ? 'border-emerald-200 bg-emerald-50/5' : 'border-slate-100 hover:border-slate-200'
              }`}
            >
              {/* Checked Indicator */}
              <div className="pt-1">
                {isDone ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 fill-emerald-50" />
                ) : (
                  <Circle className="w-6 h-6 text-slate-300 hover:text-emerald-500 transition-colors" />
                )}
              </div>

              {/* Vaccine Text specifications */}
              <div className="flex-1 space-y-1">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div className="flex items-center gap-2">
                    <h4 className={`font-extrabold text-xs md:text-sm tracking-tight ${isDone ? 'text-emerald-800 line-through' : 'text-slate-900'}`}>
                      {v.name}
                    </h4>
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">
                      {v.dose}
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-amber-600 sm:text-right">
                    {v.ageText}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">
                  Enfermedad: {v.disease}
                </p>
                <p className="text-[11px] text-slate-600 leading-relaxed pt-1">
                  {v.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Legal Reference & Instruction Badge */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex gap-3 text-xs text-slate-500 leading-relaxed">
        <Info className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <div>
          <strong>Nota de control médico:</strong> Recuerda llevar el carné de vacunación físico oficial a cada cita médica. Este rastreador digital es únicamente para el control y recordatorios personales de los padres y madres primerizos. Las pautas de vacunación están homologadas con el Calendario de la OMS / Programa Ampliado de Inmunizaciones (PAI).
        </div>
      </div>
    </div>
  );
}
