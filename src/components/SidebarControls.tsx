import React from 'react';
import type { EditorSettings, AspectRatio, ZoomKeyframe } from '../types';
import { GRADIENT_PRESETS } from '../constants/presets';
import { 
  Camera, 
  Layout, 
  Paintbrush, 
  Settings2,
  Trash2,
  Plus
} from 'lucide-react';

interface SidebarControlsProps {
  settings: EditorSettings;
  onChangeSettings: (settings: Partial<EditorSettings>) => void;
  keyframes: ZoomKeyframe[];
  onAddKeyframe: () => void;
  onRemoveKeyframe: (id: string) => void;
  onUpdateKeyframe: (id: string, updates: Partial<ZoomKeyframe>) => void;
  currentTime: number;
  duration: number;
}

export const SidebarControls: React.FC<SidebarControlsProps> = ({
  settings,
  onChangeSettings,
  keyframes,
  onAddKeyframe,
  onRemoveKeyframe,
  onUpdateKeyframe,
  currentTime: _currentTime,
  duration: _duration
}) => {
  const updateSetting = <K extends keyof EditorSettings>(key: K, value: EditorSettings[K]) => {
    onChangeSettings({ [key]: value });
  };

  return (
    <aside className="glass-panel sidebar flex flex-col h-full w-[350px] border-r border-glass text-sm select-none rounded-none">
      
      <div className="flex border-b border-glass px-5 py-4 items-center gap-2">
        <Settings2 size={16} className="text-violet-400" />
        <h2 className="font-bold text-white tracking-wide text-xs uppercase">Demo Canvas Styles</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        
        {/* Section 1: Webcam Overlay */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
            <Camera size={14} className="text-purple-400" />
            Facecam Overlay
          </h3>

          {/* Camera Position buttons */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'top-left', name: 'Top Left' },
              { id: 'top-right', name: 'Top Right' },
              { id: 'bottom-left', name: 'Bottom Left' },
              { id: 'bottom-right', name: 'Bottom Right' },
              { id: 'none', name: 'Hide Camera' },
            ].map((pos) => (
              <button
                key={pos.id}
                onClick={() => updateSetting('cameraPosition', pos.id as any)}
                className={`p-2.5 rounded-lg border text-xs font-semibold text-center transition-all ${settings.cameraPosition === pos.id ? 'border-purple-500 bg-purple-500/10 text-white' : 'border-glass hover:bg-white/5 text-gray-400'} ${pos.id === 'none' ? 'col-span-2' : ''}`}
              >
                {pos.name}
              </button>
            ))}
          </div>

          {settings.cameraPosition !== 'none' && (
            <div className="space-y-3.5 pt-1 animate-fade-in">
              {/* Webcam Size slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400 font-medium">Camera Bubble Size</span>
                  <span className="text-purple-400 font-semibold">{settings.cameraSize}px</span>
                </div>
                <input 
                  type="range" 
                  min="80" 
                  max="200" 
                  value={settings.cameraSize}
                  onChange={(e) => updateSetting('cameraSize', parseInt(e.target.value))}
                />
              </div>

              {/* Webcam Border Color */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400 font-medium">Border Color</span>
                <input 
                  type="color" 
                  value={settings.cameraBorderColor} 
                  onChange={(e) => updateSetting('cameraBorderColor', e.target.value)}
                  className="w-7 h-7 rounded border border-glass cursor-pointer bg-transparent"
                />
              </div>
            </div>
          )}
        </div>

        {/* Section 2: Browser Window Frame */}
        <div className="space-y-4 border-t border-glass pt-5">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
            <Layout size={14} className="text-blue-400" />
            Browser Window style
          </h3>

          {/* Aspect Ratio */}
          <div className="space-y-2">
            <label className="text-[11px] text-gray-500 font-bold uppercase">Aspect Ratio</label>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { id: '16-9', name: '16:9 Desktop' },
                { id: '9-16', name: '9:16 Vertical' },
                { id: '1-1', name: '1:1 Square' },
                { id: '4-3', name: '4:3 Tablet' },
              ].map((ratio) => (
                <button
                  key={ratio.id}
                  onClick={() => updateSetting('aspectRatio', ratio.id as AspectRatio)}
                  className={`py-2 rounded-lg border text-xs font-semibold transition-all ${settings.aspectRatio === ratio.id ? 'border-blue-500 bg-blue-500/10 text-white' : 'border-glass hover:bg-white/5 text-gray-400'}`}
                >
                  {ratio.name}
                </button>
              ))}
            </div>
          </div>

          {/* Window Padding Scale */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-gray-400 font-medium">Window Padding (Scale)</span>
              <span className="text-blue-400 font-semibold">{Math.round(settings.scale * 100)}%</span>
            </div>
            <input 
              type="range" 
              min="0.5" 
              max="1.1" 
              step="0.01" 
              value={settings.scale}
              onChange={(e) => updateSetting('scale', parseFloat(e.target.value))}
            />
          </div>

          {/* Border Radius */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-gray-400 font-medium">Corner Rounding</span>
              <span className="text-blue-400 font-semibold">{settings.borderRadius}px</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="32" 
              value={settings.borderRadius}
              onChange={(e) => updateSetting('borderRadius', parseInt(e.target.value))}
            />
          </div>

          {/* Shadow intensity */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-gray-400 font-medium">Shadow Blur</span>
              <span className="text-blue-400 font-semibold">{settings.shadowIntensity}px</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={settings.shadowIntensity}
              onChange={(e) => updateSetting('shadowIntensity', parseInt(e.target.value))}
            />
          </div>

          {/* macOS window traffic lights header toggle */}
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-white/5 border border-glass">
            <span className="text-xs text-gray-300 font-semibold">macOS Title Dots</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={settings.macOSHeader} 
                onChange={(e) => updateSetting('macOSHeader', e.target.checked)} 
                className="sr-only peer"
              />
              <div className="w-8 h-4.5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>

        {/* Section 3: Canvas Background Preset */}
        <div className="space-y-4 border-t border-glass pt-5">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
            <Paintbrush size={14} className="text-pink-400" />
            Canvas Background
          </h3>

          <div className="grid grid-cols-2 gap-2">
            {GRADIENT_PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => updateSetting('gradientPresetId', preset.id)}
                className={`group p-1 rounded-xl border text-left overflow-hidden transition-all ${settings.gradientPresetId === preset.id ? 'border-pink-500 ring-1 ring-pink-500/25' : 'border-glass hover:border-white/10'}`}
              >
                <div 
                  className="h-10 rounded-lg w-full mb-1" 
                  style={{ background: preset.css }}
                />
                <span className="text-[10px] font-bold px-1 text-gray-400 block truncate group-hover:text-white">
                  {preset.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Section 4: Zoom Keyframe list */}
        <div className="space-y-4 border-t border-glass pt-5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <Settings2 size={14} className="text-yellow-400" />
              Focus Zoom Points
            </h3>
            <button 
              onClick={onAddKeyframe}
              className="glass-button py-1 px-2 text-[10px] active bg-yellow-600 hover:bg-yellow-500 text-white flex items-center gap-0.5"
            >
              <Plus size={10} /> Add
            </button>
          </div>

          {keyframes.length === 0 ? (
            <div className="text-center py-6 text-gray-500 text-xs border border-dashed border-glass rounded-xl">
              No zoom focus points added.<br/>Click anywhere on video canvas!
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
              {[...keyframes].sort((a,b) => a.time - b.time).map((kf) => (
                <div key={kf.id} className="p-2.5 rounded-lg bg-white/5 border border-glass space-y-2 relative group">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-yellow-400">At {kf.time.toFixed(1)}s</span>
                    <button 
                      onClick={() => onRemoveKeyframe(kf.id)}
                      className="text-gray-400 hover:text-red-400 transition-colors p-0.5"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-gray-500">Zoom Power</span>
                      <span className="text-yellow-400 font-semibold">{kf.zoom.toFixed(1)}x</span>
                    </div>
                    <input 
                      type="range" 
                      min="1" 
                      max="3" 
                      step="0.1" 
                      value={kf.zoom}
                      onChange={(e) => onUpdateKeyframe(kf.id, { zoom: parseFloat(e.target.value) })}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </aside>
  );
};
