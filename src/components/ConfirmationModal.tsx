import React from 'react';
import { useTranslation } from 'react-i18next';
import './ConfirmationModal.css';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
}) => {
  const { t } = useTranslation();

  if (!isOpen) {
    return null;
  }

  return (
    <div className="confirmation-modal-overlay" onClick={onClose}>
      <div className="confirmation-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="confirmation-modal-header">
          <h5 className="confirmation-modal-title">{title}</h5>
          <button type="button" className="close-button" onClick={onClose}>
            &times;
          </button>
        </div>
        <div className="confirmation-modal-body">
          <p>{message}</p>
        </div>
        <div className="confirmation-modal-footer">
          <button onClick={onClose} className="btn btn-danger">
            {t('confirmationModal.cancelButton')}
          </button>
          <button onClick={onConfirm} className="btn btn-success">
            {t('confirmationModal.confirmButton')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
