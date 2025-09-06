# MIT License
# Autor atual: David Assef
# Descrição: Dockerfile para o backend ReciboFast em Go
# Data: 03-09-2025

# Stage de build
FROM golang:1.23 AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o /backend ./cmd/api

# Stage final minimalista
FROM alpine:latest
WORKDIR /root/
COPY --from=builder /backend /backend
CMD ["/backend"]
