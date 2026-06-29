import { useState } from 'react';
import {
  ArrowRight,
  Camera,
  Check,
  Film,
  Layers3,
  Maximize2,
  Mic,
  Monitor,
  MousePointer2,
  Play,
  Scissors,
  Sparkles,
  Star,
  Video,
  WandSparkles,
} from 'lucide-react';
import { DemonierLogo } from './DemonierLogo';

interface LandingPageProps {
  onOpenStudio: () => void;
}

const previewModes = [
  {
    label: 'Screen only',
    title: 'Full screen. Camera on top.',
    copy: 'Clean walkthroughs with no background, no frame, and no distraction.',
    icon: Maximize2,
    className: 'screen-only',
  },
  {
    label: 'Styled',
    title: 'Polished framed demos.',
    copy: 'Gradient backgrounds, browser frame, rounded camera, and export-ready layout.',
    icon: Layers3,
    className: 'polish-view',
  },
  {
    label: 'Facecam',
    title: 'Camera where it helps.',
    copy: 'Corner camera or 5:4 side camera for more personal explainers.',
    icon: Camera,
    className: 'camera-view',
  },
];

const featureRows = [
  { icon: Video, title: 'Record browser, window, or full screen', copy: 'Capture the exact thing you want to explain, right from the browser.' },
  { icon: Camera, title: 'Add camera without extra setup', copy: 'Use corner bubbles or left/right side camera with a clean 5:4 shape.' },
  { icon: Mic, title: 'Control voice with the camera', copy: 'Hide the camera when you want a silent export, or keep it visible with voice.' },
  { icon: Maximize2, title: 'Screen + Camera Only mode', copy: 'Remove the background and keep the viewer focused on the real screen.' },
  { icon: WandSparkles, title: 'Styled Background mode', copy: 'Turn raw recordings into product-ready demos with color and framing.' },
  { icon: Scissors, title: 'Trim and export', copy: 'Cut the slow parts and download a finished video in a clean format.' },
];

const stats = [
  ['16:10', 'MacBook Air friendly output'],
  ['5:4', 'Side facecam ratio'],
  ['4K', 'High quality export'],
  ['Free', 'Browser based workflow'],
];

const useCases = [
  ['Product demos', 'Show a new feature with a polished frame.'],
  ['Tutorials', 'Keep the full screen visible for step-by-step teaching.'],
  ['Client updates', 'Send a clear walkthrough instead of scheduling another meeting.'],
  ['Support videos', 'Record the fix once and reuse it.'],
];

const testimonials = [
  ['This makes my walkthroughs feel cleaner before I even export.', 'Founder'],
  ['The screen-only mode is perfect for tutorials where every edge matters.', 'Designer'],
  ['I can record, trim, and send a client update without opening another tool.', 'Product lead'],
];

const faqs = [
  ['Is it free to start?', 'Yes. The current workflow runs in your browser without a paid tool.'],
  ['Can I hide the camera?', 'Yes. Choose Hide camera in Facecam Overlay. The export will also remove voice audio.'],
  ['Can I remove the background?', 'Yes. Choose Screen + Camera in Video Layout.'],
  ['Can I make it look polished?', 'Yes. Choose Styled Background and adjust camera, padding, and background.'],
];

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenStudio }) => {
  const [activeMode, setActiveMode] = useState(0);
  const active = previewModes[activeMode];
  const ActiveIcon = active.icon;

  return (
    <main className="monza-landing" id="home">
      <section className="monza-hero">
        <div className="monza-badge"><Sparkles size={14} /> Screen recording studio for clear demos</div>
        <h2>Turn screen recordings into polished product videos.</h2>
        <p>
          Demonier records your screen, camera, and voice, then helps you choose the
          right layout for tutorials, demos, updates, and support videos.
        </p>
        <div className="monza-actions">
          <button onClick={onOpenStudio} className="framer-primary">Open studio free <ArrowRight size={17} /></button>
          <a href="#features" className="monza-secondary">Explore features</a>
        </div>
        <div className="monza-proof">
          <span><Check size={13} /> No install</span>
          <span><Check size={13} /> 16:10 output</span>
          <span><Check size={13} /> Screen + camera</span>
        </div>
      </section>

      <section className="monza-preview-shell" aria-label="Interactive Demonier preview">
        <div className="monza-preview-top">
          <div><DemonierLogo /><b>Demonier Studio</b></div>
          <span><i /> Ready to record</span>
        </div>
        <div className="monza-preview-grid">
          <div className={`monza-stage ${active.className}`}>
            <div className="monza-screen">
              <div className="monza-browser"><i /><i /><i /><span>demo-recording</span></div>
              <div className="monza-screen-content">
                <aside><i /><i /><i /><i /></aside>
                <div>
                  <ActiveIcon size={28} />
                  <b>{active.title}</b>
                  <p>{active.copy}</p>
                  <span className="monza-cursor"><MousePointer2 size={14} /></span>
                </div>
              </div>
            </div>
            <div className="monza-camera">CAM</div>
            <div className="monza-timeline"><i /><i /><i /><i /><b /></div>
          </div>
          <div className="monza-mode-list">
            {previewModes.map((mode, index) => (
              <button key={mode.label} onClick={() => setActiveMode(index)} className={activeMode === index ? 'active' : ''}>
                <mode.icon size={17} />
                <span>{mode.label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="monza-logos" aria-label="Demonier use cases">
        <span>For founders</span>
        <span>For designers</span>
        <span>For educators</span>
        <span>For support teams</span>
        <span>For product teams</span>
      </section>

      <section className="monza-section" id="features">
        <div className="monza-section-heading">
          <span className="framer-kicker">Features</span>
          <h3>Everything you need to make a clear walkthrough.</h3>
          <p>Record, style, trim, and export without jumping between multiple tools.</p>
        </div>
        <div className="monza-feature-grid">
          {featureRows.map((feature) => (
            <article key={feature.title}>
              <feature.icon size={22} />
              <h4>{feature.title}</h4>
              <p>{feature.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="monza-band">
        <div>
          <span className="framer-kicker">Layouts</span>
          <h3>Choose clean or designed after recording.</h3>
          <p>One recording can become a focused tutorial or a polished product demo.</p>
        </div>
        <div className="monza-layouts">
          <article><Monitor size={22} /><h4>Screen + Camera</h4><p>Full screen, camera overlay, no background.</p></article>
          <article><Layers3 size={22} /><h4>Styled Background</h4><p>Gradient canvas, rounded browser frame, and soft shadow.</p></article>
        </div>
      </section>

      <section className="monza-stats">
        {stats.map(([value, label]) => (
          <article key={value}><b>{value}</b><span>{label}</span></article>
        ))}
      </section>

      <section className="monza-split" id="how-it-works">
        <div>
          <span className="framer-kicker">Workflow</span>
          <h3>From raw screen to shareable demo.</h3>
        </div>
        <ol>
          <li><b>01</b><div><h4>Record</h4><p>Pick screen, camera, and mic options before capture.</p></div></li>
          <li><b>02</b><div><h4>Style</h4><p>Choose screen-only or styled background, then position the facecam.</p></div></li>
          <li><b>03</b><div><h4>Export</h4><p>Trim the ends and download the final video.</p></div></li>
        </ol>
      </section>

      <section className="monza-section">
        <div className="monza-section-heading">
          <span className="framer-kicker">Use cases</span>
          <h3>Make videos people can actually follow.</h3>
        </div>
        <div className="monza-usecase-grid">
          {useCases.map(([title, copy]) => (
            <article key={title}><h4>{title}</h4><p>{copy}</p></article>
          ))}
        </div>
      </section>

      <section className="monza-testimonials">
        <div className="monza-section-heading">
          <span className="framer-kicker">What it feels like</span>
          <h3>Simple enough to use every day.</h3>
        </div>
        <div>
          {testimonials.map(([quote, role]) => (
            <article key={quote}>
              <div><Star size={15} /><Star size={15} /><Star size={15} /></div>
              <p>"{quote}"</p>
              <span>{role}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="monza-free-plan">
        <div>
          <span className="framer-kicker">Free plan</span>
          <h3>Start with the browser studio.</h3>
          <p>Use Demonier without a paid tool. Record, style, trim, and export from your browser.</p>
        </div>
        <ul>
          <li><Check size={15} /> Screen recording</li>
          <li><Check size={15} /> Camera overlay</li>
          <li><Check size={15} /> 16:10 canvas</li>
          <li><Check size={15} /> Video export</li>
        </ul>
      </section>

      <section className="monza-faq">
        <div className="monza-section-heading">
          <span className="framer-kicker">FAQ</span>
          <h3>Questions before you record.</h3>
        </div>
        <div>
          {faqs.map(([question, answer]) => (
            <article key={question}><h4>{question}</h4><p>{answer}</p></article>
          ))}
        </div>
      </section>

      <section className="monza-final">
        <Film size={30} />
        <h3>Ready to make your next screen recording easier to watch?</h3>
        <p>Open the free studio, record your screen, and choose the style that fits.</p>
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
