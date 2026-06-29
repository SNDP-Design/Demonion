export interface ZoomKeyframe {
  id: string;
  time: number; // in seconds
  zoom: number; // multiplier, e.g. 1.0 to 3.0
  x: number;    // normalized center X (0 to 1)
  y: number;    // normalized center Y (0 to 1)
  duration: number; // transition duration in seconds
  easing: 'linear' | 'ease-out' | 'ease-in-out' | 'smooth';
}

export type AspectRatio = '16-9' | '9-16' | '1-1' | '4-3';

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
  cameraPosition: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'none';
  cameraSize: number; // pixels (80 to 200)
  cameraBorderColor: string;
  trimStart: number; // in seconds
  trimEnd: number; // in seconds
  exportResolution?: '1080p' | '4k';
}
