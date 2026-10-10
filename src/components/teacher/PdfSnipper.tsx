import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Crop, Check, X, RotateCcw } from 'lucide-react';

// Configure pdfjs worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

interface PdfSnipperProps {
  pdfFile: File | null;
  pdfArrayBuffer?: ArrayBuffer | null;
  onSnippetCaptured: (imageUrl: string) => void;
}

export const PdfSnipper: React.FC<PdfSnipperProps> = ({
  pdfFile,
  pdfArrayBuffer,
  onSnippetCaptured,
}) => {
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [pageNum, setPageNum] = useState<number>(1);
  const [numPages, setNumPages] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.5);
  const [isSnippingMode, setIsSnippingMode] = useState<boolean>(false);
  const [isSelecting, setIsSelecting] = useState<boolean>(false);
  const [selectionBox, setSelectionBox] = useState<{ startX: number; startY: number; endX: number; endY: number } | null>(null);
  const [capturedPreview, setCapturedPreview] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Load PDF document
  useEffect(() => {
    let isCancelled = false;

    const loadDoc = async () => {
      try {
        let data: ArrayBuffer | null = null;
        if (pdfArrayBuffer) {
          data = pdfArrayBuffer;
        } else if (pdfFile) {
          data = await pdfFile.arrayBuffer();
        }

        if (!data) return;

        const loadingTask = pdfjsLib.getDocument({ data });
        const doc = await loadingTask.promise;
        if (!isCancelled) {
          setPdfDoc(doc);
          setNumPages(doc.numPages);
          setPageNum(1);
        }
      } catch (err) {
        console.error('Failed to load PDF document:', err);
      }
    };

    loadDoc();
    return () => {
      isCancelled = true;
    };
  }, [pdfFile, pdfArrayBuffer]);

  // Render current page
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;

    let isCancelled = false;

    const renderPage = async () => {
      try {
        const page = await pdfDoc.getPage(pageNum);
        if (isCancelled) return;

        const viewport = page.getViewport({ scale });
        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext('2d');
        if (!context) return;

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
          canvas: canvas,
        };

        await page.render(renderContext).promise;
      } catch (err) {
        console.error('Error rendering page:', err);
      }
    };

    renderPage();
    return () => {
      isCancelled = true;
    };
  }, [pdfDoc, pageNum, scale]);

  // Handle snipping mouse interactions
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isSnippingMode || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsSelecting(true);
    setSelectionBox({ startX: x, startY: y, endX: x, endY: y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isSelecting || !selectionBox || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const y = Math.max(0, Math.min(e.clientY - rect.top, rect.height));

    setSelectionBox((prev) => (prev ? { ...prev, endX: x, endY: y } : null));
  };

  const handleMouseUp = () => {
    if (!isSelecting || !selectionBox || !canvasRef.current) return;
    setIsSelecting(false);

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();

    // Scale coordinates from DOM element to canvas internal resolution
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const left = Math.min(selectionBox.startX, selectionBox.endX) * scaleX;
    const top = Math.min(selectionBox.startY, selectionBox.endY) * scaleY;
    const width = Math.abs(selectionBox.endX - selectionBox.startX) * scaleX;
    const height = Math.abs(selectionBox.endY - selectionBox.startY) * scaleY;

    // Minimum size check (at least 20x20 pixels)
    if (width > 20 && height > 20) {
      const cropCanvas = document.createElement('canvas');
      cropCanvas.width = width;
      cropCanvas.height = height;
      const cropCtx = cropCanvas.getContext('2d');

      if (cropCtx) {
        cropCtx.drawImage(canvas, left, top, width, height, 0, 0, width, height);
        const dataUrl = cropCanvas.toDataURL('image/png');
        setCapturedPreview(dataUrl);
      }
    }
  };

  const confirmSnippet = () => {
    if (capturedPreview) {
      onSnippetCaptured(capturedPreview);
      setCapturedPreview(null);
      setSelectionBox(null);
      setIsSnippingMode(false);
    }
  };

  const cancelSnippet = () => {
    setCapturedPreview(null);
    setSelectionBox(null);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100 rounded-xl overflow-hidden shadow-xl border border-slate-800">
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between px-4 py-2.5 bg-slate-800 border-b border-slate-700 gap-2">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">Xem PDF</span>
          <span className="text-xs text-slate-400">|</span>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setPageNum((p) => Math.max(1, p - 1))}
              disabled={pageNum <= 1}
              className="p-1 rounded hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent"
              title="Trang trước"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono font-medium px-2 py-0.5 bg-slate-900 rounded">
              {pageNum} / {numPages}
            </span>
            <button
              onClick={() => setPageNum((p) => Math.min(numPages, p + 1))}
              disabled={pageNum >= numPages}
              className="p-1 rounded hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent"
              title="Trang sau"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Zoom & Snipping Tools */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1 bg-slate-900 px-1 py-0.5 rounded">
            <button
              onClick={() => setScale((s) => Math.max(0.8, s - 0.2))}
              className="p-1 hover:text-white text-slate-400"
              title="Thu nhỏ"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs font-mono px-1">{Math.round(scale * 100)}%</span>
            <button
              onClick={() => setScale((s) => Math.min(3.0, s + 0.2))}
              className="p-1 hover:text-white text-slate-400"
              title="Phóng to"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Snipping Toggle */}
          <button
            onClick={() => {
              setIsSnippingMode(!isSnippingMode);
              setSelectionBox(null);
              setCapturedPreview(null);
            }}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              isSnippingMode
                ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/30 ring-2 ring-rose-400'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow'
            }`}
          >
            <Crop className="w-3.5 h-3.5" />
            <span>{isSnippingMode ? 'Đang Cắt Ảnh (Hủy)' : 'Cắt Ảnh Từ PDF'}</span>
          </button>
        </div>
      </div>

      {/* Snipping Hint Banner */}
      {isSnippingMode && !capturedPreview && (
        <div className="bg-amber-500/20 text-amber-200 border-b border-amber-500/30 px-4 py-1.5 text-xs flex items-center justify-between">
          <span>
            👉 <strong>Hướng dẫn:</strong> Kéo chuột quanh hình vẽ/đồ thị trên trang PDF để cắt ảnh.
          </span>
          <span className="text-amber-400 font-mono text-[11px]">Nhấp chuột & kéo vùng chọn</span>
        </div>
      )}

      {/* Canvas Viewport */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto p-4 flex justify-center items-start bg-slate-950 relative"
      >
        <div
          className={`relative select-none shadow-2xl ${
            isSnippingMode ? 'cursor-crosshair' : 'cursor-default'
          }`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        >
          <canvas ref={canvasRef} className="block rounded bg-white" />

          {/* Selection Box Overlay */}
          {selectionBox && (
            <div
              className="absolute border-2 border-emerald-400 bg-emerald-500/20 pointer-events-none transition-none"
              style={{
                left: `${Math.min(selectionBox.startX, selectionBox.endX)}px`,
                top: `${Math.min(selectionBox.startY, selectionBox.endY)}px`,
                width: `${Math.abs(selectionBox.endX - selectionBox.startX)}px`,
                height: `${Math.abs(selectionBox.endY - selectionBox.startY)}px`,
              }}
            >
              <div className="absolute -top-6 left-0 bg-emerald-600 text-white text-[10px] px-1.5 py-0.5 rounded font-mono">
                {Math.round(Math.abs(selectionBox.endX - selectionBox.startX))} ×{' '}
                {Math.round(Math.abs(selectionBox.endY - selectionBox.startY))} px
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Captured Image Confirmation Popover */}
      {capturedPreview && (
        <div className="absolute bottom-4 right-4 max-w-sm bg-slate-800 border-2 border-emerald-500 rounded-xl p-3 shadow-2xl z-20 animate-in fade-in slide-in-from-bottom-4">
          <div className="text-xs font-semibold text-emerald-400 mb-2 flex items-center justify-between">
            <span>Đã cắt thành công ảnh hình học!</span>
            <button onClick={cancelSnippet} className="text-slate-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="bg-slate-900 rounded p-1 max-h-48 overflow-hidden flex items-center justify-center mb-3 border border-slate-700">
            <img src={capturedPreview} alt="Snippet Preview" className="max-h-44 object-contain rounded" />
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={confirmSnippet}
              className="flex-1 flex items-center justify-center space-x-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold transition"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Dùng Ảnh Này</span>
            </button>
            <button
              onClick={cancelSnippet}
              className="flex items-center justify-center space-x-1 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded text-xs font-medium transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Cắt Lại</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
