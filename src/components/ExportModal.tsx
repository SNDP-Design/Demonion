import React, { useEffect, useRef } from 'react';
import type { EditorSettings } from '../types';

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
  const audioCtxRef = useRef<AudioContext | null>(null);
  const originalPlayRateRef = useRef(1);
  const originalTimeRef = useRef(0);
  const hasStartedRef = useRef(false);

  const restoreEditor = () => {
    onChangeSettings({ exportResolution: '1080p' });
    if (audioCtxRef.current) {
      void audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
  };

  const startExport = async () => {
    if (!canvasElement || !videoElement) {
      onError('Your video preview is not ready yet. Please wait a moment and try again.');
      onClose();
      return;
    }

    try {
      onProgress(0);
      onChangeSettings({ exportResolution: '4k' });

      const expectedSize = settings.aspectRatio === '16-10'
        ? { width: 3840, height: 2400 }
        : settings.aspectRatio === '4-3'
          ? { width: 2880, height: 2160 }
          : { width: 3840, height: 2160 };
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
      const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        const audioCtx = new AudioContextClass();
        audioCtxRef.current = audioCtx;
        if (audioCtx.state === 'suspended') await audioCtx.resume();
        const destination = audioCtx.createMediaStreamDestination();
        let hasAudioInput = false;

        try {
          const videoAudio = audioCtx.createMediaElementSource(videoElement);
          videoAudio.connect(destination);
          videoAudio.connect(audioCtx.destination);
          hasAudioInput = true;
        } catch {
          // Some browser recordings have no audio source. Microphone audio can still be mixed below.
        }

        if (micStream?.getAudioTracks().length) {
          const microphone = audioCtx.createMediaStreamSource(micStream);
          microphone.connect(destination);
          hasAudioInput = true;
        }

        if (hasAudioInput) mixedAudioTrack = destination.stream.getAudioTracks()[0] ?? null;
      }

      const canvasStream = canvasElement.captureStream(60);
      const outputStream = new MediaStream(canvasStream.getVideoTracks());
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
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType || 'video/webm' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `demonier-${Date.now()}.${extension}`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);

        videoElement.playbackRate = originalPlayRateRef.current;
        videoElement.currentTime = originalTimeRef.current;
        videoElement.pause();
        if (cameraVideoElement) {
          cameraVideoElement.currentTime = originalTimeRef.current;
          cameraVideoElement.pause();
        }
        restoreEditor();
        onProgress(100);
        onClose();
      };

      recorder.start();
      await videoElement.play();
      await cameraVideoElement?.play();

      const checkProgress = () => {
        if (recorder.state !== 'recording') return;
        const progress = Math.round(Math.min(100, ((videoElement.currentTime - startSec) / exportDuration) * 100));
        onProgress(progress);
        if (videoElement.currentTime >= endSec || videoElement.ended) recorder.stop();
        else requestAnimationFrame(checkProgress);
      };
      requestAnimationFrame(checkProgress);
    } catch (error) {
      restoreEditor();
      const message = error instanceof Error ? error.message : 'The video could not be exported. Please try again.';
      onError(message);
      onClose();
    }
  };

  useEffect(() => {
    if (!isOpen) {
      hasStartedRef.current = false;
      return;
    }
    if (!hasStartedRef.current) {
      hasStartedRef.current = true;
      void startExport();
    }
  }, [isOpen]);

  return null;
};
