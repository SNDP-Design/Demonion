import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { AudioTrackState, EditorSettings, VideoSegment } from '../types';

let persistentAudioCtx: AudioContext | null = null;
let persistentVideoSourceNode: MediaElementAudioSourceNode | null = null;

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProgress: (progress: number) => void;
  onError: (message: string) => void;
  canvasElement: HTMLCanvasElement | null;
  videoElement: HTMLVideoElement | null;
  cameraVideoElement: HTMLVideoElement | null;
  micStream: MediaStream | null;
  settings: EditorSettings;
  onChangeSettings: (settings: Partial<EditorSettings>) => void;
  duration: number;
  trimStart: number;
  trimEnd: number;
  clips?: VideoSegment[];
  importedAudio?: AudioTrackState | null;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  onProgress,
  onError,
  canvasElement,
  videoElement,
  cameraVideoElement,
  micStream,
  settings,
  onChangeSettings,
  duration,
  trimStart,
  trimEnd,
  clips = [],
  importedAudio = null
}) => {
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const originalPlayRateRef = useRef(1);
  const originalTimeRef = useRef(0);
  const hasStartedRef = useRef(false);
  const [localProgress, setLocalProgress] = useState(0);
  const activeMicSourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const activeExportDestinationRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const isCancelledRef = useRef(false);

  const restoreEditor = useCallback(() => {
    onChangeSettings({ exportResolution: '1080p' });
    if (persistentVideoSourceNode && persistentAudioCtx) {
      try {
        persistentVideoSourceNode.disconnect();
      } catch {
        // Safe
      }
      try {
        persistentVideoSourceNode.connect(persistentAudioCtx.destination);
      } catch (err) {
        console.warn('Failed to reconnect video audio to speakers:', err);
      }
    }
    if (activeMicSourceNodeRef.current) {
      try {
        activeMicSourceNodeRef.current.disconnect();
      } catch {
        // Safe
      }
      activeMicSourceNodeRef.current = null;
    }
    activeExportDestinationRef.current = null;
  }, [onChangeSettings]);

  const startExport = useCallback(async () => {
    if (!canvasElement || !videoElement) {
      onError('Your video preview is not ready yet. Please wait a moment and try again.');
      onClose();
      return;
    }

    try {
      isCancelledRef.current = false;
      onProgress(0);
      setLocalProgress(0);
      onChangeSettings({ exportResolution: '4k' });

      const expectedSize = (() => {
        switch (settings.aspectRatio) {
          case '16-10':
            return { width: 3840, height: 2400 };
          case '9-16':
            return { width: 2160, height: 3840 };
          case '1-1':
            return { width: 2160, height: 2160 };
          case '4-3':
            return { width: 2880, height: 2160 };
          case '16-9':
          default:
            return { width: 3840, height: 2160 };
        }
      })();

      await new Promise<void>((resolve) => window.setTimeout(resolve, 100));

      const resizeDeadline = performance.now() + 2000;
      while ((canvasElement.width < expectedSize.width || canvasElement.height < expectedSize.height) && performance.now() < resizeDeadline) {
        await new Promise<void>((resolve) => window.setTimeout(resolve, 50));
      }

      chunksRef.current = [];
      originalPlayRateRef.current = videoElement.playbackRate;
      originalTimeRef.current = videoElement.currentTime;

      videoElement.pause();
      cameraVideoElement?.pause();

      const activeSegments = clips && clips.length > 0
        ? clips
        : [{ id: 'full', start: trimStart, end: trimEnd > 0 ? trimEnd : duration }];

      const initialStartSec = activeSegments[0].start;
      const totalExportDuration = activeSegments.reduce((acc, c) => acc + Math.max(0, c.end - c.start), 0) || 0.1;

      await new Promise<void>((resolve) => {
        let settled = false;
        const done = () => {
          if (settled) return;
          settled = true;
          videoElement.removeEventListener('seeked', done);
          clearTimeout(timeout);
          resolve();
        };
        const timeout = window.setTimeout(done, 250);
        videoElement.addEventListener('seeked', done);
        videoElement.currentTime = initialStartSec;
        if (cameraVideoElement) cameraVideoElement.currentTime = initialStartSec;
      });

      let mixedAudioTrack: MediaStreamTrack | null = null;
      let importedAudioEl: HTMLAudioElement | null = null;
      let importedAudioSourceNode: MediaElementAudioSourceNode | null = null;

      const includeExportAudio = true;
      const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (includeExportAudio && AudioContextClass) {
        if (!persistentAudioCtx) {
          try {
            persistentAudioCtx = new AudioContextClass({ sampleRate: 44100 });
          } catch {
            persistentAudioCtx = new AudioContextClass();
          }
        }
        if (persistentAudioCtx.state === 'suspended') {
          await persistentAudioCtx.resume();
        }
        const destination = persistentAudioCtx.createMediaStreamDestination();
        let hasAudioInput = false;

        if (!persistentVideoSourceNode && persistentAudioCtx) {
          try {
            persistentVideoSourceNode = persistentAudioCtx.createMediaElementSource(videoElement);
          } catch (err) {
            console.warn('Failed to create media element source node:', err);
          }
        }

        if (persistentVideoSourceNode) {
          try {
            persistentVideoSourceNode.disconnect();
          } catch {
            // Safe
          }
          try {
            persistentVideoSourceNode.connect(destination);
            hasAudioInput = true;
          } catch (err) {
            console.warn('Failed to connect video source node to export destination:', err);
          }
        }

        let micSourceNode: MediaStreamAudioSourceNode | null = null;
        if (micStream?.getAudioTracks().length) {
          try {
            micSourceNode = persistentAudioCtx.createMediaStreamSource(micStream);
            micSourceNode.connect(destination);
            hasAudioInput = true;
          } catch (err) {
            console.warn('Failed to connect mic stream to export destination:', err);
          }
        }

        // Mix imported background audio track if present
        if (importedAudio && !importedAudio.muted && importedAudio.src) {
          try {
            importedAudioEl = new Audio(importedAudio.src);
            importedAudioEl.currentTime = Math.max(0, initialStartSec - importedAudio.startTime + importedAudio.trimStart);
            importedAudioEl.volume = importedAudio.volume;
            importedAudioSourceNode = persistentAudioCtx.createMediaElementSource(importedAudioEl);
            importedAudioSourceNode.connect(destination);
            hasAudioInput = true;
            void importedAudioEl.play().catch((e) => console.warn('Imported audio play during export warning:', e));
          } catch (err) {
            console.warn('Failed to mix imported audio into export destination:', err);
          }
        }

        if (hasAudioInput) {
          mixedAudioTrack = destination.stream.getAudioTracks()[0] ?? null;
        }

        activeMicSourceNodeRef.current = micSourceNode;
        activeExportDestinationRef.current = destination;
      }

      const canvasStream = canvasElement.captureStream(60);
      const canvasTracks = canvasStream.getVideoTracks();
      const outputStream = new MediaStream(canvasTracks);
      if (mixedAudioTrack) outputStream.addTrack(mixedAudioTrack);

      const getPreferredFormat = () => {
        const mp4Types = [
          'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
          'video/mp4;codecs=h264,aac',
          'video/mp4'
        ];
        for (const type of mp4Types) {
          if (MediaRecorder.isTypeSupported(type)) {
            return { mimeType: type, extension: 'mp4' };
          }
        }
        const webmTypes = [
          'video/webm;codecs=vp8,opus',
          'video/webm;codecs=vp9,opus',
          'video/webm'
        ];
        for (const type of webmTypes) {
          if (MediaRecorder.isTypeSupported(type)) {
            return { mimeType: type, extension: 'webm' };
          }
        }
        return { mimeType: '', extension: 'webm' };
      };

      const { mimeType, extension } = getPreferredFormat();

      const recorder = new MediaRecorder(outputStream, {
        mimeType: mimeType || undefined,
        videoBitsPerSecond: 25000000
      });
      recorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      let progressTimer: number | null = null;
      let frameRequestTimer: number | null = null;

      const stopTimers = () => {
        if (progressTimer !== null) {
          window.clearInterval(progressTimer);
          progressTimer = null;
        }
        if (frameRequestTimer !== null) {
          window.clearInterval(frameRequestTimer);
          frameRequestTimer = null;
        }
      };

      recorder.onerror = (event) => {
        console.error('MediaRecorder error during export:', event);
        stopTimers();
        if (importedAudioEl) {
          importedAudioEl.pause();
          importedAudioEl = null;
        }
        restoreEditor();
        recorderRef.current = null;
        hasStartedRef.current = false;
        onError('MediaRecorder encountered an encoding error. Please try again.');
        onClose();
      };
      const stopRecording = () => {
        if (recorder.state === 'recording') recorder.stop();
      };

      recorder.onstop = () => {
        stopTimers();
        if (importedAudioEl) {
          importedAudioEl.pause();
          importedAudioEl = null;
        }
        if (importedAudioSourceNode) {
          try { importedAudioSourceNode.disconnect(); } catch { /* safe */ }
          importedAudioSourceNode = null;
        }
        videoElement.removeEventListener('ended', stopRecording);

        videoElement.playbackRate = originalPlayRateRef.current;
        videoElement.currentTime = originalTimeRef.current;
        videoElement.pause();
        if (cameraVideoElement) {
          cameraVideoElement.currentTime = originalTimeRef.current;
          cameraVideoElement.pause();
        }
        restoreEditor();

        if (!isCancelledRef.current) {
          const blob = new Blob(chunksRef.current, { type: mimeType || 'video/webm' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `demonion-${Date.now()}.${extension}`;
          document.body.appendChild(link);
          link.click();
          link.remove();
          window.setTimeout(() => URL.revokeObjectURL(url), 1000);
          onProgress(100);
          setLocalProgress(100);
        }

        recorderRef.current = null;
        hasStartedRef.current = false;
        onClose();
      };

      recorder.start(200);
      try {
        await videoElement.play();
      } catch (err) {
        console.warn('Video play error during export:', err);
      }
      if (cameraVideoElement) {
        try {
          await cameraVideoElement.play();
        } catch (err) {
          console.warn('Camera video play error during export:', err);
        }
      }

      const requestCanvasFrame = () => {
        canvasTracks.forEach((track) => {
          const requestFrame = (track as MediaStreamTrack & { requestFrame?: () => void }).requestFrame;
          requestFrame?.call(track);
        });
      };

      let currentSegmentIdx = 0;
      const checkProgress = () => {
        if (recorder.state !== 'recording') return;

        // Ensure playback continues even if browser attempts to suspend background media
        if (videoElement.paused && recorder.state === 'recording') {
          void videoElement.play().catch(() => {/* safe */});
        }
        if (cameraVideoElement && cameraVideoElement.paused && recorder.state === 'recording') {
          void cameraVideoElement.play().catch(() => {/* safe */});
        }
        if (importedAudioEl && importedAudioEl.paused && recorder.state === 'recording') {
          void importedAudioEl.play().catch(() => {/* safe */});
        }

        const current = videoElement.currentTime;
        const activeSeg = activeSegments[currentSegmentIdx];

        if (activeSeg && current >= activeSeg.end - 0.05) {
          currentSegmentIdx++;
          if (currentSegmentIdx < activeSegments.length) {
            const nextSeg = activeSegments[currentSegmentIdx];
            videoElement.currentTime = nextSeg.start;
            if (cameraVideoElement) cameraVideoElement.currentTime = nextSeg.start;
            if (importedAudioEl && importedAudio) {
              importedAudioEl.currentTime = Math.max(0, nextSeg.start - importedAudio.startTime + importedAudio.trimStart);
            }
          } else {
            if (recorder.state === 'recording') {
              recorder.stop();
            }
            return;
          }
        }

        let processedDuration = 0;
        for (let i = 0; i < currentSegmentIdx; i++) {
          processedDuration += activeSegments[i].end - activeSegments[i].start;
        }
        if (activeSeg) {
          processedDuration += Math.max(0, current - activeSeg.start);
        }

        const progress = Math.max(0, Math.min(99, Math.round((processedDuration / totalExportDuration) * 100)));
        onProgress(progress);
        setLocalProgress(progress);

        if (videoElement.ended) {
          if (recorder.state === 'recording') {
            recorder.stop();
          }
        }
      };

      videoElement.addEventListener('ended', stopRecording, { once: true });
      progressTimer = window.setInterval(checkProgress, 250);
      frameRequestTimer = window.setInterval(requestCanvasFrame, 1000 / 30);
      checkProgress();
    } catch (error) {
      restoreEditor();
      recorderRef.current = null;
      hasStartedRef.current = false;
      const message = error instanceof Error ? error.message : 'The video could not be exported. Please try again.';
      onError(message);
      onClose();
    }
  }, [
    canvasElement,
    cameraVideoElement,
    duration,
    micStream,
    onChangeSettings,
    onClose,
    onError,
    onProgress,
    restoreEditor,
    settings.aspectRatio,
    trimEnd,
    trimStart,
    videoElement,
    clips,
    importedAudio
  ]);

  useEffect(() => {
    if (!isOpen) {
      hasStartedRef.current = false;
      return;
    }
    if (!hasStartedRef.current) {
      hasStartedRef.current = true;
      void startExport();
    }
  }, [isOpen, startExport]);

  if (!isOpen) return null;

  return (
    <div className="export-modal-overlay">
      <div className="export-modal">
        <div className="export-modal-header">
          <h3>Exporting Video</h3>
          <span className="export-progress-text">{localProgress}%</span>
        </div>

        {/* Progress Bar Track */}
        <div className="export-progress-track">
          <div 
            className="export-progress-bar" 
            style={{ width: `${localProgress}%` }}
          />
        </div>

        {/* Informative background card */}
        <div className="export-warning-card">
          <div className="export-warning-icon">🚀</div>
          <div className="export-warning-content">
            <h4>Exporting in background</h4>
            <p>
              Your video is rendering continuously.
              <br />
              You can <strong>freely switch tabs, open other applications, or minimize this window</strong> — your export will finish automatically.
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="export-actions">
          <button 
            onClick={() => {
              isCancelledRef.current = true;
              if (recorderRef.current && recorderRef.current.state !== 'inactive') {
                recorderRef.current.stop();
              } else {
                restoreEditor();
                onClose();
              }
            }}
            className="export-cancel-btn"
          >
            Cancel Export
          </button>
        </div>
      </div>
    </div>
  );
};
