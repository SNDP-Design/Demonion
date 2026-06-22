import type { GradientPreset, EditorSettings } from '../types';

export const GRADIENT_PRESETS: GradientPreset[] = [
  { id: 'sunset', name: 'Sunset Glow', css: 'linear-gradient(135deg, #f97316 0%, #ec4899 50%, #8b5cf6 100%)' },
  { id: 'cyberpunk', name: 'Cyber Glow', css: 'linear-gradient(135deg, #a855f7 0%, #06b6d4 100%)' },
  { id: 'aurora', name: 'Northern Aurora', css: 'linear-gradient(135deg, #10b981 0%, #06b6d4 50%, #3b82f6 100%)' },
  { id: 'nebula', name: 'Cosmic Nebula', css: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 40%, #db2777 100%)' },
  { id: 'ocean', name: 'Deep Blue', css: 'linear-gradient(135deg, #1e3a8a 0%, #0284c7 50%, #0d9488 100%)' },
  { id: 'mono-dark', name: 'Studio Dark', css: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)' },
  { id: 'mono-light', name: 'Studio Light', css: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)' },
  { id: 'mesh-candy', name: 'Cotton Candy', css: 'radial-gradient(at 0% 0%, #c084fc 0px, transparent 50%), radial-gradient(at 100% 0%, #f472b6 0px, transparent 50%), radial-gradient(at 100% 100%, #60a5fa 0px, transparent 50%), radial-gradient(at 0% 100%, #34d399 0px, transparent 50%), #171a26' },
];

export const DEFAULT_SETTINGS: EditorSettings = {
  backgroundType: 'gradient',
  gradientPresetId: 'sunset',
  solidColor: '#0f172a',
  aspectRatio: '16-9',
  borderRadius: 12,
  shadowIntensity: 60,
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.15)',
  scale: 0.85,
  macOSHeader: true,
  cameraPosition: 'bottom-right',
  cameraShape: 'circle',
  cameraSize: 120,
  cameraBorderColor: '#8b5cf6',
  trimStart: 0,
  trimEnd: 0,
};
