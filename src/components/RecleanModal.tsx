import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Room } from '../types';
import './RecleanModal.css';

interface RecleanModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: Room;
  onMark: (reason: string, file: File | null) => Promise<void>;
}

const RecleanModal: React.FC<RecleanModalProps> = ({ isOpen, onClose, room, onMark }) => {
  const { t } = useTranslation();
  const [reason, setReason] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason) return;

    setIsLoading(true);
    await onMark(reason, file);
    setIsLoading(false);

    setReason('');
    setFile(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h5 className="modal-title">{t('recleanModal.title', { roomNumber: room.id })}</h5>
          <button type="button" className="close-button" onClick={onClose}>
            &times;
          </button>
        </div>
        <div className="modal-body">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">{t('recleanModal.reasonLabel')}</label>
              <textarea
                className="form-textarea"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
                autoFocus
              ></textarea>
            </div>
            <div className="form-group">
              <label className="form-label">{t('recleanModal.photoLabel')}</label>
              <input
                type="file"
                className="form-input-file"
                onChange={handleFileChange}
                accept="image/*"
              />
            </div>
            <button type="submit" className="submit-button" disabled={!reason || isLoading}>
              {isLoading ? t('recleanModal.loadingButton') : t('recleanModal.markButton')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RecleanModal;
