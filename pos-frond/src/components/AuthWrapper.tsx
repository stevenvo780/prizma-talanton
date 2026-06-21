import React, { useCallback, useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Spinner } from 'react-bootstrap';
import Layout from './Layout';
import OnboardingWizard from './OnboardingWizard';
import POSview from '../views/POSview';
import Products from '../views/Products';
import Clients from '../views/Clients';
import Invoice from '../views/Invoice';
import Login from '../views/Login';
import Register from '../views/Register';
import Settings from '../views/Settings';
import EditProfile from '../views/Profile';
import Suscribe from '../views/Subscribe';
import Dashboard from '../views/Dashboard';
import { useSelector } from 'react-redux';
import { RootState } from '../redux/store';
import api from '../utils/axios';

const AuthWrapper: React.FC = () => {
  const user = useSelector((state: RootState) => state.auth.userData);
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null);

  // Verificar si el usuario ya completó el onboarding
  const checkOnboarding = useCallback(async () => {
    if (!user?.id) return;
    try {
      const [resProfile, resCashBoxes] = await Promise.all([
        api.get(`/profile/user/${user.id}`).catch(() => ({ data: null })),
        api.get('/cash-box').catch(() => ({ data: [] })),
      ]);
      const p = resProfile.data;
      const boxes = resCashBoxes.data;
      const hasProfile = p?.companyName && p?.nit;
      const hasCashBox = Array.isArray(boxes) && boxes.length > 0;
      setOnboardingDone(!!(hasProfile && hasCashBox));
    } catch {
      // Si hay error, forzar el wizard de onboarding
      setOnboardingDone(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user) {
      checkOnboarding();
    } else {
      setOnboardingDone(null);
    }
  }, [user, checkOnboarding]);

  // Usuario autenticado
  if (user) {
    // Cargando verificación de onboarding
    if (onboardingDone === null) {
      return (
        <div style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Spinner animation="border" style={{ color: '#f5a623', width: 48, height: 48 }} />
        </div>
      );
    }

    // Mostrar wizard si falta configuración
    if (!onboardingDone) {
      return (
        <OnboardingWizard onComplete={() => setOnboardingDone(true)} />
      );
    }

    return (
      <Layout>
        <div style={{ margin: 10 }}>
          <Routes>
            <Route path="/pos" element={<POSview />} />
            <Route path="/products" element={<Products />} />
            <Route path="/clients" element={<Clients />} />
            <Route path="/invoice" element={<Invoice />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/profile/edit" element={<EditProfile />} />
            <Route path="/taxes" element={<Navigate to="/settings" />} />
            <Route path="/discounts" element={<Navigate to="/settings" />} />
            <Route path="/category" element={<Navigate to="/settings" />} />
            <Route path="/categoryPricing" element={<Navigate to="/settings" />} />
            <Route path="/config" element={<Navigate to="/settings" />} />
            <Route path="/" element={<Navigate to="/pos" />} />
            <Route path="/invoices" element={<Invoice />} />
            <Route path="/subscribe" element={<Suscribe />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Layout>
    );
  }

  // Usuario no autenticado
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/register" element={<Register />} />
    </Routes>
  );
};

export default AuthWrapper;
