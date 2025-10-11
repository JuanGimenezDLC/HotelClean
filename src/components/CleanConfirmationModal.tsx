import React from 'react';
import { useTranslation } from 'react-i18next';
import { Room } from '../types';
import './ConfirmationModal.css'; // Reutilizaremos los estilos existentes

interface CleanConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  room: Room | null;
}

const CleanConfirmationModal: React.FC<CleanConfirmationModalProps> = ({ isOpen, onClose, onConfirm, room }) => {
  const { t } = useTranslation();

  if (!isOpen || !room) {
    return null;
  }

  const bedType = room.bedType ? t(`roomType.${room.bedType}`) : '';

  return (
    <div className="confirmation-modal-overlay">
      <div className="confirmation-modal-content">
        <div className="confirmation-modal-header">
          <h2 className="confirmation-modal-title">{t('cleanConfirmationModal.title')}</h2>
        </div>
        <div className="confirmation-modal-body">
          <p>
            {t('cleanConfirmationModal.message', { roomNumber: room.id, bedType: bedType })}
          </p>
        </div>
        <div className="confirmation-modal-footer">
          <button onClick={onClose} className="btn btn-danger">{t('cleanConfirmationModal.cancelButton')}</button>
          <button onClick={onConfirm} className="btn btn-success">{t('cleanConfirmationModal.confirmButton')}</button>
        </div>
      </div>
    </div>
  );
};

export default CleanConfirmationModal;
