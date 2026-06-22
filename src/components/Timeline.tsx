import React, { useRef, useEffect, useState } from 'react';
import { 
  Play, 
  Pause, 
  Gauge 
} from 'lucide-react';

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
  const [draggingItem, setDraggingItem] = useState<{ type: 'playhead' | 'trim-start' | 'trim-end' } | null>(null);

  // Formatting utility e.g. 00:05.2
  const formatTime = (time: number) => {
    if (isNaN(time)) return '00:00.0';
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    const ms = Math.floor((time % 1) * 10);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms}`;
  };

  const handleTrackInteraction = (clientX: number) => {
    if (!trackRef.current || duration <= 0) return;
    const rect = trackRef.current.getBoundingClientRect();
    const clickX = clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    const targetTime = percentage * duration;

    if (draggingItem) {
      if (draggingItem.type === 'playhead') {
        onTimeUpdate(targetTime);
      } else if (draggingItem.type === 'trim-start') {
        const endVal = trimEnd > 0 ? trimEnd : duration;
        onTrimChange(Math.min(targetTime, endVal - 0.2), endVal);
      } else if (draggingItem.type === 'trim-end') {
        onTrimChange(trimStart, Math.max(targetTime, trimStart + 0.2));
      }
    } else {
      // Just a click to seek
      onTimeUpdate(targetTime);
    }
  };

  const handleMouseDown = (
    e: React.MouseEvent, 
    type: 'playhead' | 'trim-start' | 'trim-end'
  ) => {
    e.stopPropagation();
    setDraggingItem({ type });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (draggingItem) {
        handleTrackInteraction(e.clientX);
      }
    };

    const handleMouseUp = () => {
      if (draggingItem) {
        setDraggingItem(null);
      }
    };

    if (draggingItem) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingItem, duration, trimStart, trimEnd, onTimeUpdate, onTrimChange]);

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const trimStartPercent = duration > 0 ? (trimStart / duration) * 100 : 0;
  const trimEndPercent = duration > 0 ? ((trimEnd > 0 ? trimEnd : duration) / duration) * 100 : 100;

  return (
    <div className="glass-panel timeline-container p-4 border-t border-glass flex flex-col gap-3 w-full bg-[rgba(10,12,18,0.85)] z-20">
      
      {/* Upper Timeline Controls */}
      <div className="flex justify-between items-center text-xs text-gray-400">
        <div className="flex items-center gap-3">
          <button 
            onClick={onTogglePlay} 
            className="xg-button xg-button-primary xg-icon-button"
          >
            {isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} className="ml-0.5" fill="currentColor" />}
          </button>

          <span className="font-mono text-gray-200">
            {formatTime(currentTime)} <span className="text-gray-600">/</span> {formatTime(duration)}
          </span>

          {/* Speed Selector */}
          <div className="flex items-center gap-1.5 ml-4 border-l border-glass pl-4">
            <Gauge size={14} className="text-gray-500" />
            <span className="text-[11px] text-gray-500">Speed:</span>
            {[0.5, 1, 1.5, 2].map((rate) => (
              <button
                key={rate}
                onClick={() => onPlaybackRateChange(rate)}
                className={`xg-segment-button ${playbackRate === rate ? 'active' : ''}`}
              >
                {rate}x
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* The Timeline Visual Track */}
      <div className="relative h-12 flex items-center">
        
        {/* Playback Track Background */}
        <div 
          ref={trackRef}
          onClick={(e) => handleTrackInteraction(e.clientX)}
          className="relative w-full h-6 rounded-md bg-[rgba(255,255,255,0.03)] border border-glass cursor-pointer overflow-visible select-none"
        >
          {/* Waveform placeholder lines for premium aesthetics */}
          <div className="absolute inset-0 flex items-center justify-around px-2 opacity-15 pointer-events-none">
            {Array.from({ length: 48 }).map((_, i) => (
              <div 
                key={i} 
                className="w-[1.5px] rounded-full bg-white" 
                style={{ height: `${20 + Math.sin(i * 0.4) * 60}%` }}
              />
            ))}
          </div>

          {/* Active Trimmed Zone Highlight */}
          <div 
            className="absolute h-full bg-violet-500/5 border-l border-r border-violet-500/40 pointer-events-none"
            style={{ left: `${trimStartPercent}%`, width: `${trimEndPercent - trimStartPercent}%` }}
          />

          {/* Unused/Trimmed out zones dark shading */}
          <div 
            className="absolute left-0 top-0 h-full bg-black/60 rounded-l-md pointer-events-none"
            style={{ width: `${trimStartPercent}%` }}
          />
          <div 
            className="absolute right-0 top-0 h-full bg-black/60 rounded-r-md pointer-events-none"
            style={{ left: `${trimEndPercent}%`, width: `${100 - trimEndPercent}%` }}
          />

          {/* Trim Handle Start */}
          <div 
            onMouseDown={(e) => handleMouseDown(e, 'trim-start')}
            className="absolute top-1/2 -translate-y-1/2 w-2.5 h-8 bg-violet-400 hover:bg-violet-300 border border-violet-600 rounded cursor-ew-resize z-20 flex-center"
            style={{ left: `calc(${trimStartPercent}% - 5px)` }}
            title="Trim Start"
          >
            <div className="w-[1px] h-3 bg-violet-800" />
          </div>

          {/* Trim Handle End */}
          <div 
            onMouseDown={(e) => handleMouseDown(e, 'trim-end')}
            className="absolute top-1/2 -translate-y-1/2 w-2.5 h-8 bg-violet-400 hover:bg-violet-300 border border-violet-600 rounded cursor-ew-resize z-20 flex-center"
            style={{ left: `calc(${trimEndPercent}% - 5px)` }}
            title="Trim End"
          >
            <div className="w-[1px] h-3 bg-violet-800" />
          </div>

          {/* Playhead Line */}
          <div 
            className="absolute top-0 h-full w-[2px] bg-red-500 shadow-md pointer-events-none z-10"
            style={{ left: `${progressPercent}%` }}
          />

          {/* Playhead Handle */}
          <div 
            onMouseDown={(e) => handleMouseDown(e, 'playhead')}
            className="absolute -top-1 w-3 h-3 rounded-full bg-red-500 border border-white hover:bg-red-400 cursor-grab active:cursor-grabbing z-20"
            style={{ left: `calc(${progressPercent}% - 6px)` }}
          />
        </div>
      </div>
    </div>
  );
};
