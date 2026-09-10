import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';

const AccessibilityContext = createContext(null);

const FONT_STEPS = ['a11y-font-0', 'a11y-font-1', 'a11y-font-2', 'a11y-font-3'];
const STORAGE_KEY = 'istidamah_a11y';

/**
 * Accessibility state for the whole app.
 *
 * Beyond the usual contrast / font-size / link-highlight toggles, this provides
 * a screen-reading layer built on the browser's Web Speech API:
 *
 *   speak(text)   read an arbitrary string aloud
 *   readPage()    read the current page's <main> content
 *   hoverRead     while on, pointing at or focusing any text element reads it,
 *                 which helps users who cannot operate a full screen reader
 *
 * Nothing is sent to a server and no API key is needed. The utterance language
 * follows <html lang>, so Arabic content is read with an Arabic voice whenever
 * the operating system provides one.
 *
 * All preferences persist to localStorage so a returning user keeps their setup.
 */
export function AccessibilityProvider({ children }) {
  const [highContrast, setHighContrast] = useState(false);
  const [highlightLinks, setHighlightLinks] = useState(false);
  const [bigCursor, setBigCursor] = useState(false);
  const [readableFont, setReadableFont] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [fontStep, setFontStep] = useState(0);

  const [speechEnabled, setSpeechEnabled] = useState(false);
  const [hoverRead, setHoverRead] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [rate, setRate] = useState(1);
  const lastSpokenRef = useRef('');

  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  // Restore saved preferences once on mount.
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      if (saved.highContrast) setHighContrast(true);
      if (saved.highlightLinks) setHighlightLinks(true);
      if (saved.bigCursor) setBigCursor(true);
      if (saved.readableFont) setReadableFont(true);
      if (saved.reduceMotion) setReduceMotion(true);
      if (saved.speechEnabled) setSpeechEnabled(true);
      if (saved.hoverRead) setHoverRead(true);
      if (typeof saved.fontStep === 'number') setFontStep(saved.fontStep);
      if (typeof saved.rate === 'number') setRate(saved.rate);
    } catch {
      /* ignore malformed storage */
    }
  }, []);

  // Persist and mirror state onto <html> so CSS can react to it.
  useEffect(() => {
    const state = {
      highContrast, highlightLinks, bigCursor, readableFont,
      reduceMotion, speechEnabled, hoverRead, fontStep, rate
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));

    const root = document.documentElement;
    root.classList.toggle('a11y-high-contrast', highContrast);
    root.classList.toggle('a11y-highlight-links', highlightLinks);
    root.classList.toggle('a11y-big-cursor', bigCursor);
    root.classList.toggle('a11y-readable-font', readableFont);
    root.classList.toggle('a11y-reduce-motion', reduceMotion);
    root.classList.toggle('a11y-read-aloud', speechEnabled);
    FONT_STEPS.forEach((cls) => root.classList.remove(cls));
    root.classList.add(FONT_STEPS[fontStep]);
  }, [highContrast, highlightLinks, bigCursor, readableFont, reduceMotion, speechEnabled, hoverRead, fontStep, rate]);

  const cancelSpeech = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }, [supported]);

  const speak = useCallback(
    (text, langOverride) => {
      if (!supported || !text) return;
      // Cap the utterance so a stray page-read doesn't run for minutes.
      const clean = String(text).replace(/\s+/g, ' ').trim().slice(0, 4000);
      if (!clean) return;

      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(clean);
      utter.lang = langOverride || (document.documentElement.lang === 'ar' ? 'ar-SA' : 'en-US');
      utter.rate = rate;

      // Prefer an installed voice matching the document language.
      const voices = window.speechSynthesis.getVoices();
      const match = voices.find((v) => v.lang && v.lang.toLowerCase().startsWith(utter.lang.slice(0, 2)));
      if (match) utter.voice = match;

      utter.onstart = () => setSpeaking(true);
      utter.onend = () => setSpeaking(false);
      utter.onerror = () => setSpeaking(false);

      setSpeaking(true);
      window.speechSynthesis.speak(utter);
    },
    [supported, rate]
  );

  const readPage = useCallback(() => {
    const main = document.querySelector('main');
    if (!main) return;
    speak(main.innerText);
  }, [speak]);

  // Hover/focus-to-read, attached only while the mode is on.
  useEffect(() => {
    if (!hoverRead || !supported) return undefined;

    const READABLE = 'h1,h2,h3,h4,p,li,a,button,label,td,th,figcaption,summary,dt,dd,[data-read]';
    const handler = (e) => {
      const el = e.target.closest?.(READABLE);
      if (!el) return;
      const text = el.getAttribute('aria-label') || el.innerText?.trim();
      if (!text || text === lastSpokenRef.current) return;
      lastSpokenRef.current = text;
      speak(text);
    };

    document.addEventListener('mouseover', handler);
    document.addEventListener('focusin', handler);
    return () => {
      document.removeEventListener('mouseover', handler);
      document.removeEventListener('focusin', handler);
      lastSpokenRef.current = '';
      window.speechSynthesis.cancel();
    };
  }, [hoverRead, supported, speak]);

  // Stop talking if the tab is hidden — speech otherwise keeps going.
  useEffect(() => {
    const onHide = () => document.hidden && cancelSpeech();
    document.addEventListener('visibilitychange', onHide);
    return () => document.removeEventListener('visibilitychange', onHide);
  }, [cancelSpeech]);

  // Turning the feature off must also silence anything mid-sentence.
  useEffect(() => {
    if (!speechEnabled) {
      setHoverRead(false);
      cancelSpeech();
    }
  }, [speechEnabled, cancelSpeech]);

  const increaseFont = useCallback(() => setFontStep((s) => Math.min(s + 1, FONT_STEPS.length - 1)), []);
  const decreaseFont = useCallback(() => setFontStep((s) => Math.max(s - 1, 0)), []);

  const reset = useCallback(() => {
    setHighContrast(false);
    setHighlightLinks(false);
    setBigCursor(false);
    setReadableFont(false);
    setReduceMotion(false);
    setSpeechEnabled(false);
    setHoverRead(false);
    setFontStep(0);
    setRate(1);
    cancelSpeech();
  }, [cancelSpeech]);

  return (
    <AccessibilityContext.Provider
      value={{
        highContrast, setHighContrast,
        highlightLinks, setHighlightLinks,
        bigCursor, setBigCursor,
        readableFont, setReadableFont,
        reduceMotion, setReduceMotion,
        fontStep, increaseFont, decreaseFont,
        speechEnabled, setSpeechEnabled,
        hoverRead, setHoverRead,
        speaking, speak, readPage, cancelSpeech,
        rate, setRate,
        speechSupported: supported,
        reset
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
}

export const useAccessibility = () => useContext(AccessibilityContext);
