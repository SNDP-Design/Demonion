import React, { useRef } from 'react';
import type { EditorSettings, ZoomMoment } from '../types';
import { GRADIENT_PRESETS } from '../constants/presets';
import { Camera, CameraOff, Circle, CornerDownLeft, CornerDownRight, CornerUpLeft, CornerUpRight, Layout, Monitor, PanelLeft, PanelRight, Paintbrush, Pencil, Square, Trash2, ZoomIn } from 'lucide-react';

interface SidebarControlsProps {
  settings: EditorSettings;
  onChangeSettings: (settings: Partial<EditorSettings>) => void;
  zoomMoments: ZoomMoment[];
  onJumpToZoomMoment: (time: number) => void;
  onUpdateZoomMoment: (index: number, updates: Partial<ZoomMoment>) => void;
  onDeleteZoomMoment: (index: number) => void;
}

export const SidebarControls: React.FC<SidebarControlsProps> = ({ settings, onChangeSettings, zoomMoments, onJumpToZoomMoment, onUpdateZoomMoment, onDeleteZoomMoment }) => {
  const update = <K extends keyof EditorSettings>(key: K, value: EditorSettings[K]) => onChangeSettings({ [key]: value });
  const flatColorInputRef = useRef<HTMLInputElement>(null);
  const sortedZoomMoments = zoomMoments.map((moment, index) => ({ moment, index })).sort((a, b) => a.moment.time - b.moment.time);
  const formatZoomTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    const tenths = Math.floor((time % 1) * 10);
    return `${minutes}:${seconds.toString().padStart(2, '0')}.${tenths}`;
  };

  return (
    <aside className="glass-panel sidebar flex flex-col h-full w-[350px] border-r border-glass text-sm select-none rounded-none">
      <div className="sidebar-content space-y-6">
        <section className="sidebar-module">
          <h3 className="sidebar-module-title"><Monitor size={14} /> Video Layout</h3>
          <div className="video-layout-options">
            <button type="button" onClick={() => update('layoutMode', 'screen-only')} className={`video-layout-option ${settings.layoutMode === 'screen-only' ? 'sidebar-control-active' : 'border-glass hover-bg-glass text-gray-400'}`}>
              <strong>Screen + Camera</strong>
            </button>
            <button type="button" onClick={() => update('layoutMode', 'framed')} className={`video-layout-option ${settings.layoutMode === 'framed' ? 'sidebar-control-active' : 'border-glass hover-bg-glass text-gray-400'}`}>
              <strong>Styled Background</strong>
            </button>
          </div>
        </section>

        <section className="sidebar-module">
          <h3 className="sidebar-module-title"><Camera size={14} /> Facecam Overlay</h3>
          <div className="facecam-position-row">
            {[
              { id: 'top-left', name: 'Top left', icon: CornerUpLeft },
              { id: 'top-right', name: 'Top right', icon: CornerUpRight },
              { id: 'bottom-left', name: 'Bottom left', icon: CornerDownLeft },
              { id: 'bottom-right', name: 'Bottom right', icon: CornerDownRight },
              { id: 'side-left', name: 'Left side', icon: PanelLeft },
              { id: 'side-right', name: 'Right side', icon: PanelRight },
              { id: 'none', name: 'Hide camera', icon: CameraOff },
            ].map((position) => (
              <button key={position.id} onClick={() => update('cameraPosition', position.id as EditorSettings['cameraPosition'])} title={position.name} aria-label={position.name}
                className={`facecam-position-button ${settings.cameraPosition === position.id ? 'sidebar-control-active' : 'border-glass hover-bg-glass text-gray-400'}`}>
                <position.icon size={17} strokeWidth={2.2} />
              </button>
            ))}
          </div>
          <div className="facecam-shape-row">
            <span>Camera Shape</span>
            <div className="facecam-shape-buttons">
              <button onClick={() => update('cameraShape', 'circle')} title="Circle camera" aria-label="Circle camera" className={`facecam-position-button ${settings.cameraShape === 'circle' ? 'sidebar-control-active' : 'border-glass hover-bg-glass text-gray-400'}`}><Circle size={17} /></button>
              <button onClick={() => update('cameraShape', 'rounded')} title="Rounded square camera" aria-label="Rounded square camera" className={`facecam-position-button ${settings.cameraShape === 'rounded' ? 'sidebar-control-active' : 'border-glass hover-bg-glass text-gray-400'}`}><Square size={17} /></button>
            </div>
          </div>
          {settings.cameraPosition !== 'none' && <div className="camera-overlay-settings pt-1">
            <label className="space-y-1.5 block"><span className="sidebar-slider-label"><span>Camera Size</span><b>{settings.cameraSize}px</b></span>
              <input type="range" min="80" max="320" value={settings.cameraSize} onChange={(event) => update('cameraSize', Number(event.target.value))} />
            </label>
            <label className="sidebar-field-label"><span>Border Color</span>
              <span className="camera-border-options">
                <button type="button" onClick={() => update('cameraBorderColor', '#000000')} aria-label="Use black camera border" title="Black border" className={`camera-border-option camera-border-black ${settings.cameraBorderColor.toLowerCase() === '#000000' ? 'sidebar-control-active' : ''}`} />
                <button type="button" onClick={() => update('cameraBorderColor', '#ffffff')} aria-label="Use white camera border" title="White border" className={`camera-border-option camera-border-white ${settings.cameraBorderColor.toLowerCase() === '#ffffff' ? 'sidebar-control-active' : ''}`} />
              </span>
            </label>
          </div>}
        </section>

        <section className="sidebar-module border-t border-glass pt-5">
          <h3 className="sidebar-module-title"><ZoomIn size={14} /> Zoom Points</h3>
          <div className="zoom-point-list">
            {sortedZoomMoments.length === 0 ? (
              <p className="zoom-point-empty">Click the preview to add a zoom point.</p>
            ) : sortedZoomMoments.map(({ moment, index }, displayIndex) => (
              <article key={`${moment.time}-${index}`} className="zoom-point-item">
                <div className="zoom-point-header">
                  <button type="button" onClick={() => onJumpToZoomMoment(moment.time)} className="zoom-point-jump">
                    <span>Point {displayIndex + 1}</span>
                    <b>{formatZoomTime(moment.time)}</b>
                  </button>
                  <button type="button" onClick={() => onDeleteZoomMoment(index)} className="zoom-point-delete" aria-label="Delete zoom point" title="Delete zoom point">
                    <Trash2 size={14} />
                  </button>
                </div>

                <label className="zoom-point-field">
                  <span>Strength</span>
                  <select value={moment.strength ?? 'normal'} onChange={(event) => onUpdateZoomMoment(index, { strength: event.target.value as ZoomMoment['strength'] })}>
                    <option value="soft">Soft</option>
                    <option value="normal">Normal</option>
                    <option value="strong">Strong</option>
                  </select>
                </label>

                <label className="zoom-point-field">
                  <span>Duration</span>
                  <select value={moment.duration ?? 'medium'} onChange={(event) => onUpdateZoomMoment(index, { duration: event.target.value as ZoomMoment['duration'] })}>
                    <option value="short">Short</option>
                    <option value="medium">Medium</option>
                    <option value="long">Long</option>
                  </select>
                </label>
              </article>
            ))}
          </div>
        </section>

        {settings.layoutMode === 'framed' && <section className="sidebar-module browser-window-section border-t border-glass pt-5">
          <h3 className="sidebar-module-title"><Layout size={14} /> Browser Window</h3>
          <div className="browser-window-controls">
            <Slider label="Window Padding" value={`${Math.round(settings.scale * 100)}%`} min="0.5" max="1.2" step="0.01" current={settings.scale} onChange={(value) => update('scale', value)} />
            <Slider label="Shadow Blur" value={`${settings.shadowIntensity}px`} min="0" max="100" current={settings.shadowIntensity} onChange={(value) => update('shadowIntensity', value)} />
            <label className="sidebar-toggle-label"><span>macOS Title Dots</span><span className="switch-container"><input type="checkbox" checked={settings.macOSHeader} onChange={(event) => update('macOSHeader', event.target.checked)} className="switch-input" /><span className="switch-slider" /></span></label>
          </div>
        </section>}

        {settings.layoutMode === 'framed' && <section className="sidebar-module border-t border-glass pt-5">
          <h3 className="sidebar-module-title"><Paintbrush size={14} /> Background</h3>
          <div className="gradient-thumbnail-grid">{GRADIENT_PRESETS.map((preset) => <button key={preset.id} onClick={() => onChangeSettings({ gradientPresetId: preset.id, backgroundType: 'gradient' })} title={preset.name} aria-label={preset.name} className={`gradient-thumbnail ${settings.gradientPresetId === preset.id && settings.backgroundType === 'gradient' ? 'active-pink' : 'border-glass hover:border-white/10'}`}><span style={{ background: preset.css }} /></button>)}
            <button type="button" onClick={() => flatColorInputRef.current?.click()} title="Choose a flat color" aria-label="Choose a flat color" className={`flat-color-thumbnail ${settings.backgroundType === 'solid' ? 'active-pink' : 'border-glass hover:border-white/10'}`}><span style={{ background: settings.solidColor }} /><i><Pencil size={12} /></i></button>
            <input ref={flatColorInputRef} type="color" value={settings.solidColor} onChange={(event) => onChangeSettings({ solidColor: event.target.value, backgroundType: 'solid' })} className="flat-color-picker-input" />
          </div>
        </section>}
      </div>
    </aside>
  );
};

interface SliderProps { className?: string; label: string; value: string; min: string; max: string; step?: string; current: number; onChange: (value: number) => void; }
const Slider: React.FC<SliderProps> = ({ className, label, value, min, max, step, current, onChange }) => <label className={`space-y-1.5 block ${className ?? ''}`}><span className="sidebar-slider-label"><span>{label}</span><b>{value}</b></span><input type="range" min={min} max={max} step={step} value={current} onChange={(event) => onChange(Number(event.target.value))} /></label>;
