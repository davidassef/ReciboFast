// Autor: David Assef
// Descrição: Componente principal da aplicação ReciboFast
// Data: 05-09-2025
// MIT License

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import PWANotification from './components/PWANotification';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Contratos from './pages/Contratos';
import Recibos from './pages/Recibos';
import Perfil from './pages/Perfil';
import SignaturesPage from './pages/SignaturesPage';
import DesignSystemTest from './pages/DesignSystemTest';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Rotas públicas */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/design-system-test" element={<DesignSystemTest />} />
          
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
        
        {/* PWA Notifications */}
        <PWANotification />
        
        {/* Toast Notifications */}
        <Toaster position="top-right" richColors />
      </Router>
    </AuthProvider>
  );
}

export default App;
