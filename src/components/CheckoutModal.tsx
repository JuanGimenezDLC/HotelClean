import React from 'react';
import { useTranslation } from 'react-i18next';
import './CheckoutModal.css';

interface CheckoutModalProps {
  onClose: () => void;
  onCheckout: (bedType: 'single' | 'double') => void;
}

const CheckoutModal: React.FC<CheckoutModalProps> = ({ onClose, onCheckout }) => {
  const { t } = useTranslation();

  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        <h2>{t('checkout.title')}</h2>
        <p>{t('checkout.message')}</p>
        <div className="modal-actions">
          <button onClick={() => onCheckout('double')} className="double-bed-btn">{t('checkout.doubleBed')}</button>
          <button onClick={() => onCheckout('single')} className="single-bed-btn">{t('checkout.singleBed')}</button>
        </div>
        <button onClick={onClose} className="close-btn">{t('checkout.close')}</button>
      </div>
    </div>
  );
};

export default CheckoutModal;
