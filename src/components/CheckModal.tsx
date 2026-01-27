import React from 'react';
import { useTranslation } from 'react-i18next';
import { X, Bed, BedDouble } from 'lucide-react';

interface CheckModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (bedType: 'single' | 'double') => void;
}

const CheckModal: React.FC<CheckModalProps> = ({ isOpen, onClose, onSelect }) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h5 className="modal-title">
            {t('checkModal.title')}
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
          <div className="check-options-container" style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <button
            onClick={() => onSelect('single')}
            className="check-option-button"
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1rem', border: '1px solid #ccc', borderRadius: '8px', background: 'none', cursor: 'pointer' }}
          >
            <Bed size={32} />
            <span className="font-medium">{t('checkModal.singleBed')}</span>
          </button>
          <button
            onClick={() => onSelect('double')}
            className="check-option-button"
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1rem', border: '1px solid #ccc', borderRadius: '8px', background: 'none', cursor: 'pointer' }}
          >
            <BedDouble size={32} />
            <span className="font-medium">{t('checkModal.doubleBed')}</span>
          </button>
        </div>
        </div>
      </div>
    </div>
  );
};

export default CheckModal;