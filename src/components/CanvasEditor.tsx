import React, { useRef, useEffect, useState } from 'react';
import type { EditorSettings, ZoomKeyframe } from '../types';

interface CanvasEditorProps {
  videoElement: HTMLVideoElement | null;
  webcamElement: HTMLVideoElement | null;
  settings: EditorSettings;
  keyframes: ZoomKeyframe[];
  currentTime: number;
  onCanvasClick: (x: number, y: number) => void;
}

export const CanvasEditor: React.FC<CanvasEditorProps> = ({
  videoElement,
  webcamElement,
  settings,
  keyframes,
  currentTime,
  onCanvasClick
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 1920, height: 1080 });

  useEffect(() => {
    let width = 1920;
    let height = 1080;
    const is4K = settings.exportResolution === '4k';

    switch (settings.aspectRatio) {
      case '16-9':
        width = is4K ? 3840 : 1920;
        height = is4K ? 2160 : 1080;
        break;
      case '9-16':
        width = is4K ? 2160 : 1080;
        height = is4K ? 3840 : 1920;
        break;
      case '1-1':
        width = is4K ? 2160 : 1080;
        height = is4K ? 2160 : 1080;
        break;
      case '4-3':
        width = is4K ? 2880 : 1440;
        height = is4K ? 2160 : 1080;
        break;
    }

    setCanvasDimensions({ width, height });
  }, [settings.aspectRatio, settings.exportResolution]);

  // Easing function for smooth zooms
  const ease = (u: number, type: 'linear' | 'ease-out' | 'ease-in-out' | 'smooth') => {
    if (type === 'linear') return u;
    if (type === 'ease-out') return 1 - Math.pow(1 - u, 3);
    if (type === 'ease-in-out') return u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
    return u * u * (3 - 2 * u);
  };

  // Interpolation logic for zooms
  const getInterpolatedZoom = (t: number) => {
    if (keyframes.length === 0) {
      return { zoom: 1.0, x: 0.5, y: 0.5 };
    }

    const sorted = [...keyframes].sort((a, b) => a.time - b.time);
    const nextIndex = sorted.findIndex(kf => t <= kf.time);
    
    if (nextIndex === -1) {
      const last = sorted[sorted.length - 1];
      return { zoom: last.zoom, x: last.x, y: last.y };
    }

    const next = sorted[nextIndex];
    const prev = nextIndex > 0 ? sorted[nextIndex - 1] : null;

    const zoomStart = prev ? prev.zoom : 1.0;
    const xStart = prev ? prev.x : 0.5;
    const yStart = prev ? prev.y : 0.5;

    const transitionStart = next.time - next.duration;

    if (t < transitionStart) {
      return { zoom: zoomStart, x: xStart, y: yStart };
    }

    const u = (t - transitionStart) / next.duration;
    const factor = ease(Math.max(0, Math.min(1, u)), next.easing);

    return {
      zoom: zoomStart + (next.zoom - zoomStart) * factor,
      x: xStart + (next.x - xStart) * factor,
      y: yStart + (next.y - yStart) * factor
    };
  };

  // Canvas drawing loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      const cw = canvas.width;
      const ch = canvas.height;

      // Enable high-quality image smoothing
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // 1. Draw Canvas Background
      ctx.clearRect(0, 0, cw, ch);
      
      if (settings.backgroundType === 'solid') {
        ctx.fillStyle = settings.solidColor;
        ctx.fillRect(0, 0, cw, ch);
      } else {
        // Preset linear gradient
        let grad = ctx.createLinearGradient(0, 0, cw, ch);
        if (settings.gradientPresetId === 'sunset') {
          grad.addColorStop(0, '#f97316');
          grad.addColorStop(0.5, '#ec4899');
          grad.addColorStop(1, '#8b5cf6');
        } else if (settings.gradientPresetId === 'cyberpunk') {
          grad.addColorStop(0, '#a855f7');
          grad.addColorStop(1, '#06b6d4');
        } else if (settings.gradientPresetId === 'aurora') {
          grad.addColorStop(0, '#10b981');
          grad.addColorStop(0.5, '#06b6d4');
          grad.addColorStop(1, '#3b82f6');
        } else if (settings.gradientPresetId === 'nebula') {
          grad.addColorStop(0, '#4f46e5');
          grad.addColorStop(0.4, '#7c3aed');
          grad.addColorStop(1, '#db2777');
        } else if (settings.gradientPresetId === 'ocean') {
          grad.addColorStop(0, '#1e3a8a');
          grad.addColorStop(0.5, '#0284c7');
          grad.addColorStop(1, '#0d9488');
        } else if (settings.gradientPresetId === 'mono-dark') {
          grad.addColorStop(0, '#1f2937');
          grad.addColorStop(1, '#111827');
        } else if (settings.gradientPresetId === 'mono-light') {
          grad.addColorStop(0, '#f3f4f6');
          grad.addColorStop(1, '#e5e7eb');
        } else if (settings.gradientPresetId === 'mesh-candy') {
          // Candy Mesh background
          ctx.fillStyle = '#171a26';
          ctx.fillRect(0, 0, cw, ch);
          
          ctx.globalCompositeOperation = 'screen';
          let g1 = ctx.createRadialGradient(0, 0, 10, 0, 0, cw * 0.6);
          g1.addColorStop(0, 'rgba(192, 132, 252, 0.4)');
          g1.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = g1;
          ctx.fillRect(0,0,cw,ch);

          let g2 = ctx.createRadialGradient(cw, 0, 10, cw, 0, cw * 0.6);
          g2.addColorStop(0, 'rgba(244, 114, 182, 0.4)');
          g2.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = g2;
          ctx.fillRect(0,0,cw,ch);

          let g3 = ctx.createRadialGradient(cw, ch, 10, cw, ch, cw * 0.6);
          g3.addColorStop(0, 'rgba(96, 165, 250, 0.4)');
          g3.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = g3;
          ctx.fillRect(0,0,cw,ch);

          let g4 = ctx.createRadialGradient(0, ch, 10, 0, ch, cw * 0.6);
          g4.addColorStop(0, 'rgba(52, 211, 153, 0.4)');
          g4.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = g4;
          ctx.fillRect(0,0,cw,ch);

          ctx.globalCompositeOperation = 'source-over';
        }
        
        if (settings.gradientPresetId !== 'mesh-candy') {
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, cw, ch);
        }
      }

      // Add subtle noise texture
      ctx.fillStyle = 'rgba(255, 255, 255, 0.015)';
      for (let i = 0; i < 4; i++) {
        ctx.fillRect(Math.random() * cw, Math.random() * ch, 2, 2);
      }

      // 2. Card Dimensions (adapts to video aspect ratio to prevent stretching)
      let videoRatio = 9 / 16;
      if (videoElement && videoElement.videoWidth && videoElement.videoHeight) {
        videoRatio = videoElement.videoHeight / videoElement.videoWidth;
      }

      const baseCardW = cw * 0.8;
      const finalW = baseCardW * settings.scale;
      const finalH = finalW * videoRatio;
      const headerH = settings.macOSHeader ? 32 : 0;
      const totalH = finalH + headerH;

      const x0 = (cw - finalW) / 2;
      const y0 = (ch - totalH) / 2;

      // 3. Draw Box Shadow
      if (settings.shadowIntensity > 0) {
        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = settings.shadowIntensity;
        ctx.shadowOffsetY = settings.shadowIntensity * 0.3;
        
        ctx.beginPath();
        ctx.roundRect(x0, y0, finalW, totalH, settings.borderRadius);
        ctx.fillStyle = '#111317';
        ctx.fill();
        ctx.restore();
      }

      // 4. Draw Composite Card Frame (clipped rounded borders)
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(x0, y0, finalW, totalH, settings.borderRadius);
      ctx.clip();

      // Card base background
      ctx.fillStyle = '#1c1e24';
      ctx.fillRect(x0, y0, finalW, totalH);

      // Draw macOS header
      if (settings.macOSHeader) {
        ctx.fillStyle = '#131417';
        ctx.fillRect(x0, y0, finalW, headerH);

        const dotRadius = 4.5;
        const colors = ['#ff5f56', '#ffbd2e', '#27c93f'];
        colors.forEach((color, idx) => {
          ctx.beginPath();
          ctx.arc(x0 + 16 + idx * 14, y0 + headerH / 2, dotRadius, 0, Math.PI * 2);
          ctx.fillStyle = color;
          ctx.fill();
        });
      }

      // Draw Zoomed Video Screen
      if (videoElement && videoElement.readyState >= 2) {
        const vWidth = videoElement.videoWidth || 1920;
        const vHeight = videoElement.videoHeight || 1080;

        const zoomState = getInterpolatedZoom(currentTime);

        const sw = vWidth / zoomState.zoom;
        const sh = vHeight / zoomState.zoom;

        let sx = zoomState.x * vWidth - sw / 2;
        let sy = zoomState.y * vHeight - sh / 2;

        sx = Math.max(0, Math.min(vWidth - sw, sx));
        sy = Math.max(0, Math.min(vHeight - sh, sy));

        ctx.drawImage(
          videoElement,
          sx, sy, sw, sh,
          x0, y0 + headerH, finalW, finalH
        );
      } else {
        ctx.fillStyle = '#0a0d14';
        ctx.fillRect(x0, y0 + headerH, finalW, finalH);
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.font = 'bold 24px Inter';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Screen Recording Preview', x0 + finalW / 2, y0 + headerH + finalH / 2);
      }

      // Draw Circular Webcam overlay inside the card (so it scale clips perfectly)
      if (settings.cameraPosition !== 'none') {
        const r = settings.cameraSize / 2;
        const margin = 20;
        let cx = x0 + r + margin;
        let cy = y0 + r + margin + headerH;

        if (settings.cameraPosition === 'top-right') {
          cx = x0 + finalW - r - margin;
        } else if (settings.cameraPosition === 'bottom-left') {
          cy = y0 + totalH - r - margin;
        } else if (settings.cameraPosition === 'bottom-right') {
          cx = x0 + finalW - r - margin;
          cy = y0 + totalH - r - margin;
        }

        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.clip();

        if (webcamElement && webcamElement.readyState >= 2) {
          // Crop webcam square
          const webW = webcamElement.videoWidth;
          const webH = webcamElement.videoHeight;
          const sq = Math.min(webW, webH);
          const wsx = (webW - sq) / 2;
          const wsy = (webH - sq) / 2;

          ctx.drawImage(
            webcamElement,
            wsx, wsy, sq, sq,
            cx - r, cy - r, 2 * r, 2 * r
          );
        } else {
          // Fallback: Draw a premium stylized gradient avatar preview
          let camGrad = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
          camGrad.addColorStop(0, '#ffffff'); 
          camGrad.addColorStop(1, '#a3a3a3'); 
          ctx.fillStyle = camGrad;
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.fill();

          // Draw mock webcam camera silhouette icon
          ctx.fillStyle = '#0a0a0a';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.font = `bold ${Math.round(r * 0.4)}px Inter`;
          ctx.fillText('CAM', cx, cy);
        }
        ctx.restore();

        // Stroke Webcam Border
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.lineWidth = 3;
        ctx.strokeStyle = settings.cameraBorderColor;
        ctx.stroke();
      }

      // Draw Card Border
      if (settings.borderWidth > 0) {
        ctx.beginPath();
        ctx.roundRect(x0, y0, finalW, totalH, settings.borderRadius);
        ctx.lineWidth = settings.borderWidth * 2;
        ctx.strokeStyle = settings.borderColor;
        ctx.stroke();
      }

      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => cancelAnimationFrame(animId);
  }, [videoElement, webcamElement, settings, keyframes, currentTime, canvasDimensions]);

  // Click on Canvas handles setting keyframes
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const cvsX = clickX * scaleX;
    const cvsY = clickY * scaleY;

    const cw = canvas.width;
    const ch = canvas.height;

    // Adapt to video aspect ratio for canvas clicks
    let videoRatio = 9 / 16;
    if (videoElement && videoElement.videoWidth && videoElement.videoHeight) {
      videoRatio = videoElement.videoHeight / videoElement.videoWidth;
    }

    const baseCardW = cw * 0.8;
    const finalW = baseCardW * settings.scale;
    const finalH = finalW * videoRatio;
    const headerH = settings.macOSHeader ? 32 : 0;
    const totalH = finalH + headerH;

    const x0 = (cw - finalW) / 2;
    const y0 = (ch - totalH) / 2;
    
    const cardLeft = x0;
    const cardTop = y0 + headerH;

    const localX = (cvsX - cardLeft) / finalW;
    const localY = (cvsY - cardTop) / finalH;

    const normX = Math.max(0, Math.min(1, localX));
    const normY = Math.max(0, Math.min(1, localY));

    onCanvasClick(normX, normY);
  };

  return (
    <div 
      ref={containerRef}
      className="flex-1 flex-center p-6 relative overflow-hidden bg-black/40"
      style={{ minHeight: '350px' }}
    >
      <div className="absolute top-4 left-4 z-10 bg-black/60 border border-glass rounded-lg px-3 py-1.5 text-[10px] text-gray-300">
        💡 <strong>Tip:</strong> Click on the screen preview to place zoom focus points!
      </div>
      <canvas
        ref={canvasRef}
        width={canvasDimensions.width}
        height={canvasDimensions.height}
        onClick={handleCanvasClick}
        className="max-w-full max-h-full aspect-video rounded-xl shadow-2xl border border-glass bg-black cursor-crosshair transition-shadow hover:shadow-[0_0_50px_rgba(139,92,246,0.1)]"
        style={{
          width: 'auto',
          height: 'auto',
          maxWidth: '100%',
          maxHeight: '100%',
          aspectRatio: settings.aspectRatio.replace('-', '/')
        }}
      />
    </div>
  );
};
