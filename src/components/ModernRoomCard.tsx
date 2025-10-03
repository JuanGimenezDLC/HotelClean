import React, { useState } from 'react';
import './ModernRoomCard.css';
import { TFunction } from 'i18next';
import { Timestamp } from 'firebase/firestore';

export interface Problem {
  id: string;
  description: string;
  reportedBy: string;
  reportedAt: Timestamp;
  isResolved: boolean;
  imageUrl?: string;
}

// --- Iconos SVG ---
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
const LockIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
  </svg>
);
const UnlockIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 9.9-1" />
  </svg>
);
const SinglePersonIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
    <circle cx="12" cy="7" r="4"></circle>
  </svg>
);
const DoublePersonIcon = () => (
  <svg width="40" height="24" viewBox="0 0 40 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <g transform="translate(-2, 0)"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></g>
    <g transform="translate(14, 0)"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></g>
  </svg>
);
const CameraIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle>
  </svg>
);

// --- Tipos ---
type RoomStatus = 'clean' | 'dirty' | 'problem' | 'occupied' | 'reclean' | 'blocked';

export interface ModernRoom {
  id: string;
  number: string;
  status: RoomStatus;
  baseStatus: 'clean' | 'dirty' | 'occupied';
  lastCleanedBy?: string;
  lastCleanedAt?: string;
  problems: Problem[];
  recleaningReason?: string;
  bedType?: 'single' | 'double';
}

interface ModernRoomCardProps {
  t: TFunction;
  room: ModernRoom;
  userRole: 'cleaner' | 'supervisor' | 'maintenance';
  onStatusChange: (newStatus: 'clean' | 'dirty' | 'occupied') => void;
  onReportProblem: () => void;
  onReclean: () => void;
  onResolveProblem: (problemId: string) => void;
  onToggleBlock: () => void;
  onMarkForCheck: () => void;
}

export const ModernRoomCard: React.FC<ModernRoomCardProps> = ({ t, room, userRole, onStatusChange, onReportProblem, onReclean, onResolveProblem, onToggleBlock, onMarkForCheck }) => {
  const [imageModalUrl, setImageModalUrl] = useState<string | null>(null);

  const statusConfig = {
    clean: { text: t('states.clean'), icon: <CleanIcon />, className: 'status-clean' },
    dirty: { text: t('states.dirty'), icon: <DirtyIcon />, className: 'status-dirty' },
    problem: { text: t('states.problem'), icon: <ProblemIcon />, className: 'status-problem' },
    occupied: { text: t('states.occupied'), icon: <OccupiedIcon />, className: 'status-occupied' },
    reclean: { text: t('states.reclean'), icon: <ProblemIcon />, className: 'status-reclean' },
    blocked: { text: t('states.blocked'), icon: <LockIcon />, className: 'status-blocked' },
  };

  const config = statusConfig[room.status] || statusConfig.blocked;
  const baseConfig = statusConfig[room.baseStatus];
  const isBlocked = room.status === 'blocked';
  const canBlock = userRole === 'supervisor';
  const canResolve = userRole === 'supervisor' || userRole === 'maintenance';

  return (
    <>
      <div className={`room-card ${config.className} ${isBlocked ? 'is-blocked' : ''}`}>
        <div className="aurora-background"></div>
        <div className="room-card-content">
          <header className="room-card-header">
            <div className="status-indicator">
              {config.icon}
              <span>
                {room.status === 'reclean' && room.baseStatus === 'occupied' ? t('states.reclean_occupied') : config.text}
                {isBlocked && ` (${baseConfig.text})`}
                {room.status === 'problem' && ` (${baseConfig.text})`}
              </span>
              {room.bedType && (
                <div className={`bed-type-icon ${room.bedType === 'double' ? 'double' : ''}`} title={t(room.bedType === 'single' ? 'roomType.single' : 'roomType.double')}>
                  {room.bedType === 'single' ? <SinglePersonIcon /> : <DoublePersonIcon />}
                </div>
              )}
            </div>
            <h2 className="room-number">{t('roomCard.room')} {room.number}</h2>
            {canBlock && (
              <button onClick={onToggleBlock} className="block-button" aria-label={isBlocked ? t('roomCard.unlockAction') : t('roomCard.lockAction')}>
                {isBlocked ? <LockIcon /> : <UnlockIcon />}
              </button>
            )}
          </header>

          <main className="room-card-body">
            {room.problems && room.problems.length > 0 && (
              <div className="problems-list">
                <h4 className="problems-title">{t('roomCard.pendingProblems')}</h4>
                <ul>
                  {room.problems.map((problem) => (
                    <li key={problem.id} className="problem-item">
                      <span>{problem.description}</span>
                      <div className="problem-actions">
                        {problem.imageUrl && (
                          <button onClick={() => setImageModalUrl(problem.imageUrl!)} className="camera-button">
                            <CameraIcon />
                          </button>
                        )}
                        {canResolve && (
                          <button onClick={() => onResolveProblem(problem.id)} className="resolve-button-small">
                            {t('roomCard.resolveButton')}
                          </button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {room.status === 'reclean' && room.recleaningReason && (
              <p className="detail-text"><strong>{t('roomCard.recleaningReason')}</strong> {room.recleaningReason}</p>
            )}
            
            {room.status === 'clean' && room.lastCleanedBy && (
              <>
                <p className="detail-text"><strong>{t('roomCard.cleanedBy')}</strong> {room.lastCleanedBy}</p>
                {room.lastCleanedAt && (
                  <p className="detail-text"><strong>{t('roomCard.cleanedAt')}</strong> {room.lastCleanedAt}</p>
                )}
              </>
            )}
          </main>

          <footer className="room-card-footer">
            <div className="status-actions">
              <button onClick={() => onStatusChange('clean')} className={`action-button ${room.baseStatus === 'clean' ? 'active' : ''}`} disabled={room.baseStatus === 'clean' || userRole === 'maintenance'}>
                {t('states.clean')}
              </button>
              <button onClick={() => onStatusChange('dirty')} className={`action-button ${room.baseStatus === 'dirty' ? 'active' : ''}`} disabled={room.baseStatus === 'dirty' || userRole === 'cleaner' || userRole === 'maintenance'}>
                {t('states.dirty')}
              </button>
              <button onClick={() => onStatusChange('occupied')} className={`action-button ${room.baseStatus === 'occupied' ? 'active' : ''}`} disabled={room.baseStatus === 'occupied' || userRole === 'cleaner' || userRole === 'maintenance'}>
                {t('states.occupied')}
              </button>
            </div>
            <div className="secondary-actions">
              <button onClick={onReportProblem} className="action-button problem-button" >
                {t('roomCard.reportProblemButton')}
              </button>
              {userRole === 'supervisor' && (
                <button onClick={onReclean} className="action-button reclean-button" >
                  {t('roomCard.recleanButton')}
                </button>
              )}
              {userRole === 'supervisor' && (
                <button onClick={() => onMarkForCheck()} className="action-button checkout-button">
                  {t('mark_for_check')}
                </button>
              )}
            </div>
          </footer>
        </div>
      </div>

      {imageModalUrl && (
        <div className="image-modal-overlay" onClick={() => setImageModalUrl(null)}>
          <img src={imageModalUrl} alt="Problem" />
        </div>
      )}
    </>
  );
};

export default ModernRoomCard;