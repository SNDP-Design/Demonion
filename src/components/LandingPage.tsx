import { useState } from 'react';
import {
  ArrowRight,
  Camera,
  Check,
  FileText,
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

type LegalPageKey = 'terms' | 'privacy';

const legalPages: Record<LegalPageKey, {
  eyebrow: string;
  title: string;
  intro: string;
  icon: typeof FileText;
  sections: Array<{ title: string; copy: string }>;
}> = {
  terms: {
    eyebrow: 'Terms of Service',
    title: 'Simple terms for using Demonier.',
    intro: 'These terms explain the basic rules for using the Demonier browser recording studio.',
    icon: FileText,
    sections: [
      { title: 'Using Demonier', copy: 'You may use Demonier to record, style, trim, and export your own screen recordings. Please use the product only for content you are allowed to capture and share.' },
      { title: 'Your recordings', copy: 'You are responsible for the videos you create, including any people, apps, websites, files, or private information shown in them.' },
      { title: 'Free browser studio', copy: 'Demonier is currently offered as a browser-based workflow. Features may change as the product improves.' },
      { title: 'No misuse', copy: 'Do not use Demonier to break laws, record private content without permission, or create harmful, misleading, or abusive material.' },
      { title: 'Availability', copy: 'We try to keep Demonier working well, but we cannot promise it will always be available, error-free, or compatible with every browser or device.' },
      { title: 'Changes', copy: 'We may update these terms when the product changes. The latest version will live on this page.' },
    ],
  },
  privacy: {
    eyebrow: 'Privacy Policy',
    title: 'How Demonier handles privacy.',
    intro: 'This page explains the basic privacy approach for the Demonier browser recording studio.',
    icon: ShieldCheck,
    sections: [
      { title: 'Screen recording permission', copy: 'Your browser asks for permission before screen, camera, or microphone access. Demonier cannot record until you choose what to share.' },
      { title: 'Local recording workflow', copy: 'The recording and editing workflow runs in your browser. Your exported video is downloaded by your browser when you choose to export.' },
      { title: 'Camera and microphone', copy: 'Camera and microphone access is controlled by your browser. You can turn camera and microphone options on or off before recording.' },
      { title: 'What to avoid recording', copy: 'Please avoid capturing passwords, private messages, financial information, or anything you do not want included in your final video.' },
      { title: 'Website hosting', copy: 'Like most websites, the hosting provider may process basic technical information needed to load the site, such as device, browser, and request data.' },
      { title: 'Updates', copy: 'We may update this privacy page as Demonier changes. The latest version will live on this page.' },
    ],
  },
};

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenStudio }) => {
  const [activeMode, setActiveMode] = useState(0);
  const active = previewModes[activeMode];
  const ActiveIcon = active.icon;
  const path = window.location.pathname;
  const legalPageKey = path === '/terms' ? 'terms' : path === '/privacy' ? 'privacy' : null;

  if (legalPageKey) {
    return (
      <main className="monza-landing" id="home">
        <LegalPage pageKey={legalPageKey} />
        <Footer />
      </main>
    );
  }

  return (
    <main className="monza-landing" id="home">
      <section className="monza-hero">
        <div className="monza-badge"><Sparkles size={14} /> Screen recording studio for clear demos</div>
        <h1>
          <span>Turn screen recordings into</span>
          <span>polished product videos.</span>
        </h1>
        <p>
          Demonier records your screen, camera, and voice, then helps you choose the
          right layout for tutorials, demos, updates, and support videos.
        </p>
        <div className="monza-actions">
          <button onClick={onOpenStudio} className="framer-primary">Start Recording Now <ArrowRight size={17} /></button>
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

      <section className="monza-section" id="use-cases">
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

      <section className="monza-final" id="ready">
        <Film size={30} />
        <h3>Ready to make your next screen recording easier to watch?</h3>
        <p>Open the free studio, record your screen, and choose the style that fits.</p>
        <button onClick={onOpenStudio} className="framer-primary">Start recording free <Play size={16} /></button>
      </section>

      <Footer />
    </main>
  );
};

const LegalPage: React.FC<{ pageKey: LegalPageKey }> = ({ pageKey }) => {
  const page = legalPages[pageKey];
  const PageIcon = page.icon;

  return (
    <section className="legal-page">
      <a href="/" className="legal-back">Back to home</a>
      <div className="legal-hero">
        <div className="legal-icon"><PageIcon size={24} /></div>
        <span className="framer-kicker">{page.eyebrow}</span>
        <h1>{page.title}</h1>
        <p>{page.intro}</p>
        <small>Last updated: June 30, 2026</small>
      </div>
      <div className="legal-grid">
        {page.sections.map((section) => (
          <article key={section.title}>
            <h2>{section.title}</h2>
            <p>{section.copy}</p>
          </article>
        ))}
      </div>
    </section>
  );
};

const Footer: React.FC = () => (
  <footer className="framer-footer">
    <div className="footer-brand">
      <span className="framer-footer-logo"><DemonierLogo /></span>
      <div>
        <b>Demonier</b>
        <small>Browser studio for clear product videos.</small>
      </div>
    </div>
    <nav className="footer-links" aria-label="Footer links">
      <a href="/#features">Features</a>
      <a href="/#how-it-works">Workflow</a>
      <a href="/terms">Terms of Service</a>
      <a href="/privacy">Privacy Policy</a>
    </nav>
    <span>© 2026 Demonier</span>
  </footer>
);
