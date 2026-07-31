import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Gauge, Music, Pause, Play, RotateCcw, Scissors, Trash2, Volume2, VolumeX, Plus } from 'lucide-react';
import type { AudioTrackState, VideoSegment } from '../types';

interface TimelineProps {
  duration: number;
  currentTime: number;
  onTimeUpdate: (time: number) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  trimStart: number;
  trimEnd: number;
  onTrimChange: (start: number, end: number) => void;
  playbackRate: number;
  onPlaybackRateChange: (rate: number) => void;

  // Video Cut & Segment props
  clips: VideoSegment[];
  selectedSegmentId?: string | null;
  onSelectSegment?: (id: string | null) => void;
  onCutAtPlayhead: () => void;
  onDeleteSegment: (id: string) => void;
  onResetCuts: () => void;
  onSegmentTrimChange?: (id: string, start: number, end: number) => void;

  // Audio track props
  audioTrack: AudioTrackState | null;
  onImportAudio: (file: File) => void;
  onRemoveAudio: () => void;
  onToggleAudioMute: () => void;
  onAudioVolumeChange: (volume: number) => void;
  onAudioPositionChange?: (startTime: number) => void;
}

export const Timeline: React.FC<TimelineProps> = ({
  duration,
  currentTime,
  onTimeUpdate,
  isPlaying,
  onTogglePlay,
  trimStart,
  trimEnd,
  onTrimChange,
  playbackRate,
  onPlaybackRateChange,
  clips,
  selectedSegmentId,
  onSelectSegment,
  onCutAtPlayhead,
  onDeleteSegment,
  onResetCuts,
  audioTrack,
  onImportAudio,
  onRemoveAudio,
  onToggleAudioMute,
  onAudioVolumeChange,
  onAudioPositionChange,
}) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const audioFileInputRef = useRef<HTMLInputElement>(null);
  const [draggingItem, setDraggingItem] = useState<'playhead' | 'trim-start' | 'trim-end' | 'audio-start' | null>(null);
  const [showVolumePopup, setShowVolumePopup] = useState(false);

  const endTime = trimEnd > 0 ? trimEnd : duration;

  const formatTime = (time: number) => {
    if (!Number.isFinite(time) || time < 0) return '00:00.0';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    const tenths = Math.floor((time % 1) * 10);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${tenths}`;
  };

  // Calculate total active length from clips
  const totalActiveLength = clips && clips.length > 0
    ? clips.reduce((acc, c) => acc + Math.max(0, c.end - c.start), 0)
    : Math.max(0, endTime - trimStart);

  const updateFromPointer = useCallback((clientX: number, activeItem = draggingItem) => {
    if (!trackRef.current || duration <= 0) return;
    const rect = trackRef.current.getBoundingClientRect();
    const targetTime = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width)) * duration;

    if (activeItem === 'trim-start') {
      onTrimChange(Math.min(targetTime, endTime - 0.2), endTime);
    } else if (activeItem === 'trim-end') {
      onTrimChange(trimStart, Math.max(targetTime, trimStart + 0.2));
    } else if (activeItem === 'audio-start' && audioTrack && onAudioPositionChange) {
      onAudioPositionChange(Math.max(0, Math.min(targetTime, duration - 0.5)));
    } else {
      onTimeUpdate(targetTime);
    }
  }, [draggingItem, duration, endTime, onTimeUpdate, onTrimChange, trimStart, audioTrack, onAudioPositionChange]);

  useEffect(() => {
    if (!draggingItem) return;
    const move = (event: MouseEvent) => updateFromPointer(event.clientX);
    const up = () => setDraggingItem(null);
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    return () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
  }, [draggingItem, updateFromPointer]);

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const trimStartPercent = duration > 0 ? (trimStart / duration) * 100 : 0;
  const trimEndPercent = duration > 0 ? (endTime / duration) * 100 : 100;

  const handleAudioFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportAudio(file);
      e.target.value = '';
    }
  };

  return (
    <section className="video-editor" aria-label="Video editing controls">
      <input
        type="file"
        ref={audioFileInputRef}
        onChange={handleAudioFileChange}
        accept="audio/*"
        style={{ display: 'none' }}
      />

      {/* Toolbar */}
      <div className="video-editor-toolbar">
        <div className="video-editor-title">
          <Scissors size={15} />
          <span>Timeline Editor</span>
        </div>
        <div className="video-editor-actions">
          {/* Cut at Playhead Button */}
          <button
            onClick={onCutAtPlayhead}
            className="video-editor-cut-btn"
            title="Split video clip at playhead position (Cut)"
          >
            <Scissors size={13} /> Cut at Playhead
          </button>

          {/* Reset Cuts */}
          <button
            onClick={onResetCuts}
            className="video-editor-reset"
            title="Reset all cuts and trims"
          >
            <RotateCcw size={13} /> Reset cuts
          </button>

          {/* Speed Selector */}
          <div className="video-editor-speed">
            <Gauge size={14} />
            <span>Speed</span>
            {[0.5, 1, 1.5, 2].map((rate) => (
              <button
                key={rate}
                onClick={() => onPlaybackRateChange(rate)}
                className={playbackRate === rate ? 'active' : ''}
              >
                {rate}x
              </button>
            ))}
          </div>

          <div className="video-editor-timecodes">
            <b>Length</b> {formatTime(totalActiveLength)}
          </div>
        </div>
      </div>

      {/* Main Track Row: Video */}
      <div className="video-editor-clip">
        <button
          onClick={onTogglePlay}
          className="video-editor-play"
          aria-label={isPlaying ? 'Pause video' : 'Play video'}
        >
          {isPlaying ? <Pause size={17} fill="currentColor" /> : <Play size={17} fill="currentColor" />}
        </button>

        <div className="video-editor-track-wrap">
          <div
            ref={trackRef}
            onClick={(event) => updateFromPointer(event.clientX, 'playhead')}
            className="video-editor-track"
          >
            {/* Background Frame Strips */}
            <div className="video-editor-frames" aria-hidden="true">
              {Array.from({ length: 22 }).map((_, index) => (
                <i key={index} style={{ opacity: 0.42 + (index % 4) * 0.11 }} />
              ))}
            </div>

            {/* Video Clips / Segments */}
            {clips && clips.length > 0 ? (
              clips.map((clip, index) => {
                const clipLeft = duration > 0 ? (clip.start / duration) * 100 : 0;
                const clipWidth = duration > 0 ? ((clip.end - clip.start) / duration) * 100 : 0;
                const isSelected = selectedSegmentId === clip.id;

                return (
                  <div
                    key={clip.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectSegment?.(clip.id);
                    }}
                    className={`timeline-clip-segment ${isSelected ? 'selected' : ''}`}
                    style={{ left: `${clipLeft}%`, width: `${clipWidth}%` }}
                    title={`Clip ${index + 1} (${formatTime(clip.end - clip.start)})`}
                  >
                    <span className="clip-label">Clip {index + 1}</span>
                    {clips.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteSegment(clip.id);
                        }}
                        className="clip-delete-btn"
                        title="Delete clip segment"
                      >
                        <Trash2 size={11} />
                      </button>
                    )}
                  </div>
                );
              })
            ) : (
              <div
                className="video-editor-selected"
                style={{ left: `${trimStartPercent}%`, width: `${trimEndPercent - trimStartPercent}%` }}
              />
            )}

            {/* Cut Regions */}
            <div className="video-editor-cut video-editor-cut-start" style={{ width: `${trimStartPercent}%` }} />
            <div className="video-editor-cut video-editor-cut-end" style={{ left: `${trimEndPercent}%`, width: `${100 - trimEndPercent}%` }} />

            {/* Overall Trim Handles */}
            <button
              onMouseDown={(event) => { event.stopPropagation(); setDraggingItem('trim-start'); }}
              className="video-editor-handle"
              style={{ left: `calc(${trimStartPercent}% - 7px)` }}
              aria-label="Trim start"
              title="Drag to trim the beginning"
            />
            <button
              onMouseDown={(event) => { event.stopPropagation(); setDraggingItem('trim-end'); }}
              className="video-editor-handle"
              style={{ left: `calc(${trimEndPercent}% - 7px)` }}
              aria-label="Trim end"
              title="Drag to trim the ending"
            />

            {/* Playhead */}
            <button
              onMouseDown={(event) => { event.stopPropagation(); setDraggingItem('playhead'); }}
              className="video-editor-playhead"
              style={{ left: `${progressPercent}%` }}
              aria-label="Drag playhead"
              title="Drag to scrub timeline"
            >
              <i />
            </button>
          </div>
        </div>
      </div>

      {/* Audio Track Row under Video Timeline */}
      <div className="timeline-audio-row">
        <div className="audio-row-control">
          {audioTrack ? (
            <div className="audio-track-info-badge">
              <Music size={14} className="text-pink-400 shrink-0" />
              <span className="audio-name" title={audioTrack.name}>{audioTrack.name}</span>
              
              <button
                onClick={onToggleAudioMute}
                className="audio-icon-btn"
                title={audioTrack.muted ? 'Unmute Audio' : 'Mute Audio'}
              >
                {audioTrack.muted || audioTrack.volume === 0 ? (
                  <VolumeX size={14} className="text-red-400" />
                ) : (
                  <Volume2 size={14} className="text-emerald-400" />
                )}
              </button>

              <div className="relative">
                <button
                  onClick={() => setShowVolumePopup(!showVolumePopup)}
                  className="audio-vol-btn"
                  title="Adjust Volume"
                >
                  {Math.round(audioTrack.muted ? 0 : audioTrack.volume * 100)}%
                </button>
                {showVolumePopup && (
                  <div className="audio-vol-popover">
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={audioTrack.muted ? 0 : audioTrack.volume}
                      onChange={(e) => onAudioVolumeChange(parseFloat(e.target.value))}
                      className="vol-slider"
                    />
                  </div>
                )}
              </div>

              <button
                onClick={onRemoveAudio}
                className="audio-remove-btn"
                title="Remove Audio Track"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => audioFileInputRef.current?.click()}
              className="import-audio-btn"
              title="Import audio file from your computer"
            >
              <Plus size={14} />
              <Music size={14} />
              <span>Import Audio</span>
            </button>
          )}
        </div>

        {/* Audio Visual Track Bar */}
        <div className="audio-track-visual-wrap">
          <div className="audio-track-visual">
            {audioTrack ? (
              (() => {
                const audioStartPct = duration > 0 ? (audioTrack.startTime / duration) * 100 : 0;
                const audioLenPct = duration > 0 ? (Math.min(audioTrack.duration, duration - audioTrack.startTime) / duration) * 100 : 100;
                return (
                  <div
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      setDraggingItem('audio-start');
                    }}
                    className="audio-track-segment"
                    style={{ left: `${audioStartPct}%`, width: `${Math.max(audioLenPct, 2)}%` }}
                    title="Drag to reposition audio start on timeline"
                  >
                    <span className="audio-track-wave-label">
                      🎵 {audioTrack.name} ({formatTime(audioTrack.duration)})
                    </span>
                    <div className="audio-waveform-bars">
                      {Array.from({ length: 30 }).map((_, i) => (
                        <div key={i} className="audio-bar" style={{ height: `${20 + (i % 5) * 15}%` }} />
                      ))}
                    </div>
                  </div>
                );
              })()
            ) : (
              <div
                onClick={() => audioFileInputRef.current?.click()}
                className="audio-track-empty-placeholder"
              >
                <span>+ Click to import computer audio under video timeline</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
