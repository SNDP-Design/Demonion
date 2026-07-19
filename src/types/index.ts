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
}

export interface ClickMoment {
  time: number;
  x: number;
  y: number;
}

export type AIDemoSceneType = 'hero' | 'feature_highlight' | 'workflow_demo' | 'analytics_spotlight' | 'cta_closing';

export interface SubtitleCue {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
  activeWordIndex?: number;
}

export interface AIDemoScene {
  id: string;
  type: AIDemoSceneType;
  startTime: number; // in seconds
  duration: number; // in seconds (total 120s across scenes)
  title: string;
  subtitleText: string;
  narrationScript: string;
  highlights: string[];
  gradientPresetId: string;
  visualMockup: {
    badgeText: string;
    headline: string;
    subheadline: string;
    primaryBtnText: string;
    secondaryBtnText: string;
    metrics?: Array<{ label: string; value: string }>;
    features?: Array<{ title: string; desc: string }>;
  };
}

export interface AIDemoScript {
  productName: string;
  productTagline: string;
  url: string;
  domain: string;
  scenes: AIDemoScene[];
  totalDuration: number; // 120 seconds (2 mins)
  subtitles: SubtitleCue[];
}

export interface AIDemoConfig {
  showSubtitles: boolean;
  subtitleStyle: 'glass-pill' | 'bold-yellow' | 'minimal-dark';
  enableVoiceover: boolean;
  voicePitch: number;
  voiceRate: number;
  voiceGender: 'female' | 'male';
}

