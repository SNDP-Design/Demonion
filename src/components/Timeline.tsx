import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pause, Play, Scissors, ZoomIn } from 'lucide-react';
import type { ClickMoment } from '../types';

interface TimelineProps {
  duration: number;
  currentTime: number;
  onTimeUpdate: (time: number) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  trimStart: number;
  trimEnd: number;
  onTrimChange: (start: number, end: number) => void;
  clickMoments?: ClickMoment[];
  onUpdateClickMomentTime?: (index: number, newTime: number) => void;
  onAddClickMoment?: (moment: ClickMoment) => void;
  onDeleteClickMoment?: (index: number) => void;
  autoZoomEnabled?: boolean;
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
  clickMoments = [],
  onUpdateClickMomentTime,
  onAddClickMoment,
  onDeleteClickMoment,
  autoZoomEnabled = true,
}) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [draggingItem, setDraggingItem] = useState<'playhead' | 'trim-start' | 'trim-end' | null>(null);
  const [draggingZoomIndex, setDraggingZoomIndex] = useState<number | null>(null);

  const endTime = trimEnd > 0 ? trimEnd : duration;

  const formatTime = (time: number) => {
    if (!Number.isFinite(time) || time < 0) return '00:00.0';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    const tenths = Math.floor((time % 1) * 10);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${tenths}`;
  };

  const updateFromPointer = useCallback((clientX: number, activeItem = draggingItem, zoomIdx = draggingZoomIndex) => {
    if (!trackRef.current || duration <= 0) return;
    const rect = trackRef.current.getBoundingClientRect();
    const targetTime = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width)) * duration;

    if (zoomIdx !== null && onUpdateClickMomentTime) {
      const clampedTime = Math.max(0, Math.min(duration, targetTime));
      onUpdateClickMomentTime(zoomIdx, clampedTime);
      onTimeUpdate(clampedTime);
    } else if (activeItem === 'trim-start') {
      onTrimChange(Math.min(targetTime, endTime - 0.2), endTime);
    } else if (activeItem === 'trim-end') {
      onTrimChange(trimStart, Math.max(targetTime, trimStart + 0.2));
    } else {
      onTimeUpdate(targetTime);
    }
  }, [draggingItem, draggingZoomIndex, duration, endTime, onTimeUpdate, onTrimChange, trimStart, onUpdateClickMomentTime]);

  useEffect(() => {
    if (!draggingItem && draggingZoomIndex === null) return;
    const move = (event: MouseEvent) => updateFromPointer(event.clientX);
    const up = () => {
      setDraggingItem(null);
      setDraggingZoomIndex(null);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    return () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
  }, [draggingItem, draggingZoomIndex, updateFromPointer]);

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const trimStartPercent = duration > 0 ? (trimStart / duration) * 100 : 0;
  const trimEndPercent = duration > 0 ? (endTime / duration) * 100 : 100;

  const handleAddZoomAtPlayhead = () => {
    onAddClickMoment?.({
      time: currentTime,
      x: 0.5,
      y: 0.5,
    });
  };

  return (
    <section className="video-editor" aria-label="Video editing controls">
      {/* Toolbar */}
      <div className="video-editor-toolbar">
        <div className="video-editor-title">
          <Scissors size={15} />
          <span>Timeline Editor</span>
        </div>
        <div className="video-editor-actions">
          {onAddClickMoment && (
            <button
              onClick={handleAddZoomAtPlayhead}
              className="video-editor-add-zoom-btn"
              title="Add auto-zoom click dot at playhead"
            >
              <ZoomIn size={12} />
              <span>+ Zoom Dot</span>
            </button>
          )}
          <div className="video-editor-timecodes">
            <b>Length</b> {formatTime(endTime - trimStart)}
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

            {/* Selected Region */}
            <div
              className="video-editor-selected"
              style={{ left: `${trimStartPercent}%`, width: `${trimEndPercent - trimStartPercent}%` }}
            />

            {/* Cut / Inactive Regions */}
            <div className="video-editor-cut video-editor-cut-start" style={{ width: `${trimStartPercent}%` }} />
            <div className="video-editor-cut video-editor-cut-end" style={{ left: `${trimEndPercent}%`, width: `${100 - trimEndPercent}%` }} />

            {/* Auto-Zoom Click Dots & Regions */}
            {clickMoments.map((moment, index) => {
              const dotLeft = duration > 0 ? (moment.time / duration) * 100 : 0;
              const isDragging = draggingZoomIndex === index;
              const isWithinActiveZoom = Math.abs(currentTime - moment.time) <= 1.5;
              const zoomDuration = 2.0; // 2s active auto-zoom window
              const zoomWidth = duration > 0 ? (zoomDuration / duration) * 100 : 0;

              return (
                <React.Fragment key={`${index}-${moment.time.toFixed(2)}`}>
                  {/* Translucent 2s zoom duration tail */}
                  <div
                    className={`timeline-zoom-region ${isWithinActiveZoom ? 'active' : ''}`}
                    style={{
                      left: `${dotLeft}%`,
                      width: `${Math.min(zoomWidth, Math.max(0, 100 - dotLeft))}%`
                    }}
                  />

                  {/* Draggable Dot */}
                  <div
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      setDraggingZoomIndex(index);
                      onTimeUpdate(moment.time);
                    }}
                    className={`timeline-zoom-dot ${isDragging ? 'dragging' : ''} ${isWithinActiveZoom ? 'active' : ''} ${!autoZoomEnabled ? 'disabled' : ''}`}
                    style={{ left: `${dotLeft}%` }}
                    title={`Auto-Zoom Click at ${formatTime(moment.time)} • Drag to move`}
                  >
                    <span className="timeline-zoom-dot-inner" />
                    <div className="timeline-zoom-dot-tooltip">
                      <span>🔍 Auto-Zoom {formatTime(moment.time)}</span>
                      {onDeleteClickMoment && clickMoments.length > 1 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteClickMoment(index);
                          }}
                          className="timeline-zoom-dot-delete"
                          title="Delete zoom dot"
                          aria-label="Delete zoom dot"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  </div>
                </React.Fragment>
              );
            })}

            {/* Trim Handles */}
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
    </section>
  );
};
