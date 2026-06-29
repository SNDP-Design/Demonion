import { type CSSProperties, useState } from 'react';
import {
  ArrowRight,
  Camera,
  Check,
  Download,
  Maximize2,
  Monitor,
  MonitorUp,
  MousePointer2,
  Play,
  Scissors,
  SquareDashedMousePointer,
  Upload,
  Video,
  WandSparkles,
} from 'lucide-react';
import { DemonierLogo } from './DemonierLogo';
import heroImage from '../assets/hero.png';

interface LandingPageProps {
  onOpenStudio: () => void;
}

const previewModes = [
  {
    label: 'Screen only',
    title: 'Your screen fills the whole frame.',
    copy: 'Hide the background and keep only the computer screen with your camera on top.',
    icon: Maximize2,
    className: 'screen-only',
  },
  {
    label: 'Camera',
    title: 'Place your face where it helps.',
    copy: 'Use a clean camera bubble or side camera view while the walkthrough stays focused.',
    icon: Camera,
    className: 'camera-view',
  },
  {
    label: 'Polish',
    title: 'Turn a raw recording into a finished demo.',
    copy: 'Add a styled frame, pick a background, trim the edges, and export in 4K.',
    icon: WandSparkles,
    className: 'polish-view',
  },
];

const featureCards = [
  { title: 'Full-screen layout', copy: 'Show only the screen and camera when you want a clean tutorial view.', icon: Monitor },
  { title: 'Camera controls', copy: 'Move your camera to corners or side positions and choose the shape.', icon: Camera },
  { title: 'Fast trimming', copy: 'Cut the slow start and ending before you export the finished video.', icon: Scissors },
  { title: '4K export', copy: 'Download a polished video straight from the browser.', icon: Download },
];

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenStudio }) => {
  const [activeMode, setActiveMode] = useState(0);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const active = previewModes[activeMode];
  const ActiveIcon = active.icon;
  const landingStyle = {
    '--tilt-x': `${tilt.x}deg`,
    '--tilt-y': `${tilt.y}deg`,
  } as CSSProperties;

  return (
    <main
      className="framer-landing framer-landing-v2"
      id="home"
      style={landingStyle}
      onPointerMove={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        setTilt({
          x: ((event.clientY - rect.top) / rect.height - 0.5) * -5,
          y: ((event.clientX - rect.left) / rect.width - 0.5) * 7,
        });
      }}
      onPointerLeave={() => setTilt({ x: 0, y: 0 })}
    >
      <section className="framer-hero framer-hero-v2">
        <div className="framer-hero-grid" aria-hidden="true" />
        <div className="framer-hero-copy-v2">
          <div className="framer-eyebrow-v2">
            <span>New</span>
            <b>Screen + Camera Only mode is live</b>
          </div>
          <h2>Demos that feel designed before you edit.</h2>
          <p>
            Record your screen, camera, and voice. Then choose a cinematic styled frame
            or a clean full-screen layout with no background.
          </p>
          <div className="framer-hero-actions">
            <button onClick={onOpenStudio} className="framer-primary">Open studio free <ArrowRight size={17} /></button>
            <a className="framer-text-link" href="#features">Explore features <span>↓</span></a>
          </div>
          <div className="framer-proof">
            <span><Check size={13} /> No install</span>
            <span><Check size={13} /> Screen + camera</span>
            <span><Check size={13} /> 4K export</span>
          </div>
        </div>

        <div className="framer-product-shell-v2" aria-label="Interactive Demonier preview">
          <div className="framer-preview-toolbar">
            <div className="framer-preview-brand"><DemonierLogo /><span>Demonier Studio</span></div>
            <div className="framer-preview-status"><i /> Ready</div>
          </div>
          <div className="framer-preview-body">
            <div className={`framer-preview-stage ${active.className}`}>
              <div className="framer-preview-screen">
                <div className="framer-browser-bar"><i /><i /><i /><span>demo.workspace</span></div>
                <div className="framer-screen-content">
                  <div className="framer-app-sidebar"><i /><i /><i /><i /></div>
                  <div className="framer-app-canvas">
                    <b>{active.title}</b>
                    <p>{active.copy}</p>
                    <div className="framer-cursor"><MousePointer2 size={14} /></div>
                  </div>
                </div>
              </div>
              <div className="framer-preview-camera"><span>CAM</span></div>
              <div className="framer-preview-tag"><ActiveIcon size={14} /> {active.label}</div>
              <div className="framer-preview-timeline"><i /><i /><i /><i /><b /></div>
            </div>
            <aside className="framer-mode-panel">
              {previewModes.map((mode, index) => (
                <button key={mode.label} onClick={() => setActiveMode(index)} className={activeMode === index ? 'active' : ''}>
                  <mode.icon size={16} />
                  <span>{mode.label}</span>
                </button>
              ))}
            </aside>
          </div>
        </div>
      </section>

      <section className="framer-feature-strip" id="features">
        <span><Video size={14} /> Capture</span>
        <span><SquareDashedMousePointer size={14} /> Layout</span>
        <span><Scissors size={14} /> Trim</span>
        <span><Upload size={14} /> Export</span>
      </section>

      <section className="framer-intro framer-intro-v2">
        <span className="framer-kicker">Updated workflow</span>
        <h3>Two beautiful ways to present your recording.</h3>
        <p>
          Use the new screen-only view for tutorials, or switch back to styled backgrounds
          when you want the recording to feel like a polished product launch.
        </p>
      </section>

      <section className="framer-showcase-grid">
        <article className="framer-showcase-card large">
          <div>
            <span className="framer-kicker">Clean mode</span>
            <h4>Computer screen first. Camera on top. Nothing else.</h4>
            <p>Perfect for direct tutorials, app walkthroughs, and client handovers where clarity matters most.</p>
          </div>
          <div className="framer-clean-preview">
            <div className="framer-clean-screen"><MonitorUp size={28} /><b>Full screen recording</b></div>
            <div className="framer-clean-camera">CAM</div>
          </div>
        </article>

        {featureCards.map((feature) => (
          <article className="framer-showcase-card" key={feature.title}>
            <feature.icon size={20} />
            <h4>{feature.title}</h4>
            <p>{feature.copy}</p>
          </article>
        ))}
      </section>

      <section className="framer-workflow framer-workflow-v2" id="how-it-works">
        <div className="framer-workflow-heading">
          <span className="framer-kicker">Simple path</span>
          <h3>Record, choose the layout, export.</h3>
          <button onClick={onOpenStudio} className="framer-secondary">Open Demonier <ArrowRight size={15} /></button>
        </div>
        <ol>
          <li><b>01</b><div><h4>Start with your screen</h4><p>Pick a tab, window, or full screen from the browser sharing menu.</p></div><span>Record</span></li>
          <li><b>02</b><div><h4>Choose the look</h4><p>Select Screen + Camera Only for a clean view, or Styled Background for a designed frame.</p></div><span>Layout</span></li>
          <li><b>03</b><div><h4>Trim and download</h4><p>Keep the useful part and export your finished walkthrough in high quality.</p></div><span>Export</span></li>
        </ol>
      </section>

      <section className="framer-final framer-final-v2">
        <img src={heroImage} alt="" aria-hidden="true" />
        <span className="framer-kicker">Ready in the browser</span>
        <h3>Make your next walkthrough feel premium.</h3>
        <p>No paid tool needed. Open the studio and record directly in your browser.</p>
        <button onClick={onOpenStudio} className="framer-primary">Start recording free <Play size={16} /></button>
      </section>

      <footer className="framer-footer">
        <div><span className="framer-footer-logo"><DemonierLogo /></span><b>Demonier</b></div>
        <p>Screen recording for ideas worth sharing.</p>
        <span>© 2026 Demonier</span>
      </footer>
    </main>
  );
};
