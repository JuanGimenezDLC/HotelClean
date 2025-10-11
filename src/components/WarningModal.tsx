import React from 'react';
import { useTranslation } from 'react-i18next';
import './ConfirmationModal.css'; // Reutilizamos los estilos

interface WarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
}

const WarningModal: React.FC<WarningModalProps> = ({ isOpen, onClose, title, message }) => {
  const { t } = useTranslation();

  if (!isOpen) {
    return null;
  }

  return (
    <div className="confirmation-modal-overlay" onClick={onClose}>
      <div className="confirmation-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="confirmation-modal-header">
          <h2 className="confirmation-modal-title">{title}</h2>
        </div>
        <div className="confirmation-modal-body">
          <p>{message}</p>
        </div>
        <div className="confirmation-modal-footer">
          <button onClick={onClose} className="btn btn-primary">
            {t('warningModal.acceptButton')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WarningModal;