import React, { useEffect, useRef, useMemo, useCallback } from 'react';
import type { AIDemoScript, AIDemoConfig, SubtitleCue } from '../types';

interface AIDemoCanvasProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  onCanvasElementChange?: (canvas: HTMLCanvasElement | null) => void;
  script: AIDemoScript;
  currentTime: number;
  config: AIDemoConfig;
  exportResolution?: '1080p' | '4k';
}

export const AIDemoCanvas: React.FC<AIDemoCanvasProps> = ({
  canvasRef,
  onCanvasElementChange,
  script,
  currentTime,
  config,
  exportResolution = '4k'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const scriptRef = useRef(script);
  const currentTimeRef = useRef(currentTime);
  const configRef = useRef(config);

  useEffect(() => {
    scriptRef.current = script;
    currentTimeRef.current = currentTime;
    configRef.current = config;
  });

  const canvasDimensions = useMemo(() => {
    const is4K = exportResolution === '4k';
    return {
      width: is4K ? 3840 : 1920,
      height: is4K ? 2160 : 1080
    };
  }, [exportResolution]);

  const setCanvasElement = useCallback((canvas: HTMLCanvasElement | null) => {
    canvasRef.current = canvas;
    onCanvasElementChange?.(canvas);
  }, [canvasRef, onCanvasElementChange]);

  // Main 60fps Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number | null = null;

    const render = () => {
      animId = null;
      const cw = canvas.width;
      const ch = canvas.height;
      const renderScale = cw / 1920; // 2x for 4K, 1x for 1080p

      const script = scriptRef.current;
      const t = currentTimeRef.current;
      const config = configRef.current;

      // Find current scene based on currentTime
      let scene = script.scenes[0];
      for (let i = script.scenes.length - 1; i >= 0; i--) {
        if (t >= script.scenes[i].startTime) {
          scene = script.scenes[i];
          break;
        }
      }

      const sceneProgress = Math.min(1, Math.max(0, (t - scene.startTime) / scene.duration));

      // 1. Draw Background Gradient
      ctx.clearRect(0, 0, cw, ch);
      const grad = ctx.createLinearGradient(0, 0, cw, ch);
      if (scene.gradientPresetId === 'sunset') {
        grad.addColorStop(0, '#f97316');
        grad.addColorStop(0.5, '#ec4899');
        grad.addColorStop(1, '#8b5cf6');
      } else if (scene.gradientPresetId === 'cyberpunk') {
        grad.addColorStop(0, '#a855f7');
        grad.addColorStop(1, '#06b6d4');
      } else if (scene.gradientPresetId === 'aurora') {
        grad.addColorStop(0, '#10b981');
        grad.addColorStop(0.5, '#06b6d4');
        grad.addColorStop(1, '#3b82f6');
      } else if (scene.gradientPresetId === 'ocean') {
        grad.addColorStop(0, '#1e3a8a');
        grad.addColorStop(0.5, '#0284c7');
        grad.addColorStop(1, '#0d9488');
      } else {
        // Nebula default
        grad.addColorStop(0, '#4f46e5');
        grad.addColorStop(0.4, '#7c3aed');
        grad.addColorStop(1, '#db2777');
      }
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, cw, ch);

      // Add subtle mesh particle dots
      ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
      for (let i = 0; i < 60; i++) {
        const px = (Math.sin(i * 99 + t * 0.2) * 0.5 + 0.5) * cw;
        const py = (Math.cos(i * 33 + t * 0.2) * 0.5 + 0.5) * ch;
        ctx.fillRect(px, py, 3 * renderScale, 3 * renderScale);
      }

      // 2. Animated Camera Scale/Pan for scene transitions
      const zoomScale = 0.96 + Math.sin(sceneProgress * Math.PI) * 0.05;
      const panY = Math.sin(sceneProgress * Math.PI * 2) * 12 * renderScale;

      ctx.save();
      ctx.translate(cw / 2, ch / 2 + panY);
      ctx.scale(zoomScale, zoomScale);

      // 3. Draw Product Browser Card
      const cardW = 1500 * renderScale;
      const cardH = 920 * renderScale;
      const cardX = -cardW / 2;
      const cardY = -cardH / 2;
      const headerH = 50 * renderScale;

      // Card Shadow
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
      ctx.shadowBlur = 60 * renderScale;
      ctx.shadowOffsetY = 24 * renderScale;
      ctx.beginPath();
      ctx.roundRect(cardX, cardY, cardW, cardH, 20 * renderScale);
      ctx.fillStyle = '#0f1117';
      ctx.fill();
      ctx.restore();

      // Card Frame Clip
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(cardX, cardY, cardW, cardH, 20 * renderScale);
      ctx.clip();

      // Card Header
      ctx.fillStyle = '#161922';
      ctx.fillRect(cardX, cardY, cardW, headerH);

      // macOS Traffic Lights
      const dots = ['#ff5f56', '#ffbd2e', '#27c93f'];
      dots.forEach((color, idx) => {
        ctx.beginPath();
        ctx.arc(cardX + 24 * renderScale + idx * 20 * renderScale, cardY + headerH / 2, 6 * renderScale, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
      });

      // URL bar
      const urlBarW = 500 * renderScale;
      const urlBarH = 28 * renderScale;
      const urlBarX = cardX + (cardW - urlBarW) / 2;
      const urlBarY = cardY + (headerH - urlBarH) / 2;
      ctx.beginPath();
      ctx.roundRect(urlBarX, urlBarY, urlBarW, urlBarH, 14 * renderScale);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.fill();

      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.font = `600 ${13 * renderScale}px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`🔒 ${script.url}`, urlBarX + urlBarW / 2, urlBarY + urlBarH / 2);

      // Main Card Content Body
      const bodyY = cardY + headerH;
      const bodyH = cardH - headerH;
      ctx.fillStyle = '#0a0c12';
      ctx.fillRect(cardX, bodyY, cardW, bodyH);

      // Inner Product Hero Content
      const mockup = scene.visualMockup;

      // Badge
      ctx.beginPath();
      ctx.roundRect(cardX + 60 * renderScale, bodyY + 60 * renderScale, 260 * renderScale, 36 * renderScale, 18 * renderScale);
      ctx.fillStyle = 'rgba(139, 92, 246, 0.2)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(139, 92, 246, 0.4)';
      ctx.lineWidth = 1.5 * renderScale;
      ctx.stroke();

      ctx.fillStyle = '#c084fc';
      ctx.font = `700 ${14 * renderScale}px Inter, sans-serif`;
      ctx.textAlign = 'left';
      ctx.fillText(mockup.badgeText, cardX + 80 * renderScale, bodyY + 82 * renderScale);

      // Headline
      ctx.fillStyle = '#ffffff';
      ctx.font = `800 ${46 * renderScale}px "Plus Jakarta Sans", Inter, sans-serif`;
      ctx.fillText(mockup.headline, cardX + 60 * renderScale, bodyY + 150 * renderScale);

      // Subheadline
      ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
      ctx.font = `400 ${22 * renderScale}px Inter, sans-serif`;
      ctx.fillText(mockup.subheadline, cardX + 60 * renderScale, bodyY + 200 * renderScale);

      // Primary & Secondary CTA Buttons
      const btnY = bodyY + 250 * renderScale;
      // Primary Button
      ctx.beginPath();
      ctx.roundRect(cardX + 60 * renderScale, btnY, 220 * renderScale, 52 * renderScale, 12 * renderScale);
      ctx.fillStyle = '#8b5cf6';
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = `700 ${16 * renderScale}px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(mockup.primaryBtnText, cardX + 170 * renderScale, btnY + 28 * renderScale);

      // Secondary Button
      ctx.beginPath();
      ctx.roundRect(cardX + 300 * renderScale, btnY, 220 * renderScale, 52 * renderScale, 12 * renderScale);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.stroke();

      ctx.fillStyle = '#e2e8f0';
      ctx.fillText(mockup.secondaryBtnText, cardX + 410 * renderScale, btnY + 28 * renderScale);

      // Render Metrics Cards if present
      if (mockup.metrics) {
        const metricY = bodyY + 350 * renderScale;
        mockup.metrics.forEach((metric, idx) => {
          const mx = cardX + 60 * renderScale + idx * 240 * renderScale;
          ctx.beginPath();
          ctx.roundRect(mx, metricY, 210 * renderScale, 110 * renderScale, 14 * renderScale);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
          ctx.fill();
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
          ctx.stroke();

          ctx.fillStyle = '#a78bfa';
          ctx.font = `800 ${32 * renderScale}px "Plus Jakarta Sans", Inter, sans-serif`;
          ctx.textAlign = 'left';
          ctx.fillText(metric.value, mx + 20 * renderScale, metricY + 45 * renderScale);

          ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
          ctx.font = `500 ${13 * renderScale}px Inter, sans-serif`;
          ctx.fillText(metric.label, mx + 20 * renderScale, metricY + 80 * renderScale);
        });
      }

      // Render Feature List Cards if present
      if (mockup.features) {
        const featureY = bodyY + 350 * renderScale;
        mockup.features.forEach((feat, idx) => {
          const fx = cardX + 60 * renderScale + idx * 360 * renderScale;
          ctx.beginPath();
          ctx.roundRect(fx, featureY, 330 * renderScale, 130 * renderScale, 14 * renderScale);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
          ctx.fill();
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
          ctx.stroke();

          ctx.fillStyle = '#ffffff';
          ctx.font = `700 ${18 * renderScale}px Inter, sans-serif`;
          ctx.textAlign = 'left';
          ctx.fillText(`✨ ${feat.title}`, fx + 20 * renderScale, featureY + 40 * renderScale);

          ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
          ctx.font = `400 ${13 * renderScale}px Inter, sans-serif`;
          ctx.fillText(feat.desc, fx + 20 * renderScale, featureY + 75 * renderScale);
        });
      }

      // Render Animated Spotlight Cursor
      const cursorProgress = (t * 0.5) % 1;
      const cursorX = cardX + 170 * renderScale + Math.sin(cursorProgress * Math.PI * 2) * 80 * renderScale;
      const cursorY = btnY + 28 * renderScale + Math.cos(cursorProgress * Math.PI * 2) * 20 * renderScale;

      ctx.save();
      ctx.beginPath();
      ctx.arc(cursorX, cursorY, 18 * renderScale, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(192, 132, 252, 0.25)';
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = `${20 * renderScale}px Inter`;
      ctx.fillText('🖱️', cursorX - 10 * renderScale, cursorY + 8 * renderScale);
      ctx.restore();

      ctx.restore(); // end frame clip
      ctx.restore(); // end camera scale/pan translate

      // 4. Draw English Subtitles / Closed Captions Burn-in
      if (config.showSubtitles) {
        const activeCue = script.subtitles.find((cue: SubtitleCue) => t >= cue.startTime && t <= cue.endTime);
        if (activeCue) {
          const subText = activeCue.text;
          const subY = ch - 120 * renderScale;

          ctx.save();
          ctx.font = `700 ${28 * renderScale}px Inter, sans-serif`;
          const textMetrics = ctx.measureText(subText);
          const padX = 36 * renderScale;
          const pillW = textMetrics.width + padX * 2;
          const pillH = 56 * renderScale;
          const pillX = (cw - pillW) / 2;

          if (config.subtitleStyle === 'bold-yellow') {
            ctx.beginPath();
            ctx.roundRect(pillX, subY, pillW, pillH, 14 * renderScale);
            ctx.fillStyle = '#000000';
            ctx.fill();

            ctx.fillStyle = '#facc15';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(subText, cw / 2, subY + pillH / 2);
          } else if (config.subtitleStyle === 'minimal-dark') {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
            ctx.fillRect(pillX, subY, pillW, pillH);

            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(subText, cw / 2, subY + pillH / 2);
          } else {
            // glass-pill (default)
            ctx.beginPath();
            ctx.roundRect(pillX, subY, pillW, pillH, 28 * renderScale);
            ctx.fillStyle = 'rgba(15, 17, 26, 0.85)';
            ctx.fill();
            ctx.strokeStyle = 'rgba(192, 132, 252, 0.4)';
            ctx.lineWidth = 1.5 * renderScale;
            ctx.stroke();

            ctx.fillStyle = '#f8fafc';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(subText, cw / 2, subY + pillH / 2);
          }
          ctx.restore();
        }
      }

      // 5. Draw 4K 60fps Badge in top right corner
      ctx.save();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.beginPath();
      ctx.roundRect(cw - 180 * renderScale, 24 * renderScale, 150 * renderScale, 36 * renderScale, 18 * renderScale);
      ctx.fill();

      ctx.fillStyle = '#4ade80';
      ctx.font = `700 ${13 * renderScale}px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('⚡ 4K 60FPS AI', cw - 105 * renderScale, 42 * renderScale);
      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animId !== null) {
        cancelAnimationFrame(animId);
      }
    };
  }, [canvasRef, canvasDimensions]);

  return (
    <div
      ref={containerRef}
      className="flex-1 flex-center p-4 relative overflow-hidden bg-black/50"
      style={{ minHeight: '380px' }}
    >
      <canvas
        ref={setCanvasElement}
        width={canvasDimensions.width}
        height={canvasDimensions.height}
        className="max-w-full max-h-full aspect-video rounded-xl shadow-2xl border border-glass bg-black"
        style={{
          width: 'auto',
          height: 'auto',
          maxWidth: '100%',
          maxHeight: '100%',
          aspectRatio: '16/9'
        }}
      />
    </div>
  );
};
