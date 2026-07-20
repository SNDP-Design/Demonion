import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Gauge, Pause, Play, RotateCcw, Scissors } from 'lucide-react';

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
  onPlaybackRateChange
}) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [draggingItem, setDraggingItem] = useState<'playhead' | 'trim-start' | 'trim-end' | null>(null);
  const endTime = trimEnd > 0 ? trimEnd : duration;

  const formatTime = (time: number) => {
    if (!Number.isFinite(time)) return '00:00.0';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    const tenths = Math.floor((time % 1) * 10);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${tenths}`;
  };

  const updateFromPointer = useCallback((clientX: number, activeItem = draggingItem) => {
    if (!trackRef.current || duration <= 0) return;
    const rect = trackRef.current.getBoundingClientRect();
    const targetTime = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width)) * duration;
    if (activeItem === 'trim-start') onTrimChange(Math.min(targetTime, endTime - 0.2), endTime);
    else if (activeItem === 'trim-end') onTrimChange(trimStart, Math.max(targetTime, trimStart + 0.2));
    else onTimeUpdate(targetTime);
  }, [draggingItem, duration, endTime, onTimeUpdate, onTrimChange, trimStart]);

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

  return (
    <section className="video-editor" aria-label="Video editing controls">
      <div className="video-editor-toolbar">
        <div className="video-editor-title"><Scissors size={15} /><span>Edit video</span></div>
        <div className="video-editor-actions">
          <button onClick={() => onTrimChange(0, duration)} className="video-editor-reset"><RotateCcw size={13} /> Reset trim</button>
          <div className="video-editor-speed"><Gauge size={14} /><span>Speed</span>{[0.5, 1, 1.5, 2].map((rate) => <button key={rate} onClick={() => onPlaybackRateChange(rate)} className={playbackRate === rate ? 'active' : ''}>{rate}x</button>)}</div>
          <div className="video-editor-timecodes"><b>Length</b> {formatTime(endTime - trimStart)}</div>
        </div>
      </div>

      <div className="video-editor-clip">
        <button onClick={onTogglePlay} className="video-editor-play" aria-label={isPlaying ? 'Pause video' : 'Play video'}>{isPlaying ? <Pause size={17} fill="currentColor" /> : <Play size={17} fill="currentColor" />}</button>
        <div className="video-editor-track-wrap">
          <div ref={trackRef} onClick={(event) => updateFromPointer(event.clientX, 'playhead')} className="video-editor-track">
            <div className="video-editor-frames" aria-hidden="true">{Array.from({ length: 22 }).map((_, index) => <i key={index} style={{ opacity: 0.42 + (index % 4) * 0.11 }} />)}</div>
            <div className="video-editor-selected" style={{ left: `${trimStartPercent}%`, width: `${trimEndPercent - trimStartPercent}%` }} />
            <div className="video-editor-cut video-editor-cut-start" style={{ width: `${trimStartPercent}%` }} />
            <div className="video-editor-cut video-editor-cut-end" style={{ left: `${trimEndPercent}%`, width: `${100 - trimEndPercent}%` }} />
            <button onMouseDown={(event) => { event.stopPropagation(); setDraggingItem('trim-start'); }} className="video-editor-handle" style={{ left: `calc(${trimStartPercent}% - 7px)` }} aria-label="Trim start" title="Drag to trim the beginning" />
            <button onMouseDown={(event) => { event.stopPropagation(); setDraggingItem('trim-end'); }} className="video-editor-handle" style={{ left: `calc(${trimEndPercent}% - 7px)` }} aria-label="Trim end" title="Drag to trim the ending" />
            <button onMouseDown={(event) => { event.stopPropagation(); setDraggingItem('playhead'); }} className="video-editor-playhead" style={{ left: `${progressPercent}%` }} aria-label="Drag playhead" title="Drag to scrub timeline"><i /></button>
          </div>
        </div>
      </div>
    </section>
  );
};
