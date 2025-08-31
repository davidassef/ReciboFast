# MIT License
# Autor atual: David Assef
# Descrição: Dockerfile multi-stage do backend ReciboFast
# Data: 29-08-2025

# Stage de build
FROM golang:1.22-alpine AS builder
WORKDIR /app
ENV CGO_ENABLED=0 GO111MODULE=on
COPY . .
RUN go mod download
RUN go build -ldflags "-s -w" -o server ./cmd/api

# Stage final minimalista
FROM scratch
WORKDIR /app
COPY --from=builder /app/server /app/server
# Certs (se necessário para HTTPS outbound)
# COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
ENV API_PORT=8080 APP_ENV=prod
EXPOSE 8080
ENTRYPOINT ["/app/server"]
