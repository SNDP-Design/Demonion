import { useState, useRef, useEffect, useCallback } from 'react';
import type { EditorSettings, ClickMoment, VideoSegment, AudioTrackState, ClipTransition } from './types';
import { DEFAULT_SETTINGS } from './constants/presets';
import { SidebarControls } from './components/SidebarControls';
import { CanvasEditor } from './components/CanvasEditor';
import { Timeline } from './components/Timeline';
import { ExportModal } from './components/ExportModal';
import { LandingPage } from './components/LandingPage';
import { DemonionLogo } from './components/DemonionLogo';
import { 
  Video, 
  Mic, 
  Camera, 
  Download,
  ArrowRight,
  RotateCcw
} from 'lucide-react';

const SIDE_CAMERA_HEIGHT_TO_WIDTH = 5 / 4;

function App() {
  const [recordingState, setRecordingState] = useState<'idle' | 'recording' | 'editor'>('idle');
  const [showLandingPage, setShowLandingPage] = useState(true);
  const [isRecordingModalOpen, setIsRecordingModalOpen] = useState(false);
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
  const [clickMoments, setClickMoments] = useState<ClickMoment[]>([]);

  // Video clips & imported audio state
  const [clips, setClips] = useState<VideoSegment[]>([]);
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null);
  const [importedAudio, setImportedAudio] = useState<AudioTrackState | null>(null);

  // Recorder flags
  const [useMic, setUseMic] = useState(true);
  const [useWebcam, setUseWebcam] = useState(true); // Default to camera overlay active!
  const useSystemAudio = true;

  // Refs
  const editorVideoRef = useRef<HTMLVideoElement | null>(null);
  const webcamVideoRef = useRef<HTMLVideoElement | null>(null);
  const modalWebcamVideoRef = useRef<HTMLVideoElement | null>(null);
  const recordedCameraVideoRef = useRef<HTMLVideoElement | null>(null);
  const importedAudioRef = useRef<HTMLAudioElement | null>(null);
  const landingScrollRef = useRef<HTMLDivElement | null>(null);
  const lastLandingScrollTopRef = useRef(0);
  const isElectronApp = typeof window !== 'undefined' && (
    Boolean(window.electronAPI?.isElectron) ||
    navigator.userAgent.includes('Electron')
  );
  const webcamStreamRef = useRef<MediaStream | null>(null);
  const webcamRequestRef = useRef<Promise<boolean> | null>(null);
  const screenRecorderRef = useRef<MediaRecorder | null>(null);
  const cameraRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordedCameraChunksRef = useRef<Blob[]>([]);
  const recordingStartTimeRef = useRef(0);
  const clickMomentsRef = useRef<ClickMoment[]>([]);
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

  const handleStopRecording = useCallback(() => {
    if (screenRecorderRef.current && screenRecorderRef.current.state === 'recording') {
      screenRecorderRef.current.stop();
      if (cameraRecorderRef.current?.state === 'recording') cameraRecorderRef.current.stop();
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      void exitCameraPictureInPicture();
    }
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
    if (!video) return true;

    if (video.srcObject !== stream) {
      video.srcObject = stream;
    }

    try {
      await video.play();
    } catch (error) {
      console.warn('Camera preview could not start:', error);
    }

    return true;
  }, []);

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

  // Prevent accidental page reloads/navigating away when a recording/edit is in progress
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (recordingState !== 'idle') {
        e.preventDefault();
        e.returnValue = 'You have an active recording session. Discard and leave?';
        return e.returnValue;
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [recordingState]);

  // Release the camera when the user turns the camera option off.
  useEffect(() => {
    if (!useWebcam) {
      releaseWebcam();
    }
  }, [releaseWebcam, useWebcam]);

  // Bind webcam stream to modal preview element when modal is active
  useEffect(() => {
    let active = true;
    if (isRecordingModalOpen && useWebcam) {
      void ensureWebcamStream().then(() => {
        if (!active) return;
        const stream = webcamStreamRef.current;
        if (stream && modalWebcamVideoRef.current) {
          if (modalWebcamVideoRef.current.srcObject !== stream) {
            modalWebcamVideoRef.current.srcObject = stream;
          }
          void modalWebcamVideoRef.current.play().catch((err) => {
            console.warn('Webcam stream play failed in modal preview:', err);
          });
        }
      });
    } else {
      if (modalWebcamVideoRef.current) {
        modalWebcamVideoRef.current.pause();
        modalWebcamVideoRef.current.srcObject = null;
      }
      if (!isRecordingModalOpen && recordingState !== 'recording') {
        releaseWebcam();
      }
    }
    return () => {
      active = false;
    };
  }, [isRecordingModalOpen, useWebcam, ensureWebcamStream, releaseWebcam, recordingState]);

  const openStudio = useCallback(() => {
    setIsRecordingModalOpen(true);
  }, []);

  useEffect(() => {
    if (recordingState !== 'recording') return;

    const addClickMoment = (moment: Omit<ClickMoment, 'time'>) => {
      const time = Math.max(0, (performance.now() - recordingStartTimeRef.current) / 1000);
      clickMomentsRef.current = [...clickMomentsRef.current, { ...moment, time }];
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
      addClickMoment(lastPointerRef.current);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' || event.code === 'Escape' || (event.altKey && event.code === 'KeyS')) {
        event.preventDefault();
        event.stopPropagation();
        handleStopRecording();
      }
    };

    window.addEventListener('pointermove', handlePointerMove, true);
    window.addEventListener('click', handleClick, true);
    window.addEventListener('keydown', handleKeyDown, true);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove, true);
      window.removeEventListener('click', handleClick, true);
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [recordingState, handleStopRecording]);

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
        audio: useSystemAudio
      });
      const screenTrack = screenStream.getVideoTracks()[0];
      if (screenTrack) {
        screenTrack.onended = () => {
          handleStopRecording();
        };
      }
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
        clickMomentsRef.current = [];
        setClickMoments([]);
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
          if (useSystemAudio && screenStream.getAudioTracks().length) {
            audioContext.createMediaStreamSource(screenStream).connect(audioDestination);
            hasAudio = true;
          }
          if (hasAudio) {
            audioDestination.stream.getAudioTracks().forEach((track) => recordingStream.addTrack(track));
          } else if (screenStream.getAudioTracks().length) {
            screenStream.getAudioTracks().forEach((track) => recordingStream.addTrack(track));
          }
        } catch (error) {
          console.warn('Could not mix audio sources:', error);
          activeMicStream?.getAudioTracks().forEach((track) => recordingStream.addTrack(track));
          if (useSystemAudio) {
            screenStream.getAudioTracks().forEach((track) => recordingStream.addTrack(track));
          }
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
          setClickMoments(clickMomentsRef.current);
          setPlaybackRate(1);
          setVideoSrc(URL.createObjectURL(blob));
          setRecordingState('editor');
          setShowLandingPage(false); // Hide landing page to show editor
          screenStream.getTracks().forEach((track) => track.stop());
        };
        recorder.start();
        recordingStartTimeRef.current = performance.now();
        setRecordingState('recording');
        setRecTime(0);
        timerRef.current = setInterval(() => setRecTime((time) => time + 1), 1000);
      };

      // Start countdown inside modal overlay
      setCountdown(3);
      const counter = setInterval(() => {
        setCountdown((prev) => {
          if (prev === null) return null;
          if (prev <= 1) {
            clearInterval(counter);
            setCountdown(null);
            setIsRecordingModalOpen(false); // Close modal when countdown completes
            startSeparateRecording();
            return null;
          }
          return prev - 1;
        });
      }, 1000);

    } catch (err) {
      console.error('Recording initialization failed:', err);
      setShowLandingPage(true);
      setIsRecordingModalOpen(true);
      setRecordingState('idle');
    }
  };



  // Video playback callbacks
  const handleTimeUpdate = () => {
    if (editorVideoRef.current) {
      const cur = editorVideoRef.current.currentTime;
      setCurrentTime(cur);
      if (recordedCameraVideoRef.current && Math.abs(recordedCameraVideoRef.current.currentTime - cur) > 0.08) {
        recordedCameraVideoRef.current.currentTime = cur;
      }
    }
  };

  const handleMetadata = () => {
    if (editorVideoRef.current) {
      const dur = editorVideoRef.current.duration;
      editorVideoRef.current.playbackRate = playbackRate;
      setDuration(dur);
      setTrimStart(0);
      setTrimEnd(dur);
      setClips([{ id: `clip-${Date.now()}`, start: 0, end: dur }]);
    }
  };

  // Video Cut Handlers
  const handleCutAtPlayhead = useCallback(() => {
    const time = editorVideoRef.current ? editorVideoRef.current.currentTime : currentTime;
    setClips((currentClips) => {
      if (currentClips.length === 0) {
        return [
          { id: `clip-${Date.now()}-1`, start: 0, end: time },
          { id: `clip-${Date.now()}-2`, start: time, end: duration }
        ];
      }
      const targetIndex = currentClips.findIndex((c) => time > c.start + 0.05 && time < c.end - 0.05);
      if (targetIndex === -1) return currentClips;

      const targetClip = currentClips[targetIndex];
      const firstHalf: VideoSegment = { id: `clip-${Date.now()}-1`, start: targetClip.start, end: time };
      const secondHalf: VideoSegment = { id: `clip-${Date.now()}-2`, start: time, end: targetClip.end };

      const updated = [...currentClips];
      updated.splice(targetIndex, 1, firstHalf, secondHalf);
      return updated;
    });
  }, [currentTime, duration]);

  const handleDeleteSegment = useCallback((id: string) => {
    setClips((currentClips) => {
      const updated = currentClips.filter((c) => c.id !== id);
      if (updated.length === 0) {
        return [{ id: `clip-${Date.now()}`, start: 0, end: duration }];
      }
      return updated;
    });
  }, [duration]);

  const handleResetCuts = useCallback(() => {
    setClips([{ id: `clip-${Date.now()}`, start: 0, end: duration }]);
    setTrimStart(0);
    setTrimEnd(duration);
  }, [duration]);

  const handleDuplicateSegment = useCallback((id: string) => {
    setClips((currentClips) => {
      const idx = currentClips.findIndex((c) => c.id === id);
      if (idx === -1) return currentClips;
      const target = currentClips[idx];
      const dup: VideoSegment = {
        ...target,
        id: `clip-${Date.now()}`
      };
      const updated = [...currentClips];
      updated.splice(idx + 1, 0, dup);
      return updated;
    });
  }, []);

  const handleReorderSegments = useCallback((fromIdx: number, toIdx: number) => {
    setClips((currentClips) => {
      if (fromIdx < 0 || fromIdx >= currentClips.length || toIdx < 0 || toIdx >= currentClips.length) return currentClips;
      const updated = [...currentClips];
      const [moved] = updated.splice(fromIdx, 1);
      updated.splice(toIdx, 0, moved);
      return updated;
    });
  }, []);

  const handleSetClipTransition = useCallback((id: string, transition: ClipTransition) => {
    setClips((currentClips) => {
      return currentClips.map((c) => (c.id === id ? { ...c, transition } : c));
    });
  }, []);

  // Audio Import Handlers
  const handleImportAudio = useCallback((file: File) => {
    if (importedAudio?.src) {
      URL.revokeObjectURL(importedAudio.src);
    }
    const url = URL.createObjectURL(file);
    const tempAudio = new Audio(url);
    tempAudio.onloadedmetadata = () => {
      setImportedAudio({
        id: `audio-${Date.now()}`,
        name: file.name,
        src: url,
        duration: tempAudio.duration || 0,
        startTime: 0,
        trimStart: 0,
        trimEnd: tempAudio.duration || 0,
        volume: 1,
        muted: false,
      });
    };
  }, [importedAudio]);

  const handleRemoveAudio = useCallback(() => {
    if (importedAudio?.src) {
      URL.revokeObjectURL(importedAudio.src);
    }
    setImportedAudio(null);
  }, [importedAudio]);

  const handleToggleAudioMute = useCallback(() => {
    setImportedAudio((curr) => (curr ? { ...curr, muted: !curr.muted } : null));
  }, []);

  const handleAudioVolumeChange = useCallback((volume: number) => {
    setImportedAudio((curr) => (curr ? { ...curr, volume, muted: volume === 0 } : null));
  }, []);

  const handleAudioPositionChange = useCallback((startTime: number) => {
    setImportedAudio((curr) => (curr ? { ...curr, startTime } : null));
  }, []);

  const handleTogglePlay = async () => {
    const video = editorVideoRef.current;
    if (!video) return;

    if (!video.paused) {
      video.pause();
      recordedCameraVideoRef.current?.pause();
      importedAudioRef.current?.pause();
      setIsPlaying(false);
    } else {
      const end = trimEnd > 0 ? trimEnd : duration;
      if (video.currentTime >= end) {
        const startPos = clips && clips[0] ? clips[0].start : trimStart;
        video.currentTime = startPos;
        if (recordedCameraVideoRef.current) {
          recordedCameraVideoRef.current.currentTime = startPos;
        }
      }
      try {
        await video.play();
        void recordedCameraVideoRef.current?.play().catch((e) => console.error(e));
        if (importedAudioRef.current && importedAudio) {
          const audioTime = Math.max(0, video.currentTime - importedAudio.startTime + importedAudio.trimStart);
          importedAudioRef.current.currentTime = audioTime;
          void importedAudioRef.current.play().catch((e) => console.error(e));
        }
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
      if (importedAudioRef.current && importedAudio) {
        importedAudioRef.current.currentTime = Math.max(0, time - importedAudio.startTime + importedAudio.trimStart);
      }
      setCurrentTime(time);
    }
  };

  const handleAddPreviewClick = useCallback((moment: ClickMoment) => {
    setClickMoments((current) => {
      const next = [...current, moment].sort((a, b) => a.time - b.time);
      clickMomentsRef.current = next;
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
    if (importedAudioRef.current) {
      importedAudioRef.current.playbackRate = rate;
    }
  };

  useEffect(() => {
    if (editorVideoRef.current) editorVideoRef.current.playbackRate = playbackRate;
    if (recordedCameraVideoRef.current) recordedCameraVideoRef.current.playbackRate = playbackRate;
    if (importedAudioRef.current) importedAudioRef.current.playbackRate = playbackRate;
  }, [playbackRate, videoSrc, cameraSrc, importedAudio]);

  // Audio property updates sync
  useEffect(() => {
    const audio = importedAudioRef.current;
    if (!audio || !importedAudio) return;
    audio.volume = importedAudio.muted ? 0 : importedAudio.volume;
    audio.muted = importedAudio.muted;
    audio.playbackRate = playbackRate;
  }, [importedAudio, playbackRate]);

  // Video looping inside trim & clip boundaries
  useEffect(() => {
    const video = editorVideoRef.current;
    if (!video) return;

    const handleLoopCheck = () => {
      const cur = video.currentTime;
      if (clips && clips.length > 0) {
        const currentClip = clips.find((c) => cur >= c.start && cur < c.end - 0.02);
        if (!currentClip) {
          const nextClip = clips.find((c) => c.start > cur);
          if (nextClip) {
            video.currentTime = nextClip.start;
            if (recordedCameraVideoRef.current) recordedCameraVideoRef.current.currentTime = nextClip.start;
            if (importedAudioRef.current && importedAudio) {
              importedAudioRef.current.currentTime = Math.max(0, nextClip.start - importedAudio.startTime + importedAudio.trimStart);
            }
          } else {
            const firstClip = clips[0];
            const startPos = firstClip ? firstClip.start : trimStart;
            video.currentTime = startPos;
            if (recordedCameraVideoRef.current) recordedCameraVideoRef.current.currentTime = startPos;
            if (importedAudioRef.current && importedAudio) {
              importedAudioRef.current.currentTime = Math.max(0, startPos - importedAudio.startTime + importedAudio.trimStart);
            }
            if (!isPlaying) {
              video.pause();
              recordedCameraVideoRef.current?.pause();
              importedAudioRef.current?.pause();
            }
          }
        }
      } else {
        const end = trimEnd > 0 ? trimEnd : duration;
        if (cur >= end) {
          video.currentTime = trimStart;
          if (recordedCameraVideoRef.current) recordedCameraVideoRef.current.currentTime = trimStart;
          if (importedAudioRef.current && importedAudio) {
            importedAudioRef.current.currentTime = Math.max(0, trimStart - importedAudio.startTime + importedAudio.trimStart);
          }
          if (!isPlaying) {
            video.pause();
            recordedCameraVideoRef.current?.pause();
            importedAudioRef.current?.pause();
          }
        }
      }
    };

    video.addEventListener('timeupdate', handleLoopCheck);
    video.addEventListener('ended', handleLoopCheck);
    return () => {
      video.removeEventListener('timeupdate', handleLoopCheck);
      video.removeEventListener('ended', handleLoopCheck);
    };
  }, [trimStart, trimEnd, duration, isPlaying, clips, importedAudio]);

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

  const showRecordingCameraPreview = (recordingState === 'recording') && useWebcam && settings.cameraPosition !== 'none';
  const isLiveSideCamera = settings.cameraPosition === 'side-left' || settings.cameraPosition === 'side-right';
  const liveCameraPreviewWidth = Math.min(220, Math.max(110, settings.cameraSize));
  const liveCameraPreviewHeight = isLiveSideCamera ? liveCameraPreviewWidth * SIDE_CAMERA_HEIGHT_TO_WIDTH : liveCameraPreviewWidth;

  return (
    <main className="xg-app h-screen w-screen flex flex-col text-white font-sans overflow-hidden">
      
      {/* Studio Header Bar */}
      {!showLandingPage && <header className="xg-nav select-none studio-nav">
        <div className="xg-nav-inner studio-nav-inner">
          <a href="/" className="xg-brand">
            <div className="xg-brand-mark"><DemonionLogo size={24} /></div>
            <div>
              <h1>Demonion</h1>
            </div>
          </a>

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
                  setClickMoments([]);
                  setPlaybackRate(1);
                  setShowLandingPage(true);
                  setIsRecordingModalOpen(true);
                  setCurrentTime(0);
                  setDuration(0);
                  setTrimStart(0);
                  setTrimEnd(0);
                  setIsPlaying(false);
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
      <video 
        ref={setRecordedCameraVideoRef} 
        src={cameraSrc || undefined} 
        style={{ position: 'absolute', width: '1px', height: '1px', opacity: 0.001, pointerEvents: 'none', zIndex: -1000 }} 
        muted 
        playsInline 
        preload="auto"
        onLoadedData={() => {
          if (recordedCameraVideoRef.current && editorVideoRef.current) {
            recordedCameraVideoRef.current.currentTime = editorVideoRef.current.currentTime;
          }
        }}
      />
      <audio
        ref={importedAudioRef}
        src={importedAudio?.src || undefined}
        style={{ display: 'none' }}
        preload="auto"
      />

      {/* Layout Content Body */}
      <div
        ref={showLandingPage && !isElectronApp ? landingScrollRef : undefined}
        onScroll={showLandingPage && !isElectronApp ? handleLandingScroll : undefined}
        className={showLandingPage ? `landing-scroll-container flex-1 ${isElectronApp ? 'overflow-hidden max-h-screen' : ''}` : 'flex-1 flex overflow-hidden'}
      >

        {showLandingPage ? (
          <>
            <header className={`xg-nav landing-nav select-none ${hideLandingNav ? 'landing-nav-hidden' : ''}`}>
              <div className="xg-nav-inner">
                <a href="/" className="xg-brand">
                  <div className="xg-brand-mark"><DemonionLogo size={24} /></div>
                  <div>
                    <h1>Demonion</h1>
                  </div>
                </a>
                {!isElectronApp && (
                  <nav className="xg-nav-links" aria-label="Main sections">
                    <a href="/#features">Features</a>
                    <a href="/#how-it-works">How it works</a>
                    <a href="/#use-cases">Use cases</a>
                    <a href="/#ready">Ready</a>
                  </nav>
                )}
                <div className="xg-nav-actions">
                  <button onClick={openStudio} className="xg-button xg-button-primary">
                    Open studio <ArrowRight size={15} />
                  </button>
                </div>
              </div>
            </header>
            <LandingPage onOpenStudio={openStudio} heroOnly={isElectronApp} />

            {/* Floating Recording Bar */}
            {recordingState === 'recording' && (
              <div className="floating-recording-bar">
                <div className="floating-recording-info">
                  <span className="floating-recording-dot" />
                  <span className="floating-recording-text">Recording active... {formatSecs(recTime)}</span>
                </div>
                <button 
                  onClick={handleStopRecording}
                  className="floating-recording-stop-btn"
                >
                  Stop Recording & Edit
                </button>
              </div>
            )}
          </>
        ) : (
          /* Editor Layout */
          <div className="flex-1 flex overflow-hidden animate-fade-in">
            <aside className="h-full shrink-0">
              <SidebarControls
                settings={settings}
                onChangeSettings={(updates) => setSettings((current) => ({ ...current, ...updates }))}
              />
            </aside>
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
              <CanvasEditor 
                canvasRef={canvasRef}
                onCanvasElementChange={setCanvasEl}
                videoElement={editorVideoEl}
                webcamElement={useWebcam ? (recordedCameraVideoEl || webcamVideoRef.current) : null}
                showWebcamOverlay={useWebcam && Boolean(cameraSrc || webcamStreamRef.current)}
                settings={settings}
                clickMoments={clickMoments}
                onAddClickMoment={handleAddPreviewClick}
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
                clips={clips}
                selectedSegmentId={selectedSegmentId}
                onSelectSegment={setSelectedSegmentId}
                onCutAtPlayhead={handleCutAtPlayhead}
                onDuplicateSegment={handleDuplicateSegment}
                onDeleteSegment={handleDeleteSegment}
                onResetCuts={handleResetCuts}
                onReorderSegments={handleReorderSegments}
                onSetClipTransition={handleSetClipTransition}
                audioTrack={importedAudio}
                onImportAudio={handleImportAudio}
                onRemoveAudio={handleRemoveAudio}
                onToggleAudioMute={handleToggleAudioMute}
                onAudioVolumeChange={handleAudioVolumeChange}
                onAudioPositionChange={handleAudioPositionChange}
              />
            </div>
          </div>
        )}
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
        trimStart={trimStart}
        trimEnd={trimEnd}
        clips={clips}
        importedAudio={importedAudio}
      />

      {/* Recording Configuration Modal */}
      {isRecordingModalOpen && (
        <div className="recording-modal-overlay">
          <div className="recording-modal">
            {countdown !== null ? (
              <div className="modal-countdown-container animate-fade-in">
                <div className="modal-countdown-text">Recording starts in</div>
                <div className="modal-countdown-number animate-ping">{countdown}</div>
                <div className="modal-countdown-sub">
                  Prepare your screen. Switching to your desired app now.
                </div>
              </div>
            ) : (
              <>
                <h2>Ready to Record?</h2>
                <p className="modal-desc">Configure your video and audio inputs before capturing your screen.</p>
                
                {/* Live Camera circular badge preview */}
                <div className={`modal-camera-preview-container ${useWebcam ? 'active' : ''}`}>
                  {useWebcam ? (
                    <>
                      <video 
                        ref={modalWebcamVideoRef} 
                        className="modal-camera-video"
                        autoPlay 
                        playsInline 
                        muted 
                      />
                      <div className="modal-camera-active-dot" />
                    </>
                  ) : (
                    <div className="modal-camera-placeholder">
                      <Camera size={32} />
                      <span>Camera Off</span>
                    </div>
                  )}
                </div>

                {/* Input Selection Control Switches */}
                <div className="modal-controls-list">
                  <div className="modal-control-row">
                    <div className="modal-control-info">
                      <div className="modal-control-icon">
                        <Mic size={18} />
                      </div>
                      <div className="modal-control-text">
                        <h4>Microphone</h4>
                        <p>Record voice narration</p>
                      </div>
                    </div>
                    <label className="modal-toggle-label">
                      <input 
                        type="checkbox" 
                        checked={useMic} 
                        onChange={(e) => setUseMic(e.target.checked)} 
                        className="switch-input"
                      />
                      <span className="modal-toggle-track" />
                    </label>
                  </div>

                  <div className="modal-control-row">
                    <div className="modal-control-info">
                      <div className="modal-control-icon">
                        <Camera size={18} />
                      </div>
                      <div className="modal-control-text">
                        <h4>Camera Overlay</h4>
                        <p>Float camera bubble on screen</p>
                      </div>
                    </div>
                    <label className="modal-toggle-label">
                      <input 
                        type="checkbox" 
                        checked={useWebcam} 
                        onChange={(e) => setUseWebcam(e.target.checked)} 
                        className="switch-input"
                      />
                      <span className="modal-toggle-track" />
                    </label>
                  </div>

                </div>

                {/* Pro Tip Note */}
                <div className="modal-tip-box">
                  <div className="modal-tip-title">
                    💡 Pro-Tip
                  </div>
                  <p className="modal-tip-desc">
                    Zoom your target window/browser to <strong>125%</strong> (press <code>Cmd +</code> or <code>Ctrl +</code>) before recording to make text and details look crisp and high-definition!
                  </p>
                </div>

                {/* Modal Actions */}
                <div className="modal-actions">
                  <button 
                    onClick={() => setIsRecordingModalOpen(false)}
                    className="modal-btn secondary"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => {
                      void handleStartScreenRecording();
                    }}
                    className="modal-btn primary"
                  >
                    <Video size={16} /> Start Recording
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

    </main>
  );
}

export default App;
