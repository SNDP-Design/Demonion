import React, { useRef, useEffect, useState } from 'react';
import type { EditorSettings } from '../types';

interface CanvasEditorProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  videoElement: HTMLVideoElement | null;
  webcamElement: HTMLVideoElement | null;
  showWebcamOverlay: boolean;
  settings: EditorSettings;
}

export const CanvasEditor: React.FC<CanvasEditorProps> = ({
  canvasRef,
  videoElement,
  webcamElement,
  showWebcamOverlay,
  settings
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 1920, height: 1080 });

  // Refs for tracking values inside the high-frequency animation loop without restarting it
  const settingsRef = useRef(settings);
  const videoElementRef = useRef(videoElement);
  const webcamElementRef = useRef(webcamElement);

  useEffect(() => {
    settingsRef.current = settings;
    videoElementRef.current = videoElement;
    webcamElementRef.current = webcamElement;
  });

  useEffect(() => {
    let width = 1920;
    let height = 1080;
    const is4K = settings.exportResolution === '4k';

    switch (settings.aspectRatio) {
      case '16-10':
        width = is4K ? 3840 : 1920;
        height = is4K ? 2400 : 1200;
        break;
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

      const settings = settingsRef.current;
      const videoElement = videoElementRef.current;
      const webcamElement = webcamElementRef.current;

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

      const renderScale = settings.exportResolution === '4k' ? 2 : 1;
      const isSideCamera = showWebcamOverlay && (settings.cameraPosition === 'side-left' || settings.cameraPosition === 'side-right');
      const baseCardW = cw * 0.8;
      const desiredCardW = baseCardW * settings.scale;
      const sideGap = isSideCamera ? 24 * renderScale : 0;
      const sideCameraSize = isSideCamera ? Math.min(settings.cameraSize * 2 * renderScale, cw * 0.28) : 0;
      const maxLayoutW = cw * 0.92;
      const maxCardW = isSideCamera ? Math.max(cw * 0.48, maxLayoutW - sideCameraSize - sideGap) : desiredCardW;
      const finalW = Math.min(desiredCardW, maxCardW);
      const finalH = finalW * videoRatio;
      const headerH = settings.macOSHeader ? 32 : 0;
      const totalH = finalH + headerH;

      const groupW = isSideCamera ? finalW + sideGap + sideCameraSize : finalW;
      const groupX = (cw - groupW) / 2;
      const x0 = isSideCamera && settings.cameraPosition === 'side-left' ? groupX + sideCameraSize + sideGap : groupX;
      const y0 = (ch - totalH) / 2;

      const drawCamera = (cameraX: number, cameraY: number, cameraSize: number, shadow = false) => {
        const r = cameraSize / 2;
        const isCircleCamera = settings.cameraShape === 'circle';
        const cameraCornerRadius = isCircleCamera ? r : cameraSize * 0.2;

        if (shadow) {
          ctx.save();
          ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
          ctx.shadowBlur = 34 * renderScale;
          ctx.shadowOffsetY = 14 * renderScale;
          ctx.beginPath();
          if (isCircleCamera) {
            ctx.arc(cameraX + r, cameraY + r, r, 0, Math.PI * 2);
          } else {
            ctx.roundRect(cameraX, cameraY, cameraSize, cameraSize, cameraCornerRadius);
          }
          ctx.fillStyle = '#101010';
          ctx.fill();
          ctx.restore();
        }

        ctx.save();
        ctx.beginPath();
        if (isCircleCamera) {
          ctx.arc(cameraX + r, cameraY + r, r, 0, Math.PI * 2);
        } else {
          ctx.roundRect(cameraX, cameraY, cameraSize, cameraSize, cameraCornerRadius);
        }
        ctx.clip();

        if (webcamElement && webcamElement.readyState >= 2) {
          const webW = webcamElement.videoWidth;
          const webH = webcamElement.videoHeight;
          const sq = Math.min(webW, webH);
          const wsx = (webW - sq) / 2;
          const wsy = (webH - sq) / 2;

          ctx.drawImage(
            webcamElement,
            wsx, wsy, sq, sq,
            cameraX, cameraY, cameraSize, cameraSize
          );
        } else {
          ctx.fillStyle = '#151515';
          ctx.fillRect(cameraX, cameraY, cameraSize, cameraSize);
        }
        ctx.restore();

        ctx.beginPath();
        if (isCircleCamera) {
          ctx.arc(cameraX + r, cameraY + r, r, 0, Math.PI * 2);
        } else {
          ctx.roundRect(cameraX, cameraY, cameraSize, cameraSize, cameraCornerRadius);
        }
        ctx.lineWidth = 3 * renderScale;
        ctx.strokeStyle = settings.cameraBorderColor;
        ctx.stroke();
      };

      // 3. Draw Box Shadow
      if (settings.shadowIntensity > 0) {
        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = settings.shadowIntensity;
        ctx.shadowOffsetY = settings.shadowIntensity * 0.3;
        
        ctx.beginPath();
        ctx.roundRect(x0, y0, finalW, totalH, 24);
        ctx.fillStyle = '#111317';
        ctx.fill();
        ctx.restore();
      }

      // 4. Draw Composite Card Frame (clipped rounded borders)
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(x0, y0, finalW, totalH, 24);
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

        ctx.drawImage(
          videoElement,
          0, 0, vWidth, vHeight,
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

      // Draw the small webcam bubble inside the screen card.
      if (showWebcamOverlay && settings.cameraPosition !== 'none' && !isSideCamera) {
        const cameraSize = settings.cameraSize * renderScale;
        const r = cameraSize / 2;
        const margin = 20 * renderScale;
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

        const cameraX = cx - r;
        const cameraY = cy - r;
        drawCamera(cameraX, cameraY, cameraSize);
      }

      // Draw Card Border
      if (settings.borderWidth > 0) {
        ctx.beginPath();
        ctx.roundRect(x0, y0, finalW, totalH, 24);
        ctx.lineWidth = settings.borderWidth * 2;
        ctx.strokeStyle = settings.borderColor;
        ctx.stroke();
      }

      ctx.restore();

      if (isSideCamera) {
        const cameraX = settings.cameraPosition === 'side-left' ? groupX : x0 + finalW + sideGap;
        const cameraY = y0 + (totalH - sideCameraSize) / 2;
        drawCamera(cameraX, cameraY, sideCameraSize, true);
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => cancelAnimationFrame(animId);
  }, [canvasRef, canvasDimensions]);

  return (
    <div 
      ref={containerRef}
      className="flex-1 flex-center p-6 relative overflow-hidden bg-black/40"
      style={{ minHeight: '350px' }}
    >
      <canvas
        ref={canvasRef}
        width={canvasDimensions.width}
        height={canvasDimensions.height}
        className="max-w-full max-h-full aspect-video rounded-xl shadow-2xl border border-glass bg-black transition-shadow hover:shadow-[0_0_50px_rgba(139,92,246,0.1)]"
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
