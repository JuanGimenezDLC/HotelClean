import React, { useState, useRef } from 'react';
import { doc, updateDoc, arrayUnion, Timestamp } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';
import { db, storage } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Room, User } from '../types';
import { Problem } from './ModernRoomCard'; // Assuming this type is correct
import './ReportProblemModal.css'; // We will modify this CSS

// Icono de advertencia (similar a AlertTriangle de lucide-react)
const IconPlaceholder = () => (
  <div className="icon-placeholder">
    <svg className="w-5 h-5 text-warning" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
      <line x1="12" y1="9" x2="12" y2="13"></line>
      <line x1="12" y1="17" x2="12.01" y2="17"></line>
    </svg>
  </div>
);


const SpinnerIcon = () => (
  <svg className="animate-spin mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);


interface ReportProblemModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: Room;
  user: User;
}

// Quick options derived from the dialog component
const quickOptions = [
  "Grifo gotea",
  "Aire acondicionado no funciona",
  "Luz fundida",
  "TV no funciona",
  "Cerradura atascada",
];

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

  const handleQuickOption = (option: string) => {
    setDescription(option);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      let imageUrl: string | undefined;

      if (imageFile) {
        const imageRef = ref(storage, `problem_images/${room.id}_${new Date().getTime()}`);
        await uploadBytes(imageRef, imageFile);
        imageUrl = await getDownloadURL(imageRef);
      }

      const newProblem: Problem = {
        id: `${new Date().getTime()}${Math.random().toString(36).substr(2, 9)}`, // Ensure unique ID
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

      // Reset form and close modal on success
      setDescription('');
      setImageFile(null);
      setImagePreview(null);
      onClose();
    } catch (error) {
      console.error("Error reporting problem:", error);
      // Optionally show a user-facing error message here
      alert('Error reporting problem. Please try again.'); // Simple alert for now
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="dialog-header-content"> {/* Mimics DialogHeader content */}
            <IconPlaceholder /> {/* Placeholder for the icon */}
            <div className="dialog-title-description">
              <h5 className="dialog-title">{t('reportProblemModal.title')}</h5> {/* Removed roomNumber from here */}
              <p className="dialog-description">{t('reportProblemModal.roomDescription', { roomNumber: room.id })}</p>
            </div>
          </div>
          <button type="button" className="close-button" onClick={onClose} aria-label="Close dialog">
            &times;
          </button>
        </div>
        <div className="modal-body">
          <form onSubmit={handleSubmit} className="dialog-form"> {/* Apply form styling */}
            <div className="quick-options-section"> {/* Mimics quick options container */}
              {quickOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => handleQuickOption(option)}
                  className={`quick-option-btn ${description === option ? 'active' : ''}`}
                >
                  {option}
                </button>
              ))}
            </div>

            <div className="textarea-section"> {/* Mimics textarea container */}
              <textarea
                placeholder={t('reportProblemModal.descriptionPlaceholder')} // Add translation key for placeholder
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="form-textarea" // This class will be styled in CSS
                required
                autoFocus
              ></textarea>
            </div>

            <div className="file-upload-section"> {/* Section for image upload */}
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
                className="photo-button" // This class will be styled
                onClick={() => fileInputRef.current?.click()}
              >
                {t('reportProblemModal.photoButton')}
              </button>
              {imagePreview && (
                <div className="image-preview-container"> {/* Mimics preview container */}
                  <button type="button" className="remove-image-button" onClick={handleRemoveImage} aria-label={t('reportProblemModal.removeImageAriaLabel')}>
                    &times;
                  </button>
                  <img src={imagePreview} alt="Preview" className="image-preview-img" /> {/* Mimics preview image style */}
                </div>
              )}
            </div>

            <div className="modal-footer"> {/* Footer for buttons */}
              <button
                type="button"
                className="button ghost cancel-button" // Mimics ghost button for cancel
                onClick={onClose}
              >
                {t('reportProblemModal.cancelButton')} {/* Add translation key */}
              </button>
              <button
                type="submit"
                className="button submit-button" // Primary button style
                disabled={!description.trim() || isSubmitting}
              >
                {isSubmitting && <SpinnerIcon />}
                {isSubmitting
                  ? t('reportProblemModal.loadingButton')
                  : t('reportProblemModal.reportButton')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ReportProblemModal;
