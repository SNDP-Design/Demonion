import type { AIDemoScript, AIDemoScene, SubtitleCue } from '../types';

export function parseProductUrl(inputUrl: string): { domain: string; productName: string; cleanUrl: string } {
  let raw = inputUrl.trim();
  if (!raw.startsWith('http://') && !raw.startsWith('https://')) {
    raw = 'https://' + raw;
  }

  try {
    const parsed = new URL(raw);
    const host = parsed.hostname.replace(/^www\./, '');
    const parts = host.split('.');
    let name = parts[0] || 'Product';
    name = name.charAt(0).toUpperCase() + name.slice(1);
    
    return {
      domain: host,
      productName: name,
      cleanUrl: parsed.origin
    };
  } catch {
    return {
      domain: 'product.com',
      productName: 'Product',
      cleanUrl: 'https://product.com'
    };
  }
}

export function generateAIDemoScript(rawUrl: string): AIDemoScript {
  const { domain, productName, cleanUrl } = parseProductUrl(rawUrl);

  const scenes: AIDemoScene[] = [
    {
      id: 'scene-1',
      type: 'hero',
      startTime: 0,
      duration: 24,
      title: `${productName} — Next Generation Product Platform`,
      subtitleText: `Welcome to ${productName}. The modern workspace engineered for fast teams.`,
      narrationScript: `Welcome to ${productName}. In this 2-minute product walkthrough, discover how ${productName} streamlines your daily workflow, boosts productivity, and brings your team together in one unified workspace.`,
      highlights: ['Instant Setup', 'Zero Maintenance', 'Real-time Sync'],
      gradientPresetId: 'nebula',
      visualMockup: {
        badgeText: '🚀 NEW RELEASE V2.0',
        headline: `Build faster with ${productName}`,
        subheadline: `The all-in-one software platform for modern teams worldwide.`,
        primaryBtnText: 'Start Free Trial',
        secondaryBtnText: 'Watch Product Video',
        metrics: [
          { label: 'Active Users', value: '100K+' },
          { label: 'Uptime SLA', value: '99.99%' },
          { label: 'Efficiency Gain', value: '4.8x' }
        ]
      }
    },
    {
      id: 'scene-2',
      type: 'feature_highlight',
      startTime: 24,
      duration: 26,
      title: 'Core Workspace & Feature Hub',
      subtitleText: `Explore the intelligent core engine designed to handle complex projects effortlessly.`,
      narrationScript: `Behind the intuitive interface lies an intelligent engine. Explore core features designed to handle complex projects with lightning speed and zero friction.`,
      highlights: ['Smart Automation', 'Custom Views', 'Keyboard Shortcuts'],
      gradientPresetId: 'cyberpunk',
      visualMockup: {
        badgeText: '⚡ CORE FEATURES',
        headline: 'Automate tasks & streamline operations',
        subheadline: 'Eliminate repetitive manual work with powerful automated workflows.',
        primaryBtnText: 'Explore Features',
        secondaryBtnText: 'Documentation',
        features: [
          { title: 'Smart Automation', desc: 'Trigger complex multi-step actions with one click.' },
          { title: 'Custom Dashboards', desc: 'Tailor your workspace views to fit your operational style.' },
          { title: 'Team Permissions', desc: 'Enterprise granular access control out of the box.' }
        ]
      }
    },
    {
      id: 'scene-3',
      type: 'workflow_demo',
      startTime: 50,
      duration: 26,
      title: 'Seamless Integrations & Workflow Sync',
      subtitleText: `Connect ${productName} directly into your existing ecosystem in seconds.`,
      narrationScript: `Integration is effortless. ${productName} seamlessly connects with your existing tech stack, syncing data in real-time so your team never misses a beat.`,
      highlights: ['1-Click Connect', 'API Access', 'Automated Triggers'],
      gradientPresetId: 'aurora',
      visualMockup: {
        badgeText: '🔗 INTEGRATION ECOSYSTEM',
        headline: 'Plugs into tools you already rely on',
        subheadline: 'Bi-directional sync ensures data is always accurate and available everywhere.',
        primaryBtnText: 'View Integrations',
        secondaryBtnText: 'API Specs',
        metrics: [
          { label: 'Integrations', value: '500+' },
          { label: 'Sync Latency', value: '<50ms' },
          { label: 'Security Grade', value: 'SOC2 Type II' }
        ]
      }
    },
    {
      id: 'scene-4',
      type: 'analytics_spotlight',
      startTime: 76,
      duration: 24,
      title: 'Real-Time Insights & Performance Analytics',
      subtitleText: `Gain actionable insight into your key operational metrics and performance data.`,
      narrationScript: `Gain total visibility over your operations. With real-time analytics and custom reporting, make data-driven decisions faster and with total confidence.`,
      highlights: ['Live Dashboards', 'Custom Reports', 'Predictive Trends'],
      gradientPresetId: 'sunset',
      visualMockup: {
        badgeText: '📊 REAL-TIME ANALYTICS',
        headline: 'Data-driven intelligence at your fingertips',
        subheadline: 'Track KPIs, revenue growth, and active performance trends in real-time.',
        primaryBtnText: 'Open Analytics',
        secondaryBtnText: 'Export Reports',
        metrics: [
          { label: 'Monthly Growth', value: '+34%' },
          { label: 'Cost Savings', value: '$42,000/yr' },
          { label: 'ROI Score', value: '340%' }
        ]
      }
    },
    {
      id: 'scene-5',
      type: 'cta_closing',
      startTime: 100,
      duration: 20,
      title: `Get Started with ${productName} Today`,
      subtitleText: `Transform your workflow today. Visit ${domain} to start your free demo.`,
      narrationScript: `Ready to upgrade your team's workflow? Visit ${domain} today to get started free. Experience the future of productive work with ${productName}.`,
      highlights: ['Free 14-Day Trial', 'No Credit Card Required', '24/7 Priority Support'],
      gradientPresetId: 'ocean',
      visualMockup: {
        badgeText: '✨ GET STARTED TODAY',
        headline: `Start building faster with ${productName}`,
        subheadline: `Join thousands of top-performing teams who rely on ${productName} every single day.`,
        primaryBtnText: `Visit ${domain}`,
        secondaryBtnText: 'Book Team Demo',
        metrics: [
          { label: 'Free Trial', value: '14 Days' },
          { label: 'Customer Rating', value: '4.9 / 5.0' },
          { label: 'Support SLA', value: '< 15 mins' }
        ]
      }
    }
  ];

  // Build timed English subtitle cues (120 seconds total)
  const subtitles: SubtitleCue[] = [];
  let cueIdCounter = 1;

  scenes.forEach((scene) => {
    // Split scene narration into short, timed subtitle sentences
    const sentences = scene.narrationScript.match(/[^.!?]+[.!?]+/g) || [scene.narrationScript];
    const timePerSentence = scene.duration / Math.max(1, sentences.length);

    sentences.forEach((sentence, sIdx) => {
      const startTime = scene.startTime + sIdx * timePerSentence;
      const endTime = startTime + timePerSentence - 0.2;
      subtitles.push({
        id: `cue-${cueIdCounter++}`,
        startTime: Number(startTime.toFixed(2)),
        endTime: Number(endTime.toFixed(2)),
        text: sentence.trim()
      });
    });
  });

  return {
    productName,
    productTagline: `Next-generation SaaS platform for modern teams`,
    url: cleanUrl,
    domain,
    scenes,
    totalDuration: 120, // 2 minutes exact
    subtitles
  };
}

import type { GeminiModelId } from '../types';

export const GEMINI_MODEL_FALLBACK_ORDER: GeminiModelId[] = [
  'gemini-3.5-flash',
  'gemini-3.1-pro-preview',
  'gemini-3-flash-preview',
  'gemini-3.1-flash-lite',
  'gemini-3.1-flash-lite-preview',
  'gemini-2.5-pro',
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.0-flash'
];

// Google Gemini API + Web Speech Synthesis Narrator Manager
export class AIVoiceoverNarrator {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private currentAudioElement: HTMLAudioElement | null = null;
  private audioCache: Map<string, string> = new Map(); // key -> blobUrl
  private isSpeaking = false;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
    }
  }

  public getCurrentUtterance() {
    return this.currentUtterance;
  }

  /**
   * Fetch audio binary from Google Gemini API using prebuilt voice (e.g. Kore)
   * Automatically falls back across Gemini models in specified order if quota or API error occurs
   */
  public async fetchGeminiAudio(
    text: string, 
    voiceName = 'Kore', 
    apiKey?: string, 
    preferredModel: GeminiModelId = 'gemini-3.5-flash'
  ): Promise<string | null> {
    const key = apiKey || import.meta.env.VITE_GEMINI_API_KEY;
    if (!key) return null;

    // Construct model priority list starting from preferredModel, then falling back in order
    const startIdx = GEMINI_MODEL_FALLBACK_ORDER.indexOf(preferredModel);
    const modelsToTry = startIdx >= 0 
      ? [...GEMINI_MODEL_FALLBACK_ORDER.slice(startIdx), ...GEMINI_MODEL_FALLBACK_ORDER.slice(0, startIdx)]
      : GEMINI_MODEL_FALLBACK_ORDER;

    for (const model of modelsToTry) {
      const cacheKey = `${model}:${voiceName}:${text}`;
      if (this.audioCache.has(cacheKey)) {
        return this.audioCache.get(cacheKey)!;
      }

      try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: `Narrate the following text clearly: ${text}` }]
              }
            ],
            generationConfig: {
              responseModalities: ['AUDIO'],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: {
                    voiceName: voiceName
                  }
                }
              }
            }
          })
        });

        if (!response.ok) {
          console.warn(`Gemini API model ${model} response status ${response.status}. Attempting fallback to next model in sequence...`);
          continue;
        }

        const data = await response.json();
        const inlineData = data.candidates?.[0]?.content?.parts?.[0]?.inlineData;

        if (inlineData && inlineData.data) {
          const mimeType = inlineData.mimeType || 'audio/wav';
          const byteCharacters = atob(inlineData.data);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: mimeType });
          const blobUrl = URL.createObjectURL(blob);

          this.audioCache.set(cacheKey, blobUrl);
          return blobUrl;
        }
      } catch (err) {
        console.warn(`Gemini API model ${model} fetch failed. Attempting next fallback model...`, err);
      }
    }

    console.warn('All Gemini API models in fallback sequence were exhausted.');
    return null;
  }

  /**
   * Speak scene narration using Google Gemini AI Voice (Kore) with Web Speech fallback
   */
  public async speakSceneScript(
    text: string, 
    pitch = 1.0, 
    rate = 1.0, 
    voiceName = 'Kore', 
    apiKey?: string,
    model: GeminiModelId = 'gemini-3.5-flash'
  ) {
    this.stop();

    const key = apiKey || import.meta.env.VITE_GEMINI_API_KEY;

    // Try Google Gemini API Audio synthesis if key is present
    if (key) {
      const audioUrl = await this.fetchGeminiAudio(text, voiceName, key, model);
      if (audioUrl) {
        try {
          const audio = new Audio(audioUrl);
          audio.playbackRate = rate;
          this.currentAudioElement = audio;
          this.isSpeaking = true;

          audio.onended = () => {
            this.isSpeaking = false;
            this.currentAudioElement = null;
          };
          audio.onerror = () => {
            this.isSpeaking = false;
            this.currentAudioElement = null;
            this.speakWebSpeechFallback(text, pitch, rate);
          };

          await audio.play();
          return;
        } catch (e) {
          console.warn('Gemini Audio playback failed, resorting to fallback:', e);
        }
      }
    }

    // Fallback to browser Web Speech API
    this.speakWebSpeechFallback(text, pitch, rate);
  }

  private speakWebSpeechFallback(text: string, pitch = 1.0, rate = 1.0) {
    if (!this.synth) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.pitch = pitch;
    utterance.rate = rate;
    utterance.lang = 'en-US';

    const voices = this.synth.getVoices();
    const preferredVoice = voices.find(
      (v) => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Karen') || v.name.includes('Zira'))
    ) || voices.find((v) => v.lang.startsWith('en'));

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    this.currentUtterance = utterance;
    this.isSpeaking = true;

    utterance.onend = () => {
      this.isSpeaking = false;
      this.currentUtterance = null;
    };

    utterance.onerror = (err) => {
      console.warn('Voiceover speech synthesis error:', err);
      this.isSpeaking = false;
      this.currentUtterance = null;
    };

    this.synth.speak(utterance);
  }

  public stop() {
    if (this.currentAudioElement) {
      this.currentAudioElement.pause();
      this.currentAudioElement.currentTime = 0;
      this.currentAudioElement = null;
    }
    if (this.synth) {
      this.synth.cancel();
    }
    this.isSpeaking = false;
    this.currentUtterance = null;
  }

  public pause() {
    if (this.currentAudioElement) {
      this.currentAudioElement.pause();
    }
    if (this.synth && this.isSpeaking) {
      this.synth.pause();
    }
  }

  public resume() {
    if (this.currentAudioElement) {
      void this.currentAudioElement.play();
    }
    if (this.synth) {
      this.synth.resume();
    }
  }
}

