import { Timestamp } from 'firebase/firestore';

export interface ReportedProblem {
  id: string; // Identificador único para el problema reportado
  description: string; // Descripción del problema
  reportedBy: string; // UID del usuario que reportó el problema
  reportedAt: Timestamp; // Marca de tiempo de cuándo se reportó el problema
  isResolved: boolean; // Indica si el problema ha sido resuelto
}

export interface Room {
  id: string; // Identificador único de la habitación (ej. "101", "205")
  status: 'Limpia' | 'Sucia' | 'Ocupada' | 'Bloqueada'; // Estado principal de la habitación
  baseStatus?: 'Limpia' | 'Sucia' | 'Ocupada'; // Estado base cuando está bloqueada
  // Eliminado: isBlocked?: boolean;
  // Ya que 'status: "Bloqueada"' ya indica que la habitación está bloqueada.
  // Esto previene redundancia y posibles inconsistencias.
  lastCleanedBy?: string; // UID del último usuario que limpió la habitación (opcional)
  lastCleanedAt?: Timestamp; // Marca de tiempo de la última limpieza (opcional)
  recleaningReason?: string; // Motivo por el cual la habitación necesita ser relimpiada (opcional)
  reportedProblems: ReportedProblem[]; // Array de problemas reportados para esta habitación
  // Se ha hecho obligatorio (sin '?') para asegurar que siempre es un array,
  // aunque esté vacío, lo que simplifica su manejo en el código.
}

export interface User {
  uid: string; // Identificador único del usuario de Firebase
  email: string; // Correo electrónico del usuario
  role: 'cleaner' | 'supervisor' | 'maintenance'; // Rol del usuario en el sistema
}
