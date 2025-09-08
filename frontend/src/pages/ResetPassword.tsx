// Autor: David Assef
// Descrição: Página de redefinição de senha após clique no link do e-mail (Supabase recovery)
// Data: 08-09-2025
// MIT License

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, ShieldCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button, Input, Card, CardHeader, CardBody } from '../components/ui';
import Captcha from '../components/Captcha';

const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const { updatePassword } = useAuth();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!password || password.length < 6) {
      setError('A nova senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }
    if (!captchaToken) {
      setError('Confirme que você é humano.');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await updatePassword(password);
      if (error) {
        setError(error.message || 'Não foi possível redefinir sua senha. O link pode ter expirado.');
      } else {
        setSuccess('Senha redefinida com sucesso! Você será redirecionado para o login.');
        setTimeout(() => navigate('/login'), 2500);
      }
    } catch (err: any) {
      setError(err?.message || 'Erro inesperado ao redefinir a senha.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-secondary-50 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="max-w-md w-full relative z-10 animate-fadeIn">
        <Card className="shadow-2xl backdrop-blur-sm bg-white/95 border-0">
          <CardHeader className="text-center">
            <div className="mx-auto h-14 w-14 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
              <ShieldCheck className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-neutral-900 via-primary-800 to-neutral-900 bg-clip-text text-transparent mb-2">
              Redefinir senha
            </h1>
            <p className="text-neutral-600">Escolha sua nova senha abaixo.</p>
          </CardHeader>
          <CardBody>
            <form onSubmit={handleSubmit} className="space-y-6 animate-slideInUp">
              <Input
                id="password"
                name="password"
                type="password"
                label="Nova senha"
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftIcon={<Lock className="w-4 h-4" />}
                required
                autoComplete="new-password"
              />

              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                label="Confirmar nova senha"
                placeholder="Repita a nova senha"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                leftIcon={<Lock className="w-4 h-4" />}
                required
                autoComplete="new-password"
              />

              {/* Captcha */}
              <Captcha onVerify={setCaptchaToken} onError={() => setError('Falha na verificação de segurança. Tente novamente.')} />

              <Button type="submit" className="w-full" disabled={!captchaToken || isLoading} loading={isLoading}>
                {isLoading ? 'Salvando...' : 'Salvar nova senha'}
              </Button>

              {error && <p className="mt-2 text-sm text-error-700">{error}</p>}
              {success && <p className="mt-2 text-sm text-success-700">{success}</p>}

              <div className="mt-4 text-center">
                <Link to="/login" className="text-primary-600 hover:underline">Voltar ao login</Link>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};

export default ResetPassword;
