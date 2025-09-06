// Autor: David Assef
// Descrição: Banner de verificação de e-mail exibido quando o usuário não confirmou o e-mail
// Data: 05-09-2025
// MIT License

import React, { useState } from 'react';
import { AlertTriangle, Mail, RefreshCw, Send } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';

const EmailVerificationBanner: React.FC = () => {
  const { user, emailVerified, resendEmailConfirmation, refreshUser } = useAuth();
  const [sending, setSending] = useState(false);

  if (emailVerified) return null;

  const email = user?.email || 'seu e-mail';

  const handleResend = async () => {
    if (!user?.email) {
      toast.error('Não foi possível identificar seu e-mail.');
      return;
    }
    try {
      setSending(true);
      const { error } = await resendEmailConfirmation(user.email);
      if (error) {
        toast.error(error.message || 'Falha ao reenviar confirmação.');
        return;
      }
      toast.success('E-mail de confirmação reenviado com sucesso. Verifique sua caixa de entrada.');
    } catch (err: any) {
      toast.error(err?.message || 'Falha ao reenviar confirmação.');
    } finally {
      setSending(false);
    }
  };

  const handleRefresh = async () => {
    await refreshUser();
  };

  return (
    <div className="mb-6 rounded-xl border border-warning-200 bg-gradient-to-r from-warning-50 to-yellow-50 p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-warning-600 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-medium text-warning-800">
            Seu e-mail ainda não foi confirmado.
          </p>
          <p className="text-sm text-warning-700 mt-1 flex items-center gap-1">
            <Mail className="w-4 h-4" />
            <span>{email}</span>
          </p>
          <p className="text-xs text-warning-700 mt-2">
            Algumas funcionalidades ficarão indisponíveis até que você confirme seu e-mail.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={handleResend}
              disabled={sending}
              className="inline-flex items-center gap-2 rounded-lg bg-warning-600 px-3 py-2 text-white text-sm hover:bg-warning-700 transition-colors disabled:opacity-70"
            >
              <Send className="w-4 h-4" />
              {sending ? 'Enviando...' : 'Reenviar confirmação'}
            </button>
            <button
              onClick={handleRefresh}
              className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm text-warning-700 border border-warning-300 hover:bg-warning-100 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Já confirmei — Atualizar status
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationBanner;
