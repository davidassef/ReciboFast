# Configuração Google OAuth - ReciboFast

**Autor:** David Assef  
**Data:** 29-08-2025  
**Licença:** MIT License  
**Descrição:** Guia passo a passo para configurar Google OAuth no Supabase

---

## 1. Pré-requisitos

- Acesso ao [Google Cloud Console](https://console.cloud.google.com/)
- Acesso ao [Supabase Dashboard](https://supabase.com/dashboard)
- Projeto ReciboFast já configurado no Supabase

---

## 2. Configuração no Google Cloud Console

### 2.1 Criar/Selecionar Projeto

1. Acesse o [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto ou selecione um existente
3. Anote o **Project ID** para referência

### 2.2 Habilitar Google+ API

1. No menu lateral, vá em **APIs & Services** > **Library**
2. Busque por "Google+ API" ou "Google Identity"
3. Clique em **Enable** para habilitar a API

### 2.3 Configurar OAuth Consent Screen

1. Vá em **APIs & Services** > **OAuth consent screen**
2. Selecione **External** (para usuários externos)
3. Preencha as informações obrigatórias:
   - **App name:** ReciboFast
   - **User support email:** seu-email@exemplo.com
   - **Developer contact information:** seu-email@exemplo.com
4. Clique em **Save and Continue**
5. Em **Scopes**, adicione os escopos básicos (email, profile)
6. Continue até finalizar

### 2.4 Criar Credenciais OAuth 2.0

1. Vá em **APIs & Services** > **Credentials**
2. Clique em **+ CREATE CREDENTIALS** > **OAuth 2.0 Client IDs**
3. Selecione **Web application**
4. Configure:
   - **Name:** ReciboFast Web Client
   - **Authorized JavaScript origins:**
     - `http://localhost:5173` (desenvolvimento)
     - `https://seu-dominio.com` (produção)
   - **Authorized redirect URIs:**
     - `https://seu-projeto-supabase.supabase.co/auth/v1/callback`
     - `http://localhost:54321/auth/v1/callback` (se usando Supabase local)

5. Clique em **Create**
6. **IMPORTANTE:** Copie e salve:
   - **Client ID**
   - **Client Secret**

---

## 3. Configuração no Supabase

### 3.1 Acessar Authentication Settings

1. Acesse o [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto ReciboFast
3. Vá em **Authentication** > **Providers**

### 3.2 Configurar Google Provider

1. Encontre **Google** na lista de providers
2. Clique no toggle para **Enable**
3. Preencha os campos:
   - **Client ID:** Cole o Client ID do Google Cloud Console
   - **Client Secret:** Cole o Client Secret do Google Cloud Console
4. Clique em **Save**

### 3.3 Configurar Site URL (Importante)

1. Vá em **Authentication** > **Settings**
2. Em **Site URL**, configure:
   - **Development:** `http://localhost:5173`
   - **Production:** `https://seu-dominio.com`
3. Em **Redirect URLs**, adicione:
   - `http://localhost:5173/auth/callback`
   - `https://seu-dominio.com/auth/callback`

---

## 4. Verificação da Configuração

### 4.1 URLs Importantes

Após a configuração, você terá acesso às seguintes URLs:

- **Supabase URL:** `https://seu-projeto.supabase.co`
- **Supabase Anon Key:** (disponível no dashboard)
- **Google OAuth Redirect:** `https://seu-projeto.supabase.co/auth/v1/callback`

### 4.2 Teste Básico

1. No Supabase Dashboard, vá em **Authentication** > **Users**
2. Clique em **Invite user** para testar se o sistema está funcionando
3. Verifique se não há erros nos logs

---

## 5. Configurações de Segurança

### 5.1 Domínios Autorizados

Certifique-se de que apenas domínios confiáveis estão configurados:

- **Desenvolvimento:** `localhost:5173`
- **Produção:** Seu domínio real

### 5.2 Escopos Mínimos

O Google OAuth deve solicitar apenas:
- `email` - Para identificação do usuário
- `profile` - Para nome e foto do usuário

---

## 6. Troubleshooting

### 6.1 Erros Comuns

**Erro: "redirect_uri_mismatch"**
- Verifique se as URLs de redirect estão corretas no Google Cloud Console
- Certifique-se de que não há barras extras no final das URLs

**Erro: "invalid_client"**
- Verifique se o Client ID e Client Secret estão corretos
- Confirme se a API está habilitada no Google Cloud Console

**Erro: "access_denied"**
- Verifique se o OAuth Consent Screen está configurado corretamente
- Confirme se o usuário tem permissão para acessar a aplicação

### 6.2 Logs para Verificação

- **Supabase:** Authentication > Logs
- **Google Cloud:** Logging > Logs Explorer
- **Browser:** Developer Tools > Console

---

## 7. Próximos Passos

Após completar esta configuração:

1. ✅ Google Provider configurado no Supabase
2. ⏳ Implementar função `signInWithGoogle()` no frontend
3. ⏳ Criar componente de botão social
4. ⏳ Atualizar páginas de login e registro
5. ⏳ Testar fluxo completo

---

## 8. Referências

- [Supabase Auth with Google](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Google OAuth 2.0 Setup](https://developers.google.com/identity/protocols/oauth2)
- [Google Cloud Console](https://console.cloud.google.com/)

---

**⚠️ IMPORTANTE:** Mantenha suas credenciais seguras e nunca as compartilhe publicamente. Use variáveis de ambiente para armazenar informações sensíveis.
