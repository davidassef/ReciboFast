/**
 * Autor: David Assef
 * Descrição: Testes para o sistema de assinaturas digitais
 * Licença: MIT License
 * Data: 01-09-2025
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SignatureCanvas } from '../components/SignatureCanvas';
import { SignatureCanvasControls } from '../components/SignatureCanvasControls';
import { SignatureMethodModal } from '../components/SignatureMethodModal';
import { useSignatureCanvas } from '../hooks/useSignatureCanvas';

// Mock do hook useSignatureCanvas
vi.mock('../hooks/useSignatureCanvas');

const mockUseSignatureCanvas = {
  canvasRef: { current: null },
  isDrawing: false,
  strokes: [],
  currentStroke: null,
  canUndo: false,
  canRedo: false,
  isEmpty: true,
  startDrawing: vi.fn(),
  draw: vi.fn(),
  stopDrawing: vi.fn(),
  undo: vi.fn(),
  redo: vi.fn(),
  clear: vi.fn(),
  exportCanvas: vi.fn(),
  setStrokeWidth: vi.fn(),
  setStrokeColor: vi.fn(),
  config: {
    strokeWidth: 2,
    strokeColor: '#000000'
  }
};

describe('Sistema de Assinaturas Digitais', () => {
  // Mock functions
  const mockOnOpenChange = vi.fn();
  const mockOnMethodSelect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useSignatureCanvas).mockReturnValue(mockUseSignatureCanvas);
  });

  describe('SignatureCanvas', () => {
    it('deve renderizar canvas com aria-label correto', () => {
      render(<SignatureCanvas />);

      const canvas = screen.getByRole('img', { name: /área de assinatura digital/i });
      expect(canvas).toBeInTheDocument();
    });

    it('deve exibir mensagem quando canvas está vazio', () => {
      render(<SignatureCanvas />);
      
      expect(screen.getByText(/assine aqui/i)).toBeInTheDocument();
    });

    it('deve chamar onSignatureChange quando assinatura muda', () => {
      const onSignatureChange = vi.fn();
      
      render(<SignatureCanvas onSignatureChange={onSignatureChange} />);
      
      expect(onSignatureChange).toHaveBeenCalledWith(true);
    });
  });

  describe('SignatureCanvasControls', () => {
    it('deve renderizar todos os controles', () => {
      render(<SignatureCanvasControls canvas={mockUseSignatureCanvas} />);
      
      // Verifica se os controles estão presentes
      expect(screen.getByText(/espessura/i)).toBeInTheDocument();
      expect(screen.getByText(/cor/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /desfazer/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /refazer/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /limpar/i })).toBeInTheDocument();
    });

    it('deve chamar clear quando botão limpar é clicado', async () => {
      const user = userEvent.setup();
      // Mock com isEmpty false para que o botão não esteja desabilitado
      const mockCanvas = {
        ...mockUseSignatureCanvas,
        isEmpty: false
      };
      render(<SignatureCanvasControls canvas={mockCanvas} />);

      const clearButton = screen.getByText('Limpar');
      await user.click(clearButton);

      expect(mockUseSignatureCanvas.clear).toHaveBeenCalled();
    });

    it('deve chamar undo quando botão desfazer é clicado', async () => {
      const user = userEvent.setup();
      const canvasWithUndo = { ...mockUseSignatureCanvas, canUndo: true };
      vi.mocked(useSignatureCanvas).mockReturnValue(canvasWithUndo);
      
      render(<SignatureCanvasControls canvas={canvasWithUndo} />);
      
      const undoButton = screen.getByRole('button', { name: /desfazer/i });
      await user.click(undoButton);
      
      expect(mockUseSignatureCanvas.undo).toHaveBeenCalled();
    });

    it('deve chamar redo quando botão refazer é clicado', async () => {
      const user = userEvent.setup();
      const canvasWithRedo = { ...mockUseSignatureCanvas, canRedo: true };
      vi.mocked(useSignatureCanvas).mockReturnValue(canvasWithRedo);
      
      render(<SignatureCanvasControls canvas={canvasWithRedo} />);
      
      const redoButton = screen.getByRole('button', { name: /refazer/i });
      await user.click(redoButton);
      
      expect(mockUseSignatureCanvas.redo).toHaveBeenCalled();
    });
  });

  describe('SignatureMethodModal', () => {
    it('deve renderizar corretamente', () => {
      render(
        <SignatureMethodModal
          open={true}
          onOpenChange={mockOnOpenChange}
          onMethodSelect={mockOnMethodSelect}
        />
      );

      expect(screen.getByText('Como você gostaria de criar sua assinatura?')).toBeInTheDocument();
      expect(screen.getByText('Desenho Digital')).toBeInTheDocument();
      expect(screen.getByText('Upload de Imagem')).toBeInTheDocument();
    });

    it('deve chamar onMethodSelect quando método é selecionado', async () => {
      const user = userEvent.setup();
      
      render(
        <SignatureMethodModal
          open={true}
          onOpenChange={mockOnOpenChange}
          onMethodSelect={mockOnMethodSelect}
        />
      );

      const canvasButton = screen.getByText('Desenho Digital');
      await user.click(canvasButton);
      
      const continueButton = screen.getByText('Continuar');
      await user.click(continueButton);

      expect(mockOnMethodSelect).toHaveBeenCalledWith('canvas');
    });

    it('deve chamar onCancel quando botão cancelar é clicado', async () => {
      const user = userEvent.setup();
      
      render(
        <SignatureMethodModal
          open={true}
          onOpenChange={mockOnOpenChange}
          onMethodSelect={mockOnMethodSelect}
        />
      );

      const cancelButton = screen.getByText('Cancelar');
      await user.click(cancelButton);

      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });

    it('não deve renderizar quando open é false', () => {
      render(
        <SignatureMethodModal
          open={false}
          onOpenChange={mockOnOpenChange}
          onMethodSelect={mockOnMethodSelect}
        />
      );

      expect(screen.queryByText('Como você gostaria de criar sua assinatura?')).not.toBeInTheDocument();
    });

    it('deve mostrar dica quando método é selecionado', async () => {
      const user = userEvent.setup();
      
      render(
        <SignatureMethodModal
          open={true}
          onOpenChange={mockOnOpenChange}
          onMethodSelect={mockOnMethodSelect}
        />
      );

      const canvasButton = screen.getByText('Desenho Digital');
      await user.click(canvasButton);
      
      expect(screen.getByText(/Use movimentos suaves e naturais/)).toBeInTheDocument();
    });

    it('deve desabilitar botão continuar quando nenhum método está selecionado', () => {
      render(
        <SignatureMethodModal
          open={true}
          onOpenChange={mockOnOpenChange}
          onMethodSelect={mockOnMethodSelect}
        />
      );

      const continueButton = screen.getByText('Continuar');
      expect(continueButton).toBeDisabled();
    });
  });

  describe('Integração dos Componentes', () => {
    it('deve funcionar corretamente quando canvas não está vazio', () => {
      const canvasWithContent = { ...mockUseSignatureCanvas, isEmpty: false };
      vi.mocked(useSignatureCanvas).mockReturnValue(canvasWithContent);
      
      render(<SignatureCanvas />);
      
      // Não deve mostrar a mensagem de canvas vazio
      expect(screen.queryByText(/clique e arraste para desenhar/i)).not.toBeInTheDocument();
    });

    it('deve permitir mudança de cor do traço', async () => {
      const user = userEvent.setup();
      
      render(
        <SignatureCanvasControls canvas={mockUseSignatureCanvas} />
      );

      // Testa seleção de cor preset
      const blackColorButton = screen.getByLabelText('Selecionar cor #000000');
      await user.click(blackColorButton);
      expect(mockUseSignatureCanvas.setStrokeColor).toHaveBeenCalledWith('#000000');

      // Testa seleção de cor personalizada
      const colorInput = screen.getByLabelText('Seletor de cor personalizada');
      await user.click(colorInput);
      
      // Simula mudança de cor
      fireEvent.change(colorInput, { target: { value: '#ff0000' } });
      expect(mockUseSignatureCanvas.setStrokeColor).toHaveBeenCalledWith('#ff0000');
    });

    it('deve permitir mudança de espessura do traço', async () => {
      const user = userEvent.setup();
      render(<SignatureCanvasControls canvas={mockUseSignatureCanvas} />);
      
      // Procura pelo slider de espessura
      const strokeSlider = screen.getByDisplayValue('2');
      
      fireEvent.change(strokeSlider, { target: { value: '5' } });
      
      expect(mockUseSignatureCanvas.setStrokeWidth).toHaveBeenCalledWith(5);
    });
  });
});