import React from 'react';
import type { AspectRatio, EditorSettings } from '../types';
import { GRADIENT_PRESETS } from '../constants/presets';
import { Camera, CameraOff, CornerDownLeft, CornerDownRight, CornerUpLeft, CornerUpRight, Layout, Paintbrush } from 'lucide-react';

interface SidebarControlsProps {
  settings: EditorSettings;
  onChangeSettings: (settings: Partial<EditorSettings>) => void;
}

export const SidebarControls: React.FC<SidebarControlsProps> = ({ settings, onChangeSettings }) => {
  const update = <K extends keyof EditorSettings>(key: K, value: EditorSettings[K]) => onChangeSettings({ [key]: value });

  return (
    <aside className="glass-panel sidebar flex flex-col h-full w-[350px] border-r border-glass text-sm select-none rounded-none">
      <div className="sidebar-content space-y-6">
        <section className="space-y-4">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5"><Camera size={14} /> Facecam Overlay</h3>
          <div className="facecam-position-row">
            {[
              { id: 'top-left', name: 'Top left', icon: CornerUpLeft },
              { id: 'top-right', name: 'Top right', icon: CornerUpRight },
              { id: 'bottom-left', name: 'Bottom left', icon: CornerDownLeft },
              { id: 'bottom-right', name: 'Bottom right', icon: CornerDownRight },
              { id: 'none', name: 'Hide camera', icon: CameraOff },
            ].map((position) => (
              <button key={position.id} onClick={() => update('cameraPosition', position.id as EditorSettings['cameraPosition'])} title={position.name} aria-label={position.name}
                className={`facecam-position-button ${settings.cameraPosition === position.id ? 'active-purple' : 'border-glass hover-bg-glass text-gray-400'}`}>
                <position.icon size={17} strokeWidth={2.2} />
              </button>
            ))}
          </div>
          {settings.cameraPosition !== 'none' && <div className="space-y-3.5 pt-1">
            <label className="space-y-1.5 block"><span className="flex justify-between text-xs text-gray-400"><span>Camera Bubble Size</span><b>{settings.cameraSize}px</b></span>
              <input type="range" min="80" max="200" value={settings.cameraSize} onChange={(event) => update('cameraSize', Number(event.target.value))} />
            </label>
            <label className="flex items-center justify-between text-xs text-gray-400"><span>Border Color</span>
              <input type="color" value={settings.cameraBorderColor} onChange={(event) => update('cameraBorderColor', event.target.value)} className="w-7 h-7 rounded border border-glass cursor-pointer bg-transparent" />
            </label>
          </div>}
        </section>

        <section className="space-y-4 border-t border-glass pt-5">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5"><Layout size={14} /> Browser Window</h3>
          <div className="space-y-2"><label className="text-[11px] text-gray-500 font-bold uppercase">Aspect Ratio</label>
            <div className="grid grid-cols-2 gap-1.5">{[
              { id: '16-9', name: '16:9 Desktop' }, { id: '9-16', name: '9:16 Vertical' }, { id: '1-1', name: '1:1 Square' }, { id: '4-3', name: '4:3 Tablet' },
            ].map((ratio) => <button key={ratio.id} onClick={() => update('aspectRatio', ratio.id as AspectRatio)} className={`py-2 rounded-lg border text-xs font-semibold transition-all ${settings.aspectRatio === ratio.id ? 'active-blue' : 'border-glass hover-bg-glass text-gray-400'}`}>{ratio.name}</button>)}</div>
          </div>
          <Slider label="Window Padding" value={`${Math.round(settings.scale * 100)}%`} min="0.5" max="1.1" step="0.01" current={settings.scale} onChange={(value) => update('scale', value)} />
          <Slider label="Corner Rounding" value={`${settings.borderRadius}px`} min="0" max="32" current={settings.borderRadius} onChange={(value) => update('borderRadius', value)} />
          <Slider label="Shadow Blur" value={`${settings.shadowIntensity}px`} min="0" max="100" current={settings.shadowIntensity} onChange={(value) => update('shadowIntensity', value)} />
          <label className="flex items-center justify-between p-2.5 rounded-lg bg-white/5 border border-glass text-xs text-gray-300"><span>macOS Title Dots</span><span className="switch-container"><input type="checkbox" checked={settings.macOSHeader} onChange={(event) => update('macOSHeader', event.target.checked)} className="switch-input" /><span className="switch-slider" /></span></label>
        </section>

        <section className="space-y-4 border-t border-glass pt-5">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5"><Paintbrush size={14} /> Background</h3>
          <div className="grid grid-cols-2 gap-2">{GRADIENT_PRESETS.map((preset) => <button key={preset.id} onClick={() => onChangeSettings({ gradientPresetId: preset.id, backgroundType: 'gradient' })} className={`group p-1 rounded-xl border text-left overflow-hidden transition-all ${settings.gradientPresetId === preset.id ? 'active-pink' : 'border-glass hover:border-white/10'}`}><span className="block h-10 rounded-lg w-full mb-1" style={{ background: preset.css }} /><span className="text-[10px] font-bold px-1 text-gray-400 block truncate group-hover:text-white">{preset.name}</span></button>)}</div>
        </section>
      </div>
    </aside>
  );
};

interface SliderProps { label: string; value: string; min: string; max: string; step?: string; current: number; onChange: (value: number) => void; }
const Slider: React.FC<SliderProps> = ({ label, value, min, max, step, current, onChange }) => <label className="space-y-1.5 block"><span className="flex justify-between text-xs text-gray-400"><span>{label}</span><b>{value}</b></span><input type="range" min={min} max={max} step={step} value={current} onChange={(event) => onChange(Number(event.target.value))} /></label>;
