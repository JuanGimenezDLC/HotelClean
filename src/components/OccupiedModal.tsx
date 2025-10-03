import React from 'react';
import { useTranslation } from 'react-i18next';
import { Room } from '../types';
import './CleanModal.css';

interface OccupiedModalProps {
  onClose: () => void;
  onSetOccupied: () => void;
  room: Room;
}

const OccupiedModal: React.FC<OccupiedModalProps> = ({ onClose, onSetOccupied, room }) => {
  const { t } = useTranslation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSetOccupied();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h5 className="modal-title">{t('occupiedModal.title', { roomNumber: room.id })}</h5>
          <button type="button" className="close-button" onClick={onClose}>
            &times;
          </button>
        </div>
        <div className="modal-body">
          <form onSubmit={handleSubmit}>
            <p>{t('occupiedModal.confirmation')}</p>
            <button type="submit" className="submit-button">
              {t('occupiedModal.setOccupiedButton')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default OccupiedModal;
