import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Room } from '../types';
import { Camera, X } from 'lucide-react';

interface RecleanModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: Room;
  onMark: (reason: string, file: File | null) => Promise<void>;
}

const RecleanModal: React.FC<RecleanModalProps> = ({ isOpen, onClose, room, onMark }) => {
  const { t } = useTranslation();
  const [reason, setReason] = useState('');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onMark(reason, imageFile);
      setReason('');
      setImageFile(null);
      setImagePreview(null);
      onClose();
    } catch (error) {
      console.error("Error requesting reclean:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h5 className="modal-title">
            {t('recleanModal.title', { roomNumber: room.id })}
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
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">
              {t('recleanModal.reasonLabel')}
            </label>
            <textarea
              className="form-textarea"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              rows={3}
              autoFocus
              placeholder={t('recleanModal.reasonPlaceholder')}
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
              disabled={isSubmitting}
            >
              <Camera className="w-5 h-5 mr-2" />
              {t('recleanModal.photoButton')}
            </button>

            {imagePreview && (
              <div className="image-preview">
                <img src={imagePreview} alt="Preview" />
              </div>
            )}
          </div>

          <button
            type="submit"
            className="submit-button"
            disabled={!reason || isSubmitting}
          >
            {isSubmitting ? t('recleanModal.submitting') : t('recleanModal.submitButton')}
          </button>
        </form>
        </div>
      </div>
    </div>
  );
};

export default RecleanModal;