import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { AIDemoScript, AIDemoConfig } from '../types';
import { generateAIDemoScript, AIVoiceoverNarrator } from '../utils/aiDemoGenerator';
import { AIDemoCanvas } from './AIDemoCanvas';
import { DemonionLogo } from './DemonionLogo';
import { 
  Sparkles, 
  Play, 
  Pause, 
  RotateCcw, 
  Download, 
  Globe, 
  Volume2, 
  VolumeX, 
  Subtitles, 
  X, 
  ArrowRight,
  Sliders,
  CheckCircle2,
  Film
} from 'lucide-react';

interface AIDemoStudioProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_URLS = [
  'https://linear.app',
  'https://stripe.com',
  'https://supabase.com',
  'https://vercel.com',
  'https://notion.so'
];

export const AIDemoStudio: React.FC<AIDemoStudioProps> = ({ isOpen, onClose }) => {
  const [step, setStep] = useState<'input' | 'generating' | 'studio'>('input');
  const [urlInput, setUrlInput] = useState('https://linear.app');
  const [genProgressStep, setGenProgressStep] = useState(0);
  const [script, setScript] = useState<AIDemoScript | null>(null);

  // Playback states
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [exportProgress, setExportProgress] = useState<number | null>(null);

  // AI Configuration
  const [config, setConfig] = useState<AIDemoConfig>({
    showSubtitles: true,
    subtitleStyle: 'glass-pill',
    enableVoiceover: true,
    voicePitch: 1.0,
    voiceRate: 1.0,
    voiceGender: 'female',
    voiceName: 'Kore',
    voiceModel: 'gemini-3.5-flash',
    geminiApiKey: ''
  });
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [canvasEl, setCanvasEl] = useState<HTMLCanvasElement | null>(null);
  const narratorRef = useRef<AIVoiceoverNarrator | null>(null);
  const playbackTimerRef = useRef<number | null>(null);
  const lastTimeRef = useRef(0);

  useEffect(() => {
    narratorRef.current = new AIVoiceoverNarrator();
    return () => {
      narratorRef.current?.stop();
    };
  }, []);

  const handleGenerate = useCallback((targetUrl: string) => {
    if (!targetUrl.trim()) return;
    setStep('generating');
    setGenProgressStep(0);

    const generated = generateAIDemoScript(targetUrl);
    setScript(generated);

    // Simulate multi-step AI processing animation
    const stepsTimer = setInterval(() => {
      setGenProgressStep((prev) => {
        if (prev >= 3) {
          clearInterval(stepsTimer);
          setTimeout(() => {
            setStep('studio');
            setCurrentTime(0);
            setIsPlaying(true);
          }, 400);
          return 3;
        }
        return prev + 1;
      });
    }, 650);
  }, []);

  // 120-second Playback Loop
  useEffect(() => {
    if (!isPlaying || !script) {
      if (playbackTimerRef.current !== null) {
        cancelAnimationFrame(playbackTimerRef.current);
        playbackTimerRef.current = null;
      }
      narratorRef.current?.stop();
      return;
    }

    lastTimeRef.current = performance.now();

    const loop = () => {
      const now = performance.now();
      const delta = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;

      setCurrentTime((prev) => {
        const next = prev + delta;
        if (next >= script.totalDuration) {
          setIsPlaying(false);
          narratorRef.current?.stop();
          return 0;
        }

        // Trigger voiceover narration when entering a new scene
        if (config.enableVoiceover) {
          const prevSceneIdx = script.scenes.findIndex(s => prev >= s.startTime && prev < s.startTime + s.duration);
          const nextSceneIdx = script.scenes.findIndex(s => next >= s.startTime && next < s.startTime + s.duration);
          if (nextSceneIdx !== -1 && (nextSceneIdx !== prevSceneIdx || prev === 0)) {
            narratorRef.current?.speakSceneScript(
              script.scenes[nextSceneIdx].narrationScript,
              config.voicePitch,
              config.voiceRate,
              config.voiceName,
              config.geminiApiKey,
              config.voiceModel
            );
          }
        }

        return next;
      });

      playbackTimerRef.current = requestAnimationFrame(loop);
    };

    playbackTimerRef.current = requestAnimationFrame(loop);

    return () => {
      if (playbackTimerRef.current !== null) {
        cancelAnimationFrame(playbackTimerRef.current);
        playbackTimerRef.current = null;
      }
    };
  }, [isPlaying, script, config.enableVoiceover, config.voicePitch, config.voiceRate, config.voiceName, config.geminiApiKey, config.voiceModel]);

  const handleTogglePlay = () => {
    if (!script) return;
    if (isPlaying) {
      setIsPlaying(false);
      narratorRef.current?.stop();
    } else {
      if (currentTime >= script.totalDuration - 0.5) {
        setCurrentTime(0);
      }
      setIsPlaying(true);
    }
  };

  const handleSeek = (targetTime: number) => {
    if (!script) return;
    const bounded = Math.max(0, Math.min(script.totalDuration, targetTime));
    setCurrentTime(bounded);
    narratorRef.current?.stop();

    if (config.enableVoiceover && isPlaying) {
      const activeScene = script.scenes.find(s => bounded >= s.startTime && bounded < s.startTime + s.duration);
      if (activeScene) {
        narratorRef.current?.speakSceneScript(
          activeScene.narrationScript,
          config.voicePitch,
          config.voiceRate,
          config.voiceName,
          config.geminiApiKey,
          config.voiceModel
        );
      }
    }
  };

  // Export Compressed 4K 60fps Video
  const handleExport4K = async () => {
    if (!canvasEl || !script) return;

    try {
      setIsPlaying(false);
      narratorRef.current?.stop();
      setExportProgress(0);

      const stream = canvasEl.captureStream(60);
      let mimeType = 'video/mp4;codecs=h264';
      let extension = 'mp4';

      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm;codecs=vp9';
        extension = 'webm';
      }

      const recorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported(mimeType) ? mimeType : undefined,
        videoBitsPerSecond: 60000000 // 60Mbps high clarity
      });

      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: mimeType || 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `demonion-${script.productName.toLowerCase()}-ai-demo-4k.${extension}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        setExportProgress(null);
      };

      recorder.start();

      // Play through 120s export
      let exportTime = 0;
      const exportInterval = setInterval(() => {
        exportTime += 0.5;
        setCurrentTime(exportTime);
        const progress = Math.min(100, Math.round((exportTime / script.totalDuration) * 100));
        setExportProgress(progress);

        if (exportTime >= script.totalDuration) {
          clearInterval(exportInterval);
          recorder.stop();
        }
      }, 100);

    } catch (err) {
      console.error('4K Export failed:', err);
      setExportProgress(null);
      alert('Video export could not complete. Please try again.');
    }
  };

  if (!isOpen) return null;

  const activeScene = script?.scenes.find(s => currentTime >= s.startTime && currentTime <= s.startTime + s.duration) || script?.scenes[0];

  const formatTimecode = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="ai-studio-overlay animate-fade-in">
      <div className="ai-studio-window">
        {/* Studio Top Navigation Header */}
        <header className="ai-studio-nav">
          <div className="ai-studio-brand">
            <DemonionLogo size={28} />
            <div>
              <h3>Demonion AI Studio</h3>
              <span>2-Min 4K 60fps Demo Generator</span>
            </div>
          </div>

          <div className="ai-studio-header-actions">
            {step === 'studio' && script && (
              <>
                <button
                  onClick={() => setConfig(prev => ({ ...prev, showSubtitles: !prev.showSubtitles }))}
                  className={`ai-header-btn ${config.showSubtitles ? 'active' : ''}`}
                  title="Toggle English Subtitles"
                >
                  <Subtitles size={15} /> Subtitles
                </button>

                <button
                  onClick={() => setConfig(prev => ({ ...prev, enableVoiceover: !prev.enableVoiceover }))}
                  className={`ai-header-btn ${config.enableVoiceover ? 'active' : ''}`}
                  title="Toggle Voiceover Narration"
                >
                  {config.enableVoiceover ? <Volume2 size={15} /> : <VolumeX size={15} />} Voiceover
                </button>

                <button
                  onClick={handleExport4K}
                  disabled={exportProgress !== null}
                  className="ai-export-btn"
                >
                  {exportProgress !== null ? (
                    `Exporting ${exportProgress}%`
                  ) : (
                    <><Download size={15} /> Export 4K 60fps</>
                  )}
                </button>
              </>
            )}

            <button onClick={onClose} className="ai-close-btn" aria-label="Close studio">
              <X size={18} />
            </button>
          </div>
        </header>

        {/* STEP 1: URL Input View */}
        {step === 'input' && (
          <div className="ai-input-view animate-fade-in">
            <div className="ai-input-hero">
              <div className="ai-sparkle-badge">
                <Sparkles size={14} /> AI Product Walkthrough Generator
              </div>
              <h2>Generate a 2-Minute 4K Product Demo from any URL</h2>
              <p>
                Enter your product website. Demonion will analyze features, generate an AI voiceover script,
                design 4K 60fps interactive scenes, and burn in English subtitles.
              </p>
            </div>

            <div className="ai-url-form">
              <div className="ai-input-wrapper">
                <Globe size={18} className="ai-input-icon" />
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://yourproduct.com"
                  className="ai-url-input"
                  autoFocus
                />
                <button
                  onClick={() => handleGenerate(urlInput)}
                  className="ai-generate-submit-btn"
                >
                  Generate 2-Min Demo <ArrowRight size={16} />
                </button>
              </div>

              {/* Preset Quick Links */}
              <div className="ai-presets-row">
                <span>Try an example:</span>
                {PRESET_URLS.map((pUrl) => (
                  <button
                    key={pUrl}
                    onClick={() => {
                      setUrlInput(pUrl);
                      handleGenerate(pUrl);
                    }}
                    className="ai-preset-chip"
                  >
                    {pUrl.replace('https://', '')}
                  </button>
                ))}
              </div>
            </div>

            {/* Feature Highlights Grid */}
            <div className="ai-input-features-grid">
              <div className="ai-feat-card">
                <Film size={20} />
                <h4>2-Minute 4K 60fps Video</h4>
                <p>Full 120-second multi-scene presentation with smooth 60fps animations.</p>
              </div>
              <div className="ai-feat-card">
                <Volume2 size={20} />
                <h4>AI Voiceover Narration</h4>
                <p>Synthesizes synchronized audio narration describing core capabilities.</p>
              </div>
              <div className="ai-feat-card">
                <Subtitles size={20} />
                <h4>Burned-in Subtitles</h4>
                <p>High-contrast English closed captions styled dynamically on canvas.</p>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Generation Progress Screen */}
        {step === 'generating' && (
          <div className="ai-generating-view animate-fade-in">
            <div className="ai-gen-card">
              <div className="ai-gen-spinner">
                <Sparkles size={32} className="ai-spinner-icon" />
              </div>
              <h3>Generating 4K AI Product Demo...</h3>
              <p>Analyzing <code>{urlInput}</code> and building a 2-minute video presentation.</p>

              <div className="ai-gen-steps-list">
                {[
                  'Extracting product metadata & feature highlights',
                  'Crafting 120-second 5-scene AI script & timeline',
                  'Synthesizing voiceover narration & subtitle cues',
                  'Rendering 4K 60fps interactive canvas mockups'
                ].map((stepLabel, idx) => (
                  <div key={idx} className={`ai-gen-step-item ${idx <= genProgressStep ? 'active' : ''}`}>
                    {idx < genProgressStep ? (
                      <CheckCircle2 size={16} className="text-purple-400" />
                    ) : (
                      <span className="ai-step-dot" />
                    )}
                    <span>{stepLabel}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Studio Editor & Player */}
        {step === 'studio' && script && (
          <div className="ai-studio-editor-view animate-fade-in">
            {/* Main 4K Canvas Component */}
            <div className="ai-canvas-area">
              <AIDemoCanvas
                canvasRef={canvasRef}
                onCanvasElementChange={setCanvasEl}
                script={script}
                currentTime={currentTime}
                config={config}
                exportResolution="4k"
              />
            </div>

            {/* Bottom Scrubber & Scene Control Panel */}
            <div className="ai-studio-controls">
              {/* Scene Navigation Bar */}
              <div className="ai-scenes-bar">
                {script.scenes.map((s, idx) => {
                  const isActive = activeScene?.id === s.id;
                  return (
                    <button
                      key={s.id}
                      onClick={() => handleSeek(s.startTime)}
                      className={`ai-scene-badge ${isActive ? 'active' : ''}`}
                    >
                      <span className="scene-num">0{idx + 1}</span>
                      <span className="scene-title">{s.title}</span>
                      <span className="scene-dur">{s.duration}s</span>
                    </button>
                  );
                })}
              </div>

              {/* Scrubber & Player Controls */}
              <div className="ai-scrubber-row">
                <button
                  onClick={handleTogglePlay}
                  className="ai-play-btn"
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
                </button>

                <button
                  onClick={() => handleSeek(0)}
                  className="ai-icon-btn"
                  title="Reset to 00:00"
                >
                  <RotateCcw size={15} />
                </button>

                <div className="ai-track-wrapper">
                  <input
                    type="range"
                    min="0"
                    max={script.totalDuration}
                    step="0.1"
                    value={currentTime}
                    onChange={(e) => handleSeek(Number(e.target.value))}
                    className="ai-timeline-slider"
                  />
                  <div
                    className="ai-track-fill"
                    style={{ width: `${(currentTime / script.totalDuration) * 100}%` }}
                  />
                </div>

                <div className="ai-timecode-display">
                  <b>{formatTimecode(currentTime)}</b> / <span>{formatTimecode(script.totalDuration)}</span>
                </div>
              </div>

              {/* Subtitle & Voice Customizer Bar */}
              <div className="ai-sub-controls-row">
                <div className="ai-sub-style-selector">
                  <span>Subtitle Style:</span>
                  {(['glass-pill', 'bold-yellow', 'minimal-dark'] as const).map((styleOpt) => (
                    <button
                      key={styleOpt}
                      onClick={() => setConfig(prev => ({ ...prev, subtitleStyle: styleOpt }))}
                      className={`ai-sub-chip ${config.subtitleStyle === styleOpt ? 'active' : ''}`}
                    >
                      {styleOpt.replace('-', ' ')}
                    </button>
                  ))}
                </div>

                <div className="ai-voice-controls">
                  <div className="ai-voice-badge" title="Google Gemini AI Voice Model">
                    <Sparkles size={12} className="text-purple-400" />
                    <span>Gemini Voice:</span>
                  </div>

                  {(['Kore', 'Puck', 'Charon', 'Fenrir', 'Aoede'] as const).map((vName) => (
                    <button
                      key={vName}
                      onClick={() => setConfig(prev => ({ ...prev, voiceName: vName }))}
                      className={`ai-rate-chip ${config.voiceName === vName ? 'active' : ''}`}
                      title={`Google Gemini AI Voice ${vName}`}
                    >
                      {vName}
                    </button>
                  ))}

                  <div className="ai-voice-divider" />

                  <Sliders size={13} />
                  <span>Rate:</span>
                  {[0.9, 1.0, 1.15].map((rate) => (
                    <button
                      key={rate}
                      onClick={() => setConfig(prev => ({ ...prev, voiceRate: rate }))}
                      className={`ai-rate-chip ${config.voiceRate === rate ? 'active' : ''}`}
                    >
                      {rate}x
                    </button>
                  ))}

                  <button
                    onClick={() => setShowApiKeyModal(!showApiKeyModal)}
                    className={`ai-key-btn ${config.geminiApiKey ? 'active' : ''}`}
                    title="Configure Google Gemini API Key for direct AI speech"
                  >
                    🔑 {config.geminiApiKey ? 'API Key Set' : 'Gemini Key'}
                  </button>
                </div>
              </div>

              {/* Gemini API Key Config Drawer */}
              {showApiKeyModal && (
                <div className="ai-apikey-drawer animate-fade-in">
                  <div className="ai-apikey-header">
                    <div className="ai-apikey-title">
                      <Sparkles size={14} className="text-purple-400" />
                      <b>Google Gemini API Voice Settings</b>
                    </div>
                    <button onClick={() => setShowApiKeyModal(false)} className="ai-close-mini">
                      <X size={14} />
                    </button>
                  </div>
                  <p className="ai-apikey-desc">
                    Voice <b>Kore</b> is powered by <code>gemini-2.5-flash</code> / <code>gemini-3.1-flash-live-preview</code> TTS API.
                    Enter your free Google Gemini API key below for ultra-realistic narration:
                  </p>
                  <div className="ai-apikey-input-row">
                    <input
                      type="password"
                      value={config.geminiApiKey || ''}
                      onChange={(e) => setConfig(prev => ({ ...prev, geminiApiKey: e.target.value }))}
                      placeholder="AIzaSy..."
                      className="ai-apikey-input"
                    />
                    <button onClick={() => setShowApiKeyModal(false)} className="ai-apikey-save">
                      Save & Apply Voice
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

