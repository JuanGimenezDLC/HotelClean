import React from 'react';
import { useTranslation } from 'react-i18next';
import { Room } from '../types';
import './ReportProblemModal.css';

interface CleanConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  room: Room;
}

const CleanConfirmationModal: React.FC<CleanConfirmationModalProps> = ({ isOpen, onClose, onConfirm, room }) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  const bedTypeLabel = room.bedType === 'double' ? 'Matrimonio' : (room.bedType === 'single' ? 'Individual' : '');

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '450px' }}>
        <div className="modal-header">
          <h5 className="dialog-title">{t('cleanConfirmation.title', 'Confirmar Limpieza')}</h5>
          <button type="button" className="close-button" onClick={onClose} aria-label="Close">
            &times;
          </button>
        </div>
        <div className="modal-body">
          <p className="dialog-description">
            {t('cleanConfirmation.message', { 
              roomNumber: room.id, 
              bedType: bedTypeLabel,
              defaultValue: `¿Confirmar limpieza de habitación ${room.id}${bedTypeLabel ? ` (${bedTypeLabel})` : ''}?`
            })}
          </p>
        </div>
        <div className="modal-footer">
          <button type="button" className="button ghost" onClick={onClose}>
            {t('common.cancel', 'Cancelar')}
          </button>
          <button type="button" className="button submit-button" onClick={onConfirm}>
            {t('common.confirm', 'Confirmar')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CleanConfirmationModal;