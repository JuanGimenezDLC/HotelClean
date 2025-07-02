import React from 'react';
import './ModernRoomCard.css';

// --- Iconos SVG para claridad visual ---
// Estos iconos ayudan a identificar el estado de un vistazo.

const CleanIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const DirtyIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
  </svg>
);

const ProblemIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line>
  </svg>
);

const OccupiedIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
    </svg>
);


// --- Tipos para el componente ---
// Definimos la estructura de datos que espera la tarjeta.
type RoomStatus = 'clean' | 'dirty' | 'problem' | 'occupied' | 'reclean';

interface Room {
  number: string;
  status: RoomStatus;
  lastCleanedBy?: string;
  lastCleanedAt?: string; // Añadimos la fecha/hora de limpieza
  problemDescription?: string;
}

interface ModernRoomCardProps {
  room: Room;
  userRole: 'cleaner' | 'supervisor' | 'maintenance'; // Pasamos el rol del usuario
  onStatusChange: (newStatus: 'clean' | 'dirty' | 'occupied') => void;
  onReportProblem: () => void;
  onReclean: () => void; // Nueva función para relimpieza
}

// --- Mapeo de configuración ---
// Centralizamos la configuración de cada estado para mantener el código limpio.
const statusConfig = {
  clean: { text: 'Limpia', icon: <CleanIcon />, className: 'status-clean' },
  dirty: { text: 'Sucia', icon: <DirtyIcon />, className: 'status-dirty' },
  problem: { text: 'Con Problema', icon: <ProblemIcon />, className: 'status-problem' },
  occupied: { text: 'Ocupada', icon: <OccupiedIcon />, className: 'status-occupied' },
  reclean: { text: 'Necesita Relimpieza', icon: <ProblemIcon />, className: 'status-reclean' },
};


// --- El Componente de la Tarjeta ---
export const ModernRoomCard: React.FC<ModernRoomCardProps> = ({ room, userRole, onStatusChange, onReportProblem, onReclean }) => {
  const config = statusConfig[room.status];

  return (
    <div className={`room-card ${config.className}`}>
      {/* Efecto de fondo Aurora */}
      <div className="aurora-background"></div>
      
      {/* Contenido de la tarjeta */}
      <div className="room-card-content">
        <header className="room-card-header">
          <div className="status-indicator">
            {config.icon}
            <span>{config.text}</span>
          </div>
          <h2 className="room-number">Habitación {room.number}</h2>
        </header>

        <main className="room-card-body">
          {/* Muestra el problema si existe */}
          {(room.status === 'problem' || room.status === 'reclean') && room.problemDescription && (
            <p className="detail-text"><strong>Motivo:</strong> {room.problemDescription}</p>
          )}
          
          {/* Muestra la información de limpieza SÓLO si el estado es 'clean' */}
          {room.status === 'clean' && room.lastCleanedBy && (
            <>
              <p className="detail-text"><strong>Limpiado por:</strong> {room.lastCleanedBy}</p>
              {room.lastCleanedAt && (
                <p className="detail-text"><strong>Hora:</strong> {room.lastCleanedAt}</p>
              )}
            </>
          )}
        </main>

        <footer className="room-card-footer">
          <div className="status-actions">
            <button 
              onClick={() => onStatusChange('clean')} 
              className={`action-button ${room.status === 'clean' ? 'active' : ''}`}
              disabled={room.status === 'clean'}
            >
              Limpia
            </button>
            <button 
              onClick={() => onStatusChange('dirty')} 
              className={`action-button ${room.status === 'dirty' ? 'active' : ''}`}
              disabled={room.status === 'dirty'}
            >
              Sucia
            </button>
             <button 
              onClick={() => onStatusChange('occupied')} 
              className={`action-button ${room.status === 'occupied' ? 'active' : ''}`}
              disabled={room.status === 'occupied'}
            >
              Ocupada
            </button>
          </div>
          <div className="secondary-actions">
            <button onClick={onReportProblem} className="action-button problem-button">
              Reportar Problema
            </button>
            {userRole === 'supervisor' && (
              <button onClick={onReclean} className="action-button reclean-button">
                Relimpieza
              </button>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
};
