# MIT License
# Autor atual: David Assef
# Descrição: Dockerfile multi-stage para o frontend ReciboFast (Vite). Build com Node 20 e runtime NGINX com SPA fallback.
# Data: 08-09-2025

# Stage de build (Node LTS)
FROM node:20-alpine AS builder
WORKDIR /app

# Instala dependências de forma determinística
COPY package*.json ./
RUN npm ci

# Copia código e constrói para produção
COPY . .
# Suporte à variável de ambiente do hCaptcha durante o build (consumida pelo Vite)
ARG VITE_HCAPTCHA_SITE_KEY
ENV VITE_HCAPTCHA_SITE_KEY=$VITE_HCAPTCHA_SITE_KEY
RUN npm run build

# Stage de runtime (NGINX)
FROM nginx:1.27-alpine

# Copia configuração com SPA fallback
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copia artefatos estáticos
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

# Executa NGINX em foreground
CMD ["nginx", "-g", "daemon off;"]
