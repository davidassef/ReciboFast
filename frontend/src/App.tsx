// Autor: David Assef
// Descrição: Componente principal da aplicação ReciboFast
// Data: 20-01-2025
// MIT License

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import PWANotification from './components/PWANotification';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Receitas from './pages/Receitas';
import Contratos from './pages/Contratos';
import Recibos from './pages/Recibos';
import Perfil from './pages/Perfil';
import DesignSystemTest from './pages/DesignSystemTest';

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
              <Layout />
            </ProtectedRoute>
          }>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/receitas" element={<Receitas />} />
            <Route path="/contratos" element={<Contratos />} />
            <Route path="/recibos" element={<Recibos />} />
            <Route path="/perfil" element={<Perfil />} />
          </Route>
        </Routes>
        
        {/* PWA Notifications */}
        <PWANotification />
      </Router>
    </AuthProvider>
  );
}

export default App;
