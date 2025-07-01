
import { Timestamp } from 'firebase/firestore';

export interface ReportedProblem {
  description: string;
  reportedBy: string;
  reportedAt: Timestamp;
  isResolved: boolean;
}

export interface Room {
  id: string;
  status: 'Sucia' | 'Limpia' | 'Ocupada';
  lastCleanedBy?: string;
  lastCleanedAt?: Timestamp;
  recleaningReason?: string;
  reportedProblems: ReportedProblem[];
}

export interface User {
  uid: string;
  email: string;
  role: 'cleaner' | 'supervisor' | 'maintenance';
}
