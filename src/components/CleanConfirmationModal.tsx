import React from 'react';
import { useTranslation } from 'react-i18next';
import { Room } from '../types';
import { X } from 'lucide-react';

interface CleanConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  room: Room;
}

const CleanConfirmationModal: React.FC<CleanConfirmationModalProps> = ({ isOpen, onClose, onConfirm, room }) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h5 className="modal-title">
            {t('cleanConfirmationModal.title')}
          </h5>
          <button
            type="button"
            className="close-button"
            onClick={onClose}
          >
            &times;
          </button>
        </div>
        
        <div className="modal-body">
          <p>
          {t('cleanConfirmationModal.message', { roomNumber: room.id })}
        </p>

          <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <button onClick={onClose} className="cancel-button" style={{ padding: '8px 16px', border: '1px solid #ccc', borderRadius: '4px', background: 'white', cursor: 'pointer' }}>
            {t('cancel')}
          </button>
            <button onClick={onConfirm} className="confirm-button" style={{ padding: '8px 16px', border: 'none', borderRadius: '4px', background: '#007bff', color: 'white', cursor: 'pointer' }}>
            {t('confirm')}
          </button>
        </div>
        </div>
      </div>
    </div>
  );
};

export default CleanConfirmationModal;