import React from 'react';
import { useTranslation } from 'react-i18next';
import './CleanModal.css';

const SinglePersonIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
    <circle cx="12" cy="7" r="4"></circle>
  </svg>
);

const DoublePersonIcon = () => (
  <svg width="40" height="24" viewBox="0 0 40 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <g transform="translate(-2, 0)">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
      <circle cx="12" cy="7" r="4"></circle>
    </g>
    <g transform="translate(14, 0)">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
      <circle cx="12" cy="7" r="4"></circle>
    </g>
  </svg>
);

interface CheckModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (bedType: 'single' | 'double') => void;
}

const CheckModal: React.FC<CheckModalProps> = ({ isOpen, onClose, onSelect }) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h5 className="modal-title">{t('checkModal.title')}</h5>
        <div className="modal-body">
          <p>{t('checkModal.message')}</p>
          <div className="bed-options">
            <button onClick={() => onSelect('single')} className="bed-option-button">
              <SinglePersonIcon />
              <span>{t('checkModal.singleBed')}</span>
            </button>
            <button onClick={() => onSelect('double')} className="bed-option-button double">
              <DoublePersonIcon />
              <span>{t('checkModal.doubleBed')}</span>
            </button>
          </div>
        </div>
        <div className="modal-footer">
          <button onClick={onClose} className="btn btn-secondary">{t('checkModal.closeButton')}</button>
        </div>
      </div>
    </div>
  );
};

export default CheckModal;
