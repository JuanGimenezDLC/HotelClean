import React from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSelector: React.FC = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="btn-group">
      <button
        type="button"
        className="btn btn-secondary dropdown-toggle"
        data-toggle="dropdown"
        aria-haspopup="true"
        aria-expanded="false"
      >
        {i18n.language.toUpperCase()}
      </button>
      <div className="dropdown-menu dropdown-menu-right">
        <button className="dropdown-item" type="button" onClick={() => changeLanguage('en')}>
          English
        </button>
        <button className="dropdown-item" type="button" onClick={() => changeLanguage('es')}>
          Español
        </button>
        <button className="dropdown-item" type="button" onClick={() => changeLanguage('de')}>
          Deutsch
        </button>
        <button className="dropdown-item" type="button" onClick={() => changeLanguage('pl')}>
          Polski
        </button>
      </div>
    </div>
  );
};

export default LanguageSelector;
