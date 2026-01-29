import React, { useState } from 'react';
import './ModernRoomCard.css';
import { TFunction } from 'i18next';
import { Timestamp } from 'firebase/firestore';
import ConfirmationModal from './ConfirmationModal';

import {
  Bed,
  BedDouble,
  Bell,
  Check,
  Circle,
  Clock,
  Lock,
  Sparkles,
  Unlock,
  User,
  Wrench,
  Camera,
  AlertTriangle,
  RotateCcw,
  LogIn,
  LogOut,
} from 'lucide-react';

export interface Problem {
  id: string;
  description: string;
  reportedBy: string;
  reportedAt: Timestamp;
  isResolved: boolean;
  imageUrl?: string;
}

// --- Tipos ---
type RoomStatus = 'clean' | 'dirty' | 'problem' | 'occupied' | 'reclean' | 'blocked' | 'dirty_occupied' | 'limpiar';

export interface ModernRoom {
  id: string;
  number: string;
  name?: string;
  status: RoomStatus;
  baseStatus: 'clean' | 'dirty' | 'occupied';
  lastCleanedBy?: string;
  lastCleanedAt?: string;
  problems: Problem[];
  recleaningReason?: string;
  cleaningReason?: string;
  recleaningImageUrl?: string;
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
  onCheckInAttemptOnDirty: () => void;
  onRequestCleaning: () => void;
  isAnimatingOut?: boolean;
}

const statusConfig = {
  clean: { textKey: 'states.clean', icon: Check, colorClass: 'status-clean' },
  dirty: { textKey: 'states.dirty', icon: Circle, colorClass: 'status-dirty' },
  problem: { textKey: 'states.problem', icon: Wrench, colorClass: 'status-problem' },
  occupied: { textKey: 'states.occupied', icon: User, colorClass: 'status-occupied' },
  reclean: { textKey: 'states.reclean', icon: Wrench, colorClass: 'status-reclean' },
  blocked: { textKey: 'states.blocked', icon: Lock, colorClass: 'status-blocked' },
  dirty_occupied: { textKey: 'states.dirty_occupied', icon: Circle, colorClass: 'status-dirty' },
  limpiar: { textKey: 'states.limpiar', icon: Sparkles, colorClass: 'status-limpiar' },
};

export const ModernRoomCard: React.FC<ModernRoomCardProps> = ({ t, room, userRole, onStatusChange, onReportProblem, onReclean, onResolveProblem, onToggleBlock, onMarkForCheck, onCheckInAttemptOnDirty, onRequestCleaning, isAnimatingOut }) => {
  const [imageModalUrl, setImageModalUrl] = useState<string | null>(null);
  const [isConfirmModalOpen, setConfirmModalOpen] = useState(false);
  const [problemToResolve, setProblemToResolve] = useState<Problem | null>(null);

  const handleOpenConfirmModal = (problem: Problem) => {
    setProblemToResolve(problem);
    setConfirmModalOpen(true);
  };

  const handleConfirmResolve = () => {
    if (problemToResolve) {
      onResolveProblem(problemToResolve.id);
    }
    setConfirmModalOpen(false);
    setProblemToResolve(null);
  };

  const handleCheckInClick = () => {
    if (room.baseStatus === 'clean') {
      onStatusChange('occupied');
    } else {
      onCheckInAttemptOnDirty();
    }
  }

  const config = statusConfig[room.status] || statusConfig.blocked;
  const baseConfig = statusConfig[room.baseStatus];
  const isBlocked = room.status === 'blocked';
  const canBlock = userRole === 'supervisor';
  const canResolve = userRole === 'supervisor' || userRole === 'maintenance';
  const isOccupied = room.baseStatus === 'occupied';
  const isCleaningRequested = !!room.cleaningReason;

  const displayName = room.name || room.number;
  const displayPrefix = room.name ? null : t('roomCard.room');

  return (
    <>
      <div className={`modern-room-card ${config.colorClass} ${isAnimatingOut ? 'animating-out' : ''}`}>
        <div className="card-header-lovable">
          <div>
            <div className={`status-badge ${config.colorClass}`}>
              {React.createElement(config.icon, { className: "status-badge-icon" })}
              <span>{t(config.textKey)}</span>
            </div>
            <h3 className="card-room-number-main">{displayName}</h3>
            {displayPrefix && <p className="card-room-number-prefix">{displayPrefix}</p>}
          </div>
          <div className="card-header-icons">
            {canBlock && (
              <div className="block-button-wrapper">
                 {isOccupied ? (
                    <button 
                      onClick={onRequestCleaning} 
                      className={`request-cleaning-button ${isCleaningRequested ? 'active' : ''}`} 
                      aria-label={t('roomCard.requestCleaning')}
                    >
                      <Bell className={isCleaningRequested ? 'text-orange-500' : ''} />
                    </button>
                  ) : (
                    <button onClick={onToggleBlock} aria-label={isBlocked ? t('roomCard.unlockAction') : t('roomCard.lockAction')}>
                      {isBlocked ? <Unlock size={18} /> : <Lock size={18} />}
                    </button>
                  )}
              </div>
            )}
             {room.bedType && ( room.bedType === 'double' ? <BedDouble className="text-muted-foreground" /> : <Bed className="text-muted-foreground" /> )}
          </div>
        </div>

        <div className="card-body-content">
          {room.lastCleanedBy && (
            <div className="card-info-item">
              <User />
              <span>{room.lastCleanedBy}</span>
            </div>
          )}
          {room.lastCleanedAt && (
            <div className="card-info-item">
              <Clock />
              <span>{room.lastCleanedAt}</span>
            </div>
          )}
          
          {(room.recleaningReason || room.cleaningReason) && (
            <div className="card-info-item">
              <Wrench />
              <span>{room.recleaningReason || room.cleaningReason}</span>
            </div>
          )}

          {room.problems && room.problems.length > 0 && (
            <div className="card-problems-list">
              {room.problems.map((problem) => (
                <div key={problem.id} className="card-problem-item">
                  <span className="card-problem-item-text">{problem.description}</span>
                  <div className="card-problem-item-actions">
                    {problem.imageUrl && (
                      <button onClick={() => setImageModalUrl(problem.imageUrl!)} className="camera-button">
                        <Camera />
                      </button>
                    )}
                    {canResolve && (
                      <button onClick={() => handleOpenConfirmModal(problem)} className="resolve-button-small">
                        <Check />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card-footer-actions">
          {userRole === 'cleaner' && (
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => onStatusChange('clean')} className="action-btn action-btn--primary text-sm">
                <Check className="w-4 h-4" />
                {t('states.clean')}
              </button>
              <button onClick={onReportProblem} className="action-btn action-btn--secondary text-sm">
                <AlertTriangle className="w-4 h-4" />
                {t('roomCard.reportProblemButton')}
              </button>
            </div>
          )}
          {userRole === 'supervisor' && (
            <>
              <div className="status-toggle-group">
                <button
                  onClick={() => onStatusChange('clean')}
                  className={`status-toggle-button toggle-clean ${room.baseStatus === 'clean' ? 'active' : ''}`}
                >
                  {t('states.clean')}
                </button>
                <button
                  onClick={() => onStatusChange('dirty')}
                  className={`status-toggle-button toggle-dirty ${room.baseStatus === 'dirty' ? 'active' : ''}`}
                >
                  {t('states.dirty')}
                </button>
                <button
                  onClick={() => onStatusChange('occupied')}
                  className={`status-toggle-button toggle-occupied ${room.baseStatus === 'occupied' ? 'active' : ''}`}
                >
                  {t('states.occupied')}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-3">
                <button 
                  onClick={onReportProblem} 
                  className="action-btn action-btn--secondary text-sm"
                >
                  <AlertTriangle className="w-4 h-4" />
                  {t('roomCard.reportProblemButton')}
                </button>
                <button 
                  onClick={onReclean} 
                  className="action-btn action-btn--secondary text-sm"
                >
                  <RotateCcw className="w-4 h-4" />
                  {t('roomCard.recleanButton')}
                </button>
                <button
                  onClick={handleCheckInClick}
                  disabled={room.baseStatus === 'occupied'}
                  className="action-btn action-btn--ghost text-sm disabled:opacity-40"
                >
                  <LogIn className="w-4 h-4" />
                  {t('roomCard.check_in')}
                </button>
                <button
                  onClick={onMarkForCheck}
                  disabled={room.baseStatus !== 'occupied'}
                  className="action-btn action-btn--ghost text-sm disabled:opacity-40"
                >
                  <LogOut className="w-4 h-4" />
                  {t('roomCard.mark_for_check')}
                </button>
              </div>
            </>
          )}
          {userRole === 'maintenance' && (
            <div className="grid grid-cols-1 gap-2 mt-3">
              <button onClick={onReportProblem} className="action-btn action-btn--secondary text-sm w-full">
                <AlertTriangle className="w-4 h-4" />
                {t('roomCard.reportProblemButton')}
              </button>
            </div>
          )}
        </div>
      </div>

      {imageModalUrl && (
        <div className="image-modal-overlay" onClick={() => setImageModalUrl(null)}>
          <img src={imageModalUrl} alt="Problem" />
        </div>
      )}

      {problemToResolve && (
        <ConfirmationModal
          isOpen={isConfirmModalOpen}
          onClose={() => setConfirmModalOpen(false)}
          onConfirm={handleConfirmResolve}
          title={t('confirmationModal.resolveTitle')}
          message={t('confirmationModal.resolveMessage', {
            problemDescription: problemToResolve.description
          })}
        />
      )}
    </>
  );
};

export default ModernRoomCard;