import React, { useRef, useEffect, useMemo, useCallback } from 'react';
import type { EditorSettings, ClickMoment } from '../types';

interface CanvasEditorProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  onCanvasElementChange?: (canvas: HTMLCanvasElement | null) => void;
  videoElement: HTMLVideoElement | null;
  webcamElement: HTMLVideoElement | null;
  showWebcamOverlay: boolean;
  settings: EditorSettings;
  clickMoments?: ClickMoment[];
  onAddClickMoment?: (moment: ClickMoment) => void;
}

const SIDE_CAMERA_HEIGHT_TO_WIDTH = 5 / 4;

const calculateLayout = (
  settings: EditorSettings,
  videoWidth: number,
  videoHeight: number,
  cw: number,
  ch: number,
  showWebcamOverlay: boolean
) => {
  const renderScale = settings.exportResolution === '4k' ? 2 : 1;
  const defaultFrameRatio = (() => {
    switch (settings.aspectRatio) {
      case '16-10':
        return 10 / 16;
      case '16-9':
        return 9 / 16;
      case '9-16':
        return 16 / 9;
      case '1-1':
        return 1;
      case '4-3':
        return 3 / 4;
    }
  })();
  const frameRatio = videoWidth && videoHeight
    ? videoHeight / videoWidth
    : defaultFrameRatio;

  const isSideCamera = showWebcamOverlay && (settings.cameraPosition === 'side-left' || settings.cameraPosition === 'side-right');
  const baseCardW = cw * 0.8;
  const defaultCardW = baseCardW * settings.scale;
  const sideOuterMargin = isSideCamera ? 16 * renderScale : 0;
  const sideGap = isSideCamera ? 16 * renderScale : 0;
  const sideCameraH = isSideCamera ? Math.min(settings.cameraSize * 2.5 * renderScale, ch * 0.56) : 0;
  const sideCameraW = isSideCamera ? sideCameraH / SIDE_CAMERA_HEIGHT_TO_WIDTH : 0;
  const sideCardW = Math.max(cw * 0.48, cw - sideOuterMargin * 2 - sideCameraW - sideGap);
  const finalW = isSideCamera ? sideCardW : defaultCardW;
  const finalH = finalW * frameRatio;
  const headerH = settings.macOSHeader ? 32 * renderScale : 0;
  const totalH = finalH + headerH;

  const groupW = isSideCamera ? finalW + sideGap + sideCameraW : finalW;
  const groupX = isSideCamera ? sideOuterMargin : (cw - groupW) / 2;
  const x0 = isSideCamera && settings.cameraPosition === 'side-left' ? groupX + sideCameraW + sideGap : groupX;
  const y0 = (ch - totalH) / 2;

  return { x0, y0, finalW, finalH, headerH, totalH, isSideCamera, sideCameraW, sideCameraH, sideGap, groupX, renderScale };
};

const getContainRect = (sourceWidth: number, sourceHeight: number, targetWidth: number, targetHeight: number) => {
  const sourceRatio = sourceWidth / sourceHeight;
  const targetRatio = targetWidth / targetHeight;

  if (sourceRatio > targetRatio) {
    const height = targetWidth / sourceRatio;
    return { dx: 0, dy: (targetHeight - height) / 2, dw: targetWidth, dh: height };
  }

  const width = targetHeight * sourceRatio;
  return { dx: (targetWidth - width) / 2, dy: 0, dw: width, dh: targetHeight };
};

export const CanvasEditor: React.FC<CanvasEditorProps> = ({
  canvasRef,
  onCanvasElementChange,
  videoElement,
  webcamElement,
  showWebcamOverlay,
  settings,
  clickMoments = [],
  onAddClickMoment
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Refs for tracking values inside the high-frequency animation loop without restarting it
  const settingsRef = useRef(settings);
  const videoElementRef = useRef(videoElement);
  const webcamElementRef = useRef(webcamElement);
  const showWebcamOverlayRef = useRef(showWebcamOverlay);
  const clickMomentsRef = useRef(clickMoments);

  useEffect(() => {
    settingsRef.current = settings;
    videoElementRef.current = videoElement;
    webcamElementRef.current = webcamElement;
    showWebcamOverlayRef.current = showWebcamOverlay;
    clickMomentsRef.current = clickMoments;
  });

  const canvasDimensions = useMemo(() => {
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

    return { width, height };
  }, [settings.aspectRatio, settings.exportResolution]);

  const setCanvasElement = useCallback((canvas: HTMLCanvasElement | null) => {
    canvasRef.current = canvas;
    onCanvasElementChange?.(canvas);
  }, [canvasRef, onCanvasElementChange]);

  const handleCanvasClick = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!videoElement || !onAddClickMoment) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const canvasX = ((event.clientX - rect.left) / rect.width) * event.currentTarget.width;
    const canvasY = ((event.clientY - rect.top) / rect.height) * event.currentTarget.height;

    const cw = event.currentTarget.width;
    const ch = event.currentTarget.height;
    const vWidth = videoElement.videoWidth || 1920;
    const vHeight = videoElement.videoHeight || 1080;

    let targetX: number;
    let targetY: number;
    let targetWidth: number;
    let targetHeight: number;

    if (settings.layoutMode === 'screen-only') {
      const target = getContainRect(vWidth, vHeight, cw, ch);
      targetX = target.dx;
      targetY = target.dy;
      targetWidth = target.dw;
      targetHeight = target.dh;
    } else {
      const layout = calculateLayout(settings, vWidth, vHeight, cw, ch, showWebcamOverlay);
      targetX = layout.x0;
      targetY = layout.y0 + layout.headerH;
      targetWidth = layout.finalW;
      targetHeight = layout.finalH;
    }

    const x = Math.min(1, Math.max(0, (canvasX - targetX) / Math.max(targetWidth, 1)));
    const y = Math.min(1, Math.max(0, (canvasY - targetY) / Math.max(targetHeight, 1)));

    onAddClickMoment({
      time: Math.max(0, videoElement.currentTime - 0.22),
      x,
      y
    });
  }, [onAddClickMoment, videoElement, settings, showWebcamOverlay]);

  // Canvas drawing loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number | null = null;
    let timeoutId: number | null = null;
    let lastVideoTime = 0;
    let lastUpdateTime = 0;

    const scheduleRender = () => {
      if (document.hidden) {
        timeoutId = window.setTimeout(render, 1000 / 30);
        return;
      }
      animId = requestAnimationFrame(render);
    };

    const render = () => {
      animId = null;
      timeoutId = null;
      const cw = canvas.width;
      const ch = canvas.height;

      const settings = settingsRef.current;
      const videoElement = videoElementRef.current;
      const webcamElement = webcamElementRef.current;
      const showWebcamOverlay = showWebcamOverlayRef.current;
      const clickMoments = clickMomentsRef.current;
      const renderScale = settings.exportResolution === '4k' ? 2 : 1;

      let displayTime = 0;
      if (videoElement) {
        const vTime = videoElement.currentTime;
        const now = performance.now();

        if (videoElement.paused) {
          displayTime = vTime;
          lastVideoTime = vTime;
          lastUpdateTime = now;
        } else {
          if (vTime !== lastVideoTime) {
            lastVideoTime = vTime;
            lastUpdateTime = now;
            displayTime = vTime;
          } else {
            const elapsed = (now - lastUpdateTime) / 1000;
            const playbackRate = videoElement.playbackRate || 1.0;
            const extrapolated = vTime + Math.min(0.15, elapsed) * playbackRate;
            displayTime = Math.min(videoElement.duration || Infinity, extrapolated);
          }
        }
      }

      const drawClickRipples = (
        targetX: number,
        targetY: number,
        targetWidth: number,
        targetHeight: number
      ) => {
        const rippleDuration = 0.8;
        const maxRadius = 40 * renderScale;

        clickMoments.forEach((moment) => {
          const age = displayTime - moment.time;
          if (age < 0 || age > rippleDuration) return;

          const screenX = targetX + moment.x * targetWidth;
          const screenY = targetY + moment.y * targetHeight;

          // Draw concentric rings
          for (let j = 0; j < 3; j++) {
            const delay = j * 0.15;
            const ringAge = age - delay;
            if (ringAge < 0) continue;

            const ringProgress = ringAge / (rippleDuration - delay);
            const radius = maxRadius * ringProgress;
            const opacity = 0.8 * (1.0 - ringProgress);

            ctx.save();
            ctx.beginPath();
            ctx.arc(screenX, screenY, radius, 0, Math.PI * 2);
            ctx.lineWidth = 2 * renderScale;
            ctx.strokeStyle = `rgba(190, 167, 255, ${opacity})`;
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(screenX, screenY, radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(190, 167, 255, ${opacity * 0.15})`;
            ctx.fill();
            ctx.restore();
          }
        });
      };

      const drawVideo = (
        sourceVideo: HTMLVideoElement,
        sourceWidth: number,
        sourceHeight: number,
        targetX: number,
        targetY: number,
        targetWidth: number,
        targetHeight: number
      ) => {
        ctx.drawImage(sourceVideo, 0, 0, sourceWidth, sourceHeight, targetX, targetY, targetWidth, targetHeight);
      };

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
        const grad = ctx.createLinearGradient(0, 0, cw, ch);
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
          const g1 = ctx.createRadialGradient(0, 0, 10, 0, 0, cw * 0.6);
          g1.addColorStop(0, 'rgba(192, 132, 252, 0.4)');
          g1.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = g1;
          ctx.fillRect(0,0,cw,ch);

          const g2 = ctx.createRadialGradient(cw, 0, 10, cw, 0, cw * 0.6);
          g2.addColorStop(0, 'rgba(244, 114, 182, 0.4)');
          g2.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = g2;
          ctx.fillRect(0,0,cw,ch);

          const g3 = ctx.createRadialGradient(cw, ch, 10, cw, ch, cw * 0.6);
          g3.addColorStop(0, 'rgba(96, 165, 250, 0.4)');
          g3.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = g3;
          ctx.fillRect(0,0,cw,ch);

          const g4 = ctx.createRadialGradient(0, ch, 10, 0, ch, cw * 0.6);
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

      const {
        x0,
        y0,
        finalW,
        finalH,
        headerH,
        totalH,
        isSideCamera,
        sideCameraW,
        sideCameraH,
        sideGap,
        groupX
      } = calculateLayout(
        settings,
        videoElement?.videoWidth || 0,
        videoElement?.videoHeight || 0,
        cw,
        ch,
        showWebcamOverlay
      );

      const drawCamera = (cameraX: number, cameraY: number, cameraW: number, cameraH: number, shadow = false, cornerRoundness = 0.2) => {
        const r = Math.min(cameraW, cameraH) / 2;
        const isCircleCamera = settings.cameraShape === 'circle';
        const cameraCornerRadius = isCircleCamera ? r : Math.min(cameraW, cameraH) * cornerRoundness;
        const centerX = cameraX + cameraW / 2;
        const centerY = cameraY + cameraH / 2;

        if (shadow) {
          ctx.save();
          ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
          ctx.shadowBlur = 34 * renderScale;
          ctx.shadowOffsetY = 14 * renderScale;
          ctx.beginPath();
          if (isCircleCamera) {
            ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
          } else {
            ctx.roundRect(cameraX, cameraY, cameraW, cameraH, cameraCornerRadius);
          }
          ctx.fillStyle = '#101010';
          ctx.fill();
          ctx.restore();
        }

        ctx.save();
        ctx.beginPath();
        if (isCircleCamera) {
          ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
        } else {
          ctx.roundRect(cameraX, cameraY, cameraW, cameraH, cameraCornerRadius);
        }
        ctx.clip();

        if (webcamElement && webcamElement.readyState >= 2) {
          const webW = webcamElement.videoWidth;
          const webH = webcamElement.videoHeight;
          const targetRatio = cameraW / cameraH;
          const sourceRatio = webW / webH;
          const sourceW = sourceRatio > targetRatio ? webH * targetRatio : webW;
          const sourceH = sourceRatio > targetRatio ? webH : webW / targetRatio;
          const wsx = (webW - sourceW) / 2;
          const wsy = (webH - sourceH) / 2;

          ctx.drawImage(
            webcamElement,
            wsx, wsy, sourceW, sourceH,
            cameraX, cameraY, cameraW, cameraH
          );
        } else {
          ctx.fillStyle = '#151515';
          ctx.fillRect(cameraX, cameraY, cameraW, cameraH);
        }
        ctx.restore();

        ctx.beginPath();
        if (isCircleCamera) {
          ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
        } else {
          ctx.roundRect(cameraX, cameraY, cameraW, cameraH, cameraCornerRadius);
        }
        ctx.lineWidth = 3 * renderScale;
        ctx.strokeStyle = settings.cameraBorderColor;
        ctx.stroke();
      };

      if (settings.layoutMode === 'screen-only') {
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, cw, ch);

        if (videoElement && videoElement.readyState >= 2) {
          const vWidth = videoElement.videoWidth || 1920;
          const vHeight = videoElement.videoHeight || 1080;
          const target = getContainRect(vWidth, vHeight, cw, ch);

          drawVideo(videoElement, vWidth, vHeight, target.dx, target.dy, target.dw, target.dh);
          drawClickRipples(target.dx, target.dy, target.dw, target.dh);
        } else {
          ctx.fillStyle = '#0a0d14';
          ctx.fillRect(0, 0, cw, ch);
          ctx.fillStyle = 'rgba(255,255,255,0.7)';
          ctx.font = `bold ${24 * renderScale}px Inter`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('Screen Recording Preview', cw / 2, ch / 2);
        }

        if (showWebcamOverlay && settings.cameraPosition !== 'none') {
          const cameraSize = settings.cameraSize * renderScale;
          const margin = 20 * renderScale;
          let cameraW = cameraSize;
          let cameraH = cameraSize;
          let cameraX = margin;
          let cameraY = margin;

          if (settings.cameraPosition === 'top-right') {
            cameraX = cw - cameraW - margin;
          } else if (settings.cameraPosition === 'bottom-left') {
            cameraY = ch - cameraH - margin;
          } else if (settings.cameraPosition === 'bottom-right') {
            cameraX = cw - cameraW - margin;
            cameraY = ch - cameraH - margin;
          } else if (settings.cameraPosition === 'side-left' || settings.cameraPosition === 'side-right') {
            cameraH = Math.min(settings.cameraSize * 2.5 * renderScale, ch * 0.56);
            cameraW = cameraH / SIDE_CAMERA_HEIGHT_TO_WIDTH;
            cameraX = settings.cameraPosition === 'side-left' ? margin : cw - cameraW - margin;
            cameraY = (ch - cameraH) / 2;
          }

          drawCamera(cameraX, cameraY, cameraW, cameraH, true, 0.08);
        }

        scheduleRender();
        return;
      };

      // 3. Draw Box Shadow
      if (settings.shadowIntensity > 0) {
        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = settings.shadowIntensity;
        ctx.shadowOffsetY = settings.shadowIntensity * 0.3;
        
        ctx.beginPath();
        ctx.roundRect(x0, y0, finalW, totalH, 24 * renderScale);
        ctx.fillStyle = '#111317';
        ctx.fill();
        ctx.restore();
      }

      // 4. Draw Composite Card Frame (clipped rounded borders)
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(x0, y0, finalW, totalH, 24 * renderScale);
      ctx.clip();

      // Card base background
      ctx.fillStyle = '#1c1e24';
      ctx.fillRect(x0, y0, finalW, totalH);

      // Draw macOS header
      if (settings.macOSHeader) {
        ctx.fillStyle = '#131417';
        ctx.fillRect(x0, y0, finalW, headerH);

        const dotRadius = 4.5 * renderScale;
        const colors = ['#ff5f56', '#ffbd2e', '#27c93f'];
        colors.forEach((color, idx) => {
          ctx.beginPath();
          ctx.arc(x0 + 16 * renderScale + idx * 14 * renderScale, y0 + headerH / 2, dotRadius, 0, Math.PI * 2);
          ctx.fillStyle = color;
          ctx.fill();
        });
      }

      // Draw Zoomed Video Screen
      if (videoElement && videoElement.readyState >= 2) {
        const vWidth = videoElement.videoWidth || 1920;
        const vHeight = videoElement.videoHeight || 1080;

        ctx.fillStyle = '#050505';
        ctx.fillRect(x0, y0 + headerH, finalW, finalH);

        drawVideo(videoElement, vWidth, vHeight, x0, y0 + headerH, finalW, finalH);
        drawClickRipples(x0, y0 + headerH, finalW, finalH);
      } else {
        ctx.fillStyle = '#0a0d14';
        ctx.fillRect(x0, y0 + headerH, finalW, finalH);
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.font = `bold ${24 * renderScale}px Inter`;
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
        drawCamera(cameraX, cameraY, cameraSize, cameraSize);
      }

      // Draw Card Border
      if (settings.borderWidth > 0) {
        ctx.beginPath();
        ctx.roundRect(x0, y0, finalW, totalH, 24 * renderScale);
        ctx.lineWidth = settings.borderWidth * 2 * renderScale;
        ctx.strokeStyle = settings.borderColor;
        ctx.stroke();
      }

      ctx.restore();

      if (isSideCamera) {
        const cameraX = settings.cameraPosition === 'side-left' ? groupX : x0 + finalW + sideGap;
        const cameraY = y0 + (totalH - sideCameraH) / 2;
        drawCamera(cameraX, cameraY, sideCameraW, sideCameraH, true, 0.08);
      }

      scheduleRender();
    };

    scheduleRender();

    return () => {
      if (animId !== null) cancelAnimationFrame(animId);
      if (timeoutId !== null) window.clearTimeout(timeoutId);
    };
  }, [canvasRef, canvasDimensions]);

  return (
    <div 
      ref={containerRef}
      className="flex-1 flex-center p-6 relative overflow-hidden bg-black/40"
      style={{ minHeight: '350px' }}
    >
      <canvas
        ref={setCanvasElement}
        onClick={handleCanvasClick}
        width={canvasDimensions.width}
        height={canvasDimensions.height}
        className="max-w-full max-h-full aspect-video rounded-xl shadow-2xl border border-glass bg-black transition-shadow hover:shadow-[0_0_50px_rgba(139,92,246,0.1)]"
        style={{
          width: 'auto',
          height: 'auto',
          maxWidth: '100%',
          maxHeight: '100%',
          cursor: onAddClickMoment ? 'crosshair' : 'default',
          aspectRatio: settings.aspectRatio.replace('-', '/')
        }}
      />
    </div>
  );
};
