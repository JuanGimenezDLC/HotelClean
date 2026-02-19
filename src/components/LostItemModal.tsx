import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Room } from '../types';
import './ReportProblemModal.css'; // Reutilizamos estilos

const IconPlaceholder = () => (
  <div className="icon-placeholder" style={{ backgroundColor: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--primary))' }}>
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
       <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
       <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
       <line x1="12" y1="22.08" x2="12" y2="12"></line>
    </svg>
  </div>
);

const SpinnerIcon = () => (
  <svg className="animate-spin mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

interface LostItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: Room;
  onSave: (description: string, file: File) => Promise<void>;
}

const LostItemModal: React.FC<LostItemModalProps> = ({ isOpen, onClose, room, onSave }) => {
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
    if (!imageFile || isSubmitting) return; // La foto es obligatoria para objetos perdidos

    setIsSubmitting(true);
    try {
      await onSave(description, imageFile);
      setDescription('');
      setImageFile(null);
      setImagePreview(null);
      onClose();
    } catch (error) {
      console.error("Error reporting lost item:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="dialog-header-content">
            <IconPlaceholder />
            <div className="dialog-title-description">
              <h5 className="dialog-title">{t('lostItem.title', 'Objeto Perdido')} - {t('roomCard.room')} {room.id}</h5>
            </div>
          </div>
          <button type="button" className="close-button" onClick={onClose}>
            &times;
          </button>
        </div>
        <div className="modal-body">
          <form onSubmit={handleSubmit} className="dialog-form">
            <div className="textarea-section">
              <textarea
                placeholder={t('lostItem.descriptionPlaceholder', 'Descripción del objeto (opcional)...')}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="form-textarea"
                autoFocus
              ></textarea>
            </div>

            <div className="file-upload-section">
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
                {t('reportProblemModal.photoButton', 'Adjuntar Foto')}
              </button>
              {imagePreview && (
                <div className="image-preview-container">
                  <button type="button" className="remove-image-button" onClick={handleRemoveImage}>
                    &times;
                  </button>
                  <img src={imagePreview} alt="Preview" className="image-preview-img" />
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button type="button" className="button ghost cancel-button" onClick={onClose}>
                {t('common.cancel', 'Cancelar')}
              </button>
              <button
                type="submit"
                className="button submit-button"
                disabled={!imageFile || isSubmitting}
              >
                {isSubmitting && <SpinnerIcon />}
                {isSubmitting ? t('common.sending', 'Enviando...') : t('common.save', 'Guardar')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LostItemModal;