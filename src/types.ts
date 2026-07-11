export interface ChildProfile {
  id: string;
  name: string;
  birthDate: string; // YYYY-MM-DD
  gender: 'M' | 'F' | 'Otro';
  weightKg?: number;
  allergies?: string;
  bloodType?: string;
  chronicConditions?: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp?: string;
}

export interface SymptomAssessment {
  id: string;
  childId?: string;
  childName?: string;
  timestamp: string;
  symptoms: string;
  severity: 'leve' | 'moderada' | 'severa';
  summary: string;
  reassurance?: string;
  steps: string[];
  redFlags: string[];
  naturalRemedies: string[];
  remediesWarning: string;
  references: string;
  messages: ChatMessage[];
  voiceAudioUrl?: string;
  imageGuideUrl?: string;
}

export interface EmergencyCondition {
  id: string;
  condition: string;
  symptoms_asociados: string[];
  gravedad: 'leve' | 'moderada' | 'severa/emergencia';
  pasos_a_seguir: string[];
  señales_de_alarma: string[];
  remedios_naturales: string[];
  advertencias_remedios: string;
  referencia: string;
  category: 'respiratorio' | 'trauma' | 'fiebre' | 'digestivo' | 'otros';
  icon: string; // Lucide icon string name
}

export interface Vaccine {
  id: string;
  name: string;
  ageMonths: number;
  ageText: string;
  disease: string;
  dose: string;
  description: string;
}
