# MIT License
# Autor atual: David Assef
# Descrição: Dockerfile para o frontend ReciboFast em Node.js
# Data: 03-09-2025

FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build --prod

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/build /app
CMD ["npm", "start"]
