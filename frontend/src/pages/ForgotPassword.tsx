// Autor: David Assef
// Descrição: Página de solicitação de redefinição de senha via e-mail
// Data: 08-09-2025
// MIT License

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Send } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button, Input, Card, CardHeader, CardBody } from '../components/ui';
import Captcha from '../components/Captcha';

const ForgotPassword: React.FC = () => {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email) {
      setError('Informe seu e-mail.');
      return;
    }

    if (!captchaToken) {
      setError('Confirme que você é humano.');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await resetPassword(email);
      if (error) {
        setError(error.message || 'Não foi possível enviar o e-mail de redefinição.');
      } else {
        setSuccess('Enviamos um e-mail com instruções para redefinir sua senha. Verifique sua caixa de entrada.');
      }
    } catch (err: any) {
      setError(err?.message || 'Erro inesperado ao enviar o e-mail.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-secondary-50 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="max-w-md w-full relative z-10 animate-fadeIn">
        <Card className="shadow-2xl backdrop-blur-sm bg-white/95 border-0">
          <CardHeader className="text-center">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-neutral-900 via-primary-800 to-neutral-900 bg-clip-text text-transparent mb-2">
              Esqueceu a senha
            </h1>
            <p className="text-neutral-600">Informe seu e-mail para enviarmos o link de redefinição.</p>
          </CardHeader>
          <CardBody>
            <form onSubmit={handleSubmit} className="space-y-6 animate-slideInUp">
              <Input
                id="email"
                name="email"
                type="email"
                label="Email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<Mail className="w-4 h-4" />}
                required
                autoComplete="email"
              />

              {/* Captcha */}
              <Captcha onVerify={setCaptchaToken} onError={() => setError('Falha na verificação de segurança. Tente novamente.')} />

              <Button type="submit" className="w-full" disabled={!captchaToken || isLoading} loading={isLoading}>
                {!isLoading && <Send className="w-4 h-4 mr-2" />}
                {isLoading ? 'Enviando...' : 'Enviar link de redefinição'}
              </Button>
            </form>

            {error && <p className="mt-4 text-sm text-error-700">{error}</p>}
            {success && <p className="mt-4 text-sm text-success-700">{success}</p>}

            <div className="mt-6 text-center">
              <Link to="/login" className="text-primary-600 hover:underline">Voltar ao login</Link>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPassword;
