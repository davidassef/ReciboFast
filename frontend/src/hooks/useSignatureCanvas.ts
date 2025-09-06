import { useRef, useState, useCallback, useEffect } from 'react';
import { Point, Stroke, SignatureCanvasData, CanvasConfig, CANVAS_CONFIG } from '../types/signature';

export interface UseSignatureCanvasOptions {
  width?: number;
  height?: number;
  strokeWidth?: number;
  strokeColor?: string;
  backgroundColor?: string;
}

export interface UseSignatureCanvasReturn {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  isDrawing: boolean;
  strokes: Stroke[];
  isEmpty: boolean;
  config: CanvasConfig;
  // Drawing methods
  startDrawing: (point: Point) => void;
  draw: (point: Point) => void;
  stopDrawing: () => void;
  // Canvas controls
  clear: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  // Configuration
  setStrokeWidth: (width: number) => void;
  setStrokeColor: (color: string) => void;
  // Export
  exportAsDataURL: (format?: 'png' | 'jpeg') => string;
  exportAsBlob: (format?: 'png' | 'jpeg') => Promise<Blob | null>;
  getCanvasData: () => SignatureCanvasData;
  // Utility
  resize: (width: number, height: number) => void;
}

export const useSignatureCanvas = (options: UseSignatureCanvasOptions = {}): UseSignatureCanvasReturn => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [undoStack, setUndoStack] = useState<Stroke[][]>([]);
  const [redoStack, setRedoStack] = useState<Stroke[][]>([]);
  const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null);
  
  const [config, setConfig] = useState<CanvasConfig>({
    width: options.width || CANVAS_CONFIG.defaultSize.width,
    height: options.height || CANVAS_CONFIG.defaultSize.height,
    strokeWidth: options.strokeWidth || CANVAS_CONFIG.defaultStrokeWidth,
    strokeColor: options.strokeColor || CANVAS_CONFIG.defaultStrokeColor,
    backgroundColor: options.backgroundColor || CANVAS_CONFIG.backgroundColor
  });

  const isEmpty = strokes.length === 0;
  const canUndo = strokes.length > 0;
  const canRedo = redoStack.length > 0;

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = config.width;
    canvas.height = config.height;

    // Configure context
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.imageSmoothingEnabled = true;

    // Clear canvas with background color
    ctx.fillStyle = config.backgroundColor;
    ctx.fillRect(0, 0, config.width, config.height);
  }, [config.width, config.height, config.backgroundColor]);

  // Redraw all strokes
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = config.backgroundColor;
    ctx.fillRect(0, 0, config.width, config.height);

    // Draw all strokes
    strokes.forEach(stroke => {
      if (stroke.points.length < 2) return;

      ctx.beginPath();
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      
      for (let i = 1; i < stroke.points.length; i++) {
        const point = stroke.points[i];
        ctx.lineTo(point.x, point.y);
      }
      
      ctx.stroke();
    });
  }, [strokes, config]);

  // Redraw when strokes change
  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  const getPointFromEvent = useCallback((event: MouseEvent | TouchEvent): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0, timestamp: Date.now() };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let clientX: number, clientY: number;

    if ('touches' in event) {
      // Touch event
      const touch = event.touches[0] || event.changedTouches[0];
      clientX = touch.clientX;
      clientY = touch.clientY;
    } else {
      // Mouse event
      clientX = event.clientX;
      clientY = event.clientY;
    }

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
      timestamp: Date.now()
    };
  }, []);

  const startDrawing = useCallback((point: Point) => {
    setIsDrawing(true);
    setRedoStack([]); // Clear redo stack when starting new stroke
    
    const newStroke: Stroke = {
      id: `stroke_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      points: [point],
      width: config.strokeWidth,
      color: config.strokeColor,
      timestamp: Date.now()
    };
    
    setCurrentStroke(newStroke);
  }, [config.strokeWidth, config.strokeColor]);

  const draw = useCallback((point: Point) => {
    if (!isDrawing || !currentStroke) return;

    const updatedStroke = {
      ...currentStroke,
      points: [...currentStroke.points, point]
    };
    
    setCurrentStroke(updatedStroke);
    
    // Draw the line segment immediately for smooth drawing
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const points = updatedStroke.points;
    if (points.length < 2) return;
    
    ctx.beginPath();
    ctx.strokeStyle = updatedStroke.color;
    ctx.lineWidth = updatedStroke.width;
    
    const prevPoint = points[points.length - 2];
    ctx.moveTo(prevPoint.x, prevPoint.y);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
  }, [isDrawing, currentStroke]);

  const stopDrawing = useCallback(() => {
    if (!isDrawing || !currentStroke) return;
    
    setIsDrawing(false);
    
    // Add completed stroke to strokes array
    setUndoStack(prev => [...prev, strokes]);
    setStrokes(prev => [...prev, currentStroke]);
    setCurrentStroke(null);
  }, [isDrawing, currentStroke, strokes]);

  const clear = useCallback(() => {
    if (strokes.length === 0) return;
    
    setUndoStack(prev => [...prev, strokes]);
    setRedoStack([]);
    setStrokes([]);
    setCurrentStroke(null);
    setIsDrawing(false);
  }, [strokes]);

  const undo = useCallback(() => {
    if (!canUndo) return;
    
    setRedoStack(prev => [...prev, strokes]);
    const previousState = undoStack[undoStack.length - 1];
    setStrokes(previousState || []);
    setUndoStack(prev => prev.slice(0, -1));
  }, [canUndo, strokes, undoStack]);

  const redo = useCallback(() => {
    if (!canRedo) return;
    
    setUndoStack(prev => [...prev, strokes]);
    const nextState = redoStack[redoStack.length - 1];
    setStrokes(nextState);
    setRedoStack(prev => prev.slice(0, -1));
  }, [canRedo, strokes, redoStack]);

  const setStrokeWidth = useCallback((width: number) => {
    const clampedWidth = Math.max(
      CANVAS_CONFIG.minStrokeWidth,
      Math.min(CANVAS_CONFIG.maxStrokeWidth, width)
    );
    setConfig(prev => ({ ...prev, strokeWidth: clampedWidth }));
  }, []);

  const setStrokeColor = useCallback((color: string) => {
    setConfig(prev => ({ ...prev, strokeColor: color }));
  }, []);

  const exportAsDataURL = useCallback((format: 'png' | 'jpeg' = 'png'): string => {
    const canvas = canvasRef.current;
    if (!canvas) return '';
    
    return canvas.toDataURL(`image/${format}`, 0.9);
  }, []);

  const exportAsBlob = useCallback((format: 'png' | 'jpeg' = 'png'): Promise<Blob | null> => {
    const canvas = canvasRef.current;
    if (!canvas) return Promise.resolve(null);
    
    return new Promise((resolve) => {
      canvas.toBlob(resolve, `image/${format}`, 0.9);
    });
  }, []);

  const getCanvasData = useCallback((): SignatureCanvasData => {
    return {
      strokes,
      dimensions: {
        width: config.width,
        height: config.height
      },
      settings: {
        backgroundColor: config.backgroundColor,
        defaultStrokeWidth: config.strokeWidth,
        defaultStrokeColor: config.strokeColor
      },
      metadata: {
        createdAt: new Date().toISOString(),
        strokeCount: strokes.length,
        totalPoints: strokes.reduce((sum, stroke) => sum + stroke.points.length, 0),
        boundingBox: calculateBoundingBox(strokes)
      }
    };
  }, [strokes, config]);

  const resize = useCallback((width: number, height: number) => {
    const clampedWidth = Math.max(
      CANVAS_CONFIG.minSize.width,
      Math.min(CANVAS_CONFIG.maxSize.width, width)
    );
    const clampedHeight = Math.max(
      CANVAS_CONFIG.minSize.height,
      Math.min(CANVAS_CONFIG.maxSize.height, height)
    );
    
    setConfig(prev => ({
      ...prev,
      width: clampedWidth,
      height: clampedHeight
    }));
  }, []);

  return {
    canvasRef,
    isDrawing,
    strokes,
    isEmpty,
    config,
    startDrawing,
    draw,
    stopDrawing,
    clear,
    undo,
    redo,
    canUndo,
    canRedo,
    setStrokeWidth,
    setStrokeColor,
    exportAsDataURL,
    exportAsBlob,
    getCanvasData,
    resize
  };
};

// Helper function to calculate bounding box
function calculateBoundingBox(strokes: Stroke[]) {
  if (strokes.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  strokes.forEach(stroke => {
    stroke.points.forEach(point => {
      minX = Math.min(minX, point.x);
      minY = Math.min(minY, point.y);
      maxX = Math.max(maxX, point.x);
      maxY = Math.max(maxY, point.y);
    });
  });

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY
  };
}