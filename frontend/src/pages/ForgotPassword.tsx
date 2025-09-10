// Autor: David Assef
// Descrição: Página de solicitação de redefinição de senha via e-mail
// Data: 08-09-2025
// MIT License

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Send } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button, Input, Card, CardHeader, CardBody } from '../components/ui';
// Captcha temporariamente desabilitado

const ForgotPassword: React.FC = () => {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [cooldown, setCooldown] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email) {
      setError('Informe seu e-mail.');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await resetPassword(email);
      if (error) {
        const msg = (error as any)?.message?.toString()?.toLowerCase() ?? '';
        const status = (error as any)?.status as number | undefined;
        if (status === 429 || msg.includes('rate') || msg.includes('too many')) {
          setError('Muitas tentativas. Aguarde 1 minuto antes de tentar novamente.');
        } else {
          setError((error as any)?.message || 'Não foi possível enviar o e-mail de redefinição.');
        }
      } else {
        setSuccess('Enviamos um e-mail com instruções para redefinir sua senha. Verifique sua caixa de entrada.');
        // Ativa cooldown de 60s para evitar spam do endpoint
        setCooldown(60);
        const timer = setInterval(() => {
          setCooldown((c) => {
            if (c <= 1) {
              clearInterval(timer);
              return 0;
            }
            return c - 1;
          });
          return undefined as unknown as number; // satisfazer tipo do TS no callback
        }, 1000);
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

              <Button type="submit" className="w-full" disabled={!email || isLoading || cooldown > 0} loading={isLoading}>
                {!isLoading && <Send className="w-4 h-4 mr-2" />}
                {isLoading ? 'Enviando...' : cooldown > 0 ? `Aguarde ${cooldown}s` : 'Enviar link de redefinição'}
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
