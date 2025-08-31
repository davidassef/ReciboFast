// MIT License
// Autor atual: David Assef
// Descrição: Logger estruturado com zap para o backend ReciboFast
// Data: 29-08-2025

package logging

import (
	"fmt"

	"go.uber.org/zap"
)

// Field representa um par chave-valor genérico para logs sem acoplar diretamente ao zap.
type Field struct{ Key string; Val interface{} }

// Logger define o contrato mínimo usado no projeto para logs.
type Logger interface{
	Debug(msg string, fields ...Field)
	Info(msg string, fields ...Field)
	Warn(msg string, fields ...Field)
	Error(msg string, fields ...Field)
	Fatal(msg string, fields ...Field)
	Sync() error
}

type zapLogger struct{ l *zap.Logger }

func NewLogger(env string) Logger {
	var zl *zap.Logger
	var err error
	if env == "prod" {
		zl, err = zap.NewProduction()
	} else {
		zl, err = zap.NewDevelopment()
	}
	if err != nil { panic(err) }
	return &zapLogger{l: zl}
}

func (z *zapLogger) Debug(msg string, fields ...Field) { z.l.Debug(msg, toZap(fields...)...) }
func (z *zapLogger) Info(msg string, fields ...Field)  { z.l.Info(msg, toZap(fields...)...) }
func (z *zapLogger) Warn(msg string, fields ...Field)  { z.l.Warn(msg, toZap(fields...)...) }
func (z *zapLogger) Error(msg string, fields ...Field) { z.l.Error(msg, toZap(fields...)...) }
func (z *zapLogger) Fatal(msg string, fields ...Field) { z.l.Fatal(msg, toZap(fields...)...) }
func (z *zapLogger) Sync() error                       { return z.l.Sync() }

func toZap(fields ...Field) []zap.Field {
	zs := make([]zap.Field, 0, len(fields))
	for _, f := range fields {
		zs = append(zs, zap.Any(f.Key, f.Val))
	}
	return zs
}

func (f Field) String() string { return fmt.Sprintf("%s=%v", f.Key, f.Val) }
