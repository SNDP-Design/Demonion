import { type CSSProperties, useState } from 'react';
import {
  ArrowRight,
  Camera,
  Check,
  Download,
  Film,
  Layers3,
  Maximize2,
  Mic,
  Monitor,
  MousePointer2,
  Play,
  Scissors,
  ShieldCheck,
  Sparkles,
  Upload,
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
    title: 'Show every edge of your screen.',
    copy: 'A clean recording view with your computer screen and camera only. No gradient, no frame, no distraction.',
    icon: Maximize2,
    className: 'screen-only',
  },
  {
    label: 'Studio frame',
    title: 'Make product demos feel polished.',
    copy: 'Add a designed background, browser-style frame, shadows, and camera placement for a launch-ready look.',
    icon: Layers3,
    className: 'polish-view',
  },
  {
    label: 'Camera focus',
    title: 'Keep your face in the story.',
    copy: 'Place your camera in a corner or side panel so your explanation feels personal and easy to follow.',
    icon: Camera,
    className: 'camera-view',
  },
];

const explainCards = [
  { icon: Video, title: 'Record your screen', copy: 'Capture a browser tab, app window, or your whole computer screen directly from the browser.' },
  { icon: Mic, title: 'Add your voice', copy: 'Turn on your microphone when you want to explain what people are watching.' },
  { icon: Camera, title: 'Add your camera', copy: 'Show your face as a bubble or side view, then change the size and shape later.' },
  { icon: Maximize2, title: 'Screen + Camera Only', copy: 'Use the clean mode when you want the viewer to focus only on the screen and you.' },
  { icon: WandSparkles, title: 'Styled background', copy: 'Use the designed layout when you want a polished product demo or social video.' },
  { icon: Scissors, title: 'Trim the rough parts', copy: 'Cut the slow beginning and ending before downloading the final video.' },
];

const useCases = [
  ['App tutorials', 'Show exactly where to click without losing the full screen.'],
  ['Client walkthroughs', 'Send a clear explanation instead of booking another call.'],
  ['Product updates', 'Record a new feature and make it look launch-ready.'],
  ['Support replies', 'Answer the same question once with a reusable video.'],
];

const faqs = [
  ['Do I need to install anything?', 'No. Demonier works inside the browser.'],
  ['Can I remove the background?', 'Yes. Choose Screen + Camera Only in the editor.'],
  ['Can I still make it look designed?', 'Yes. Choose Styled Background when you want the framed demo look.'],
  ['Is there a free way to use it?', 'Yes. The current workflow runs in your browser without a paid tool.'],
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
      className="framer-landing clean-landing"
      id="home"
      style={landingStyle}
      onPointerMove={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        setTilt({
          x: ((event.clientY - rect.top) / rect.height - 0.5) * -3,
          y: ((event.clientX - rect.left) / rect.width - 0.5) * 4,
        });
      }}
      onPointerLeave={() => setTilt({ x: 0, y: 0 })}
    >
      <section className="clean-hero">
        <div className="clean-hero-copy">
          <div className="clean-badge"><Sparkles size={14} /> Updated editor with screen-only mode</div>
          <h2>Record clear screen videos without fighting the design.</h2>
          <p>
            Demonier helps you record your screen, camera, and voice, then choose between
            a clean full-screen tutorial or a polished framed demo.
          </p>
          <div className="clean-actions">
            <button onClick={onOpenStudio} className="framer-primary">Open studio free <ArrowRight size={17} /></button>
            <a href="#features" className="framer-secondary clean-link">View features</a>
          </div>
          <div className="clean-proof">
            <span><Check size={13} /> Browser based</span>
            <span><Check size={13} /> Screen + camera</span>
            <span><Check size={13} /> Export video</span>
          </div>
        </div>

        <div className="clean-product-card" aria-label="Interactive Demonier preview">
          <div className="clean-product-top">
            <div><DemonierLogo /><b>Demonier Studio</b></div>
            <span><i /> Ready</span>
          </div>
          <div className={`clean-product-stage ${active.className}`}>
            <div className="clean-screen">
              <div className="clean-screen-top"><i /><i /><i /><span>your-recording</span></div>
              <div className="clean-screen-body">
                <div className="clean-left-panel"><i /><i /><i /></div>
                <div className="clean-main-panel">
                  <ActiveIcon size={24} />
                  <b>{active.title}</b>
                  <p>{active.copy}</p>
                  <div className="clean-pointer"><MousePointer2 size={14} /></div>
                </div>
              </div>
            </div>
            <div className="clean-camera">CAM</div>
            <div className="clean-timeline"><i /><i /><i /><i /><b /></div>
          </div>
          <div className="clean-mode-tabs">
            {previewModes.map((mode, index) => (
              <button key={mode.label} onClick={() => setActiveMode(index)} className={activeMode === index ? 'active' : ''}>
                <mode.icon size={15} /> {mode.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="clean-section clean-feature-intro" id="features">
        <span className="framer-kicker">What it does</span>
        <h3>Everything needed for a useful walkthrough.</h3>
        <p>Each feature is built for one simple goal: help your viewer understand what you are showing.</p>
      </section>

      <section className="clean-feature-grid">
        {explainCards.map((feature) => (
          <article key={feature.title}>
            <feature.icon size={21} />
            <h4>{feature.title}</h4>
            <p>{feature.copy}</p>
          </article>
        ))}
      </section>

      <section className="clean-section clean-comparison">
        <div>
          <span className="framer-kicker">Choose your layout</span>
          <h3>Clean tutorial or polished demo.</h3>
          <p>You can switch layouts after recording, so one video can become different styles for different uses.</p>
        </div>
        <div className="clean-layout-cards">
          <article>
            <Monitor size={22} />
            <h4>Screen + Camera Only</h4>
            <p>Best when you want the full computer screen visible with no background or browser frame.</p>
            <ul><li>Full screen focus</li><li>Camera on top</li><li>Good for tutorials</li></ul>
          </article>
          <article>
            <Layers3 size={22} />
            <h4>Styled Background</h4>
            <p>Best when you want a more designed look for product demos, social posts, or launches.</p>
            <ul><li>Gradient background</li><li>Browser-style frame</li><li>Good for marketing</li></ul>
          </article>
        </div>
      </section>

      <section className="clean-section clean-steps" id="how-it-works">
        <div>
          <span className="framer-kicker">How it works</span>
          <h3>Three simple steps.</h3>
        </div>
        <ol>
          <li><b>01</b><h4>Record</h4><p>Pick your screen, turn camera or mic on if needed, and start recording.</p></li>
          <li><b>02</b><h4>Design</h4><p>Choose screen-only mode or styled mode, then place your camera where it looks best.</p></li>
          <li><b>03</b><h4>Export</h4><p>Trim the start and end, then download the finished video.</p></li>
        </ol>
      </section>

      <section className="clean-section clean-usecases">
        <div>
          <span className="framer-kicker">Use it for</span>
          <h3>Videos people can follow.</h3>
        </div>
        <div className="clean-usecase-list">
          {useCases.map(([title, copy]) => (
            <article key={title}><h4>{title}</h4><p>{copy}</p></article>
          ))}
        </div>
      </section>

      <section className="clean-section clean-quality">
        <div>
          <Film size={24} />
          <h3>Built for clean output.</h3>
          <p>
            The editor keeps your recording private in the browser, lets you trim quickly,
            and exports a ready-to-share video without sending you through a complicated tool.
          </p>
        </div>
        <div className="clean-quality-points">
          <span><ShieldCheck size={16} /> Browser workflow</span>
          <span><Upload size={16} /> Direct export</span>
          <span><Download size={16} /> Download video</span>
        </div>
      </section>

      <section className="clean-section clean-faq">
        <div>
          <span className="framer-kicker">Questions</span>
          <h3>Quick answers.</h3>
        </div>
        <div>
          {faqs.map(([question, answer]) => (
            <article key={question}><h4>{question}</h4><p>{answer}</p></article>
          ))}
        </div>
      </section>

      <section className="clean-final">
        <span className="framer-kicker">Ready when you are</span>
        <h3>Make a screen recording that is easy to watch.</h3>
        <p>Start with the free browser studio, then choose the layout that fits your video.</p>
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
