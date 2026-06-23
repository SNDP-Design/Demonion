import { useState, useRef, useEffect, useCallback } from 'react';
import type { EditorSettings } from './types';
import { DEFAULT_SETTINGS } from './constants/presets';
import { SidebarControls } from './components/SidebarControls';
import { CanvasEditor } from './components/CanvasEditor';
import { Timeline } from './components/Timeline';
import { ExportModal } from './components/ExportModal';
import { LandingPage } from './components/LandingPage';
import { 
  Sparkles, 
  Video, 
  Mic, 
  Camera, 
  CheckCircle2,
  Clapperboard,
  Disc, 
  Download,
  ArrowRight,
  MonitorUp,
  RotateCcw,
  Scissors,
  FileVideo
} from 'lucide-react';

function App() {
  const [recordingState, setRecordingState] = useState<'idle' | 'recording' | 'editor'>('idle');
  const [showLandingPage, setShowLandingPage] = useState(true);
  const [countdown, setCountdown] = useState<number | null>(null);
  
  // Streams
  const [videoSrc, setVideoSrc] = useState<string>('');
  const [cameraSrc, setCameraSrc] = useState<string>('');
  const [micStream, setMicStream] = useState<MediaStream | null>(null);

  // Editor states
  const [settings, setSettings] = useState<EditorSettings>(DEFAULT_SETTINGS);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportProgress, setExportProgress] = useState<number | null>(null);
  const [recordingIncludesWebcam, setRecordingIncludesWebcam] = useState(false);

  // Recorder flags
  const [useMic, setUseMic] = useState(true);
  const [useWebcam, setUseWebcam] = useState(true); // Default to camera overlay active!

  // Refs
  const editorVideoRef = useRef<HTMLVideoElement | null>(null);
  const webcamVideoRef = useRef<HTMLVideoElement | null>(null);
  const recordedCameraVideoRef = useRef<HTMLVideoElement | null>(null);
  const webcamStreamRef = useRef<MediaStream | null>(null);
  const webcamRequestRef = useRef<Promise<boolean> | null>(null);
  const screenRecorderRef = useRef<MediaRecorder | null>(null);
  const cameraRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordedCameraChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);
  const [recTime, setRecTime] = useState(0);

  // Callback ref states to ensure preview render loop updates when DOM elements mount
  const [editorVideoEl, setEditorVideoEl] = useState<HTMLVideoElement | null>(null);
  const [recordedCameraVideoEl, setRecordedCameraVideoEl] = useState<HTMLVideoElement | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const releaseWebcam = useCallback(() => {
    webcamVideoRef.current?.pause();
    if (webcamVideoRef.current) webcamVideoRef.current.srcObject = null;
    webcamStreamRef.current?.getTracks().forEach((track) => track.stop());
    webcamStreamRef.current = null;
  }, []);

  const waitForVideoFrame = useCallback((video: HTMLVideoElement) => {
    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) return Promise.resolve(true);

    return new Promise<boolean>((resolve) => {
      const finish = () => {
        video.removeEventListener('loadeddata', finish);
        clearTimeout(timeout);
        resolve(video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA);
      };
      const timeout = window.setTimeout(finish, 5000);
      video.addEventListener('loadeddata', finish, { once: true });
    });
  }, []);

  const connectWebcamVideo = useCallback(async (stream: MediaStream) => {
    const video = webcamVideoRef.current;
    if (!video) return false;

    if (video.srcObject !== stream) {
      video.srcObject = stream;
    }

    try {
      await video.play();
    } catch (error) {
      console.warn('Camera preview could not start:', error);
      return false;
    }

    return waitForVideoFrame(video);
  }, [waitForVideoFrame]);

  const ensureWebcamStream = useCallback(async () => {
    const existingStream = webcamStreamRef.current;
    if (existingStream?.getVideoTracks().some((track) => track.readyState === 'live')) {
      return connectWebcamVideo(existingStream);
    }

    if (webcamRequestRef.current) return webcamRequestRef.current;

    const request = (async () => {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640, max: 1280 },
          height: { ideal: 360, max: 720 },
          frameRate: { ideal: 30, max: 30 },
        },
        audio: false,
      });
      webcamStreamRef.current = stream;
      return connectWebcamVideo(stream);
    })();

    webcamRequestRef.current = request;
    try {
      return await request;
    } finally {
      webcamRequestRef.current = null;
    }
  }, [connectWebcamVideo]);

  const setEditorVideoRef = useCallback((el: HTMLVideoElement | null) => {
    editorVideoRef.current = el;
    setEditorVideoEl((current) => current === el ? current : el);
  }, []);

  const setWebcamVideoRef = useCallback((el: HTMLVideoElement | null) => {
    webcamVideoRef.current = el;
    if (el && webcamStreamRef.current) {
      void connectWebcamVideo(webcamStreamRef.current);
    }
  }, [connectWebcamVideo]);

  const setRecordedCameraVideoRef = useCallback((el: HTMLVideoElement | null) => {
    recordedCameraVideoRef.current = el;
    setRecordedCameraVideoEl((current) => current === el ? current : el);
  }, []);

  // Auto clean blob url
  useEffect(() => {
    return () => {
      if (videoSrc) URL.revokeObjectURL(videoSrc);
    };
  }, [videoSrc]);

  // Release the camera when the user turns the camera option off.
  useEffect(() => {
    if (!useWebcam) {
      releaseWebcam();
    }
  }, [releaseWebcam, useWebcam]);

  // Handle countdown overlay before screen recording starts
  const handleStartScreenRecording = async () => {
    try {
      // 1. Prompt screen grab
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: { 
          displaySurface: 'monitor',
          width: { ideal: 3840, max: 3840 },
          height: { ideal: 2160, max: 2160 },
          frameRate: { ideal: 60, max: 60 }
        },
        audio: true
      });

      // 2. Request mic if requested
      let activeMicStream: MediaStream | null = null;
      if (useMic) {
        try {
          activeMicStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          setMicStream(activeMicStream);
        } catch (e) {
          console.warn('Microphone access denied, proceeding with system audio only.');
        }
      }

      // 3. Make sure the camera feed is connected before the countdown begins.
      let includeWebcam = false;
      if (useWebcam) {
        try {
          includeWebcam = await ensureWebcamStream();
          if (!includeWebcam) {
            throw new Error('Camera video did not become ready in time.');
          }
        } catch (error) {
          console.warn('Camera could not be included in this recording:', error);
          setUseWebcam(false);
        }
      }

      const startSeparateRecording = () => {
        recordedChunksRef.current = [];
        recordedCameraChunksRef.current = [];
        let recordMimeType = 'video/webm;codecs=vp9';
        if (!MediaRecorder.isTypeSupported(recordMimeType)) recordMimeType = 'video/webm;codecs=vp8';
        if (!MediaRecorder.isTypeSupported(recordMimeType)) recordMimeType = 'video/webm';
        if (!MediaRecorder.isTypeSupported(recordMimeType)) recordMimeType = '';

        const recordingStream = new MediaStream();
        screenStream.getVideoTracks().forEach((track) => recordingStream.addTrack(track));

        let audioContext: AudioContext | null = null;
        try {
          audioContext = new AudioContext();
          const audioDestination = audioContext.createMediaStreamDestination();
          let hasAudio = false;

          if (screenStream.getAudioTracks().length > 0) {
            audioContext.createMediaStreamSource(screenStream).connect(audioDestination);
            hasAudio = true;
          }
          if (activeMicStream?.getAudioTracks().length) {
            audioContext.createMediaStreamSource(activeMicStream).connect(audioDestination);
            hasAudio = true;
          }
          if (hasAudio) audioDestination.stream.getAudioTracks().forEach((track) => recordingStream.addTrack(track));
        } catch (error) {
          console.warn('Could not mix audio sources:', error);
          screenStream.getAudioTracks().forEach((track) => recordingStream.addTrack(track));
          activeMicStream?.getAudioTracks().forEach((track) => recordingStream.addTrack(track));
        }

        const recorder = new MediaRecorder(recordingStream, {
          mimeType: recordMimeType || undefined,
          videoBitsPerSecond: 45000000,
        });
        screenRecorderRef.current = recorder;

        const cameraStream = includeWebcam ? webcamStreamRef.current : null;
        if (cameraStream) {
          const cameraRecorder = new MediaRecorder(cameraStream, { mimeType: recordMimeType || undefined, videoBitsPerSecond: 12000000 });
          cameraRecorderRef.current = cameraRecorder;
          cameraRecorder.ondataavailable = (event) => { if (event.data.size > 0) recordedCameraChunksRef.current.push(event.data); };
          cameraRecorder.onstop = () => {
            if (recordedCameraChunksRef.current.length > 0) setCameraSrc(URL.createObjectURL(new Blob(recordedCameraChunksRef.current, { type: recordMimeType || 'video/webm' })));
            releaseWebcam();
          };
          cameraRecorder.start();
        }
        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) recordedChunksRef.current.push(event.data);
        };
        recorder.onstop = () => {
          const blob = new Blob(recordedChunksRef.current, { type: recordMimeType || 'video/webm' });
          if (cameraRecorderRef.current?.state === 'recording') cameraRecorderRef.current.stop();
          else releaseWebcam();
          audioContext?.close();
          activeMicStream?.getTracks().forEach((track) => track.stop());
          setMicStream(null);
          setRecordingIncludesWebcam(false);
          setVideoSrc(URL.createObjectURL(blob));
          setRecordingState('editor');
          screenStream.getTracks().forEach((track) => track.stop());
        };
        recorder.start();
        setRecordingState('recording');
        setRecTime(0);
        timerRef.current = setInterval(() => setRecTime((time) => time + 1), 1000);
      };

      // Start countdown
      setCountdown(3);
      const counter = setInterval(() => {
        setCountdown((prev) => {
          if (prev === null) return null;
          if (prev <= 1) {
            clearInterval(counter);
            setCountdown(null);
            
            startSeparateRecording();

            return null;
          }
          return prev - 1;
        });
      }, 1000);

    } catch (err) {
      console.error('Recording initialization failed:', err);
    }
  };

  const handleStopRecording = () => {
    if (screenRecorderRef.current && screenRecorderRef.current.state === 'recording') {
      screenRecorderRef.current.stop();
      if (cameraRecorderRef.current?.state === 'recording') cameraRecorderRef.current.stop();
      clearInterval(timerRef.current);
    }
  };

  // Video playback callbacks
  const handleTimeUpdate = () => {
    if (editorVideoRef.current) {
      setCurrentTime(editorVideoRef.current.currentTime);
      if (recordedCameraVideoRef.current && Math.abs(recordedCameraVideoRef.current.currentTime - editorVideoRef.current.currentTime) > 0.08) {
        recordedCameraVideoRef.current.currentTime = editorVideoRef.current.currentTime;
      }
    }
  };

  const handleMetadata = () => {
    if (editorVideoRef.current) {
      const dur = editorVideoRef.current.duration;
      setDuration(dur);
      setTrimStart(0);
      setTrimEnd(dur);
    }
  };

  const handleTogglePlay = () => {
    const video = editorVideoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
      recordedCameraVideoRef.current?.pause();
      setIsPlaying(false);
    } else {
      const end = trimEnd > 0 ? trimEnd : duration;
      if (video.currentTime >= end) {
        video.currentTime = trimStart;
      }
      video.play().catch(e => console.error(e));
      recordedCameraVideoRef.current?.play().catch(e => console.error(e));
      setIsPlaying(true);
    }
  };

  const handleSeek = (time: number) => {
    const video = editorVideoRef.current;
    if (video) {
      video.currentTime = time;
      if (recordedCameraVideoRef.current) recordedCameraVideoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  // Trim updates
  const handleTrimChange = (start: number, end: number) => {
    setTrimStart(start);
    setTrimEnd(end);
    if (editorVideoRef.current) {
      if (editorVideoRef.current.currentTime < start) {
        editorVideoRef.current.currentTime = start;
      } else if (editorVideoRef.current.currentTime > end) {
        editorVideoRef.current.currentTime = start;
      }
    }
  };

  // Playback Rate
  const handlePlaybackRate = (rate: number) => {
    setPlaybackRate(rate);
    if (editorVideoRef.current) {
      editorVideoRef.current.playbackRate = rate;
    }
  };

  // Video looping inside trim boundaries
  useEffect(() => {
    const video = editorVideoRef.current;
    if (!video) return;

    const handleLoopCheck = () => {
      const end = trimEnd > 0 ? trimEnd : duration;
      if (video.currentTime >= end) {
        if (isPlaying) {
          video.currentTime = trimStart;
        } else {
          video.pause();
          video.currentTime = trimStart;
        }
      }
    };

    video.addEventListener('timeupdate', handleLoopCheck);
    return () => {
      video.removeEventListener('timeupdate', handleLoopCheck);
    };
  }, [trimStart, trimEnd, duration, isPlaying]);

  const formatSecs = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <main className="xg-app h-screen w-screen flex flex-col text-white font-sans overflow-hidden">
      
      {/* Header Bar */}
      <header className="xg-nav select-none">
        <div className={`xg-nav-inner ${showLandingPage ? '' : 'studio-nav-inner'}`}>
          <div className="xg-brand">
            <div className="xg-brand-mark"><Sparkles size={16} /></div>
            <div>
              <h1>Screentor</h1>
            </div>
          </div>
          {showLandingPage && (
            <nav className="xg-nav-links" aria-label="Main sections">
              <a href="#home" className="active">Home</a>
              <a href="#how-it-works">How it works</a>
              <a href="#features">Features</a>
            </nav>
          )}

          {showLandingPage ? (
            <div className="xg-nav-actions">
              <button onClick={() => setShowLandingPage(false)} className="xg-button xg-button-primary">
                Open studio <ArrowRight size={15} />
              </button>
            </div>
          ) : recordingState === 'editor' && (
          <div className="xg-nav-actions">
            <button 
              onClick={() => {
                if (window.confirm('Discard current video and start over?')) {
                  setRecordingState('idle');
                  setVideoSrc('');
                  setCameraSrc('');
                  setRecordingIncludesWebcam(false);
                }
              }}
              className="xg-button xg-button-secondary"
            >
              <RotateCcw size={13} /> Reset Video
            </button>
            <button 
              onClick={() => {
                setExportProgress(0);
                setExportModalOpen(true);
              }}
              className="xg-button xg-button-primary"
              disabled={exportProgress !== null}
            >
              {exportProgress === null ? <><Download size={14} /> Export Video</> : `Exporting ${exportProgress}%`}
            </button>
          </div>
        )}
        </div>
      </header>

      {/* Screen Elements for Feeds (Hidden in viewport) */}
      <video
        ref={setEditorVideoRef}
        src={videoSrc || undefined}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleMetadata}
        style={{ position: 'absolute', width: '1px', height: '1px', opacity: 0.001, pointerEvents: 'none', zIndex: -1000 }}
        crossOrigin="anonymous"
        playsInline
      />
      <video
        ref={setWebcamVideoRef}
        className={recordingState === 'recording' && useWebcam ? 'recording-camera-preview' : undefined}
        style={recordingState === 'recording' && useWebcam ? {
          width: `${Math.min(220, Math.max(110, settings.cameraSize))}px`,
          aspectRatio: '1 / 1',
          borderRadius: settings.cameraShape === 'circle' ? '50%' : '20%',
          borderColor: settings.cameraBorderColor,
        } : { position: 'fixed', right: '8px', bottom: '8px', width: '160px', height: '90px', opacity: 0.01, pointerEvents: 'none', zIndex: 0 }}
        autoPlay
        playsInline
        muted
      />
      <video ref={setRecordedCameraVideoRef} src={cameraSrc || undefined} style={{ position: 'absolute', width: '1px', height: '1px', opacity: 0.001, pointerEvents: 'none', zIndex: -1000 }} muted playsInline />

      {/* Layout Content Body */}
      <div className={showLandingPage ? 'landing-scroll-container flex-1' : 'flex-1 flex overflow-hidden'}>

        {showLandingPage ? (
          <>
          <LandingPage onOpenStudio={() => setShowLandingPage(false)} />
          {false && (
          <section className="screentor-landing animate-fade-in" id="home">
            <div className="landing-hero">
              <span className="xg-pill"><span className="xg-status-dot" /> Your browser recording studio</span>
              <h2><span className="landing-heading-line">Make every product</span><span className="landing-heading-line landing-heading-muted">demo feel ready to share.</span></h2>
              <p>Record your screen, camera, and voice in one place. Trim the rough edges, then export a polished video—without installing anything.</p>
              <div className="landing-hero-actions">
                <button onClick={() => setShowLandingPage(false)} className="xg-button xg-button-primary landing-primary-action">
                  Start recording free <ArrowRight size={16} />
                </button>
                <a className="xg-button xg-button-secondary" href="#how-it-works">See how it works</a>
              </div>
              <p className="landing-note"><CheckCircle2 size={14} /> Works directly in your browser</p>
            </div>

            <div className="landing-preview" aria-label="Screentor app preview">
              <div className="landing-preview-bar"><span /><span /><span /><b>Screentor Studio</b></div>
              <div className="landing-preview-body">
                <aside><div className="preview-brand"><Sparkles size={14} /> Screentor</div><div className="preview-menu active">New recording</div><div className="preview-menu">My clips</div><div className="preview-menu">Exports</div></aside>
                <div className="preview-canvas"><div className="preview-canvas-pill">● Recording preview</div><div className="preview-window"><div className="preview-window-top"><i /><i /><i /></div><div className="preview-window-copy"><b>Ship a clear demo.</b><span>Capture the work, not the friction.</span></div><div className="preview-camera"><Camera size={20} /></div></div></div>
              </div>
            </div>

            <section className="landing-features" id="features">
              <article><span className="landing-feature-icon"><MonitorUp size={20} /></span><h3>Capture in one click</h3><p>Choose a browser tab, app window, or your whole screen. Keep your voice and camera with it.</p></article>
              <article><span className="landing-feature-icon"><Scissors size={20} /></span><h3>Make it feel intentional</h3><p>Trim the start and end, choose your framing, and keep the recording focused on the work.</p></article>
              <article><span className="landing-feature-icon"><Clapperboard size={20} /></span><h3>Export and share</h3><p>Create a high-quality video directly from your browser when the demo is ready to send.</p></article>
            </section>

            <section className="landing-workflow" id="how-it-works">
              <div><span className="landing-kicker">A simple workflow</span><h3>From screen to shareable video.</h3></div>
              <ol><li><b>01</b><span>Choose what to capture</span></li><li><b>02</b><span>Record your walkthrough</span></li><li><b>03</b><span>Trim and export your demo</span></li></ol>
            </section>

            <section className="landing-story" id="why-screentor">
              <div className="landing-story-intro">
                <span className="landing-kicker">Made for clear explanations</span>
                <h3>Your product is easier to understand when people can see it.</h3>
                <p>Screentor helps you turn a quick walkthrough into a video that is calm, focused, and easy to follow. It is for the moments when a screenshot is not enough.</p>
              </div>
              <div className="landing-story-list">
                <article><b>Show, don’t describe</b><p>Walk a client through a feature, a teammate through a process, or a customer through a fix.</p></article>
                <article><b>Keep the important parts in view</b><p>Use your camera when it adds a human touch, and trim away the moments that do not help the story.</p></article>
                <article><b>Stay in the browser</b><p>Record and export without a heavy desktop app, a complicated timeline, or an account setup wall.</p></article>
              </div>
            </section>

            <section className="landing-use-cases">
              <div className="landing-section-heading"><span className="landing-kicker">Use Screentor for</span><h3>More than just a demo.</h3><p>Whenever you need to explain something on screen, you can make it easier to watch.</p></div>
              <div className="landing-use-case-grid">
                <article><span>01</span><h4>Product walkthroughs</h4><p>Give prospects and customers a clear view of how your product works.</p></article>
                <article><span>02</span><h4>Release updates</h4><p>Show what changed instead of writing a long summary that people have to imagine.</p></article>
                <article><span>03</span><h4>Support answers</h4><p>Record a helpful answer once and send it whenever the same question comes back.</p></article>
                <article><span>04</span><h4>Internal handovers</h4><p>Give your team context for a design, task, or workflow without another meeting.</p></article>
              </div>
            </section>

            <section className="landing-assurance">
              <div><span className="landing-kicker">Simple by design</span><h3>No complicated setup.<br />No hidden workflow.</h3></div>
              <ul><li><CheckCircle2 size={17} /> Pick your screen, window, or browser tab</li><li><CheckCircle2 size={17} /> Add your voice and camera if you want to</li><li><CheckCircle2 size={17} /> Trim the recording and export the video</li></ul>
            </section>

            <section className="landing-faq" id="faq">
              <div className="landing-section-heading"><span className="landing-kicker">Questions, answered</span><h3>Good to know before you record.</h3></div>
              <div className="landing-faq-list">
                <details open><summary>Do I need to install anything?<span>+</span></summary><p>No. Screentor runs in a modern web browser. You choose what to share using your browser’s normal screen-sharing window.</p></details>
                <details><summary>Can I include my camera and microphone?<span>+</span></summary><p>Yes. Turn on the camera and microphone choices before you start. Your browser will ask for permission the first time.</p></details>
                <details><summary>Can I record only my browser tab?<span>+</span></summary><p>Yes. When you start, choose the tab, app window, or full screen you want to capture.</p></details>
                <details><summary>Can I make a video without the camera?<span>+</span></summary><p>Yes. Turn the camera choice off before recording, or hide it in the recording settings.</p></details>
              </div>
            </section>

            <section className="landing-final-cta">
              <span className="xg-pill"><span className="xg-status-dot" /> Ready when you are</span>
              <h3>Make the next explanation<br /><span>easy to watch.</span></h3>
              <p>Open Screentor and record your first clear walkthrough in a few clicks.</p>
              <button onClick={() => setShowLandingPage(false)} className="xg-button xg-button-primary landing-primary-action">Open Screentor <ArrowRight size={16} /></button>
            </section>

            <footer className="landing-footer">
              <div className="landing-footer-brand"><span className="xg-brand-mark"><Sparkles size={15} /></span><div><b>Screentor</b><small>A browser recording studio for clear product videos.</small></div></div>
              <div className="landing-footer-links"><a href="#home">Home</a><a href="#features">Features</a><a href="#how-it-works">How it works</a><a href="#faq">FAQ</a></div>
              <p>© 2026 Screentor</p>
            </footer>
          </section>
          )}
          </>
        ) : <>

        {/* State 1: Dashboard Setup */}
        {recordingState === 'idle' && (
          <section className="xg-hero animate-fade-in">
            <div className="xg-hero-copy">
              <span className="xg-pill"><span className="xg-status-dot" /> Ready to record</span>
              <h2>Record product demos<br /><span>that look polished.</span></h2>
              <p>Capture your screen, camera, and voice in one quiet, focused studio. Then trim your recording and export it when it is ready.</p>
            </div>

            {/* Recorder controls panel */}
            <div className="xg-recorder-card">
                <div className="xg-recorder-heading">
                  <div className="xg-recorder-icon">
                    <Video size={24} />
                  </div>
                  <div>
                    <h3>New recording</h3>
                    <p>Choose what to include, then select your browser tab or window.</p>
                  </div>
                </div>
                <div className="xg-recorder-options">
                    <div className="xg-option-row">
                      <span><Mic size={15} /> Voice microphone</span>
                      <label className="switch-container">
                        <input 
                          type="checkbox" 
                          checked={useMic} 
                          onChange={(e) => setUseMic(e.target.checked)} 
                          className="switch-input"
                        />
                        <div className="switch-slider"></div>
                      </label>
                    </div>
                    <div className="xg-option-row">
                      <span><Camera size={15} /> Camera overlay</span>
                      <label className="switch-container">
                        <input 
                          type="checkbox" 
                          checked={useWebcam} 
                          onChange={(e) => setUseWebcam(e.target.checked)} 
                          className="switch-input"
                        />
                        <div className="switch-slider"></div>
                      </label>
                    </div>
                </div>

                <button 
                  onClick={handleStartScreenRecording}
                  className="xg-button xg-button-primary xg-record-button"
                >
                  Start recording <span aria-hidden="true">→</span>
                </button>
            </div>
          </section>
        )}

        {/* Countdown overlay screen */}
        {countdown !== null && (
          <div className="flex-1 flex-center bg-black-90 z-40">
            <div className="text-center space-y-3">
              <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">Recording starts in</p>
              <div className="text-8xl font-black text-violet-500 animate-ping font-mono">
                {countdown}
              </div>
            </div>
          </div>
        )}

        {/* State 2: Active Recording Control view */}
        {recordingState === 'recording' && (
          <section className="flex-1 flex flex-col justify-center items-center gap-6 animate-fade-in bg-zinc-950">
            <div className="w-24 h-24 rounded-full bg-red-600/10 border-2 border-red-500 flex-center animate-pulse">
              <Disc size={40} className="text-red-500" />
            </div>
            
            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-white">Recording Your Screen...</h3>
              <p className="text-xs text-gray-400">Everything is being captured. Switch to your desired app now.</p>
              <p className="text-sm font-mono text-red-400 font-semibold pt-1">Timer: {formatSecs(recTime)}</p>
            </div>

            <button 
              onClick={handleStopRecording}
              className="glass-button danger px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:scale-105 transition-transform"
            >
              <FileVideo size={16} /> Stop Recording & Edit
            </button>
          </section>
        )}

        {/* State 3: Editor Layout */}
        {recordingState === 'editor' && (
          <div className="flex-1 flex overflow-hidden animate-fade-in">
            <aside className="h-full shrink-0">
              <SidebarControls
                settings={settings}
                onChangeSettings={(updates) => setSettings({ ...settings, ...updates })}
              />
            </aside>
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
              <CanvasEditor 
                canvasRef={canvasRef}
                videoElement={editorVideoEl}
                webcamElement={useWebcam && !recordingIncludesWebcam ? recordedCameraVideoEl : null}
                showWebcamOverlay={useWebcam && !recordingIncludesWebcam && Boolean(cameraSrc)}
                settings={settings}
              />
              <Timeline
                duration={duration}
                currentTime={currentTime}
                onTimeUpdate={handleSeek}
                isPlaying={isPlaying}
                onTogglePlay={handleTogglePlay}
                trimStart={trimStart}
                trimEnd={trimEnd}
                onTrimChange={handleTrimChange}
                playbackRate={playbackRate}
                onPlaybackRateChange={handlePlaybackRate}
              />
            </div>
          </div>
        )}

        </>}
      </div>

      {/* Export Modal */}
      <ExportModal 
        isOpen={exportModalOpen}
        onClose={() => {
          setExportModalOpen(false);
          setExportProgress(null);
        }}
        onProgress={setExportProgress}
        onError={(message) => window.alert(message)}
        canvasElement={canvasRef.current}
        videoElement={editorVideoEl}
        cameraVideoElement={recordedCameraVideoEl}
        micStream={micStream}
        settings={settings}
        onChangeSettings={(updates) => setSettings({ ...settings, ...updates })}
        duration={duration}
      />

    </main>
  );
}

export default App;
