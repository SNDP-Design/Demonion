import { useState, useRef, useEffect, useCallback } from 'react';
import type { EditorSettings, ZoomMoment } from './types';
import { DEFAULT_SETTINGS } from './constants/presets';
import { SidebarControls } from './components/SidebarControls';
import { CanvasEditor } from './components/CanvasEditor';
import { Timeline } from './components/Timeline';
import { ExportModal } from './components/ExportModal';
import { LandingPage } from './components/LandingPage';
import { DemonierLogo } from './components/DemonierLogo';
import { 
  Video, 
  Mic, 
  Camera, 
  Disc, 
  Download,
  ArrowRight,
  RotateCcw,
  FileVideo
} from 'lucide-react';

const SIDE_CAMERA_HEIGHT_TO_WIDTH = 5 / 4;

function App() {
  const [recordingState, setRecordingState] = useState<'idle' | 'recording' | 'editor'>('idle');
  const [showLandingPage, setShowLandingPage] = useState(true);
  const [hideLandingNav, setHideLandingNav] = useState(false);
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
  const [zoomMoments, setZoomMoments] = useState<ZoomMoment[]>([]);

  // Recorder flags
  const [useMic, setUseMic] = useState(true);
  const [useWebcam, setUseWebcam] = useState(true); // Default to camera overlay active!

  // Refs
  const editorVideoRef = useRef<HTMLVideoElement | null>(null);
  const webcamVideoRef = useRef<HTMLVideoElement | null>(null);
  const recordedCameraVideoRef = useRef<HTMLVideoElement | null>(null);
  const landingScrollRef = useRef<HTMLDivElement | null>(null);
  const lastLandingScrollTopRef = useRef(0);
  const webcamStreamRef = useRef<MediaStream | null>(null);
  const webcamRequestRef = useRef<Promise<boolean> | null>(null);
  const screenRecorderRef = useRef<MediaRecorder | null>(null);
  const cameraRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordedCameraChunksRef = useRef<Blob[]>([]);
  const recordingStartTimeRef = useRef(0);
  const zoomMomentsRef = useRef<ZoomMoment[]>([]);
  const lastPointerRef = useRef({ x: 0.5, y: 0.5 });
  const timerRef = useRef<ReturnType<typeof window.setInterval> | null>(null);
  const [recTime, setRecTime] = useState(0);

  // Callback ref states to ensure preview render loop updates when DOM elements mount
  const [editorVideoEl, setEditorVideoEl] = useState<HTMLVideoElement | null>(null);
  const [recordedCameraVideoEl, setRecordedCameraVideoEl] = useState<HTMLVideoElement | null>(null);
  const [canvasEl, setCanvasEl] = useState<HTMLCanvasElement | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const exitCameraPictureInPicture = useCallback(async () => {
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      }
    } catch (error) {
      console.warn('Camera floating preview could not be closed:', error);
    }
  }, []);

  const releaseWebcam = useCallback(() => {
    void exitCameraPictureInPicture();
    webcamVideoRef.current?.pause();
    if (webcamVideoRef.current) webcamVideoRef.current.srcObject = null;
    webcamStreamRef.current?.getTracks().forEach((track) => track.stop());
    webcamStreamRef.current = null;
  }, [exitCameraPictureInPicture]);

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

  const showFloatingCameraPreview = useCallback(async () => {
    const video = webcamVideoRef.current;
    if (!video || !document.pictureInPictureEnabled || document.pictureInPictureElement) return;

    const isReady = await waitForVideoFrame(video);
    if (!isReady) return;

    try {
      await video.requestPictureInPicture();
    } catch (error) {
      console.warn('Camera floating preview could not start:', error);
    }
  }, [waitForVideoFrame]);

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

  useEffect(() => {
    return () => {
      if (cameraSrc) URL.revokeObjectURL(cameraSrc);
    };
  }, [cameraSrc]);

  // Release the camera when the user turns the camera option off.
  useEffect(() => {
    if (!useWebcam) {
      releaseWebcam();
    }
  }, [releaseWebcam, useWebcam]);

  useEffect(() => {
    if (!showLandingPage && recordingState === 'idle' && useWebcam) {
      void ensureWebcamStream().catch((error) => {
        console.warn('Camera preview could not start:', error);
        setUseWebcam(false);
      });
    }
  }, [ensureWebcamStream, recordingState, showLandingPage, useWebcam]);

  const openStudio = useCallback(() => {
    setHideLandingNav(false);
    lastLandingScrollTopRef.current = 0;
    setShowLandingPage(false);
  }, []);

  useEffect(() => {
    if (recordingState !== 'recording') return;

    const addZoomMoment = (moment: Omit<ZoomMoment, 'time'>) => {
      const time = Math.max(0, (performance.now() - recordingStartTimeRef.current) / 1000);
      zoomMomentsRef.current = [...zoomMomentsRef.current, { strength: 'normal', duration: 'medium', ...moment, time }];
    };

    const updatePointer = (event: PointerEvent | MouseEvent) => {
      lastPointerRef.current = {
        x: Math.min(1, Math.max(0, event.clientX / Math.max(window.innerWidth, 1))),
        y: Math.min(1, Math.max(0, event.clientY / Math.max(window.innerHeight, 1)))
      };
    };

    const handlePointerMove = (event: PointerEvent) => updatePointer(event);
    const handleClick = (event: MouseEvent) => {
      updatePointer(event);
      addZoomMoment({ type: 'click', ...lastPointerRef.current });
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      addZoomMoment({ type: 'typing', ...lastPointerRef.current });
    };

    window.addEventListener('pointermove', handlePointerMove, true);
    window.addEventListener('click', handleClick, true);
    window.addEventListener('keydown', handleKeyDown, true);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove, true);
      window.removeEventListener('click', handleClick, true);
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [recordingState]);

  const handleLandingScroll = useCallback(() => {
    const scrollTop = landingScrollRef.current?.scrollTop ?? 0;
    const previousScrollTop = lastLandingScrollTopRef.current;

    if (scrollTop < 24) {
      setHideLandingNav(false);
    } else if (scrollTop > previousScrollTop + 6) {
      setHideLandingNav(true);
    } else if (scrollTop < previousScrollTop - 6) {
      setHideLandingNav(false);
    }

    lastLandingScrollTopRef.current = Math.max(scrollTop, 0);
  }, []);

  // Handle countdown overlay before screen recording starts
  const handleStartScreenRecording = async () => {
    try {
      // 1. Prompt screen grab
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: { 
          displaySurface: 'monitor',
          width: { ideal: 3840, max: 3840 },
          height: { ideal: 2400, max: 2400 },
          frameRate: { ideal: 60, max: 60 }
        },
        audio: false
      });
      const screenTrack = screenStream.getVideoTracks()[0];
      const displaySurface = (screenTrack?.getSettings() as MediaTrackSettings & { displaySurface?: string }).displaySurface;
      const isBrowserTabRecording = displaySurface === 'browser';

      // 2. Request mic if requested
      let activeMicStream: MediaStream | null = null;
      if (useMic) {
        try {
          activeMicStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          setMicStream(activeMicStream);
        } catch {
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
          if (isBrowserTabRecording) {
            void showFloatingCameraPreview();
          }
        } catch (error) {
          console.warn('Camera could not be included in this recording:', error);
          setUseWebcam(false);
        }
      }

      const startSeparateRecording = () => {
        recordedChunksRef.current = [];
        recordedCameraChunksRef.current = [];
        zoomMomentsRef.current = [];
        setZoomMoments([]);
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

          if (activeMicStream?.getAudioTracks().length) {
            audioContext.createMediaStreamSource(activeMicStream).connect(audioDestination);
            hasAudio = true;
          }
          if (hasAudio) audioDestination.stream.getAudioTracks().forEach((track) => recordingStream.addTrack(track));
        } catch (error) {
          console.warn('Could not mix audio sources:', error);
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
          setZoomMoments(zoomMomentsRef.current);
          setVideoSrc(URL.createObjectURL(blob));
          setRecordingState('editor');
          screenStream.getTracks().forEach((track) => track.stop());
        };
        recorder.start();
        recordingStartTimeRef.current = performance.now();
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
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      void exitCameraPictureInPicture();
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

  const handleTogglePlay = async () => {
    const video = editorVideoRef.current;
    if (!video) return;

    if (!video.paused) {
      video.pause();
      recordedCameraVideoRef.current?.pause();
      setIsPlaying(false);
    } else {
      const end = trimEnd > 0 ? trimEnd : duration;
      if (video.currentTime >= end) {
        video.currentTime = trimStart;
        if (recordedCameraVideoRef.current) {
          recordedCameraVideoRef.current.currentTime = trimStart;
        }
      }
      try {
        await video.play();
        void recordedCameraVideoRef.current?.play().catch(e => console.error(e));
        setIsPlaying(true);
      } catch (e) {
        console.error(e);
        setIsPlaying(false);
      }
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

  const handleAddPreviewZoom = useCallback((moment: ZoomMoment) => {
    setZoomMoments((current) => {
      const zoomMoment: ZoomMoment = { strength: 'normal', duration: 'medium', ...moment };
      const next = [...current, zoomMoment].sort((a, b) => a.time - b.time);
      zoomMomentsRef.current = next;
      return next;
    });
  }, []);

  const handleUpdateZoomMoment = useCallback((index: number, updates: Partial<ZoomMoment>) => {
    setZoomMoments((current) => {
      const next = current.map((moment, momentIndex) => momentIndex === index ? { ...moment, ...updates } : moment);
      zoomMomentsRef.current = next;
      return next;
    });
  }, []);

  const handleDeleteZoomMoment = useCallback((index: number) => {
    setZoomMoments((current) => {
      const next = current.filter((_, momentIndex) => momentIndex !== index);
      zoomMomentsRef.current = next;
      return next;
    });
  }, []);

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
    if (recordedCameraVideoRef.current) {
      recordedCameraVideoRef.current.playbackRate = rate;
    }
  };

  // Video looping inside trim boundaries
  useEffect(() => {
    const video = editorVideoRef.current;
    if (!video) return;

    const restartLoop = () => {
      video.currentTime = trimStart;
      if (recordedCameraVideoRef.current) {
        recordedCameraVideoRef.current.currentTime = trimStart;
      }
      setCurrentTime(trimStart);
    };

    const handleLoopCheck = () => {
      const end = trimEnd > 0 ? trimEnd : duration;
      if (video.currentTime >= end) {
        if (isPlaying) {
          restartLoop();
          void video.play().catch((error) => console.error(error));
          void recordedCameraVideoRef.current?.play().catch((error) => console.error(error));
        } else {
          video.pause();
          recordedCameraVideoRef.current?.pause();
          restartLoop();
        }
      }
    };

    video.addEventListener('timeupdate', handleLoopCheck);
    video.addEventListener('ended', handleLoopCheck);
    return () => {
      video.removeEventListener('timeupdate', handleLoopCheck);
      video.removeEventListener('ended', handleLoopCheck);
    };
  }, [trimStart, trimEnd, duration, isPlaying]);

  useEffect(() => {
    const video = editorVideoEl;
    if (!video) return;

    const markPlaying = () => setIsPlaying(true);
    const markPaused = () => setIsPlaying(false);

    video.addEventListener('play', markPlaying);
    video.addEventListener('playing', markPlaying);
    video.addEventListener('pause', markPaused);
    video.addEventListener('ended', markPaused);

    return () => {
      video.removeEventListener('play', markPlaying);
      video.removeEventListener('playing', markPlaying);
      video.removeEventListener('pause', markPaused);
      video.removeEventListener('ended', markPaused);
    };
  }, [editorVideoEl]);

  const formatSecs = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const showRecordingCameraPreview = !showLandingPage && (recordingState === 'idle' || recordingState === 'recording') && useWebcam && settings.cameraPosition !== 'none';
  const isLiveSideCamera = settings.cameraPosition === 'side-left' || settings.cameraPosition === 'side-right';
  const liveCameraPreviewWidth = Math.min(220, Math.max(110, settings.cameraSize));
  const liveCameraPreviewHeight = isLiveSideCamera ? liveCameraPreviewWidth * SIDE_CAMERA_HEIGHT_TO_WIDTH : liveCameraPreviewWidth;

  return (
    <main className="xg-app h-screen w-screen flex flex-col text-white font-sans overflow-hidden">
      
      {/* Studio Header Bar */}
      {!showLandingPage && <header className="xg-nav select-none studio-nav">
        <div className="xg-nav-inner studio-nav-inner">
          <div className="xg-brand">
            <div className="xg-brand-mark"><DemonierLogo /></div>
            <div>
              <h1>Demonier</h1>
            </div>
          </div>

          {recordingState === 'idle' ? (
            <div className="xg-nav-actions studio-record-actions">
              <label className="studio-record-toggle">
                <Mic size={14} />
                <span>Mic</span>
                <input 
                  type="checkbox" 
                  checked={useMic} 
                  onChange={(e) => setUseMic(e.target.checked)} 
                  className="switch-input"
                />
                <span className="studio-toggle-track" />
              </label>
              <label className="studio-record-toggle">
                <Camera size={14} />
                <span>Camera</span>
                <input 
                  type="checkbox" 
                  checked={useWebcam} 
                  onChange={(e) => setUseWebcam(e.target.checked)} 
                  className="switch-input"
                />
                <span className="studio-toggle-track" />
              </label>
              <button 
                onClick={handleStartScreenRecording}
                className="xg-button xg-button-primary"
              >
                <Video size={14} /> Start Recording
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
                  setZoomMoments([]);
                  setRecordingIncludesWebcam(false);
                }
              }}
              className="xg-button xg-button-secondary"
            >
              <RotateCcw size={13} /> Record New
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
      </header>}

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
        className={showRecordingCameraPreview ? 'recording-camera-preview' : undefined}
        style={showRecordingCameraPreview ? {
          left: 'auto',
          right: '32px',
          top: 'auto',
          bottom: '32px',
          width: `${liveCameraPreviewWidth}px`,
          height: `${liveCameraPreviewHeight}px`,
          aspectRatio: isLiveSideCamera ? '4 / 5' : '1 / 1',
          borderRadius: isLiveSideCamera ? '8%' : settings.cameraShape === 'circle' ? '50%' : '18%',
          borderColor: settings.cameraBorderColor,
        } : { position: 'fixed', right: '8px', bottom: '8px', width: '160px', height: '90px', opacity: 0.01, pointerEvents: 'none', zIndex: 0 }}
        autoPlay
        playsInline
        muted
      />
      <video ref={setRecordedCameraVideoRef} src={cameraSrc || undefined} style={{ position: 'absolute', width: '1px', height: '1px', opacity: 0.001, pointerEvents: 'none', zIndex: -1000 }} muted playsInline />

      {/* Layout Content Body */}
      <div
        ref={showLandingPage ? landingScrollRef : undefined}
        onScroll={showLandingPage ? handleLandingScroll : undefined}
        className={showLandingPage ? 'landing-scroll-container flex-1' : 'flex-1 flex overflow-hidden'}
      >

        {showLandingPage ? (
          <>
            <header className={`xg-nav landing-nav select-none ${hideLandingNav ? 'landing-nav-hidden' : ''}`}>
              <div className="xg-nav-inner">
                <div className="xg-brand">
                  <div className="xg-brand-mark"><DemonierLogo /></div>
                  <div>
                    <h1>Demonier</h1>
                  </div>
                </div>
                <nav className="xg-nav-links" aria-label="Main sections">
                  <a href="/#features">Features</a>
                  <a href="/#how-it-works">How it works</a>
                  <a href="/#use-cases">Use cases</a>
                  <a href="/#ready">Ready</a>
                </nav>
                <div className="xg-nav-actions">
                  <button onClick={openStudio} className="xg-button xg-button-primary">
                    Open studio <ArrowRight size={15} />
                  </button>
                </div>
              </div>
            </header>
            <LandingPage onOpenStudio={openStudio} />
          </>
        ) : <>

        {recordingState === 'idle' && <section className="studio-empty-space animate-fade-in" aria-label="Recording ready" />}

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
                onChangeSettings={(updates) => setSettings((current) => ({ ...current, ...updates }))}
                zoomMoments={zoomMoments}
                onJumpToZoomMoment={handleSeek}
                onUpdateZoomMoment={handleUpdateZoomMoment}
                onDeleteZoomMoment={handleDeleteZoomMoment}
              />
            </aside>
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
              <CanvasEditor 
                canvasRef={canvasRef}
                onCanvasElementChange={setCanvasEl}
                videoElement={editorVideoEl}
                webcamElement={useWebcam && !recordingIncludesWebcam ? recordedCameraVideoEl : null}
                showWebcamOverlay={useWebcam && !recordingIncludesWebcam && Boolean(cameraSrc)}
                settings={settings}
                zoomMoments={zoomMoments}
                onAddZoomMoment={handleAddPreviewZoom}
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
        canvasElement={canvasEl}
        videoElement={editorVideoEl}
        cameraVideoElement={recordedCameraVideoEl}
        micStream={micStream}
        settings={settings}
        onChangeSettings={(updates) => setSettings((current) => ({ ...current, ...updates }))}
        duration={duration}
      />

    </main>
  );
}

export default App;
