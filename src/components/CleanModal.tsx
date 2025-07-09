import React from 'react';
import { useTranslation } from 'react-i18next';
import './CleanModal.css';

const SingleBedIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 8V6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2" />
    <path d="M3 16v-2a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2" />
    <path d="M7 12h10" />
    <path d="M7 18h10" />
  </svg>
);

const DoubleBedIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 8V6a2 2 0 0 1 2-2h5a2 2 0 0 1 2 2v2" />
    <path d="M12 8V6a2 2 0 0 1 2-2h5a2 2 0 0 1 2 2v2" />
    <path d="M3 16v-2a2 2 0 0 1 2-2h5a2 2 0 0 1 2 2v2" />
    <path d="M12 16v-2a2 2 0 0 1 2-2h5a2 2 0 0 1 2 2v2" />
    <path d="M7 12h2" />
    <path d="M15 12h2" />
    <path d="M7 18h2" />
    <path d="M15 18h2" />
  </svg>
);

interface CleanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (bedType: 'single' | 'double') => void;
}

const CleanModal: React.FC<CleanModalProps> = ({ isOpen, onClose, onSelect }) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h5 className="modal-title">{t('cleanModal.title')}</h5>
        <div className="modal-body">
          <p>{t('cleanModal.message')}</p>
          <div className="bed-options">
            <button onClick={() => onSelect('single')} className="bed-option-button">
              <SingleBedIcon />
              <span>{t('cleanModal.singleBed')}</span>
            </button>
            <button onClick={() => onSelect('double')} className="bed-option-button">
              <DoubleBedIcon />
              <span>{t('cleanModal.doubleBed')}</span>
            </button>
          </div>
        </div>
        <div className="modal-footer">
          <button onClick={onClose} className="btn btn-secondary">{t('cleanModal.closeButton')}</button>
        </div>
      </div>
    </div>
  );
};

export default CleanModal;
