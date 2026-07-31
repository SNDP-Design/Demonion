export type AspectRatio = '16-10' | '16-9' | '9-16' | '1-1' | '4-3';

export interface GradientPreset {
  id: string;
  name: string;
  css: string;
}

export interface EditorSettings {
  layoutMode: 'framed' | 'screen-only';
  backgroundType: 'gradient' | 'solid';
  gradientPresetId: string;
  solidColor: string;
  aspectRatio: AspectRatio;
  borderRadius: number; // in pixels
  shadowIntensity: number; // 0 to 100
  borderWidth: number; // in pixels
  borderColor: string;
  scale: number; // 0.3 to 1.2
  macOSHeader: boolean;
  cameraPosition: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'side-left' | 'side-right' | 'none';
  cameraShape: 'circle' | 'rounded';
  cameraSize: number; // pixels (80 to 320)
  cameraBorderColor: string;
  trimStart: number; // in seconds
  trimEnd: number; // in seconds
  exportResolution?: '1080p' | '4k';
  enableAutoZoom?: boolean;
  zoomFactor?: number; // 1.1 to 2.0
}

export interface ClickMoment {
  time: number;
  x: number;
  y: number;
}

export type ClipTransition = 'none' | 'fade' | 'dissolve' | 'slide';

export interface VideoSegment {
  id: string;
  name?: string;
  start: number; // start time in source video (seconds)
  end: number;   // end time in source video (seconds)
  transition?: ClipTransition;
  transitionDuration?: number; // default 0.5s
}

export interface AudioTrackState {
  id: string;
  name: string;
  src: string;
  duration: number;
  startTime: number; // position on timeline in seconds where audio starts playing
  trimStart: number; // offset within audio file in seconds
  trimEnd: number;   // end trim within audio file in seconds
  volume: number;    // 0 to 1
  muted: boolean;
  fadeIn?: number;   // seconds
  fadeOut?: number;  // seconds
}


