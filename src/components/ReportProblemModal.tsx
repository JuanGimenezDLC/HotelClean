
import React, { useState } from 'react';
import { doc, updateDoc, arrayUnion, Timestamp } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';
import { db } from '../firebase';
import { Room, User } from '../types';

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
    <div className="modal" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{t('reportProblemModal.title', { roomNumber: room.id })}</h5>
            <button type="button" className="close" onClick={onClose}>
              <span>&times;</span>
            </button>
          </div>
          <div className="modal-body">
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>{t('reportProblemModal.descriptionLabel')}</label>
                <textarea
                  className="form-control"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                ></textarea>
              </div>
              <button type="submit" className="btn btn-primary mt-3">
                {t('reportProblemModal.reportButton')}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportProblemModal;
