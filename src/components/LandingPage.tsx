import { useEffect, useRef, useState } from 'react';
import { ArrowRight, ArrowUpRight, Camera, Check, Circle, Download, FileText, Layers3, Maximize2, Mic, MousePointer2, Pause, Play, Scissors, ShieldCheck, Sparkles, Upload, Video, WandSparkles } from 'lucide-react';
import { DemonionLogo } from './DemonionLogo';
import './landing.css';

interface LandingPageProps {
  onOpenStudio: () => void;
  onImportVideoFile?: (file: File) => void;
  heroOnly?: boolean;
}

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


const questions = [
  ['Do I need to install anything?', 'No. Open the studio in your browser to record your screen, camera, and voice. Screen capture support depends on your browser and device; a desktop browser works best.'],
  ['Is Demonion really free?', 'Yes. Record, style, trim, and export without a subscription or an account.'],
  ['Where do my recordings go?', 'Your recordings are processed locally in your browser. Export the finished video directly to your device.'],
  ['Can I edit a video I already have?', 'Yes. Choose Import video to open an existing video in the editor, then style, trim, and export it.'],
  ['Can I record without my camera?', 'Yes. Turn off Camera Overlay before recording. In the editor, Hide camera also removes voice audio from the export.'],
];
const palettes = [
  { name: 'Violet', color: 'linear-gradient(135deg, #3d228a, #9464ed 55%, #e4bfff)' },
  { name: 'Midnight', color: 'linear-gradient(135deg, #08051b, #322060 60%, #6e4bb0)' },
  { name: 'Rose', color: 'linear-gradient(135deg, #57309d, #ba69bd 60%, #f3cbec)' },
];

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenStudio, onImportVideoFile, heroOnly = false }) => {
  const rootRef = useRef<HTMLElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [palette, setPalette] = useState(0);
  const [layout, setLayout] = useState('Styled');
  const [playing, setPlaying] = useState(true);
  const [currentLegalPage, setCurrentLegalPage] = useState<LegalPageKey | null>(() => {
    const route = window.location.pathname.replace('/', '') || window.location.hash.replace('#', '');
    return route === 'terms' || route === 'privacy' ? route : null;
  });
  const navigateLegal = (page: LegalPageKey | null) => {
    setCurrentLegalPage(page);
    window.history.pushState(null, '', page ? `/${page}` : '/');
    document.querySelector('.landing-scroll-container')?.scrollTo({ top: 0 });
  };
  useEffect(() => {
    const syncRoute = () => {
      const route = window.location.pathname.replace('/', '') || window.location.hash.replace('#', '');
      setCurrentLegalPage(route === 'terms' || route === 'privacy' ? route : null);
    };
    window.addEventListener('popstate', syncRoute);
    return () => window.removeEventListener('popstate', syncRoute);
  }, []);
  useEffect(() => {
    const nodes = rootRef.current?.querySelectorAll('.dm-reveal');
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); }
    }), { threshold: 0.08 });
    nodes?.forEach(node => observer.observe(node));
    return () => observer.disconnect();
  }, [currentLegalPage]);
  if (currentLegalPage) return <main className="monza-landing dm-legal"><LegalPage pageKey={currentLegalPage} onBackToHome={() => navigateLegal(null)} /><Footer onNavigateLegal={navigateLegal} onBackToHome={() => navigateLegal(null)} /></main>;
  return (
    <main ref={rootRef} className={`dm-site ${playing ? '' : 'dm-paused'} ${heroOnly ? 'dm-desktop' : ''}`} id="home">
      <section className="dm-hero">
        <div className="dm-orbit dm-orbit-one" aria-hidden="true" /><div className="dm-orbit dm-orbit-two" aria-hidden="true" />
        <div className="dm-eyebrow"><span className="dm-status" /> YOUR SCREEN. A LITTLE MORE CINEMATIC.</div>
        <h1>Good ideas deserve<br /><span>a great demo.</span><Sparkles className="dm-title-spark" aria-hidden="true" /></h1>
        <p>Turn everyday screen recordings into something worth watching.<br className="dm-desktop-break" /> Record, add your style, and make your next big idea click.</p>
        <div className="dm-actions"><button className="dm-button" onClick={onOpenStudio}><Video size={18} /> Start creating — it’s free <ArrowUpRight size={19} /></button>{onImportVideoFile && <button className="dm-button dm-button-quiet" onClick={() => fileInputRef.current?.click()}><Upload size={17} /> Import video</button>}</div>
        <input hidden type="file" accept="video/*" ref={fileInputRef} onChange={event => { const file = event.target.files?.[0]; if (file) onImportVideoFile?.(file); event.target.value = ''; }} />
        <div className="dm-proof"><span><Check size={13} /> No sign-up</span><span><Check size={13} /> No watermarks</span><span><ShieldCheck size={13} /> Stays on your device</span></div>
      </section>

      <section className="dm-playground" aria-label="Interactive style preview" id="playground">
        <div className="dm-float dm-float-record"><span className="dm-status" /> A little polish. A big difference.</div>
        <div className="dm-preview-top"><span><DemonionLogo size={20} /> The demo before your demo</span><span className="dm-preview-label">INTERACTIVE PREVIEW <span className="dm-status" /></span></div>
        <div className={`dm-stage dm-layout-${layout.toLowerCase()}`} style={{ background: palettes[palette].color }}>
          <div className="dm-demo-window">
            <div className="dm-window-bar"><span>● ● ●</span><span>your-next-big-idea.app</span><Maximize2 size={12} /></div>
            <div className="dm-demo-content"><aside><div className="dm-demo-mark">a<span>✳</span></div><i /><i /><i /><i /><div className="dm-sidebar-bottom" /></aside>
              <div className="dm-dashboard"><div className="dm-dash-heading"><div><small>WORKSPACE / OVERVIEW</small><h3>Make room for big ideas.</h3></div><span className="dm-avatar">J</span></div><div className="dm-metric-row"><div><small>Total views</small><b>24,890 <em>↗ 18.6%</em></b></div><div><small>Engagement</small><b>86.4% <em>↗ 12.2%</em></b></div></div><div className="dm-chart"><div><span>Audience growth</span><small>This month ↗</small></div><svg viewBox="0 0 600 145" preserveAspectRatio="none" aria-label="Illustrative audience growth chart"><defs><linearGradient id="chart-fill" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#a583ff" stopOpacity=".4" /><stop offset="1" stopColor="#a583ff" stopOpacity="0" /></linearGradient></defs><path d="M0 125 C35 125 40 100 75 105 S125 65 165 80 S225 110 260 65 S315 80 355 45 S405 65 450 30 S520 50 600 5 L600 145 L0 145Z" fill="url(#chart-fill)" /><path className="dm-chart-line" d="M0 125 C35 125 40 100 75 105 S125 65 165 80 S225 110 260 65 S315 80 355 45 S405 65 450 30 S520 50 600 5" fill="none" stroke="#b99cff" strokeWidth="3" /></svg><div className="dm-chart-dates"><small>01 JUN</small><small>15 JUN</small><small>30 JUN</small></div></div></div>
            </div>
          </div>
          <div className="dm-facecam" aria-label="Illustrated camera overlay"><div className="dm-person"><div className="dm-person-hair" /><div className="dm-person-face" /><div className="dm-person-body" /></div><span><Mic size={10} /> Your story, your voice</span></div>
          <div className="dm-preview-cursor" aria-hidden="true"><MousePointer2 size={25} fill="#f0dfff" /><span>You, but polished</span></div>
        </div>
        <div className="dm-preview-controls"><div className="dm-layout-switch" aria-label="Preview layout">{['Styled', 'Minimal', 'Sidecam'].map(name => <button key={name} aria-pressed={layout === name} className={layout === name ? 'selected' : ''} onClick={() => setLayout(name)}>{name}</button>)}</div><div className="dm-swatches"><span>Make it yours</span>{palettes.map((item, i) => <button key={item.name} aria-label={`${item.name} background`} aria-pressed={palette === i} className={palette === i ? 'selected' : ''} style={{ background: item.color }} onClick={() => setPalette(i)} />)}</div><button className="dm-motion-button" aria-label={playing ? 'Pause animations' : 'Play animations'} onClick={() => setPlaying(!playing)}>{playing ? <Pause size={15} /> : <Play size={15} />}</button></div>
        <div className="dm-preview-caption"><span>Not a video. Go ahead, play with it.</span><ArrowUpRight size={15} /></div>
      </section>
      {!heroOnly && <>
      <div className="dm-audience"><span>BIG IDEAS COME FROM EVERYWHERE.</span><div><b>Independent makers</b><i>✳</i><b>Product teams</b><i>✳</i><b>Designers</b><i>✳</i><b>Educators</b></div></div>
      <section className="dm-section dm-reveal" id="features"><div className="dm-section-heading"><span className="dm-eyebrow">LESS FRICTION. MORE CREATION.</span><h2>Everything you need.<br /><span>Nothing in your way.</span></h2><p>From “let me show you” to “just sent it.”<br />One simple studio for the whole story.</p></div>
      <div className="dm-bento">
        <article className="dm-feature dm-feature-wide"><div className="dm-feature-copy"><span className="dm-icon"><Video size={20} /></span><h3>Capture the good stuff.</h3><p>Your screen, your face, your voice.<br />Bring the whole explanation together.</p></div><div className="dm-capture-art" aria-hidden="true"><div className="dm-capture-rings"><div /><div /><Video size={42} /></div><div className="dm-record-bar"><span className="dm-status" /> REC <b>00:24</b><div className="dm-wave">{Array.from({length: 17}, (_, i) => <i key={i} style={{ animationDelay: `${i * .12}s`, height: `${8 + (i * 7 % 19)}px` }} />)}</div><Mic size={15} /><Camera size={15} /></div><span className="dm-art-note">All together. Beautifully.</span></div></article>
        <article className="dm-feature"><div className="dm-style-art" aria-hidden="true"><div /><div /><div><WandSparkles size={32} /></div></div><span className="dm-icon"><Layers3 size={20} /></span><h3>A look that’s all you.</h3><p>Rich backgrounds, clean frames, and a camera layout that fits your story.</p></article>
        <article className="dm-feature"><div className="dm-timeline-art" aria-hidden="true"><div className="dm-time-labels"><span>00:00</span><span>00:15</span><span>00:30</span></div><div className="dm-filmstrip">{Array.from({length: 8}, (_, i) => <i key={i} />)}</div><div className="dm-audio-track" /><div className="dm-playhead" /><Scissors size={20} /></div><span className="dm-icon"><Scissors size={20} /></span><h3>Get to the best part.</h3><p>Trim the slow start. Cut the extra seconds. Keep the moments that matter.</p></article>
        <article className="dm-feature dm-feature-wide dm-export-feature"><div className="dm-feature-copy"><span className="dm-icon"><Download size={20} /></span><h3>Big-screen energy.<br />Ready to share.</h3><p>Export up to 4K. No watermark.<br />Just your work, looking its best.</p></div><div className="dm-export-art" aria-hidden="true"><div className="dm-export-disc">4K<small>MADE TO BE SEEN</small></div><div className="dm-export-pill"><Check size={14} /> Looking sharp.</div></div></article>
      </div></section>
      <section className="dm-workflow dm-section dm-reveal" id="how-it-works"><div className="dm-section-heading"><span className="dm-eyebrow">FROM FIRST TAKE TO FINAL FILE</span><h2>Three steps.<br /><span>That’s the whole production.</span></h2></div><div className="dm-steps">{[{icon: Circle, title:'Hit record.', copy:'Choose a screen, window, or tab. Add your camera and talk it through.'},{icon: Sparkles,title:'Find your look.',copy:'Pick a background, frame your camera, and trim things down.'},{icon: ArrowUpRight,title:'Send it out.',copy:'Export to your device. Share your demo wherever your audience is.'}].map((step,i)=><article key={step.title}><span className="dm-step-count">0{i+1}</span><div className="dm-step-icon"><step.icon size={25}/></div><h3>{step.title}</h3><p>{step.copy}</p></article>)}</div></section>
      <section className="dm-section dm-usecases dm-reveal" id="use-cases"><div><span className="dm-eyebrow">SHOW. DON’T JUST TELL.</span><h2>A better way<br />to get it across.</h2><p>Less explaining in paragraphs.<br />More “oh, I get it now.”</p><a href="#playground" className="dm-text-link">Find your style <ArrowRight size={17}/></a></div><div className="dm-usecase-list">{[['01','Launch the thing','Product walkthroughs that put your hard work in the spotlight.'],['02','Teach the shortcut','Step-by-step tutorials with you right there in the frame.'],['03','Skip the meeting','Clear client updates they can watch on their own time.'],['04','Show the solution','Support videos that make the next step obvious.']].map(([n,title,copy])=><article key={n}><span>{n}</span><div><h3>{title}</h3><p>{copy}</p></div><ArrowUpRight size={22}/></article>)}</div></section>
      <section className="dm-private dm-section dm-reveal"><div className="dm-privacy-orbit" aria-hidden="true"><div /><div /><ShieldCheck size={42}/></div><div><span className="dm-eyebrow">YOUR WORK STAYS YOURS</span><h2>On your device.<br /><span>Off everyone else’s server.</span></h2><p>Your recordings are processed right in your browser.<br />No uploads. No account. A little peace of mind, built in.</p></div></section>
      <section className="dm-section dm-faq dm-reveal"><div><span className="dm-eyebrow">GOOD QUESTIONS</span><h2>A few things<br />worth knowing.</h2></div><div>{questions.map(([q,a])=><details key={q}><summary>{q}<span>+</span></summary><p>{a}</p></details>)}</div></section>
      <section className="dm-final dm-reveal" id="ready"><div className="dm-final-halo" aria-hidden="true"/><span className="dm-eyebrow">FREE TO USE. READY WHEN YOU ARE.</span><h2>Your next great demo<br /><span>starts with a click.</span></h2><button className="dm-button" onClick={onOpenStudio}>Let’s make something <ArrowUpRight size={19}/></button><p>No subscription. Just hit record.</p></section>
      <Footer onNavigateLegal={navigateLegal} onBackToHome={() => { navigateLegal(null); document.querySelector('.landing-scroll-container')?.scrollTo({top: 0, behavior: 'smooth'}); }} />
      </>}
    </main>
  );
};

const LegalPage: React.FC<{ pageKey: LegalPageKey; onBackToHome: () => void }> = ({ pageKey, onBackToHome }) => {
  const page = legalPages[pageKey];
  const PageIcon = page.icon;

  return (
    <section className="legal-page">
      <div className="legal-container">
        <button onClick={onBackToHome} className="legal-back" style={{ background: 'none', border: 'none', cursor: 'pointer', font: 'inherit', color: 'inherit', padding: 0 }}>
          ← Back to home
        </button>
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

const Footer: React.FC<{ onNavigateLegal?: (key: LegalPageKey) => void; onBackToHome?: () => void }> = ({ onNavigateLegal, onBackToHome }) => (
  <footer className="demonion-footer">
    <div className="footer-top-glow" />
    <div className="footer-grid">
      {/* Brand Column */}
      <div className="footer-column brand-col">
        <button onClick={onBackToHome} className="footer-brand-info" style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left' }}>
          <span className="footer-logo-wrapper"><DemonionLogo size={28} /></span>
          <div>
            <span className="footer-brand-name">Demonion</span>
            <span className="footer-brand-tagline">Browser recording studio</span>
          </div>
        </button>
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
          <button onClick={() => onNavigateLegal?.('terms')} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', font: 'inherit', padding: 0, textAlign: 'left' }}>
            Terms of Service
          </button>
          <button onClick={() => onNavigateLegal?.('privacy')} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', font: 'inherit', padding: 0, textAlign: 'left' }}>
            Privacy Policy
          </button>
        </nav>
      </div>
    </div>

    <div className="footer-bottom">
      <span>© {new Date().getFullYear()} Demonion. All rights reserved.</span>
      <span className="footer-attribution">Built for modern creators.</span>
    </div>
  </footer>
);
