import { useState, useRef, useEffect, useCallback } from 'react';
import type { EditorSettings } from './types';
import { DEFAULT_SETTINGS } from './constants/presets';
import { SidebarControls } from './components/SidebarControls';
import { CanvasEditor } from './components/CanvasEditor';
import { Timeline } from './components/Timeline';
import { ExportModal } from './components/ExportModal';
import { 
  Sparkles, 
  Video, 
  Mic, 
  Camera, 
  Disc, 
  Download,
  RotateCcw,
  FileVideo
} from 'lucide-react';

function App() {
  const [recordingState, setRecordingState] = useState<'idle' | 'recording' | 'editor'>('idle');
  const [countdown, setCountdown] = useState<number | null>(null);
  
  // Streams
  const [videoSrc, setVideoSrc] = useState<string>('');
  const [micStream, setMicStream] = useState<MediaStream | null>(null);
  const [webcamStream, setWebcamStream] = useState<MediaStream | null>(null);

  // Editor states
  const [settings, setSettings] = useState<EditorSettings>(DEFAULT_SETTINGS);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [exportModalOpen, setExportModalOpen] = useState(false);

  // Recorder flags
  const [useMic, setUseMic] = useState(true);
  const [useWebcam, setUseWebcam] = useState(true); // Default to camera overlay active!

  // Refs
  const editorVideoRef = useRef<HTMLVideoElement | null>(null);
  const webcamVideoRef = useRef<HTMLVideoElement | null>(null);
  const screenRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);
  const [recTime, setRecTime] = useState(0);

  // Callback ref states to ensure preview render loop updates when DOM elements mount
  const [editorVideoEl, setEditorVideoEl] = useState<HTMLVideoElement | null>(null);
  const [webcamVideoEl, setWebcamVideoEl] = useState<HTMLVideoElement | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const setEditorVideoRef = useCallback((el: HTMLVideoElement | null) => {
    editorVideoRef.current = el;
    setEditorVideoEl((current) => current === el ? current : el);
  }, []);

  const setWebcamVideoRef = useCallback((el: HTMLVideoElement | null) => {
    webcamVideoRef.current = el;
    setWebcamVideoEl((current) => current === el ? current : el);
  }, []);

  // Auto clean blob url
  useEffect(() => {
    return () => {
      if (videoSrc) URL.revokeObjectURL(videoSrc);
    };
  }, [videoSrc]);

  // Request/Release Webcam Overlay Stream based on settings toggle/editor state
  useEffect(() => {
    const initWebcam = async () => {
      if (useWebcam && recordingState === 'idle') {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { width: { ideal: 1280 }, height: { ideal: 720 } }, 
            audio: false 
          });
          setWebcamStream(stream);
          if (webcamVideoRef.current) {
            webcamVideoRef.current.srcObject = stream;
            webcamVideoRef.current.play().catch(err => console.warn('Webcam play failed:', err));
          }
        } catch (e) {
          console.error('Webcam permission denied:', e);
          setUseWebcam(false);
        }
      }
    };

    if (recordingState === 'idle') {
      if (useWebcam) {
        initWebcam();
      } else {
        if (webcamStream) {
          webcamStream.getTracks().forEach(track => track.stop());
          setWebcamStream(null);
        }
      }
    }
  }, [useWebcam, recordingState]);

  // Handle countdown overlay before screen recording starts
  const handleStartScreenRecording = async () => {
    try {
      // 1. Prompt screen grab
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: { 
          displaySurface: 'monitor',
          width: { ideal: 2560, max: 3840 },
          height: { ideal: 1600, max: 2160 },
          frameRate: { ideal: 60 }
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

      // 3. Request webcam if requested
      let activeWebcamStream: MediaStream | null = null;
      if (useWebcam) {
        try {
          activeWebcamStream = await navigator.mediaDevices.getUserMedia({ 
            video: { width: { ideal: 1280 }, height: { ideal: 720 } } 
          });
          setWebcamStream(activeWebcamStream);
          if (webcamVideoRef.current) {
            webcamVideoRef.current.srcObject = activeWebcamStream;
            webcamVideoRef.current.play().catch(err => console.warn('Webcam start failed:', err));
          }
        } catch (e) {
          console.warn('Webcam access denied.');
          setUseWebcam(false);
        }
      }

      // Start countdown
      setCountdown(3);
      const counter = setInterval(() => {
        setCountdown((prev) => {
          if (prev === null) return null;
          if (prev <= 1) {
            clearInterval(counter);
            setCountdown(null);
            
            // Start recording action
            recordedChunksRef.current = [];
            
            // Create recorder (we record screen stream video)
            let recordMimeType = 'video/webm;codecs=vp9';
            if (!MediaRecorder.isTypeSupported(recordMimeType)) {
              recordMimeType = 'video/webm;codecs=vp8';
            }
            if (!MediaRecorder.isTypeSupported(recordMimeType)) {
              recordMimeType = 'video/webm';
            }
            if (!MediaRecorder.isTypeSupported(recordMimeType)) {
              recordMimeType = 'video/mp4;codecs=h264';
            }
            if (!MediaRecorder.isTypeSupported(recordMimeType)) {
              recordMimeType = '';
            }

            const recorder = new MediaRecorder(screenStream, {
              mimeType: recordMimeType || undefined,
              videoBitsPerSecond: 25000000 // 25 Mbps high quality screen capture
            });
            screenRecorderRef.current = recorder;

            recorder.ondataavailable = (e) => {
              if (e.data && e.data.size > 0) {
                recordedChunksRef.current.push(e.data);
              }
            };

            recorder.onstop = () => {
              const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
              const url = URL.createObjectURL(blob);
              setVideoSrc(url);
              setRecordingState('editor');
              
              // Stop screen stream tracks
              screenStream.getTracks().forEach(t => t.stop());
            };

            recorder.start();
            setRecordingState('recording');
            setRecTime(0);
            timerRef.current = setInterval(() => {
              setRecTime(t => t + 1);
            }, 1000);

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
      clearInterval(timerRef.current);
    }
  };

  // Video playback callbacks
  const handleTimeUpdate = () => {
    if (editorVideoRef.current) {
      setCurrentTime(editorVideoRef.current.currentTime);
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
      setIsPlaying(false);
    } else {
      const end = trimEnd > 0 ? trimEnd : duration;
      if (video.currentTime >= end) {
        video.currentTime = trimStart;
      }
      video.play().catch(e => console.error(e));
      setIsPlaying(true);
    }
  };

  const handleSeek = (time: number) => {
    const video = editorVideoRef.current;
    if (video) {
      video.currentTime = time;
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
        <div className="xg-nav-inner">
          <div className="xg-brand">
            <div className="xg-brand-mark"><Sparkles size={16} /></div>
            <div>
              <h1>Screentor</h1>
              <p>Browser Studio</p>
            </div>
          </div>
          <div className="xg-nav-links" aria-label="Workspace sections">
            <span className="active">Studio</span>
            <span>Capture</span>
            <span>Export</span>
          </div>

          {recordingState === 'editor' && (
          <div className="xg-nav-actions">
            <button 
              onClick={() => {
                if (window.confirm('Discard current video and start over?')) {
                  setRecordingState('idle');
                  setVideoSrc('');
                }
              }}
              className="xg-button xg-button-secondary"
            >
              <RotateCcw size={13} /> Reset
            </button>
            <button 
              onClick={() => setExportModalOpen(true)}
              className="xg-button xg-button-primary"
            >
              <Download size={14} /> Export Video
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
        style={{ position: 'absolute', width: '1px', height: '1px', opacity: 0.001, pointerEvents: 'none', zIndex: -1000 }}
        autoPlay
        playsInline
        muted
      />

      {/* Layout Content Body */}
      <div className="flex-1 flex overflow-hidden">

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
          <div className="flex-1 flex flex-col overflow-hidden animate-fade-in">
            {/* Split controls & editor */}
            <div className="flex-1 flex overflow-hidden">
              <SidebarControls
                settings={settings}
                onChangeSettings={(updates) => setSettings({ ...settings, ...updates })}
              />
              <CanvasEditor 
                canvasRef={canvasRef}
                videoElement={editorVideoEl}
                webcamElement={useWebcam ? webcamVideoEl : null}
                settings={settings}
              />
            </div>

            {/* Video timeline controls */}
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
        )}

      </div>

      {/* Export Modal */}
      <ExportModal 
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        canvasElement={canvasRef.current}
        videoElement={editorVideoEl}
        micStream={micStream}
        settings={settings}
        onChangeSettings={(updates) => setSettings({ ...settings, ...updates })}
        duration={duration}
      />

    </main>
  );
}

export default App;
