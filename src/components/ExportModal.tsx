import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { EditorSettings } from '../types';

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
}

// This component deliberately has no visual UI. It renders the video in the
// background while App keeps the person in the editor and shows progress in the header.
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
  duration
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
      const resizeDeadline = performance.now() + 2000;
      while ((canvasElement.width < expectedSize.width || canvasElement.height < expectedSize.height) && performance.now() < resizeDeadline) {
        await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      }

      if (canvasElement.width < expectedSize.width || canvasElement.height < expectedSize.height) {
        throw new Error('The 4K video canvas was not ready. Please try again.');
      }

      chunksRef.current = [];
      originalPlayRateRef.current = videoElement.playbackRate;
      originalTimeRef.current = videoElement.currentTime;

      videoElement.pause();
      cameraVideoElement?.pause();
      const startSec = settings.trimStart;
      const endSec = settings.trimEnd > 0 ? settings.trimEnd : duration;
      const exportDuration = Math.max(endSec - startSec, 0.1);

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
        videoElement.currentTime = startSec;
        if (cameraVideoElement) cameraVideoElement.currentTime = startSec;
      });

      let mixedAudioTrack: MediaStreamTrack | null = null;
      const includeExportAudio = true;
      const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (includeExportAudio && AudioContextClass) {
        if (!persistentAudioCtx) {
          persistentAudioCtx = new AudioContextClass();
        }
        if (persistentAudioCtx.state === 'suspended') {
          await persistentAudioCtx.resume();
        }
        const destination = persistentAudioCtx.createMediaStreamDestination();
        let hasAudioInput = false;

        if (!persistentVideoSourceNode) {
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

      let mimeType = 'video/mp4;codecs=h264,aac';
      let extension = 'mp4';
      if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = 'video/mp4;codecs=h264,opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = 'video/mp4;codecs=h264';
      if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = 'video/mp4';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm;codecs=vp9,opus';
        extension = 'webm';
        if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = 'video/webm;codecs=vp8,opus';
        if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = 'video/webm';
        if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = '';
      }

      const recorder = new MediaRecorder(outputStream, {
        mimeType: mimeType || undefined,
        videoBitsPerSecond: 80000000
      });
      recorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      let progressTimer: number | null = null;
      let frameRequestTimer: number | null = null;
      let pausedForHiddenTab = false;
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
      const stopRecording = () => {
        if (recorder.state === 'recording') recorder.stop();
      };
      const handleVisibilityChange = () => {
        if (document.hidden && recorder.state === 'recording') {
          pausedForHiddenTab = true;
          videoElement.pause();
          cameraVideoElement?.pause();
          recorder.pause();
          return;
        }

        if (!document.hidden && pausedForHiddenTab && recorder.state === 'paused') {
          pausedForHiddenTab = false;
          recorder.resume();
          void videoElement.play().catch((error) => {
            console.warn('Video export preview could not resume:', error);
          });
          void cameraVideoElement?.play().catch((error) => {
            console.warn('Camera export preview could not resume:', error);
          });
        }
      };

      recorder.onstop = () => {
        stopTimers();
        videoElement.removeEventListener('ended', stopRecording);
        document.removeEventListener('visibilitychange', handleVisibilityChange);

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

      recorder.start();
      document.addEventListener('visibilitychange', handleVisibilityChange);
      await videoElement.play();
      await cameraVideoElement?.play();

      const requestCanvasFrame = () => {
        canvasTracks.forEach((track) => {
          const requestFrame = (track as MediaStreamTrack & { requestFrame?: () => void }).requestFrame;
          requestFrame?.call(track);
        });
      };

      const checkProgress = () => {
        if (recorder.state !== 'recording') return;
        const progress = Math.round(Math.min(100, ((videoElement.currentTime - startSec) / exportDuration) * 100));
        onProgress(progress);
        setLocalProgress(progress);
        if (videoElement.currentTime >= endSec || videoElement.ended) recorder.stop();
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
    settings.trimEnd,
    settings.trimStart,
    videoElement
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

        {/* Warning card */}
        <div className="export-warning-card">
          <div className="export-warning-icon">⚠️</div>
          <div className="export-warning-content">
            <h4>Keep this tab active</h4>
            <p>
              Please <strong>do not switch tabs, minimize this window, or navigate away</strong>.
              <br /><br />
              Keep this screen active until the export completes, otherwise the export will fail.
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
