import { useState } from 'react';
import { ArrowRight, Check, Film, Layers3, MonitorUp, MousePointer2, Scissors, Sparkles, Upload, Video, WandSparkles } from 'lucide-react';

interface LandingPageProps {
  onOpenStudio: () => void;
}

const previewModes = [
  { label: 'Record', title: 'Capture the moment.', copy: 'Record your tab, window, or screen in one click.', icon: Video },
  { label: 'Style', title: 'Make it feel finished.', copy: 'Frame your screen, camera, and brand in one calm canvas.', icon: WandSparkles },
  { label: 'Trim', title: 'Keep only the good part.', copy: 'Cut the rough edges before your video leaves the browser.', icon: Scissors },
];

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenStudio }) => {
  const [activeMode, setActiveMode] = useState(0);
  const active = previewModes[activeMode];
  const ActiveIcon = active.icon;

  return (
    <main className="framer-landing" id="home">
      <section className="framer-hero">
        <div className="framer-orb framer-orb-one" />
        <div className="framer-orb framer-orb-two" />
        <div className="framer-eyebrow"><span /><b>Browser-native screen recording</b><em>No installs. No account wall.</em></div>
        <h2>Make your next<br /><span>demo impossible to ignore.</span></h2>
        <p>Record your screen, camera, and voice. Shape it into a polished walkthrough—right where you work.</p>
        <div className="framer-hero-actions">
          <button onClick={onOpenStudio} className="framer-primary">Start recording free <ArrowRight size={17} /></button>
          <a className="framer-text-link" href="#how-it-works">See how it works <span>↓</span></a>
        </div>
        <div className="framer-proof"><span><Check size={13} /> 4K ready</span><span><Check size={13} /> 60 FPS capture</span><span><Check size={13} /> In your browser</span></div>

        <div className="framer-product-shell" aria-label="Interactive Screentor preview">
          <div className="framer-product-top"><div className="framer-dots"><i /><i /><i /></div><span>Screentor Studio</span><small>● Ready to record</small></div>
          <div className="framer-product-body">
            <aside className="framer-product-nav">{previewModes.map((mode, index) => <button key={mode.label} onClick={() => setActiveMode(index)} className={activeMode === index ? 'active' : ''}><mode.icon size={15} /> {mode.label}</button>)}</aside>
            <div className="framer-product-stage">
              <div className="framer-stage-note"><ActiveIcon size={14} /> {active.label} mode</div>
              <div className="framer-window">
                <div className="framer-window-bar"><i /><i /><i /><span>your-product.com</span></div>
                <div className="framer-window-content"><div className="framer-window-copy"><b>{active.title}</b><p>{active.copy}</p><button>Try the new flow <ArrowRight size={13} /></button></div><div className="framer-spotlight" /></div>
                <div className="framer-camera"><span>Live</span></div>
              </div>
              <div className="framer-timeline"><i /><i /><i /><i /><i /><b /></div>
            </div>
          </div>
        </div>
      </section>

      <div className="framer-marquee"><div><span>Screen + camera</span><i>✦</i><span>Clear demos</span><i>✦</i><span>Fast edits</span><i>✦</i><span>4K exports</span><i>✦</i><span>Screen + camera</span><i>✦</i><span>Clear demos</span><i>✦</i></div></div>

      <section className="framer-intro" id="features"><span className="framer-kicker">Everything you need. Nothing to learn.</span><h3>From first click to<br /><em>ready-to-share.</em></h3><p>Screentor turns the usual pile of recording tools into one focused flow.</p></section>

      <section className="framer-bento">
        <article className="framer-card framer-card-large"><div className="framer-card-icon"><MonitorUp size={20} /></div><span>01 — Capture</span><h4>Choose exactly what you want people to see.</h4><p>Record a browser tab, an app window, or your full screen, with microphone and camera when you need them.</p><div className="framer-capture-graphic"><div><Video size={16} /> Screen</div><div><Sparkles size={16} /> Camera</div><div><MousePointer2 size={16} /> Voice</div></div></article>
        <article className="framer-card framer-card-dark"><div className="framer-card-icon"><Layers3 size={20} /></div><span>02 — Style</span><h4>Your recording, on-brand by default.</h4><p>Choose a background, a browser frame, camera placement, and the right crop in seconds.</p><div className="framer-gradient-samples"><i /><i /><i /><i /></div></article>
        <article className="framer-card framer-card-wide"><div className="framer-card-icon"><Scissors size={20} /></div><span>03 — Edit</span><h4>Trim the wait. Keep the story.</h4><p>Use a simple visual timeline to cut the beginning and ending before your video is exported.</p><div className="framer-mini-timeline"><b /><i /><i /><i /><i /><i /><em /></div></article>
        <article className="framer-card framer-card-export"><div className="framer-card-icon"><Upload size={20} /></div><span>04 — Share</span><h4>Export 4K 60 FPS video.</h4><p>Your polished video downloads directly to your browser—no extra service in the middle.</p><div className="framer-export-chip"><Film size={15} /> 4K · 60 FPS <Check size={14} /></div></article>
      </section>

      <section className="framer-workflow" id="how-it-works"><div className="framer-workflow-heading"><span className="framer-kicker">One clear workflow</span><h3>More showing.<br /><em>Less explaining.</em></h3><button onClick={onOpenStudio} className="framer-secondary">Open Screentor <ArrowRight size={15} /></button></div><ol><li><b>01</b><div><h4>Press record</h4><p>Pick your screen, window, or tab from the browser sharing menu.</p></div><span>01</span></li><li><b>02</b><div><h4>Walk them through it</h4><p>Your camera, microphone, and screen work together in one recording.</p></div><span>02</span></li><li><b>03</b><div><h4>Shape and send</h4><p>Trim the rough edges, choose your frame, and export when it feels right.</p></div><span>03</span></li></ol></section>

      <section className="framer-usecases"><div className="framer-usecase-heading"><span className="framer-kicker">Built for the work that needs context</span><h3>Give your ideas<br />a better way in.</h3></div><div className="framer-usecase-list"><article><b>Product demos</b><span>Turn a new feature into a story people can follow.</span></article><article><b>Client updates</b><span>Walk through decisions without another meeting.</span></article><article><b>Support answers</b><span>Show the fix once, then send it whenever it is needed.</span></article><article><b>Team handovers</b><span>Leave the next person more context than a comment ever could.</span></article></div></section>

      <section className="framer-final"><div className="framer-final-grid" /><span className="framer-kicker">Ready when you are</span><h3>Make something<br /><em>worth watching.</em></h3><p>Your next clear walkthrough is one browser tab away.</p><button onClick={onOpenStudio} className="framer-primary">Start recording free <ArrowRight size={17} /></button></section>

      <footer className="framer-footer"><div><span className="framer-footer-logo"><Sparkles size={15} /></span><b>Screentor</b></div><p>Screen recording for ideas worth sharing.</p><span>© 2026 Screentor</span></footer>
    </main>
  );
};
