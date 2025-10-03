
import React, { useState, useRef } from 'react';
import { doc, updateDoc, arrayUnion, Timestamp } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';
import { db, storage } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Problem } from './ModernRoomCard';
import { Room, User } from '../types';
import './ReportProblemModal.css';

interface ReportProblemModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: Room;
  user: User;
}

// --- Icono de Carga (Spinner) ---
const SpinnerIcon = () => (
  <svg className="animate-spin" style={{ marginRight: '0.75rem', height: '1.25rem', width: '1.25rem' }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);


const ReportProblemModal: React.FC<ReportProblemModalProps> = ({ isOpen, onClose, room, user }) => {
  const { t } = useTranslation();
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || isSubmitting) return;

    setIsSubmitting(true);
    try {
      let imageUrl: string | undefined;

      if (imageFile) {
        const imageRef = ref(storage, `problem_images/${room.id}_${new Date().getTime()}`);
        await uploadBytes(imageRef, imageFile);
        imageUrl = await getDownloadURL(imageRef);
      }

      const newProblem: Problem = {
        id: new Date().getTime().toString() + Math.random().toString(36).substr(2, 9),
        description,
        reportedBy: user.uid,
        reportedAt: Timestamp.now(),
        isResolved: false,
        ...(imageUrl && { imageUrl }),
      };

      const roomRef = doc(db, 'rooms', room.id);
      await updateDoc(roomRef, {
        reportedProblems: arrayUnion(newProblem),
      });

      // Limpiar y cerrar solo si todo ha ido bien
      setDescription('');
      setImageFile(null);
      setImagePreview(null);
      onClose();
    } catch (error) {
      console.error("Error reporting problem:", error);
      // Aquí podrías mostrar una notificación de error al usuario
    } finally {
      setIsSubmitting(false);
    }
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
            <div className="form-group">
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleImageChange}
                style={{ display: 'none' }}
                ref={fileInputRef}
              />
              <button
                type="button"
                className="photo-button"
                onClick={() => fileInputRef.current?.click()}
              >
                {t('reportProblemModal.photoButton')}
              </button>
              {imagePreview && (
                <div className="image-preview">
                  <button type="button" className="remove-image-button" onClick={handleRemoveImage} aria-label={t('reportProblemModal.removeImageAriaLabel')}>
                    &times;
                  </button>
                  <img src={imagePreview} alt="Preview" />
                </div>
              )}
            </div>
            <button type="submit" className="submit-button" disabled={!description || isSubmitting} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {isSubmitting && <SpinnerIcon />}
              {isSubmitting
                ? t('reportProblemModal.loadingButton')
                : t('reportProblemModal.reportButton')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ReportProblemModal;
