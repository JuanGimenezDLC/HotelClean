import React from 'react';
import { useTranslation } from 'react-i18next';
import { Room } from '../types';
import { CheckCircle2, X } from 'lucide-react';

interface CleanModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: Room;
}

const CleanModal: React.FC<CleanModalProps> = ({ isOpen, onClose, room }) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  // Auto-close after 2 seconds
  setTimeout(onClose, 2000);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ textAlign: 'center', padding: '2rem' }}>
        <div style={{ marginBottom: '1rem', color: '#28a745' }}>
          <CheckCircle2 size={48} />
        </div>
        
        <h2 className="modal-title" style={{ marginBottom: '0.5rem' }}>
          {t('cleanModal.title')}
        </h2>
        
        <p>
          {t('cleanModal.message', { roomNumber: room.id })}
        </p>
      </div>
    </div>
  );
};

export default CleanModal;