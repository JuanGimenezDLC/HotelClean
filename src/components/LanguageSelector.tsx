import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

const languages = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' },
  { code: 'de', name: 'Deutsch' },
  { code: 'pl', name: 'Polski' },
];

const LanguageIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
    <path d="M2 12h20" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10" />
    <path d="M12 2a15.3 15.3 0 0 0-4 10 15.3 15.3 0 0 0 4 10" />
  </svg>
);

interface LanguageSelectorProps {
  currentLanguage: string;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ currentLanguage }) => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    setIsOpen(false);
  };

  // Cierra el menú si se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const availableLanguages = languages.filter(lang => lang.code !== currentLanguage);

  return (
    <div className="language-selector-container" ref={dropdownRef}>
      <button className="language-button" onClick={() => setIsOpen(!isOpen)}>
        <LanguageIcon />
        <span>{languages.find(l => l.code === currentLanguage)?.name}</span>
      </button>
      <div className={`language-dropdown ${isOpen ? 'open' : ''}`}>
        {availableLanguages.map((lang) => (
          <div
            key={lang.code}
            className="language-option"
            onClick={() => changeLanguage(lang.code)}
          >
            {lang.name}
          </div>
        ))}
      </div>
    </div>
  );
};

export default LanguageSelector;
