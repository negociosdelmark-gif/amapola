/// <reference types="vite-plugin-pwa/client" />
export type ManeuverType = 'rcp_infant' | 'heimlich_infant' | 'rcp_child' | 'heimlich_child';

export interface Vaccine {
  id: string;
  name: string;
  disease: string;
  ageMonths: number;
  ageText: string;
  status: 'PENDING' | 'COMPLETED' | 'OVERDUE';
  dateAdministered?: string;
  batchNumber?: string;
  facility?: string;
  notes?: string;
}

export interface EmergencyContact {
  id: string;
  name: string;
  role: string;
  phone: string;
  isPrimary?: boolean;
}

export interface IncidentReport {
  id: string;
  timestamp: string;
  type: string;
  description: string;
  status: 'REPORTED' | 'RESOLVED';
}
