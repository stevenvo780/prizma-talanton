import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Button, Image } from 'react-bootstrap';
import { auth } from '../../utils/firebase';
import firebase from 'firebase/compat/app';
import { useDispatch } from 'react-redux';
import { login } from '../../redux/auth';
import { addNotification } from '../../redux/ui';
import RegisterModal from './RegisterModal';
import axios from '../../utils/axios';
import { User } from '../../utils/types';
import {
  Receipt,
  CreditCard2Back,
  BoxSeam,
  GraphUpArrow,
  EnvelopeAt,
  ShieldLock,
  CheckLg,
  ArrowLeft,
} from 'react-bootstrap-icons';
import './Login.css';

const PLANS = [
  { name: 'Básico',    price: '49.000',  features: ['200 facturas/mes', 'POS web + API REST', 'Webhooks básicos'] },
  { name: 'Estándar',  price: '99.000',  features: ['1.000 facturas/mes', 'POS end-to-end + API + Webhooks', 'DIAN automática'], popular: true },
  { name: 'Premium',   price: '199.000', features: ['Facturas ilimitadas', 'API + Webhooks sin límites', 'SDK + soporte 24/7'] },
];

const FEATURES = [
  { icon: <Receipt size={28} />, title: 'Facturación Electrónica DIAN', desc: 'Emite facturas válidas ante la DIAN de forma automática desde el POS' },
  { icon: <CreditCard2Back size={28} />, title: 'API REST end-to-end', desc: 'Conecta tu sistema de extremo a extremo con nuestra API completa y webhooks' },
  { icon: <BoxSeam size={28} />, title: 'POS + Inventario', desc: 'Punto de venta completo con control de stock en tiempo real' },
  { icon: <GraphUpArrow size={28} />, title: 'Webhooks & Notificaciones', desc: 'Recibe eventos en tiempo real en cualquier sistema externo' },
];

const LoginPage: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [showResetForm, setShowResetForm] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [activePlan, setActivePlan] = useState(1);
  const [activeFeature, setActiveFeature] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % FEATURES.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);

    try {
      const userCredential = await auth.signInWithEmailAndPassword(email, password);
      const user = userCredential.user;
      
      const token = await user?.getIdToken();

      const data = await axios.get(`/user/get/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const userData = data.data as User;

      console.log(userData);
      
      dispatch(login({
        token: token || '',
        user: {
          ...userData,
          id: user?.uid || '',
          email: user?.email || '',
          name: user?.displayName || email.split('@')[0],
          apiKey: userData.apiKey || '',
        }
      }));
      
      dispatch(addNotification({ message: 'Bienvenido', color: 'success' }));
      navigate('/');
    } catch (error: any) {
      console.error('Error de autenticación:', error.message);
      dispatch(addNotification({ message: 'Error al ingresar', color: 'danger' }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      const provider = new firebase.auth.GoogleAuthProvider();
      const result = await auth.signInWithPopup(provider);
      const user = result.user;
      
      const token = await user?.getIdToken();
      const data = await axios.get(`/user/get/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const userData = data.data as User;
      console.log(userData);
      dispatch(login({
        token: token || '',
        user: {
          ...userData,
          id: user?.uid || '',
          email: user?.email || '',
          name: user?.displayName || (user?.email?.split('@')[0] || ''),
          apiKey: userData.apiKey || '',
        }
      }));
      
      dispatch(addNotification({ message: 'Bienvenido', color: 'success' }));
      navigate('/');
    } catch (error: any) {
      console.error('Error de autenticación con Google:', error.message);
      dispatch(addNotification({ message: 'Error al ingresar con Google', color: 'danger' }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = () => {
    setShowRegisterModal(true);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) {
      dispatch(addNotification({ message: 'Por favor ingrese su correo electrónico', color: 'warning' }));
      return;
    }

    try {
      await auth.sendPasswordResetEmail(resetEmail);
      dispatch(addNotification({ 
        message: 'Se ha enviado un enlace para restablecer su contraseña', 
        color: 'success' 
      }));
      setShowResetForm(false);
    } catch (error: any) {
      console.error('Error al enviar correo de recuperación:', error.message);
      dispatch(addNotification({ message: 'Error al enviar correo de recuperación', color: 'danger' }));
    }
  };

  return (
    <div className="login-wrapper">
      {/* ─── LADO IZQUIERDO: Showcase ─── */}
      <div className="login-showcase">
        <div className="showcase-bg-shapes">
          <div className="shape shape-1" />
          <div className="shape shape-2" />
          <div className="shape shape-3" />
        </div>

        <div className="showcase-content">
          <div className="showcase-header">
            <Image
              src="/logo-lockup.png"
              className="showcase-logo"
              alt="Prizma Talanton"
            />
            <p className="showcase-tagline">
              El sistema de punto de venta más completo de Colombia
            </p>
          </div>

          {/* Feature rotativo */}
          <div className="showcase-feature-carousel">
            {FEATURES.map((feat, i) => (
              <div
                key={i}
                className={`feature-slide ${i === activeFeature ? 'active' : ''}`}
              >
                <span className="feature-icon">{feat.icon}</span>
                <div>
                  <h3 className="feature-title">{feat.title}</h3>
                  <p className="feature-desc">{feat.desc}</p>
                </div>
              </div>
            ))}
            <div className="feature-dots">
              {FEATURES.map((_, i) => (
                <button
                  key={i}
                  className={`dot ${i === activeFeature ? 'active' : ''}`}
                  onClick={() => setActiveFeature(i)}
                  aria-label={`Feature ${i + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Mini cards de planes */}
          <div className="showcase-plans">
            <h4 className="plans-title">Planes desde</h4>
            <div className="plans-row">
              {PLANS.map((plan, i) => (
                <div
                  key={i}
                  className={`plan-mini ${i === activePlan ? 'active' : ''} ${plan.popular ? 'popular' : ''}`}
                  onClick={() => setActivePlan(i)}
                >
                  {plan.popular && <span className="popular-tag">Popular</span>}
                  <h5 className="plan-mini-name">{plan.name}</h5>
                  <div className="plan-mini-price">
                    <span className="currency">$</span>
                    <span className="amount">{plan.price}</span>
                    <span className="period">/mes</span>
                  </div>
                  <ul className="plan-mini-features">
                    {plan.features.map((f, j) => (
                      <li key={j}><CheckLg size={12} className="check-icon" /> {f}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div className="showcase-stats">
            <div className="stat">
              <span className="stat-number">500+</span>
              <span className="stat-label">Negocios activos</span>
            </div>
            <div className="stat-divider" />
            <div className="stat">
              <span className="stat-number">99.9%</span>
              <span className="stat-label">Uptime</span>
            </div>
            <div className="stat-divider" />
            <div className="stat">
              <span className="stat-number">DIAN</span>
              <span className="stat-label">Certificado</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── LADO DERECHO: Login form ─── */}
      <div className="login-form-side">
        <div className="login-form-container">
          <div className="login-form-header">
            <Image
              src="/logo-lockup.png"
              className="login-mobile-logo"
              alt="Prizma Talanton"
            />
            <h2 className="login-title">Bienvenido</h2>
            <p className="login-subtitle">
              {showResetForm ? 'Recupera tu contraseña' : 'Ingresa a tu cuenta para continuar'}
            </p>
          </div>

          {showResetForm ? (
            <Form onSubmit={handleResetPassword} className="login-form">
              <Form.Group className="mb-3">
                <Form.Label className="form-label-modern">Correo electrónico</Form.Label>
                <Form.Control
                  type="email"
                  placeholder="tu@empresa.com"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="form-input-modern"
                />
              </Form.Group>
              <Button type="submit" className="btn-login-primary w-100 mb-3">
                Enviar enlace de recuperación
              </Button>
              <button
                type="button"
                className="btn-link-modern"
                onClick={() => setShowResetForm(false)}
              >
                <ArrowLeft size={14} /> Volver al inicio de sesión
              </button>
            </Form>
          ) : (
            <>
              <Form onSubmit={handleSubmit} className="login-form">
                <Form.Group className="mb-3">
                  <Form.Label className="form-label-modern">Correo</Form.Label>
                  <div className="input-icon-wrapper">
                    <span className="input-icon"><EnvelopeAt size={18} /></span>
                    <Form.Control
                      type="email"
                      placeholder="tu@empresa.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="form-input-modern with-icon"
                    />
                  </div>
                </Form.Group>
                <Form.Group className="mb-4">
                  <Form.Label className="form-label-modern">Contraseña</Form.Label>
                  <div className="input-icon-wrapper">
                    <span className="input-icon"><ShieldLock size={18} /></span>
                    <Form.Control
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="form-input-modern with-icon"
                    />
                  </div>
                </Form.Group>

                <Button
                  type="submit"
                  className="btn-login-primary w-100"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="btn-loading">
                      <span className="spinner" /> Ingresando...
                    </span>
                  ) : (
                    'Iniciar sesión'
                  )}
                </Button>
              </Form>

              <div className="login-divider">
                <span>o continúa con</span>
              </div>

              <Button
                className="btn-google w-100"
                onClick={handleGoogleLogin}
                disabled={isLoading}
              >
                <svg className="google-icon" viewBox="0 0 24 24" width="20" height="20">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Iniciar sesión con Google
              </Button>

              <div className="login-footer-links">
                <button
                  type="button"
                  className="btn-link-modern"
                  onClick={() => setShowResetForm(true)}
                >
                  ¿Olvidaste tu contraseña?
                </button>
                <div className="register-cta">
                  <span>¿No tienes cuenta?</span>
                  <button
                    type="button"
                    className="btn-register-link"
                    onClick={handleRegister}
                  >
                    Regístrate gratis
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="login-form-footer">
          <p>© 2026 <a href="https://talanton.prisma-enterprice.cloud" target="_blank" rel="noopener noreferrer">Prizma Talanton</a> · Suite empresarial <a href="https://prisma-enterprice.cloud" target="_blank" rel="noopener noreferrer">Prizma</a></p>
        </div>
      </div>

      <RegisterModal
        show={showRegisterModal}
        onHide={() => setShowRegisterModal(false)}
      />
    </div>
  );
};

export default LoginPage;
