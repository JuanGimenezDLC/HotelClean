import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase'; // Assuming firebase auth is initialized here
import './Login.css'; // For custom styles
import { User } from '../types'; // Corrected import

// Assuming a background image is available at 'public/images/corporate-bg.jpg'
// You might need to adjust the path or use a CSS class for background

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      // The actual user object returned might differ, adjust based on your auth setup
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      // Assuming you have a way to map Firebase User to your User interface
      // For now, we'll just use a placeholder user object.
      // In a real app, you'd likely fetch user details or use an onAuthStateChanged listener.
      const user: User = {
        uid: userCredential.user.uid,
        email: userCredential.user.email!,
        // Default role or fetch from backend/localStorage if available
        // This role needs to be aligned with your User type in src/types.ts
        role: 'supervisor' // Placeholder role, adjust as needed
      };
      onLogin(user);
    } catch (err: any) {
      console.error('Login error:', err);
      if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        setError('Credenciales inválidas. Por favor, verifica tu correo y contraseña.');
      } else {
        setError('Ocurrió un error al intentar iniciar sesión. Por favor, inténtalo de nuevo.');
      }
    }
  };

  return (
    <div className="login-page-container">
      <div className="login-content-wrapper">
        <div className="login-form-card" style={{ maxWidth: '450px', width: '100%', margin: '0 auto' }}>
          <h1 className="login-title">Hoteles Aspire</h1>
          <p className="login-subtitle">Inicia sesión para continuar</p>
          <form onSubmit={handleLogin} className="login-form">
            <div className="form-group">
              <label htmlFor="email">Correo Electrónico</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ejemplo@hotelesaspire.com"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">Contraseña</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Tu contraseña"
                required
              />
            </div>
            {error && <p className="login-error-message">{error}</p>}
            <button type="submit" className="login-submit-button">
              Iniciar Sesión
            </button>
          </form>
        </div>
      </div>
      {/* You would typically have a background image here, styled via CSS */}
      <div className="login-background-overlay"></div>
    </div>
  );
};

export default Login;