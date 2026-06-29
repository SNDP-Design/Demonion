import type { GradientPreset, EditorSettings } from '../types';

export const GRADIENT_PRESETS: GradientPreset[] = [
  { id: 'sunset', name: 'Sunset Glow', css: 'linear-gradient(135deg, #f97316 0%, #ec4899 50%, #8b5cf6 100%)' },
  { id: 'cyberpunk', name: 'Cyber Glow', css: 'linear-gradient(135deg, #a855f7 0%, #06b6d4 100%)' },
  { id: 'aurora', name: 'Northern Aurora', css: 'linear-gradient(135deg, #10b981 0%, #06b6d4 50%, #3b82f6 100%)' },
  { id: 'nebula', name: 'Cosmic Nebula', css: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 40%, #db2777 100%)' },
  { id: 'ocean', name: 'Deep Blue', css: 'linear-gradient(135deg, #1e3a8a 0%, #0284c7 50%, #0d9488 100%)' },
];

export const DEFAULT_SETTINGS: EditorSettings = {
  layoutMode: 'framed',
  backgroundType: 'gradient',
  gradientPresetId: 'sunset',
  solidColor: '#0f172a',
  aspectRatio: '16-10',
  borderRadius: 24,
  shadowIntensity: 60,
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.15)',
  scale: 0.85,
  macOSHeader: false,
  cameraPosition: 'bottom-right',
  cameraShape: 'rounded',
  cameraSize: 120,
  cameraBorderColor: '#ffffff',
  trimStart: 0,
  trimEnd: 0,
};
