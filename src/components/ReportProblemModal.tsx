
import React, { useState } from 'react';
import { doc, updateDoc, arrayUnion, Timestamp } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';
import { db } from '../firebase';
import { Room, User } from '../types';
import './ReportProblemModal.css'; // Importar el nuevo CSS

interface ReportProblemModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: Room;
  user: User;
}

const ReportProblemModal: React.FC<ReportProblemModalProps> = ({ isOpen, onClose, room, user }) => {
  const { t } = useTranslation();
  const [description, setDescription] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description) return;

    const roomRef = doc(db, 'rooms', room.id);
    await updateDoc(roomRef, {
      reportedProblems: arrayUnion({
        id: new Date().getTime().toString() + Math.random().toString(36).substr(2, 9),
        description,
        reportedBy: user.uid,
        reportedAt: Timestamp.now(),
        isResolved: false,
      }),
    });

    setDescription('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h5 className="modal-title">{t('reportProblemModal.title', { roomNumber: room.id })}</h5>
          <button type="button" className="close-button" onClick={onClose}>
            &times;
          </button>
        </div>
        <div className="modal-body">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">{t('reportProblemModal.descriptionLabel')}</label>
              <textarea
                className="form-textarea"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                autoFocus
              ></textarea>
            </div>
            <button type="submit" className="submit-button" disabled={!description}>
              {t('reportProblemModal.reportButton')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ReportProblemModal;
