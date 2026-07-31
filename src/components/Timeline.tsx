import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Gauge, Music, Pause, Play, RotateCcw, Scissors, Trash2, Volume2, VolumeX, Plus, Copy, ZoomIn, ZoomOut, Maximize2, Sparkles, Layers } from 'lucide-react';
import type { AudioTrackState, VideoSegment, ClipTransition } from '../types';

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
  onDuplicateSegment?: (id: string) => void;
  onDeleteSegment: (id: string) => void;
  onResetCuts: () => void;
  onReorderSegments?: (fromIdx: number, toIdx: number) => void;
  onSetClipTransition?: (id: string, transition: ClipTransition) => void;

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
  onDuplicateSegment,
  onDeleteSegment,
  onResetCuts,
  onReorderSegments,
  onSetClipTransition,
  audioTrack,
  onImportAudio,
  onRemoveAudio,
  onToggleAudioMute,
  onAudioVolumeChange,
  onAudioPositionChange,
}) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const audioFileInputRef = useRef<HTMLInputElement>(null);

  const [zoomLevel, setZoomLevel] = useState<number>(1.0); // 0.5 to 3.0
  const [draggingItem, setDraggingItem] = useState<'playhead' | 'trim-start' | 'trim-end' | 'audio-start' | null>(null);
  const [showVolumePopup, setShowVolumePopup] = useState(false);
  const [transitionMenuClipId, setTransitionMenuClipId] = useState<string | null>(null);
  const [draggedClipIndex, setDraggedClipIndex] = useState<number | null>(null);

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

  // Keyboard shortcut `S` to cut clip at playhead
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 's' || e.key === 'S') && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        e.preventDefault();
        onCutAtPlayhead();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCutAtPlayhead]);

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
    <section className="video-editor canva-timeline-wrapper" aria-label="Canva video editing controls">
      <input
        type="file"
        ref={audioFileInputRef}
        onChange={handleAudioFileChange}
        accept="audio/*"
        style={{ display: 'none' }}
      />

      {/* Canva Header Toolbar */}
      <div className="video-editor-toolbar canva-toolbar">
        <div className="video-editor-title">
          <Layers size={16} className="text-pink-400" />
          <span>Timeline Editor</span>
        </div>

        {/* Canva Action Buttons */}
        <div className="video-editor-actions">
          {/* Split / Cut Button */}
          <button
            onClick={onCutAtPlayhead}
            className="video-editor-cut-btn"
            title="Split video clip at playhead position (Shortcut: S)"
          >
            <Scissors size={13} /> Split
          </button>

          {/* Duplicate Selected Clip */}
          <button
            onClick={() => {
              if (selectedSegmentId && onDuplicateSegment) {
                onDuplicateSegment(selectedSegmentId);
              } else if (clips[0] && onDuplicateSegment) {
                onDuplicateSegment(clips[0].id);
              }
            }}
            className="canva-tool-btn"
            title="Duplicate selected scene clip"
          >
            <Copy size={13} /> Duplicate
          </button>

          {/* Delete Selected Clip */}
          <button
            onClick={() => {
              if (selectedSegmentId) {
                onDeleteSegment(selectedSegmentId);
              } else if (clips.length > 1) {
                onDeleteSegment(clips[clips.length - 1].id);
              }
            }}
            className="canva-tool-btn text-red-400 hover:text-red-300"
            title="Delete clip segment"
          >
            <Trash2 size={13} /> Delete
          </button>

          {/* Reset Cuts */}
          <button
            onClick={onResetCuts}
            className="video-editor-reset"
            title="Reset all cuts and timeline edits"
          >
            <RotateCcw size={13} /> Reset
          </button>

          {/* Canva Zoom Controls */}
          <div className="canva-zoom-controls">
            <button
              onClick={() => setZoomLevel((z) => Math.max(0.5, z - 0.25))}
              className="canva-zoom-btn"
              title="Zoom out timeline"
            >
              <ZoomOut size={13} />
            </button>
            <input
              type="range"
              min="0.5"
              max="3.0"
              step="0.1"
              value={zoomLevel}
              onChange={(e) => setZoomLevel(parseFloat(e.target.value))}
              className="canva-zoom-slider"
              title="Timeline zoom scale"
            />
            <button
              onClick={() => setZoomLevel((z) => Math.min(3.0, z + 0.25))}
              className="canva-zoom-btn"
              title="Zoom in timeline"
            >
              <ZoomIn size={13} />
            </button>
            <button
              onClick={() => setZoomLevel(1.0)}
              className="canva-zoom-btn"
              title="Fit to screen"
            >
              <Maximize2 size={12} />
            </button>
          </div>

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

          {/* Timecodes */}
          <div className="video-editor-timecodes">
            <b>{formatTime(currentTime)}</b> / {formatTime(totalActiveLength)}
          </div>
        </div>
      </div>

      {/* Main Timeline Scrollable Container */}
      <div ref={scrollContainerRef} className="canva-timeline-scroll-container">
        <div className="video-editor-clip canva-video-clip-row">
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
              className="video-editor-track canva-editor-track"
              style={{ width: `${zoomLevel * 100}%` }}
            >
              {/* Background Frame Strips */}
              <div className="video-editor-frames" aria-hidden="true">
                {Array.from({ length: Math.round(22 * zoomLevel) }).map((_, index) => (
                  <i key={index} style={{ opacity: 0.42 + (index % 4) * 0.11 }} />
                ))}
              </div>

              {/* Canva Scene Cards (Clips) */}
              {clips && clips.length > 0 ? (
                clips.map((clip, index) => {
                  const clipLeft = duration > 0 ? (clip.start / duration) * 100 : 0;
                  const clipWidth = duration > 0 ? ((clip.end - clip.start) / duration) * 100 : 0;
                  const isSelected = selectedSegmentId === clip.id;
                  const hasNextClip = index < clips.length - 1;

                  return (
                    <React.Fragment key={clip.id}>
                      {/* Canva Scene Card */}
                      <div
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('text/plain', index.toString());
                          setDraggedClipIndex(index);
                        }}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          const fromIndexStr = e.dataTransfer.getData('text/plain');
                          const fromIdx = parseInt(fromIndexStr, 10);
                          if (!isNaN(fromIdx) && fromIdx !== index && onReorderSegments) {
                            onReorderSegments(fromIdx, index);
                          }
                          setDraggedClipIndex(null);
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectSegment?.(clip.id);
                        }}
                        className={`canva-scene-card ${isSelected ? 'selected' : ''} ${draggedClipIndex === index ? 'dragging' : ''}`}
                        style={{ left: `${clipLeft}%`, width: `${clipWidth}%` }}
                        title={`Scene ${index + 1} (${formatTime(clip.end - clip.start)}) - Drag to reorder`}
                      >
                        <div className="canva-scene-card-header">
                          <span className="canva-scene-badge">Scene {index + 1}</span>
                          <span className="canva-scene-duration">{formatTime(clip.end - clip.start)}</span>
                        </div>

                        {/* Clip Actions overlay on hover */}
                        <div className="canva-scene-actions">
                          {clips.length > 1 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteSegment(clip.id);
                              }}
                              className="canva-scene-delete-btn"
                              title="Delete scene clip"
                            >
                              <Trash2 size={11} />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Inter-Clip Transition Badge between adjacent clips */}
                      {hasNextClip && (
                        <div
                          className="canva-transition-badge-wrap"
                          style={{ left: `${clipLeft + clipWidth}%` }}
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setTransitionMenuClipId(transitionMenuClipId === clip.id ? null : clip.id);
                            }}
                            className={`canva-transition-badge ${clip.transition && clip.transition !== 'none' ? 'active' : ''}`}
                            title={`Transition: ${clip.transition || 'None'}`}
                          >
                            <Sparkles size={11} />
                          </button>

                          {/* Transition Selection Popover */}
                          {transitionMenuClipId === clip.id && (
                            <div className="canva-transition-popover">
                              <div className="canva-popover-title">Scene Transition</div>
                              {[
                                { id: 'none', label: 'None (Instant Cut)' },
                                { id: 'fade', label: 'Fade' },
                                { id: 'dissolve', label: 'Dissolve' },
                                { id: 'slide', label: 'Slide' }
                              ].map((item) => (
                                <button
                                  key={item.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onSetClipTransition?.(clip.id, item.id as ClipTransition);
                                    setTransitionMenuClipId(null);
                                  }}
                                  className={`canva-transition-option ${clip.transition === item.id || (!clip.transition && item.id === 'none') ? 'active' : ''}`}
                                >
                                  {item.label}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </React.Fragment>
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
                title="Drag to trim beginning"
              />
              <button
                onMouseDown={(event) => { event.stopPropagation(); setDraggingItem('trim-end'); }}
                className="video-editor-handle"
                style={{ left: `calc(${trimEndPercent}% - 7px)` }}
                aria-label="Trim end"
                title="Drag to trim ending"
              />

              {/* Playhead */}
              <button
                onMouseDown={(event) => { event.stopPropagation(); setDraggingItem('playhead'); }}
                className="video-editor-playhead"
                style={{ left: `${progressPercent}%` }}
                aria-label="Drag playhead"
                title="Drag playhead to scrub timeline"
              >
                <i />
              </button>
            </div>
          </div>
        </div>

        {/* Canva Audio Track Row under Video Timeline */}
        <div className="timeline-audio-row canva-audio-row">
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

          {/* Audio Visual Track Bar aligned to timeline scale */}
          <div className="audio-track-visual-wrap">
            <div
              className="audio-track-visual"
              style={{ width: `${zoomLevel * 100}%` }}
            >
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
                        {Array.from({ length: Math.round(30 * zoomLevel) }).map((_, i) => (
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
                  <span>+ Click to import computer audio track</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
