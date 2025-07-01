
import React, { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Room } from '../types';

interface RecleanModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: Room;
}

const RecleanModal: React.FC<RecleanModalProps> = ({ isOpen, onClose, room }) => {
  const [reason, setReason] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason) return;

    const roomRef = doc(db, 'rooms', room.id);
    await updateDoc(roomRef, {
      status: 'recleaning',
      recleaningReason: reason,
    });

    setReason('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Marcar para Relimpieza - Habitación {room.id}</h5>
            <button type="button" className="close" onClick={onClose}>
              <span>&times;</span>
            </button>
          </div>
          <div className="modal-body">
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Motivo de la Relimpieza</label>
                <textarea
                  className="form-control"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  required
                ></textarea>
              </div>
              <button type="submit" className="btn btn-primary mt-3">
                Marcar
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecleanModal;
