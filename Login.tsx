import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import './Login.css';
import { Building, Wrench, Sparkles, ArrowRight, ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const roles = [
  {
    key: 'super',
    label: 'role.reception.label',
    description: 'role.reception.description',
    icon: Building,
    className: 'role-reception',
  },
  {
    key: 'limp',
    label: 'role.cleaning.label',
    description: 'role.cleaning.description',
    icon: Sparkles,
    className: 'role-cleaning',
  },
  {
    key: 'mant',
    label: 'role.maintenance.label',
    description: 'role.maintenance.description',
    icon: Wrench,
    className: 'role-maintenance',
  },
];

const Login: React.FC = () => {
  const { t } = useTranslation();
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // The onAuthStateChanged listener in App.tsx will handle the redirect
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        setError(t('login.error.invalidCredentials'));
      } else {
        setError(t('login.error.generic'));
      }
    }
  };

  const handleRoleSelect = (roleKey: string) => {
    // Pre-fill email based on role for convenience, if desired
    // This is a minor logic adjustment for better UX
    const roleEmails: { [key: string]: string } = {
      super: 'super@hotel.com',
      limp: 'limp@hotel.com',
      mant: 'mant@hotel.com',
    };
    setEmail(roleEmails[roleKey] || '');
    setSelectedRole(roleKey);
  };

  if (!selectedRole) {
    return (
      <div className="login-container">
        <div className="login-card">
          <div className="login-logo-section">
            <div className="login-logo-wrapper">
              <span className="login-logo-icon">H</span>
            </div>
            <h1 className="login-title">{t('login.title')}</h1>
            <p className="login-subtitle">{t('login.subtitle')}</p>
          </div>
          <div className="login-roles-list">
            {roles.map((role) => (
              <button
                key={role.key}
                onClick={() => handleRoleSelect(role.key)}
                className={`login-role-button ${role.className}`}
              >
                <div className="login-role-button-content">
                  <div className="login-role-icon-wrapper">
                    <role.icon className="login-role-icon" />
                  </div>
                  <div className="login-role-text">
                    <p className="login-role-label">{t(role.label)}</p>
                    <p className="login-role-description">{t(role.description)}</p>
                  </div>
                  <ArrowRight className="login-role-arrow" />
                </div>
              </button>
            ))}
          </div>
          <p className="login-footer">{t('login.footer')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <button onClick={() => setSelectedRole(null)} className="back-button">
          <ArrowLeft size={16} /> {t('login.backButton')}
        </button>
        <div className="login-logo-section">
            <div className="login-logo-wrapper">
              <span className="login-logo-icon">H</span>
            </div>
            <h1 className="login-title">{t('login.formTitle')}</h1>
            <p className="login-subtitle">{t('login.formSubtitle', { role: t(roles.find(r => r.key === selectedRole)?.label || '') })}</p>
        </div>
        <form onSubmit={handleLogin} className="login-form">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('login.emailPlaceholder')}
            required
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t('login.passwordPlaceholder')}
            required
          />
          {error && <p className="login-error">{error}</p>}
          <button type="submit" className="login-submit-button">{t('login.loginButton')}</button>
        </form>
      </div>
    </div>
  );
};

export default Login;