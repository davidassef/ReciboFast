// Autor: David Assef
// Descrição: Componente principal da aplicação ReciboFast
// Data: 07-09-2025
// MIT License

import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import PWANotification from './components/PWANotification';
import GlobalLoader from './components/GlobalLoader';
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const Terms = lazy(() => import('./pages/Terms'));
const Privacy = lazy(() => import('./pages/Privacy'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Contratos = lazy(() => import('./pages/Contratos'));
const Recibos = lazy(() => import('./pages/Recibos'));
const Perfil = lazy(() => import('./pages/Perfil'));
const SignaturesPage = lazy(() => import('./pages/SignaturesPage'));
const DesignSystemTest = lazy(() => import('./pages/DesignSystemTest'));
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Suspense fallback={<GlobalLoader />}> 
          <Routes>
            {/* Rotas públicas */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/design-system-test" element={<DesignSystemTest />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            
            {/* Rotas protegidas */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/" element={
              <ProtectedRoute>
                <ErrorBoundary>
                  <Layout />
                </ErrorBoundary>
              </ProtectedRoute>
            }>
              <Route path="/dashboard" element={<Dashboard />} />
              {/** rota de receitas removida */}
              <Route path="/contratos" element={<Contratos />} />
              <Route path="/recibos" element={<Recibos />} />
              <Route path="/assinaturas" element={<SignaturesPage />} />
              <Route path="/perfil" element={<Perfil />} />
            </Route>
          </Routes>
        </Suspense>
        
        {/* PWA Notifications */}
        <PWANotification />
        
        {/* Toast Notifications */}
        <Toaster position="top-right" richColors />
      </Router>
    </AuthProvider>
  );
}

export default App;
