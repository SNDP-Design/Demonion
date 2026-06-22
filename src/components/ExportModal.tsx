import React, { useState, useEffect, useRef } from 'react';
import type { EditorSettings } from '../types';
import { 
  Download, 
  X, 
  Loader2, 
  CheckCircle,
  Video,
  AlertTriangle
} from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  canvasElement: HTMLCanvasElement | null;
  videoElement: HTMLVideoElement | null;
  micStream: MediaStream | null;
  settings: EditorSettings;
  onChangeSettings: (settings: Partial<EditorSettings>) => void;
  duration: number;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  canvasElement,
  videoElement,
  micStream,
  settings,
  onChangeSettings,
  duration
}) => {
  const [exportState, setExportState] = useState<'idle' | 'rendering' | 'completed' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [fileSize, setFileSize] = useState<string>('');
  const [downloadUrl, setDownloadUrl] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState('');
  const [exportExtension, setExportExtension] = useState('mp4');

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const originalPlayRateRef = useRef<number>(1);
  const originalTimeRef = useRef<number>(0);

  useEffect(() => {
    // Cleanup URL when component unmounts
    return () => {
      if (downloadUrl) {
        URL.revokeObjectURL(downloadUrl);
      }
    };
  }, [downloadUrl]);

  if (!isOpen) return null;

  const startExport = async () => {
    if (!canvasElement || !videoElement) {
      setErrorMsg('Canvas or Video source is missing.');
      setExportState('error');
      return;
    }

    try {
      // 1. Temporarily request 4K resolution buffer on canvas
      onChangeSettings({ exportResolution: '4k' });

      // 2. Wait until the canvas has reached its true 4K export size.
      const expectedSize = settings.aspectRatio === '9-16'
        ? { width: 2160, height: 3840 }
        : settings.aspectRatio === '1-1'
          ? { width: 2160, height: 2160 }
          : settings.aspectRatio === '4-3'
            ? { width: 2880, height: 2160 }
            : { width: 3840, height: 2160 };
      const resizeDeadline = performance.now() + 2000;
      while ((canvasElement.width < expectedSize.width || canvasElement.height < expectedSize.height) && performance.now() < resizeDeadline) {
        await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      }

      if (canvasElement.width < expectedSize.width || canvasElement.height < expectedSize.height) {
        throw new Error('The 4K export canvas was not ready. Please try again.');
      }

      setExportState('rendering');
      setProgress(0);
      chunksRef.current = [];

      // Save user playback settings
      originalPlayRateRef.current = videoElement.playbackRate;
      originalTimeRef.current = videoElement.currentTime;

      // Pause video and seek to trimStart
      videoElement.pause();
      const startSec = settings.trimStart;
      const endSec = settings.trimEnd > 0 ? settings.trimEnd : duration;
      const exportDuration = endSec - startSec;

      // Wait for seek to complete with safety timeout
      await new Promise<void>((resolve) => {
        let resolved = false;
        const done = () => {
          if (resolved) return;
          resolved = true;
          videoElement.removeEventListener('seeked', onSeeked);
          clearTimeout(timeout);
          resolve();
        };
        const onSeeked = () => done();
        const timeout = setTimeout(() => done(), 250); // 250ms fallback

        videoElement.addEventListener('seeked', onSeeked);
        videoElement.currentTime = startSec;
      });

      // SETUP AUDIO MIXER USING WEB AUDIO API
      let mixedAudioTrack: MediaStreamTrack | null = null;
      let audioCtx: AudioContext | null = null;
      let destNode: MediaStreamAudioDestinationNode | null = null;

      const hasVideoAudio = (videoElement as any).mozHasAudio || 
                            Boolean((videoElement as any).webkitAudioDecodedByteCount) || 
                            ((videoElement as any).audioTracks && (videoElement as any).audioTracks.length > 0) ||
                            true; // Fallback to try and capture anyway

      if (hasVideoAudio || micStream) {
        audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioCtxRef.current = audioCtx;

        if (audioCtx.state === 'suspended') {
          await audioCtx.resume();
        }

        destNode = audioCtx.createMediaStreamDestination();

        let hasInputs = false;

        // 1. Connect video audio if it exists
        try {
          // Note: createMediaElementSource can only be called once per element
          // We wrap it in a try-catch in case it was already created elsewhere.
          const sourceNode = audioCtx.createMediaElementSource(videoElement);
          sourceNode.connect(destNode);
          // Connect to hardware speakers so we can hear it while playing/recording
          sourceNode.connect(audioCtx.destination);
          hasInputs = true;
        } catch (e) {
          console.warn('Could not connect video audio source (might already be connected):', e);
        }

        // 2. Connect microphone audio if available
        if (micStream && micStream.getAudioTracks().length > 0) {
          const micSource = audioCtx.createMediaStreamSource(micStream);
          const micGain = audioCtx.createGain();
          micGain.gain.value = 1.0; // adjust microphone gain
          micSource.connect(micGain);
          micGain.connect(destNode);
          hasInputs = true;
        }

        if (hasInputs) {
          mixedAudioTrack = destNode.stream.getAudioTracks()[0];
        }
      }

      // GET CANVAS STREAM
      const canvasStream = canvasElement.captureStream(60);
      const outputStream = new MediaStream();

      // Add video track
      canvasStream.getVideoTracks().forEach(track => outputStream.addTrack(track));

      // Add audio track if mixed
      if (mixedAudioTrack) {
        outputStream.addTrack(mixedAudioTrack);
      }

      // Check supported MIME types (prioritize MP4 container first)
      let mimeType = 'video/mp4;codecs=h264,aac';
      let extension = 'mp4';

      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/mp4;codecs=h264,opus';
      }
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/mp4;codecs=h264';
      }
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/mp4';
      }

      // Fallback to WebM if browser's encoder doesn't support MP4 container natively
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm;codecs=vp9,opus';
        extension = 'webm';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'video/webm;codecs=vp8,opus';
        }
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'video/webm';
        }
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = ''; // Let browser choose default
        }
      }
      setExportExtension(extension);

      const recorder = new MediaRecorder(outputStream, {
        mimeType: mimeType || undefined,
        videoBitsPerSecond: 80000000 // High-quality compressed 4K at 60 FPS
      });
      recorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        // Build final Blob
        const blob = new Blob(chunksRef.current, { type: mimeType || 'video/webm' });
        const url = URL.createObjectURL(blob);
        setDownloadUrl(url);

        // Trigger automatic download
        const a = document.createElement('a');
        a.href = url;
        a.download = `screentor-${Date.now()}.${extension}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        // Format file size
        const sizeMb = blob.size / (1024 * 1024);
        setFileSize(`${sizeMb.toFixed(2)} MB`);

        // Close AudioContext
        if (audioCtxRef.current) {
          audioCtxRef.current.close();
          audioCtxRef.current = null;
        }

        // Restore video state
        videoElement.playbackRate = originalPlayRateRef.current;
        videoElement.currentTime = originalTimeRef.current;
        videoElement.pause();

        // Restore canvas resolution to standard 1080p
        onChangeSettings({ exportResolution: '1080p' });

        setExportState('completed');
      };

      // Start recording
      recorder.start();
      videoElement.play();

      // Monitor loop for export progress and trim completion
      const checkProgress = () => {
        if (recorder.state !== 'recording') return;

        const current = videoElement.currentTime;
        const progressVal = Math.min(100, ((current - startSec) / exportDuration) * 100);
        setProgress(Math.round(progressVal));

        if (current >= endSec || videoElement.ended) {
          // Finished export duration
          recorder.stop();
        } else {
          requestAnimationFrame(checkProgress);
        }
      };

      requestAnimationFrame(checkProgress);

    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'An error occurred during video rendering.');
      
      // Restore canvas resolution to standard 1080p
      onChangeSettings({ exportResolution: '1080p' });

      setExportState('error');

      // Reset audio context if failed
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
        audioCtxRef.current = null;
      }
    }
  };

  const cancelExport = () => {
    if (recorderRef.current && recorderRef.current.state === 'recording') {
      recorderRef.current.stop();
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
    if (videoElement) {
      videoElement.pause();
      videoElement.currentTime = originalTimeRef.current;
    }
    // Restore canvas resolution to standard 1080p
    onChangeSettings({ exportResolution: '1080p' });

    setExportState('idle');
  };

  return (
    <div className="fixed inset-0 bg-black-80 flex-center z-50 animate-fade-in p-4">
      <div className="glass-panel w-full max-w-[480px] p-6 space-y-6 relative border border-white-10 shadow-violet-glow-large animate-slide-up bg-zinc-950">
        
        {/* Close Button */}
        {exportState !== 'rendering' && (
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        )}

        {/* State 1: Idle Setup */}
        {exportState === 'idle' && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Video className="text-violet-400" size={20} />
              Export Settings
            </h3>
            <p className="text-xs text-gray-400">
              Your video will be processed directly in your browser. Higher settings may take longer to compile.
            </p>

            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-300">Export Quality</span>
                <span className="xg-export-quality">4K · 60 FPS</span>
              </div>

              {/* Warning Alert */}
              <div className="flex gap-2.5 p-3 rounded-lg badge-amber text-[11px] text-amber-300 leading-normal">
                <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                <span>
                  Please do not minimize this tab or switch windows while rendering, as browsers automatically throttle background canvases, which will stall the export process.
                </span>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button 
                onClick={onClose}
                className="glass-button flex-1 justify-center text-xs"
              >
                Cancel
              </button>
              <button 
                onClick={startExport}
                className="glass-button flex-1 justify-center text-xs active"
              >
                Render Video
              </button>
            </div>
          </div>
        )}

        {/* State 2: Rendering */}
        {exportState === 'rendering' && (
          <div className="text-center py-6 space-y-5">
            <Loader2 className="animate-spin text-violet-500 mx-auto" size={36} />
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-white">Baking Video Effects...</h4>
              <p className="text-xs text-gray-400">Processing frames on canvas</p>
            </div>
            
            {/* Progress bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono text-violet-400 px-1">
                <span>Rendering</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-white-5 h-2 rounded-full overflow-hidden border border-glass">
                <div 
                  className="bg-accent-gradient h-full transition-all duration-100 ease-out" 
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <button 
              onClick={cancelExport}
              className="glass-button danger text-xs px-6 py-2 mt-2"
            >
              Abort Export
            </button>
          </div>
        )}

        {/* State 3: Completed */}
        {exportState === 'completed' && (
          <div className="text-center py-4 space-y-5 animate-fade-in">
            <CheckCircle className="text-emerald-500 mx-auto" size={40} />
            <div className="space-y-1">
              <h4 className="text-base font-bold text-white">Video Ready for Download!</h4>
              <p className="text-xs text-gray-400">Successfully exported in high quality</p>
            </div>

            <div className="p-3.5 rounded-xl bg-white-5 border border-glass grid grid-cols-2 text-xs divide-x divide-glass">
              <div className="space-y-0.5">
                <div className="text-gray-500">File Format</div>
                <div className="font-semibold text-white">{exportExtension.toUpperCase()} Video</div>
              </div>
              <div className="space-y-0.5">
                <div className="text-gray-500">File Size</div>
                <div className="font-semibold text-white">{fileSize}</div>
              </div>
            </div>

            <div className="flex flex-col gap-2.5 pt-2">
              <a 
                href={downloadUrl} 
                download={`screentor-${Date.now()}.${exportExtension}`}
                className="glass-button justify-center py-3 active text-sm font-bold flex items-center gap-2"
              >
                <Download size={16} /> Download Video
              </a>
              <button 
                onClick={onClose}
                className="glass-button justify-center py-2 text-xs"
              >
                Back to Editor
              </button>
            </div>
          </div>
        )}

        {/* State 4: Error */}
        {exportState === 'error' && (
          <div className="space-y-4 text-center py-4">
            <AlertTriangle className="text-red-500 mx-auto" size={40} />
            <div className="space-y-1">
              <h4 className="text-base font-bold text-white">Export Failed</h4>
              <p className="text-xs text-red-400 leading-normal px-4">{errorMsg}</p>
            </div>
            <button 
              onClick={() => setExportState('idle')}
              className="glass-button text-xs py-2 px-6"
            >
              Try Again
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
