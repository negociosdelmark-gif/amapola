import React, { useState, useEffect } from 'react';
import { 
  Baby, ShieldAlert, Activity, Thermometer, CalendarDays, 
  User, Star, Menu, X, Check, Heart, ShieldCheck, Cloud, CloudOff, RefreshCw,
  LayoutDashboard, BellRing
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import HeroSection from './components/HeroSection';
import EmergencyPanel from './components/EmergencyPanel';
import SymptomChecker from './components/SymptomChecker';
import EmergencyLibrary from './components/EmergencyLibrary';
import VaccineTracker from './components/VaccineTracker';
import ProfileManager from './components/ProfileManager';
import PremiumSimulation from './components/PremiumSimulation';
import Dashboard from './components/Dashboard';
import { ChildProfile, SymptomAssessment } from './types';

// Firebase imports
import { auth, db, googleProvider } from './lib/firebase';
import { signInWithPopup, signOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { collection, doc, setDoc, deleteDoc, getDocs } from 'firebase/firestore';

export default function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'emergency' | 'checker' | 'library' | 'vaccine' | 'family' | 'dashboard'>('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Persistent core states
  const [freeAssessmentsLeft, setFreeAssessmentsLeft] = useState<number>(3);
  const [isPremium, setIsPremium] = useState<boolean>(false);
  const [profiles, setProfiles] = useState<ChildProfile[]>([]);
  const [activeProfile, setActiveProfile] = useState<ChildProfile | null>(null);
  const [assessments, setAssessments] = useState<SymptomAssessment[]>([]);

  // Firebase auth & cloud sync states
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [authExecuting, setAuthExecuting] = useState<boolean>(false);
  const [authError, setAuthError] = useState<{ message: string; code?: string } | null>(null);

  // FCM simulated push notification state
  const [activeNotification, setActiveNotification] = useState<{ title: string; body: string; timestamp: string } | null>(null);

  // Setup push notification listener
  useEffect(() => {
    const handlePushEvent = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        setActiveNotification(customEvent.detail);
      }
    };

    window.addEventListener('app-push-notification', handlePushEvent);
    return () => {
      window.removeEventListener('app-push-notification', handlePushEvent);
    };
  }, []);

  // Auto dismiss notification after 8 seconds
  useEffect(() => {
    if (activeNotification) {
      const timer = setTimeout(() => {
        setActiveNotification(null);
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [activeNotification]);

  // Synchronise local storage data with Firestore securely
  const syncUserData = async (currentUser: FirebaseUser) => {
    if (!navigator.onLine) {
      console.warn("Dispositivo sin conexión. Sincronización en la nube pospuesta.");
      return;
    }
    setIsSyncing(true);
    try {
      // 1. Sync child profiles with Firestore
      const profilesRef = collection(db, 'users', currentUser.uid, 'profiles');
      const profilesSnapshot = await getDocs(profilesRef);
      const cloudProfiles = profilesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ChildProfile[];
      
      let mergedProfiles = [...cloudProfiles];
      const localProfiles = JSON.parse(localStorage.getItem('angelito_profiles') || '[]');
      
      // Back up any missing local profiles to Firestore
      for (const local of localProfiles) {
        if (!cloudProfiles.some(p => p.id === local.id)) {
          await setDoc(doc(profilesRef, local.id), local);
          mergedProfiles.push(local);
        }
      }
      
      setProfiles(mergedProfiles);
      localStorage.setItem('angelito_profiles', JSON.stringify(mergedProfiles));
      if (mergedProfiles.length > 0) {
        setActiveProfile(mergedProfiles[0]);
      }

      // 2. Sync assessments with Firestore
      const assessRef = collection(db, 'users', currentUser.uid, 'assessments');
      const assessSnapshot = await getDocs(assessRef);
      const cloudAssess = assessSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as SymptomAssessment[];

      let mergedAssess = [...cloudAssess];
      const localAssess = JSON.parse(localStorage.getItem('angelito_assessments') || '[]');
      
      // Back up any missing local assessments to Firestore
      for (const local of localAssess) {
        if (!cloudAssess.some(a => a.id === local.id)) {
          await setDoc(doc(assessRef, local.id), local);
          mergedAssess.push(local);
        }
      }
      
      // Sort assessments desc by ID or Date
      mergedAssess.sort((a, b) => b.id.localeCompare(a.id));
      setAssessments(mergedAssess);
      localStorage.setItem('angelito_assessments', JSON.stringify(mergedAssess));

    } catch (err) {
      console.error("Error al sincronizar datos con Firestore:", err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Monitor connectivity status for mobile environment resilience
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (auth.currentUser) {
        syncUserData(auth.currentUser);
      }
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load local state & subscribe to Firebase auth
  useEffect(() => {
    // Load local counts first (for quick offline rendering)
    const storedFree = localStorage.getItem('angelito_free_checks');
    if (storedFree !== null) {
      setFreeAssessmentsLeft(parseInt(storedFree));
    } else {
      localStorage.setItem('angelito_free_checks', '3');
    }

    const storedPremium = localStorage.getItem('angelito_premium');
    if (storedPremium === 'true') {
      setIsPremium(true);
    }

    const storedProfiles = localStorage.getItem('angelito_profiles');
    if (storedProfiles) {
      try {
        const parsed = JSON.parse(storedProfiles);
        setProfiles(parsed);
        if (parsed.length > 0) {
          setActiveProfile(parsed[0]);
        }
      } catch {
        setProfiles([]);
      }
    } else {
      // Pre-populate with 1 mock profile so the app looks professional and ready to use
      const initialMock: ChildProfile[] = [
        {
          id: "p_mateo",
          name: "Mateo",
          birthDate: "2024-03-15",
          gender: "M",
          weightKg: 12.5,
          allergies: "Nueces, Polvo",
          bloodType: "O+",
          chronicConditions: "Asma estacional"
        }
      ];
      setProfiles(initialMock);
      setActiveProfile(initialMock[0]);
      localStorage.setItem('angelito_profiles', JSON.stringify(initialMock));
    }

    const storedAssess = localStorage.getItem('angelito_assessments');
    if (storedAssess) {
      try {
        setAssessments(JSON.parse(storedAssess));
      } catch {
        setAssessments([]);
      }
    }

    // Safety timeout to prevent infinite loading screen on unstable networks
    const safetyTimeout = setTimeout(() => {
      setAuthLoading(false);
    }, 4000);

    // Subscribe to Firebase Auth
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      clearTimeout(safetyTimeout);
      setUser(currentUser);
      if (currentUser) {
        await syncUserData(currentUser);
      }
      setAuthLoading(false);
    });

    return () => {
      clearTimeout(safetyTimeout);
      unsubscribe();
    };
  }, []);

  // Login handler
  const handleLogin = async () => {
    if (!navigator.onLine) {
      setAuthError({
        message: "Estás sin conexión a Internet. Por favor, conéctate a una red móvil o Wi-Fi para iniciar sesión con Google.",
        code: "auth/network-request-failed"
      });
      return;
    }

    setAuthExecuting(true);
    setAuthError(null);

    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error("Authentication with Google failed:", err);
      let userFriendlyMessage = "No se pudo iniciar sesión con Google. Inténtalo de nuevo.";
      
      if (err.code === 'auth/popup-blocked') {
        userFriendlyMessage = "El navegador bloqueó la ventana emergente de inicio de sesión de Google. Por favor, permite las ventanas emergentes en tu navegador móvil (Safari/Chrome) para Amapola e inténtalo de nuevo.";
      } else if (err.code === 'auth/popup-closed-by-user') {
        userFriendlyMessage = "Se cerró la ventana de inicio de sesión de Google antes de completar el proceso.";
      } else if (err.code === 'auth/network-request-failed' || err.message?.includes('network')) {
        userFriendlyMessage = "Error de red o conexión inestable. Por favor, verifica tu cobertura móvil o conexión Wi-Fi e inténtalo de nuevo.";
      } else if (err.code === 'auth/cancelled-popup-request') {
        userFriendlyMessage = "Se canceló el proceso de inicio de sesión actual debido a un intento simultáneo.";
      } else if (err.code) {
        userFriendlyMessage = `Error de autenticación (${err.code}): ${err.message}`;
      }
      
      setAuthError({
        message: userFriendlyMessage,
        code: err.code || "auth/unknown"
      });
    } finally {
      setAuthExecuting(false);
    }
  };

  // Logout handler
  const handleLogout = async () => {
    try {
      await signOut(auth);
      // Clear user state and reset local fallback profiles
      setUser(null);
      setAuthError(null);
      const storedProfiles = JSON.parse(localStorage.getItem('angelito_profiles') || '[]');
      setProfiles(storedProfiles);
      if (storedProfiles.length > 0) {
        setActiveProfile(storedProfiles[0]);
      } else {
        setActiveProfile(null);
      }
      setAssessments(JSON.parse(localStorage.getItem('angelito_assessments') || '[]'));
    } catch (err) {
      console.error("Sign out failed:", err);
    }
  };

  // Update free assessments count helper
  const handleDecrementFree = () => {
    if (isPremium) return;
    setFreeAssessmentsLeft(prev => {
      const next = Math.max(0, prev - 1);
      localStorage.setItem('angelito_free_checks', next.toString());
      return next;
    });
  };

  // Activate premium
  const handleActivatePremium = () => {
    setIsPremium(true);
    localStorage.setItem('angelito_premium', 'true');
  };

  // Add child profile
  const handleAddProfile = async (newProfile: ChildProfile) => {
    const updated = [...profiles, newProfile];
    setProfiles(updated);
    localStorage.setItem('angelito_profiles', JSON.stringify(updated));
    setActiveProfile(newProfile);

    if (user) {
      try {
        await setDoc(doc(db, 'users', user.uid, 'profiles', newProfile.id), newProfile);
      } catch (err) {
        console.error("Failed to backup child profile to firestore:", err);
      }
    }
  };

  // Delete child profile
  const handleDeleteProfile = async (id: string) => {
    const updated = profiles.filter(p => p.id !== id);
    setProfiles(updated);
    localStorage.setItem('angelito_profiles', JSON.stringify(updated));
    
    if (activeProfile?.id === id) {
      setActiveProfile(updated.length > 0 ? updated[0] : null);
    }

    if (user) {
      try {
        await deleteDoc(doc(db, 'users', user.uid, 'profiles', id));
      } catch (err) {
        console.error("Failed to delete child profile from firestore:", err);
      }
    }
  };

  // Save new symptom check
  const handleSaveAssessment = async (newAssess: SymptomAssessment) => {
    const updated = [newAssess, ...assessments];
    setAssessments(updated);
    localStorage.setItem('angelito_assessments', JSON.stringify(updated));

    if (user) {
      try {
        await setDoc(doc(db, 'users', user.uid, 'assessments', newAssess.id), newAssess);
      } catch (err) {
        console.error("Failed to backup symptom assessment to firestore:", err);
      }
    }
  };

  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (authLoading) {
    return (
      <div id="auth-loading-splash" className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 animate-fadeIn">
        <div className="text-center space-y-4 max-w-sm">
          <div className="relative inline-block">
            <div className="w-16 h-16 bg-emerald-500 text-white rounded-2xl flex items-center justify-center text-3xl shadow-md animate-pulse">
              👶
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-400 rounded-full border-2 border-white animate-ping" />
          </div>
          <div className="space-y-1">
            <h1 className="text-xl font-black text-slate-900 tracking-tight">Amapola</h1>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Cargando Guía Pediátrica...</p>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed font-semibold">
            Verificando sesión segura...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col font-sans text-slate-800">
      
      {/* Offline Status Alert Banner */}
      {!isOnline && (
        <div id="offline-warning-banner" className="bg-amber-500 text-slate-950 text-[11px] font-black uppercase tracking-wider py-2 px-4 text-center sticky top-[64px] z-30 shadow-md flex items-center justify-center gap-2 animate-fadeIn transition-all">
          <CloudOff className="w-4 h-4 text-slate-950 shrink-0" />
          <span>Modo Sin Conexión Activo. Tus datos se guardan de forma segura de manera local y se sincronizarán al recuperar señal.</span>
        </div>
      )}
      
      {/* PROFESSIONAL HIGH-CONTRAST HEADER */}
      <header className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-slate-100 z-40 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          
          {/* Logo brand */}
          <button 
            onClick={() => handleTabChange('home')}
            className="flex items-center gap-2 text-left cursor-pointer group"
          >
            <div className="w-10 h-10 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl flex items-center justify-center shadow-sm transition-colors text-xl">
              👶
            </div>
            <div>
              <span className="font-black text-slate-900 tracking-tight leading-none text-base block group-hover:text-emerald-600 transition-colors">
                Amapola
              </span>
              <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">
                Guía Pediátrica
              </span>
            </div>
          </button>

          {/* Desktop Navigation Menus */}
          <nav className="hidden md:flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide">
            <button
              onClick={() => handleTabChange('home')}
              className={`px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'home' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Inicio
            </button>
            <button
              onClick={() => handleTabChange('emergency')}
              className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-1 cursor-pointer ${
                activeTab === 'emergency' ? 'bg-rose-50 text-rose-600' : 'text-slate-500 hover:text-rose-600 hover:bg-rose-50/30'
              }`}
            >
              <ShieldAlert className="w-4 h-4" /> Emergencias
            </button>
            <button
              onClick={() => handleTabChange('checker')}
              className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-1 cursor-pointer ${
                activeTab === 'checker' ? 'bg-emerald-50 text-emerald-600' : 'text-slate-500 hover:text-emerald-600 hover:bg-emerald-50/30'
              }`}
            >
              <Activity className="w-4 h-4" /> Diagnóstico IA
            </button>
            <button
              onClick={() => handleTabChange('library')}
              className={`px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'library' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Manual Pediátrico
            </button>
            <button
              onClick={() => handleTabChange('vaccine')}
              className={`px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'vaccine' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Vacunas
            </button>
            <button
              onClick={() => handleTabChange('dashboard')}
              className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-1 cursor-pointer ${
                activeTab === 'dashboard' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" /> Dashboard
            </button>
            <button
              onClick={() => handleTabChange('family')}
              className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-1 cursor-pointer ${
                activeTab === 'family' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Mis Hijos
            </button>
          </nav>

          {/* User profile & premium trigger action buttons */}
          <div className="flex items-center gap-2">
            {/* Cloud Sync Status indicator */}
            {user ? (
              <div 
                className="hidden lg:flex items-center gap-1.5 text-slate-500 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-xl text-xs font-bold"
                title={`Sincronizado con Google: ${user.email}`}
              >
                {isSyncing ? (
                  <RefreshCw className="w-3.5 h-3.5 text-emerald-500 animate-spin" />
                ) : (
                  <Cloud className="w-3.5 h-3.5 text-emerald-500" />
                )}
                <span className="text-emerald-700">En la nube</span>
              </div>
            ) : (
              <button
                onClick={handleLogin}
                className="hidden lg:flex items-center gap-1.5 text-slate-500 hover:text-slate-800 bg-slate-50 border border-slate-200/50 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
                title="Sincroniza tus datos de forma segura en Firestore"
              >
                <CloudOff className="w-3.5 h-3.5 text-slate-400" />
                <span>Nube</span>
              </button>
            )}

            <button
              onClick={() => handleTabChange('family')}
              className="bg-slate-50 hover:bg-slate-100 text-slate-700 py-1.5 px-3 rounded-xl border border-slate-200/50 flex items-center gap-1.5 transition-colors text-xs font-bold cursor-pointer"
            >
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">
                {activeProfile ? activeProfile.name : "Invitado"}
              </span>
            </button>

            {isPremium ? (
              <div className="bg-emerald-500 text-slate-950 font-black text-[10px] px-2.5 py-1.5 rounded-xl uppercase flex items-center gap-1 tracking-wider shadow-sm">
                <ShieldCheck className="w-3.5 h-3.5 fill-current" /> Premium
              </div>
            ) : (
              <button
                onClick={() => handleTabChange('family')}
                className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-extrabold text-[10px] px-2.5 py-1.5 rounded-xl uppercase flex items-center gap-1 tracking-wider shadow-sm transition-colors cursor-pointer"
              >
                <Star className="w-3.5 h-3.5 fill-current" /> Ver Premium
              </button>
            )}

            {/* Mobile menu trigger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl border border-slate-200/50 transition-colors cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* MOBILE COLLAPSED MENUS */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-100 p-4 space-y-1 text-sm font-bold uppercase tracking-wide shadow-sm animate-fadeIn">
          <button
            onClick={() => handleTabChange('home')}
            className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-slate-50 block text-slate-700"
          >
            Inicio
          </button>
          <button
            onClick={() => handleTabChange('emergency')}
            className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-rose-50 hover:text-rose-600 flex items-center gap-2 text-slate-700"
          >
            <ShieldAlert className="w-4.5 h-4.5 text-rose-500" /> Emergencias
          </button>
          <button
            onClick={() => handleTabChange('checker')}
            className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-emerald-50 hover:text-emerald-600 flex items-center gap-2 text-slate-700"
          >
            <Activity className="w-4.5 h-4.5 text-emerald-500" /> Diagnóstico IA
          </button>
          <button
            onClick={() => handleTabChange('library')}
            className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-slate-50 block text-slate-700"
          >
            Manual Pediátrico
          </button>
          <button
            onClick={() => handleTabChange('vaccine')}
            className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-slate-50 block text-slate-700"
          >
            Vacunas
          </button>
          <button
            onClick={() => handleTabChange('dashboard')}
            className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-slate-50 flex items-center gap-2 text-slate-700 font-bold"
          >
            <LayoutDashboard className="w-4.5 h-4.5 text-slate-500" /> Dashboard
          </button>
          <button
            onClick={() => handleTabChange('family')}
            className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-slate-50 block text-slate-700"
          >
            Mis Hijos
          </button>
        </div>
      )}

      {/* MAIN LAYOUT BODY */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">
        {activeTab === 'home' && (
          <HeroSection 
            onNavigate={handleTabChange} 
            freeAssessmentsLeft={isPremium ? 9999 : freeAssessmentsLeft}
          />
        )}

        {activeTab === 'emergency' && (
          <EmergencyPanel />
        )}

        {activeTab === 'checker' && (
          <SymptomChecker 
            freeAssessmentsLeft={isPremium ? 9999 : freeAssessmentsLeft}
            decrementFreeAssessments={handleDecrementFree}
            activeProfile={activeProfile}
            profiles={profiles}
            onSelectProfile={setActiveProfile}
            onNavigateToPremium={() => handleTabChange('family')}
            onSaveAssessment={handleSaveAssessment}
          />
        )}

        {activeTab === 'library' && (
          <EmergencyLibrary />
        )}

        {activeTab === 'vaccine' && (
          <VaccineTracker activeProfile={activeProfile} />
        )}

        {activeTab === 'dashboard' && (
          <Dashboard 
            profiles={profiles}
            activeProfile={activeProfile}
            onSelectProfile={setActiveProfile}
            assessments={assessments}
            onNavigate={handleTabChange}
          />
        )}

        {activeTab === 'family' && (
          <div className="space-y-8">
            <ProfileManager 
              profiles={profiles}
              onAddProfile={handleAddProfile}
              onDeleteProfile={handleDeleteProfile}
              activeProfile={activeProfile}
              onSelectProfile={setActiveProfile}
              assessments={assessments}
              onNavigateToPremium={() => {}}
              user={user}
              onLogin={handleLogin}
              onLogout={handleLogout}
              authExecuting={authExecuting}
              authError={authError}
              isOnline={isOnline}
              onClearError={() => setAuthError(null)}
            />
            
            <PremiumSimulation 
              isPremium={isPremium}
              onActivatePremium={handleActivatePremium}
            />
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="bg-slate-900 text-slate-400 py-10 mt-12 border-t border-slate-800 text-xs">
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Brand footer details */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-emerald-500 text-white rounded-lg flex items-center justify-center text-sm">
                👶
              </div>
              <span className="font-extrabold text-white tracking-tight text-sm">Amapola</span>
            </div>
            <p className="leading-relaxed text-[11px] text-slate-400 max-w-xs">
              Orientación y primeros auxilios pediátricos de alta fidelidad. Brindamos tranquilidad a los padres en momentos de incertidumbre clínica.
            </p>
          </div>

          {/* Quick link columns */}
          <div className="space-y-2">
            <h4 className="text-white font-bold text-xs">Secciones de la App</h4>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <button onClick={() => handleTabChange('home')} className="text-left hover:text-white transition-colors cursor-pointer">Inicio</button>
              <button onClick={() => handleTabChange('emergency')} className="text-left hover:text-white transition-colors cursor-pointer">Emergencias</button>
              <button onClick={() => handleTabChange('checker')} className="text-left hover:text-white transition-colors cursor-pointer">Diagnóstico IA</button>
              <button onClick={() => handleTabChange('dashboard')} className="text-left hover:text-white transition-colors cursor-pointer">Dashboard</button>
              <button onClick={() => handleTabChange('library')} className="text-left hover:text-white transition-colors cursor-pointer">Manual Médico</button>
              <button onClick={() => handleTabChange('vaccine')} className="text-left hover:text-white transition-colors cursor-pointer">Calendario de Vacunas</button>
              <button onClick={() => handleTabChange('family')} className="text-left hover:text-white transition-colors cursor-pointer">Perfiles Hijos</button>
            </div>
          </div>

          {/* Liability warning */}
          <div className="space-y-2 text-[10px] text-slate-500 leading-relaxed border-t border-slate-800 md:border-t-0 pt-6 md:pt-0">
            <h4 className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Descargo de Responsabilidad Médica</h4>
            <p>
              Amapola es una plataforma virtual que proporciona pautas de primeros auxilios de carácter educativo y orientativo conforme a las directrices AAP/AHA 2026. **No constituye un servicio de diagnóstico clínico ni sustituye en modo alguno la consulta de un pediatra o médico calificado.** Ante cualquier sospecha de gravedad o peligro real, asista de inmediato a urgencias.
            </p>
          </div>
        </div>

        {/* Bottom copyright bar */}
        <div className="max-w-6xl mx-auto px-4 mt-8 pt-6 border-t border-slate-800 text-center text-slate-500 text-[10px] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 Amapola Pediátrica. Todos los derechos reservados.</p>
          <div className="flex gap-4">
            <span className="hover:text-slate-400 transition-colors">Cumplimiento Ley 1581 (Colombia)</span>
            <span className="hover:text-slate-400 transition-colors">Protección de Datos Sensibles</span>
          </div>
        </div>
      </footer>

      {/* Real-time Push Notification Floating Toast (FCM Simulator) */}
      <AnimatePresence>
        {activeNotification && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className="fixed top-20 right-4 left-4 sm:left-auto sm:max-w-md bg-slate-950/95 backdrop-blur-md text-white border border-slate-800 rounded-2xl p-4 shadow-2xl z-50 flex items-start gap-3.5"
          >
            <div className="bg-amber-500 text-slate-950 p-2 rounded-xl shrink-0">
              <BellRing className="w-5 h-5 animate-bounce" />
            </div>
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex justify-between items-start gap-1">
                <h4 className="text-xs font-black tracking-tight uppercase text-amber-400">
                  {activeNotification.title}
                </h4>
                <button 
                  onClick={() => setActiveNotification(null)}
                  className="text-slate-400 hover:text-white transition-colors cursor-pointer text-sm font-bold pl-2"
                >
                  ✕
                </button>
              </div>
              <p className="text-[11px] text-slate-200 leading-normal font-medium text-left">
                {activeNotification.body}
              </p>
              <span className="text-[9px] text-slate-500 font-mono block pt-1 text-left">
                Recibido: justo ahora • FCM Cloud Service
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
