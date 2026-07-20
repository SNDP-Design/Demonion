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
import { DemonionLogo } from './DemonionLogo';

interface LandingPageProps {
  onOpenStudio: () => void;
  onOpenAIDemo?: () => void;
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
  ['16:9', 'Standard widescreen output'],
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
  summary: string[];
  sections: Array<{ title: string; copy: string }>;
}> = {
  terms: {
    eyebrow: 'Legal · terms',
    title: 'Terms of Service',
    intro: 'The terms that govern your use of Demonion.',
    icon: FileText,
    summary: [
      'By using Demonion, you agree to these terms.',
      'All recording and video processing happens 100% locally in your browser.',
      'You own your videos and you are responsible for the content you record.',
      'We provide the Service "as is" without warranties of any kind.',
      'We can update or modify the Service at any time.'
    ],
    sections: [
      { title: '1. Acceptance', copy: '<p>These Terms of Service ("Terms") form a binding agreement between you ("you", "your") and <strong>SNDP-Design</strong> ("we", "us", "our"), the operator of <a href="https://www.demonion.uno">https://www.demonion.uno</a> (the "Service"). By accessing or using the Service, you agree to these Terms and to our <a href="/privacy">Privacy Policy</a>. If you do not agree, do not use the Service.</p>' },
      { title: '2. Eligibility', copy: '<p>You must be at least 13 years old to use the Service. If you are under 18, you represent that you have your parent or guardian\'s permission to use the Service. By using Demonion, you represent that you meet these requirements.</p>' },
      { title: '3. Local Processing & Ownership', copy: '<p>All video compositing, camera rendering, audio mixing, and export processing occur locally in your browser. We do not store or claim ownership of any videos, audio, or metadata you record. You retain full copyright and ownership of all content you create using the Service.</p>' },
      { title: '4. Acceptable use', copy: '<p>You agree not to:</p><ul><li>Use the Service for any illegal purpose or in violation of any laws.</li><li>Record or distribute content that is defamatory, harassing, or infringes the intellectual property rights of any third party.</li><li>Record private information of individuals without their explicit consent.</li><li>Reverse engineer, decompile, or attempt to extract the source code of the recorder or compositing player.</li><li>Use automated bots or scripts to access the Service in a way that disrupts the platform.</li></ul>' },
      { title: '5. Disclaimers', copy: '<p>The Service is provided "as is" and "as available" without warranties of any kind, express or implied, including but not limited to merchantability, fitness for a particular purpose, or non-infringement. We do not warrant that:</p><ul><li>The Service will be uninterrupted, error-free, or fully compatible with every browser version or hardware configuration.</li><li>Use of the Service will result in specific marketing outcomes or video quality standards.</li><li>Any errors or rendering bugs will be corrected instantly.</li></ul>' },
      { title: '6. Limitation of liability', copy: '<p>To the maximum extent permitted by law, in no event will we be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits, revenue, data, or goodwill, arising out of or related to your use of the Service, even if we have been advised of the possibility of such damages.</p><p>Our total cumulative liability to you for all claims will not exceed USD $50.</p>' },
      { title: '7. Termination', copy: '<p>We may modify, suspend, or discontinue the Service (in whole or in part) at any time. We also reserve the right to block access to the Service for users who violate these Terms.</p>' },
      { title: '8. Contact', copy: '<p>Questions about these Terms?</p><ul><li>Email: <a href="mailto:hello@demonion.uno">hello@demonion.uno</a></li><li>Site: <a href="https://www.demonion.uno">https://www.demonion.uno</a></li></ul>' }
    ],
  },
  privacy: {
    eyebrow: 'Legal · privacy',
    title: 'Privacy Policy',
    intro: 'How Demonion collects, uses, and protects your information.',
    icon: ShieldCheck,
    summary: [
      'Demonion is a local-first application. Video recording, compositing, and rendering are performed 100% locally in your browser.',
      'No screen capture frames, camera recordings, or microphone feeds are ever uploaded to our servers.',
      'Any preference configurations are stored in your browser\'s local storage.',
      'We do not sell your data, use trackers, or display third-party advertisements.'
    ],
    sections: [
      { title: '1. Who we are', copy: '<p>Demonion (the "Service") is operated by <strong>SNDP-Design</strong> ("we", "us", or "our"). This Privacy Policy describes how we handle information when you use the Service at <a href="https://www.demonion.uno">https://www.demonion.uno</a>.</p>' },
      { title: '2. Information we collect', copy: '<h3>2.1 Device Permission Scopes</h3><p>To record video walkthroughs, Demonion requires permission to access your screen (or specific windows), camera inputs, and microphone feeds. These permissions are managed entirely by your browser. Demonion does not record any data until you explicitly grant access.</p><h3>2.2 Local Recording Files</h3><p>Your audio and video recordings are processed inside your browser\'s local sandbox environment using the MediaStream and MediaRecorder APIs. The completed video files are exported directly to your local computer\'s downloads folder. We never have access to, nor do we store, your video or audio files on our servers.</p><h3>2.3 Automatically Logged Information</h3><p>The Service is hosted on Vercel. Vercel may log standard server access information (IP address, browser type, request timestamp) for security and performance optimization. We do not have access to or store these logs ourselves. See the <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener">Vercel Privacy Policy</a> for details.</p>' },
      { title: '3. How we use information', copy: '<p>Since all media content is kept on your local machine, we only use standard web traffic data to:</p><ul><li>Ensure the technical operation of the recording studio.</li><li>Save user configuration data (such as layout presets, camera border designs, and themes) locally in your browser\'s <code>localStorage</code>.</li><li>Respond to support requests sent to our contact email.</li></ul><p>We do not use your information for advertising, profiling, or training machine-learning models.</p>' },
      { title: '4. How we share information', copy: '<p>We do not sell or rent your personal information. We share information only in these limited cases:</p><ul><li><strong>Vercel</strong>: Hosts the application files. Their privacy practices are linked above.</li><li><strong>Legal requirements</strong>: We may disclose information if required by law, subpoena, or court order, or to protect the rights and safety of our users or the public.</li></ul>' },
      { title: '5. Data retention & account deletion', copy: '<p>Because Demonion operates locally, your recordings only exist on your own device. If you delete a recording locally, it is gone forever. We do not keep backups of your recordings on our servers because we never receive them in the first place.</p><p>Any UI preference configurations stored in your browser\'s local storage remain until you clear your browser data or cache.</p>' },
      { title: '6. Your choices and rights', copy: '<p>You have full control over your data:</p><ul><li><strong>Revoke permissions</strong>: You can revoke screen, camera, and microphone permissions at any time through your browser settings.</li><li><strong>Delete local data</strong>: You can clear your browser storage (LocalStorage) to reset all UI layout preferences.</li><li><strong>GDPR / CCPA rights</strong>: If you reside in the EU, UK, or California, you have the right to request access, correction, or deletion of any technical metadata we may have. Contact us at the email below to exercise these rights.</li></ul>' },
      { title: '7. Security', copy: '<p>We encrypt all data in transit using HTTPS (provided by Vercel via Let\'s Encrypt). While local browser storage is protected by standard browser sandboxing, you are responsible for securing the exported video files on your local drive.</p>' },
      { title: '8. Contact', copy: '<p>Questions about this policy or your data rights?</p><ul><li>Email: <a href="mailto:hello@demonion.uno">hello@demonion.uno</a></li><li>Site: <a href="https://www.demonion.uno">https://www.demonion.uno</a></li></ul>' }
    ],
  },
};

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenStudio, onOpenAIDemo }) => {
  const [activeMode, setActiveMode] = useState(0);
  const [activeBgPreset, setActiveBgPreset] = useState('nebula');
  const [activeCamShape, setActiveCamShape] = useState<'circle' | 'rounded'>('rounded');
  const [activeCamPos, setActiveCamPos] = useState<'bottom-right' | 'top-right' | 'side-right'>('bottom-right');

  const active = previewModes[activeMode];
  const ActiveIcon = active.icon;
  const path = window.location.pathname;
  const legalPageKey = path === '/terms' ? 'terms' : path === '/privacy' ? 'privacy' : null;

  const handlePointerMove = (e: React.MouseEvent<HTMLElement> | React.TouchEvent<HTMLElement>) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    card.style.setProperty('--mouse-x', `${x}px`);
    card.style.setProperty('--mouse-y', `${y}px`);
    card.setAttribute('data-active', 'true');
  };

  if (legalPageKey) {
    return (
      <main className="monza-landing" id="home">
        <LegalPage pageKey={legalPageKey} />
        <Footer />
      </main>
    );
  }

  const bgGradientMap: Record<string, string> = {
    sunset: 'linear-gradient(135deg, #f97316 0%, #ec4899 50%, #8b5cf6 100%)',
    cyberpunk: 'linear-gradient(135deg, #a855f7 0%, #06b6d4 100%)',
    aurora: 'linear-gradient(135deg, #10b981 0%, #06b6d4 50%, #3b82f6 100%)',
    nebula: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 40%, #db2777 100%)',
  };

  return (
    <main className="monza-landing" id="home">
      {/* Framer Dotted Grid Backdrop */}
      <div className="framer-grid-overlay" />

      {/* Framer Aurora Glowing Circles */}
      <div className="framer-glow-bg">
        <div className="framer-glow-circle framer-glow-1" />
        <div className="framer-glow-circle framer-glow-2" />
        <div className="framer-glow-circle framer-glow-3" />
      </div>

      <section className="monza-hero">
        <div className="monza-badge"><Sparkles size={14} /> Screen recording studio for clear demos</div>
        <h1>
          <span>Turn screen recordings into</span>
          <span>polished product demos</span>
        </h1>
        <p>
          Demonion records your screen, camera, and voice, then helps you choose the
          right layout for tutorials, demos, updates, and support videos.
        </p>
        <div className="monza-actions">
          {onOpenAIDemo && (
            <button onClick={onOpenAIDemo} className="framer-primary ai-hero-cta">
              <Sparkles size={17} /> Create Demo (AI)
            </button>
          )}
          <button onClick={onOpenStudio} className="monza-secondary">
            Screen Recorder <ArrowRight size={15} />
          </button>
        </div>
        <div className="monza-proof">
          <span><Check size={13} /> No install</span>
          <span><Check size={13} /> 16:9 output</span>
          <span><Check size={13} /> Screen + camera</span>
        </div>
      </section>

      {/* Interactive Framer Studio Preview Shell */}
      <section 
        className="monza-preview-shell" 
        aria-label="Interactive Demonion preview"
        onMouseMove={handlePointerMove}
        onTouchStart={handlePointerMove}
        onTouchMove={handlePointerMove}
      >
        <div className="monza-preview-top">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><DemonionLogo size={22} /><b>Demonion Studio Interactive Demo</b></div>
          <div className="monza-interactive-badge">
            <span className="live-pulse-dot" /> Try changing controls below
          </div>
        </div>
        <div className="monza-preview-grid">
          <div 
            className={`monza-stage ${active.className}`}
            style={activeMode === 1 ? { background: bgGradientMap[activeBgPreset] } : undefined}
          >
            <div className="monza-screen">
              <div className="monza-browser"><i /><i /><i /><span>demo-recording.mp4</span></div>
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
            
            {/* Interactive Camera Bubble */}
            {activeMode !== 0 && (
              <div 
                className={`monza-camera ${activeCamShape} pos-${activeCamPos}`}
              >
                CAM
              </div>
            )}

            <div className="monza-timeline"><i /><i /><i /><i /><b /></div>
          </div>

          <div className="monza-mode-list">
            <div className="monza-control-group-title">Layout Mode</div>
            {previewModes.map((mode, index) => (
              <button key={mode.label} onClick={() => setActiveMode(index)} className={activeMode === index ? 'active' : ''}>
                <mode.icon size={17} />
                <span>{mode.label}</span>
              </button>
            ))}

            {activeMode === 1 && (
              <>
                <div className="monza-control-group-title" style={{ marginTop: '16px' }}>Canvas Preset</div>
                <div className="monza-preset-chips">
                  {Object.keys(bgGradientMap).map((presetKey) => (
                    <button
                      key={presetKey}
                      onClick={() => setActiveBgPreset(presetKey)}
                      className={`preset-chip ${activeBgPreset === presetKey ? 'active' : ''}`}
                      style={{ background: bgGradientMap[presetKey] }}
                      title={presetKey}
                    />
                  ))}
                </div>
              </>
            )}

            <div className="monza-control-group-title" style={{ marginTop: '16px' }}>Camera Style & Position</div>
            <div className="monza-cam-style-row">
              <button
                onClick={() => setActiveCamShape('circle')}
                className={`cam-style-btn ${activeCamShape === 'circle' ? 'active' : ''}`}
              >
                Circle
              </button>
              <button
                onClick={() => setActiveCamShape('rounded')}
                className={`cam-style-btn ${activeCamShape === 'rounded' ? 'active' : ''}`}
              >
                Rounded
              </button>
            </div>
            <div className="monza-cam-style-row" style={{ marginTop: '8px' }}>
              <button
                onClick={() => setActiveCamPos('bottom-right')}
                className={`cam-style-btn ${activeCamPos === 'bottom-right' ? 'active' : ''}`}
              >
                Bottom Right
              </button>
              <button
                onClick={() => setActiveCamPos('top-right')}
                className={`cam-style-btn ${activeCamPos === 'top-right' ? 'active' : ''}`}
              >
                Top Right
              </button>
              <button
                onClick={() => setActiveCamPos('side-right')}
                className={`cam-style-btn ${activeCamPos === 'side-right' ? 'active' : ''}`}
              >
                Side 5:4
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Infinite Framer Ticker Marquee Band */}
      <section className="framer-marquee-ribbon" aria-label="Feature highlights">
        <div className="framer-marquee-track">
          {[
            '⚡ 4K Ultra HD Export',
            '🎥 Screen & Camera Overlay',
            '🎨 Framed & Styled Backgrounds',
            '✂️ Precise Video Trimming',
            '🔒 100% Local & Private Processing',
            '🚀 Zero Installation Needed',
            '⚡ 4K Ultra HD Export',
            '🎥 Screen & Camera Overlay',
            '🎨 Framed & Styled Backgrounds',
            '✂️ Precise Video Trimming',
            '🔒 100% Local & Private Processing',
            '🚀 Zero Installation Needed',
          ].map((item, i) => (
            <div key={i} className="framer-marquee-badge">
              {item}
            </div>
          ))}
        </div>
      </section>

      <section className="monza-logos" aria-label="Demonion use cases">
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
            <article 
              key={feature.title}
              onMouseMove={handlePointerMove}
              onTouchStart={handlePointerMove}
              onTouchMove={handlePointerMove}
            >
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
          <p>Use Demonion without a paid tool. Record, style, trim, and export from your browser.</p>
        </div>
        <ul>
          <li><Check size={15} /> Screen recording</li>
          <li><Check size={15} /> Camera overlay</li>
          <li><Check size={15} /> 16:9 canvas</li>
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
      <div className="legal-container">
        <a href="/" className="legal-back">Back to home</a>
        <div className="legal-hero">
          <div className="legal-icon"><PageIcon size={24} /></div>
          <span className="framer-kicker">{page.eyebrow}</span>
          <h1>{page.title}</h1>
          <p>{page.intro}</p>
          <small>Effective date: July 6, 2026 · Last updated: July 6, 2026</small>
        </div>

        <div className="legal-article">
          <div className="legal-summary-card">
            <span className="card-label">Quick summary</span>
            <ul>
              {page.summary.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>

          {page.sections.map((section) => (
            <div key={section.title} className="legal-section">
              <h2>{section.title}</h2>
              <div dangerouslySetInnerHTML={{ __html: section.copy }} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const Footer: React.FC = () => (
  <footer className="demonion-footer">
    <div className="footer-top-glow" />
    <div className="footer-grid">
      {/* Brand Column */}
      <div className="footer-column brand-col">
        <a href="/" className="footer-brand-info">
          <span className="footer-logo-wrapper"><DemonionLogo size={28} /></span>
          <div>
            <span className="footer-brand-name">Demonion</span>
            <span className="footer-brand-tagline">Browser recording studio</span>
          </div>
        </a>
        <p className="footer-description">
          Record your screen, camera, and audio, style with beautiful backgrounds, and export 4K walkthroughs directly from your browser.
        </p>
        <div className="footer-socials">
          <a href="https://github.com/SNDP-Design/Demonion" target="_blank" rel="noopener noreferrer" title="GitHub">
            <svg className="social-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" /><path d="M9 18c-4.51 2-5-2-7-2" /></svg>
          </a>
          <a href="https://x.com/sndpdesign" target="_blank" rel="noopener noreferrer" title="Twitter / X">
            <svg className="social-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" /></svg>
          </a>
        </div>
      </div>

      {/* Product Column */}
      <div className="footer-column">
        <h4>Product</h4>
        <nav aria-label="Product Links">
          <a href="/#features">Features</a>
          <a href="/#how-it-works">Workflow</a>
          <a href="/#use-cases">Use Cases</a>
          <a href="/#ready">Get Started</a>
        </nav>
      </div>

      {/* Resources Column */}
      <div className="footer-column">
        <h4>Resources</h4>
        <nav aria-label="Resource Links">
          <a href="https://github.com/SNDP-Design/Demonion" target="_blank" rel="noopener noreferrer">GitHub Repo</a>
          <a href="https://www.demonion.uno/" target="_blank" rel="noopener noreferrer">Live Site</a>
          <a href="/terms">Terms of Service</a>
          <a href="/privacy">Privacy Policy</a>
        </nav>
      </div>
    </div>

    <div className="footer-bottom">
      <span>© {new Date().getFullYear()} Demonion. All rights reserved.</span>
      <span className="footer-attribution">Built for modern creators.</span>
    </div>
  </footer>
);
