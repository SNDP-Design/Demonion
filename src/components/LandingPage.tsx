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
import { DemoDayLogo } from './DemoDayLogo';

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
    title: 'DemoDay Terms of Service',
    intro: 'Please read these Terms of Service carefully before using DemoDay. By accessing or using our browser recording studio, you agree to be bound by these terms.',
    icon: FileText,
    sections: [
      { title: 'Acceptance of Terms', copy: 'By using DemoDay, you represent that you are at least 13 years of age and agree to these terms. If you do not agree to these terms, you must not use or access the service.' },
      { title: 'Local Processing & Ownership', copy: 'All video processing, compositing, and rendering occurs 100% locally in your browser. DemoDay does not store, see, or claim ownership of any videos, audio, or metadata you record. You retain full copyright and ownership of your creations.' },
      { title: 'Permitted Use & Content License', copy: 'You agree to use DemoDay only for lawful purposes. You represent that you have all necessary rights, licenses, and permissions to record the windows, screens, and audio inputs that you choose to capture.' },
      { title: 'Prohibited Activities', copy: 'You agree not to use the service to record or share content that is defamatory, infringing on third-party intellectual property, violates any individual\'s privacy, or constitutes harassment, abuse, or illegal material.' },
      { title: 'Disclaimer of Warranties', copy: 'DemoDay is provided on an "as is" and "as available" basis without warranties of any kind. We do not guarantee that the service will be error-free, uninterrupted, or fully compatible with every browser version or hardware setup.' },
      { title: 'Limitation of Liability', copy: 'To the maximum extent permitted by law, DemoDay and its operators shall not be liable for any direct, indirect, incidental, or consequential damages resulting from your use of the studio or any loss of recorded footage.' },
    ],
  },
  privacy: {
    eyebrow: 'Privacy Policy',
    title: 'DemoDay Privacy Policy',
    intro: 'At DemoDay, we believe your data should belong solely to you. This Privacy Policy details how we handle information in our local-first browser recording studio.',
    icon: ShieldCheck,
    sections: [
      { title: 'Our Local-First Promise', copy: 'DemoDay is built on a local-first architecture. All video capture, background compositing, and export rendering run completely inside your browser. No video frames, audio inputs, or screen content are ever uploaded to our servers.' },
      { title: 'Browser Permissions', copy: 'To perform recording services, DemoDay requests screen sharing, camera, and microphone permissions. These permissions are requested natively by your browser, and you can revoke them at any time through your browser settings.' },
      { title: 'Hosting & Server Logs', copy: 'Like standard web applications, our hosting provider (Vercel) automatically logs basic technical information (such as your IP address, browser type, and request timestamps) to verify server health and prevent network abuse.' },
      { title: 'Local Configuration Data', copy: 'We may use your browser\'s local storage (LocalStorage) to remember your workspace settings (such as camera shape, size, border radius, and active theme). This configuration stays local to your device.' },
      { title: 'Third-Party Analytics', copy: 'We may use privacy-respecting, aggregated analytics to count site visits and help us improve DemoDay features. This analytics data contains no personal identifiers or recording details.' },
      { title: 'Security of Recordings', copy: 'Because your recording files are processed and exported locally to your machine\'s downloads folder, you are solely responsible for securing your exported videos. We cannot recover lost recordings because we never have access to them.' },
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
          DemoDay records your screen, camera, and voice, then helps you choose the
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

      <section className="monza-preview-shell" aria-label="Interactive DemoDay preview">
        <div className="monza-preview-top">
          <div><DemoDayLogo /><b>DemoDay Studio</b></div>
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

      <section className="monza-logos" aria-label="DemoDay use cases">
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
          <p>Use DemoDay without a paid tool. Record, style, trim, and export from your browser.</p>
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

const Footer: React.FC = () => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail('');
      setTimeout(() => setSubscribed(false), 3000);
    }
  };

  return (
    <footer className="demoday-footer">
      <div className="footer-top-glow" />
      <div className="footer-grid">
        {/* Brand Column */}
        <div className="footer-column brand-col">
          <div className="footer-brand-info">
            <span className="footer-logo-wrapper"><DemoDayLogo /></span>
            <div>
              <span className="footer-brand-name">DemoDay</span>
              <span className="footer-brand-tagline">Browser recording studio</span>
            </div>
          </div>
          <p className="footer-description">
            Record your screen, camera, and audio, style with beautiful backgrounds, and export 4K walkthroughs directly from your browser.
          </p>
          <div className="footer-socials">
            <a href="https://github.com/SNDP-Design/DemoDay" target="_blank" rel="noopener noreferrer" title="GitHub">
              <svg className="social-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" /><path d="M9 18c-4.51 2-5-2-7-2" /></svg>
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" title="Twitter / X">
              <svg className="social-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" /></svg>
            </a>
          </div>
        </div>

        {/* Product Column */}
        <div className="footer-column">
          <h4>Product</h4>
          <nav aria-label="Product Links">
            <a href="#features">Features</a>
            <a href="#how-it-works">Workflow</a>
            <a href="#use-cases">Use Cases</a>
            <a href="#ready">Get Started</a>
          </nav>
        </div>

        {/* Resources Column */}
        <div className="footer-column">
          <h4>Resources</h4>
          <nav aria-label="Resource Links">
            <a href="https://github.com/SNDP-Design/DemoDay" target="_blank" rel="noopener noreferrer">GitHub Repo</a>
            <a href="https://itsdemoday.vercel.app/" target="_blank" rel="noopener noreferrer">Live Site</a>
            <a href="/terms">Terms of Service</a>
            <a href="/privacy">Privacy Policy</a>
          </nav>
        </div>

        {/* Newsletter Column */}
        <div className="footer-column newsletter-col">
          <h4>Stay Updated</h4>
          <p className="newsletter-text">Subscribe to get notified about new styling presets and export features.</p>
          <form onSubmit={handleSubscribe} className="newsletter-form">
            <input 
              type="email" 
              placeholder="Enter your email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="newsletter-input"
              required
            />
            <button type="submit" className="newsletter-submit" disabled={subscribed}>
              {subscribed ? 'Subscribed!' : 'Subscribe'}
            </button>
          </form>
        </div>
      </div>

      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} DemoDay. All rights reserved.</span>
        <span className="footer-attribution">Built for modern creators.</span>
      </div>
    </footer>
  );
};
