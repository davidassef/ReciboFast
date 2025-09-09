// Autor: David Assef
// Descrição: Página de registro do usuário
// Data: 08-09-2025
// MIT License

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User, UserPlus, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button, Input, Card, CardHeader, CardBody } from '../components/ui';
import { cn } from '../lib/utils';
import GoogleLoginButton from '../components/GoogleLoginButton';
import Captcha from '../components/Captcha';
import LegalModal from '../components/LegalModal';
import Terms from './Terms';
import Privacy from './Privacy';
import { verifyCaptcha } from '../services/captcha';

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    terms: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Nome é obrigatório');
      return false;
    }
    if (!formData.email.trim()) {
      setError('Email é obrigatório');
      return false;
    }
    if (formData.password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem');
      return false;
    }
    if (!formData.terms) {
      setError('É necessário aceitar os Termos de Uso e a Política de Privacidade.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Verificação do hCaptcha (server-side em produção)
      if (!captchaToken) {
        setError('Confirme que você é humano.');
        setIsLoading(false);
        return;
      }
      const { ok, error: captchaError } = await verifyCaptcha(captchaToken);
      if (!ok) {
        setError(captchaError || 'Falha na verificação de segurança.');
        setIsLoading(false);
        return;
      }

      const { data, error } = await signUp(
        formData.email,
        formData.password,
        {
          full_name: formData.name
        }
      );
      
      if (error) {
        setError(error.message || 'Erro ao criar conta');
      } else if (data?.user) {
        setSuccess('Conta criada com sucesso! Verifique seu email para confirmar a conta.');
        // Redirecionar para login após alguns segundos
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    } catch {
      setError('Erro inesperado. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 6) strength++;
    if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength++;
    if (password.match(/\d/)) strength++;
    if (password.match(/[^\w\s]/)) strength++;
    return strength;
  };

  const passwordStrength = getPasswordStrength(formData.password);
  const strengthLabels = ['Muito fraca', 'Fraca', 'Média', 'Forte', 'Muito forte'];
  const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500'];

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
              <UserPlus className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-neutral-900 via-primary-800 to-neutral-900 bg-clip-text text-transparent mb-2 animate-slideInLeft">
              Criar conta no ReciboFast
            </h1>
            <p className="mt-4 text-base text-neutral-600 leading-relaxed animate-slideInRight">
              Ou{' '}
              <Link
                to="/login"
                className="font-semibold text-primary-600 hover:text-primary-500 transition-all duration-200 hover:underline decoration-2 underline-offset-2"
              >
                entre com sua conta existente
              </Link>
            </p>
          </CardHeader>

          <CardBody className="space-y-8">
            <form onSubmit={handleSubmit} className="space-y-6 animate-slideInUp">
              <div className="space-y-6">
                {/* Name */}
                <Input
                  id="name"
                  name="name"
                  type="text"
                  label="Nome Completo"
                  placeholder="Seu nome completo"
                  value={formData.name}
                  onChange={handleChange}
                  leftIcon={<User className="w-4 h-4" />}
                  required
                  autoComplete="name"
                />

                {/* Email */}
                <Input
                  id="email"
                  name="email"
                  type="email"
                  label="Email"
                  placeholder="seu@email.com"
                  value={formData.email}
                  onChange={handleChange}
                  leftIcon={<Mail className="w-4 h-4" />}
                  required
                  autoComplete="email"
                />

                {/* Password */}
                <div>
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    label="Senha"
                    placeholder="Mínimo 6 caracteres"
                    value={formData.password}
                    onChange={handleChange}
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
                    autoComplete="new-password"
                  />
              
                  {/* Password Strength */}
                  {formData.password && (
                    <div className="mt-3">
                      <div className="flex space-x-1">
                        {[1, 2, 3, 4].map((level) => (
                          <div
                            key={level}
                            className={cn(
                              'h-2 flex-1 rounded-full transition-all duration-300',
                              passwordStrength >= level ? strengthColors[passwordStrength - 1] : 'bg-neutral-200'
                            )}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-neutral-600 mt-2 font-medium">
                        Força da senha: <span className="font-semibold">{strengthLabels[passwordStrength - 1] || 'Muito fraca'}</span>
                      </p>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  label="Confirmar Senha"
                  placeholder="Confirme sua senha"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  leftIcon={<Lock className="w-4 h-4" />}
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="text-neutral-400 hover:text-neutral-600 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  }
                  required
                  autoComplete="new-password"
                />
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-gradient-to-r from-red-50 to-red-100/50 border border-red-200/60 rounded-xl p-4 flex items-center space-x-3 backdrop-blur-sm animate-slideInDown">
                  <div className="flex-shrink-0 w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  </div>
                  <p className="text-sm text-red-700 font-medium">{error}</p>
                </div>
              )}

              {/* Success Message */}
              {success && (
                <div className="bg-gradient-to-r from-green-50 to-green-100/50 border border-green-200/60 rounded-xl p-4 flex items-center space-x-3 backdrop-blur-sm animate-slideInDown">
                  <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <p className="text-sm text-green-700 font-medium">{success}</p>
                </div>
              )}

              {/* Terms and Conditions */}
              <div className="flex items-start space-x-4 p-4 bg-gradient-to-r from-neutral-50 to-neutral-100/50 rounded-xl border border-neutral-200/60">
                <input
                   id="terms"
                   name="terms"
                   type="checkbox"
                   required
                   checked={formData.terms}
                   onChange={(e) => setFormData(prev => ({ ...prev, terms: e.target.checked }))}
                   className="mt-1 h-5 w-5 text-primary-600 focus:ring-primary-500 focus:ring-2 border-neutral-300 rounded-md transition-all duration-200 hover:border-primary-400"
                 />
                <label htmlFor="terms" className="text-sm text-neutral-700 leading-relaxed">
                  Eu concordo com os{' '}
                  <a 
                    href="/terms" 
                    onClick={(e) => { e.preventDefault(); setShowTerms(true); }}
                    className="text-primary-600 hover:text-primary-500 font-semibold transition-all duration-200 hover:underline decoration-2 underline-offset-2 cursor-pointer"
                  >
                    Termos de Uso
                  </a>{' '}
                  e{' '}
                  <a 
                    href="/privacy" 
                    onClick={(e) => { e.preventDefault(); setShowPrivacy(true); }}
                    className="text-primary-600 hover:text-primary-500 font-semibold transition-all duration-200 hover:underline decoration-2 underline-offset-2 cursor-pointer"
                  >
                    Política de Privacidade
                  </a>
                </label>
              </div>

              {/* Captcha */}
              <div className="pt-2">
                <Captcha
                  onVerify={setCaptchaToken}
                  onError={() => setError('Falha na verificação de segurança. Tente novamente.')}
                  size="compact"
                  theme="light"
                  align="center"
                  className="mt-1"
                />
              </div>

              {/* Submit Button */}
              <Button
                 type="submit"
                 disabled={isLoading || !captchaToken}
                 className="w-full py-4 text-base font-semibold"
                 size="lg"
               >
                 {isLoading ? (
                   <div className="flex items-center space-x-3">
                     <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                     <span>Criando conta...</span>
                   </div>
                 ) : (
                   <div className="flex items-center space-x-2">
                     <UserPlus className="w-5 h-5" />
                     <span>Criar conta</span>
                   </div>
                 )}
               </Button>
            </form>

            {/* Divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full h-px bg-gradient-to-r from-transparent via-neutral-300 to-transparent" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-6 bg-white text-neutral-500 font-medium">Ou continue com</span>
              </div>
            </div>

            {/* Social Login */}
            <div className="space-y-4">
              <GoogleLoginButton
                onSuccess={() => {
                  // O redirecionamento será feito automaticamente pelo Supabase
                  console.log('Registro com Google iniciado');
                }}
                onError={(error) => {
                  setError(`Erro no registro com Google: ${error}`);
                }}
                disabled={isLoading}
                className="w-full"
              />
            </div>
          </CardBody>
        </Card>
        {/* Modais de Termos e Privacidade */}
        <LegalModal isOpen={showTerms} title="Termos de Uso" onClose={() => setShowTerms(false)}>
          <Terms />
        </LegalModal>
        <LegalModal isOpen={showPrivacy} title="Política de Privacidade" onClose={() => setShowPrivacy(false)}>
          <Privacy />
        </LegalModal>
      </div>
    </div>
  );
};

export default Register;