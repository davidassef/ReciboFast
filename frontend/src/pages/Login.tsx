// Autor: David Assef
// Descrição: Página de login do usuário
// Data: 05-09-2025
// MIT License

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, LogIn, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button, Input, Card, CardHeader, CardBody } from '../components/ui';
import GoogleLoginButton from '../components/GoogleLoginButton';

// Mapeia mensagens de erro do Supabase para mensagens amigáveis
const mapSupabaseAuthError = (error: unknown): string => {
  if (!error) return 'Erro ao fazer login. Tente novamente.';

  const msg = (error as any)?.message?.toString()?.toLowerCase() ?? '';
  const status = (error as any)?.status as number | undefined;

  if (msg.includes('email not confirmed') || msg.includes('email_not_confirmed')) {
    return 'Email não confirmado. Verifique sua caixa de entrada para confirmar sua conta.';
  }
  if (msg.includes('invalid login credentials') || msg.includes('invalid_credentials')) {
    return 'Credenciais inválidas. Verifique seu email e senha.';
  }
  if (status === 400 && (msg.includes('invalid_grant') || msg.includes('grant'))) {
    return 'Não foi possível autenticar. Verifique suas credenciais ou tente redefinir sua senha.';
  }
  if (status === 429 || msg.includes('rate limit')) {
    return 'Muitas tentativas de login. Aguarde alguns minutos e tente novamente.';
  }
  return (error as any)?.message || 'Erro ao fazer login. Tente novamente.';
};

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { signIn, resendEmailConfirmation, refreshUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const { data, error } = await signIn(email, password);
      
      if (error) {
        setError(mapSupabaseAuthError(error));
      } else if (data?.session) {
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Erro de login:', error);
      setError(mapSupabaseAuthError(error));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-secondary-50 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-100 rounded-full mix-blend-multiply opacity-30 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary-100 rounded-full mix-blend-multiply opacity-30 animate-blob [animation-delay:2s]"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-accent-100 rounded-full mix-blend-multiply opacity-30 animate-blob [animation-delay:4s]"></div>
      </div>
      
      <div className="max-w-md w-full relative z-10 animate-fadeIn">
        <Card className="shadow-2xl backdrop-blur-sm bg-white/95 border-0">
          <CardHeader className="text-center">
            <div className="mx-auto h-16 w-16 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center mb-8 shadow-lg transform hover:scale-105 transition-all duration-300 animate-scaleIn">
              <LogIn className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-neutral-900 via-primary-800 to-neutral-900 bg-clip-text text-transparent mb-2 animate-slideInLeft">
              Entrar no ReciboFast
            </h1>
            <p className="mt-4 text-base text-neutral-600 leading-relaxed animate-slideInRight">
              Ou{' '}
              <Link
                to="/register"
                className="font-semibold text-primary-600 hover:text-primary-500 transition-all duration-200 hover:underline decoration-2 underline-offset-2"
              >
                crie sua conta gratuita
              </Link>
            </p>
          </CardHeader>

          <CardBody className="space-y-8">
            <form onSubmit={handleSubmit} className="space-y-6 animate-slideInUp">
              {/* Email */}
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

              {/* Password */}
              <Input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                label="Senha"
                placeholder="Sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftIcon={<Lock className="w-4 h-4" />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-neutral-400 hover:text-neutral-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
                required
                autoComplete="current-password"
              />

              {/* Error Message */}
              {error && (
                <div className="flex items-center space-x-3 text-error-700 bg-gradient-to-r from-error-50 to-error-100 p-4 rounded-xl border border-error-200 shadow-sm animate-slideInDown">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 animate-pulse" />
                  <span className="text-sm font-medium">{error}</span>
                </div>
              )}

              {/* Ações para e-mail não confirmado */}
              {error && error.toLowerCase().includes('email não confirmado') && (
                <div className="flex flex-wrap gap-2 mt-2 animate-fadeIn">
                  <button
                    type="button"
                    onClick={async () => {
                      if (!email) return;
                      const { error } = await resendEmailConfirmation(email);
                      if (error) {
                        console.error('Falha ao reenviar confirmação:', error);
                      }
                    }}
                    className="inline-flex items-center gap-2 rounded-lg bg-warning-600 px-3 py-2 text-white text-xs hover:bg-warning-700 transition-colors"
                  >
                    Reenviar confirmação
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      await refreshUser();
                    }}
                    className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs text-warning-700 border border-warning-300 hover:bg-warning-100 transition-colors"
                  >
                    Já confirmei — Atualizar status
                  </button>
                </div>
              )}

              {/* Remember me and Forgot password */}
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center group">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-5 w-5 text-primary-600 focus:ring-primary-500 focus:ring-2 border-2 border-neutral-300 rounded-lg transition-all duration-200 hover:border-primary-400"
                  />
                  <label htmlFor="remember-me" className="ml-3 block text-sm font-medium text-neutral-700 group-hover:text-primary-600 transition-colors duration-200 cursor-pointer">
                    Lembrar de mim
                  </label>
                </div>

                <div className="text-sm">
                  <Link
                    to="/forgot-password"
                    className="font-semibold text-primary-600 hover:text-primary-500 transition-all duration-200 hover:underline decoration-2 underline-offset-2"
                  >
                    Esqueceu a senha?
                  </Link>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                disabled={isLoading}
                loading={isLoading}
              >
                {!isLoading && <LogIn className="w-4 h-4 mr-2" />}
                {isLoading ? 'Entrando...' : 'Entrar'}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full h-px bg-gradient-to-r from-transparent via-neutral-300 to-transparent" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 py-1 bg-white text-neutral-500 font-medium rounded-full shadow-sm border border-neutral-200">Ou continue com</span>
              </div>
            </div>

            {/* Social Login */}
            <div className="space-y-3">
              <GoogleLoginButton
                onSuccess={() => {
                  // O redirecionamento será feito automaticamente pelo Supabase
                  console.log('Login com Google iniciado');
                }}
                onError={(error) => {
                  setError(`Erro no login com Google: ${error}`);
                }}
                disabled={isLoading}
                className="w-full"
              />
            </div>

            {/* Footer */}
            <div className="text-center pt-4">
              <p className="text-xs text-neutral-500 leading-relaxed">
                Ao entrar, você concorda com nossos{' '}
                <Link to="/terms" className="text-primary-600 hover:text-primary-500 font-medium transition-colors duration-200 hover:underline decoration-1 underline-offset-2">
                  Termos de Uso
                </Link>{' '}
                e{' '}
                <Link to="/privacy" className="text-primary-600 hover:text-primary-500 font-medium transition-colors duration-200 hover:underline decoration-1 underline-offset-2">
                  Política de Privacidade
                </Link>
              </p>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};

export default Login;