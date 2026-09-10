import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Sparkles, MessageCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { EASE } from '../motion/variants';

/**
 * "Istedama Assistant".
 *
 * At rest the widget is a slim tab tucked against the screen edge, showing
 * only an icon. Hovering (or focusing) slides it out to reveal its label;
 * clicking opens the full conversation card. This keeps the assistant
 * discoverable without a permanent floating bubble covering page content.
 *
 * Replies come from a small local knowledge base whose patterns match both
 * Arabic and English phrasing. Swap `answerQuery` for a real API call when
 * a model endpoint is available.
 */
const KNOWLEDGE_BASE = [
  { match: /icv|in.?country value|القيمة المحلية|قيمة محلية/i, key: 'chat.icv' },
  { match: /document|paperwork|require|مستند|وثائق|أوراق|مطلوب/i, key: 'chat.documents' },
  { match: /bank|financ|partner|loan|offer|discount|بنك|تمويل|شريك|قرض|عرض|خصم/i, key: 'chat.banks' },
  { match: /certificat|certified|verify|شهاد|اعتماد|تحقق/i, key: 'chat.certificate' },
  { match: /score|calculat|درج|احتساب|حساب|نتيجة/i, key: 'chat.score' },
  { match: /tender|bid|مناقص|عطاء/i, key: 'chat.tenders' },
  { match: /book|hall|facilit|room|حجز|قاعة|مرفق/i, key: 'chat.facilities' },
  { match: /advert|ad |إعلان|اعلان/i, key: 'chat.ads' }
];

export default function ChatbotWidget() {
  const { t, isRTL } = useLanguage();
  const [open, setOpen] = useState(false);
  const [peek, setPeek] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    setMessages([{ from: 'bot', text: t('chat.greeting') }]);
  }, [t]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, open, typing]);

  const answerQuery = (text) => {
    const hit = KNOWLEDGE_BASE.find((k) => k.match.test(text));
    return t(hit ? hit.key : 'chat.fallback');
  };

  const send = (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    setMessages((m) => [...m, { from: 'user', text }]);
    setInput('');
    setTyping(true);
    // Brief delay so the reply doesn't appear instantaneously, which reads
    // as a canned lookup rather than an answer.
    setTimeout(() => {
      setTyping(false);
      setMessages((m) => [...m, { from: 'bot', text: answerQuery(text) }]);
    }, 550);
  };

  // The tab sits on the edge the reading direction ends on, so in Arabic it is
  // the left. Everything with a handedness follows from that one fact.
  const Arrow = isRTL ? ChevronRight : ChevronLeft;
  const slideFrom = isRTL ? -40 : 40;

  return (
    <>
      {/*
        The resting state is a thin arrow tab against the edge the reading
        direction ends on — the left in Arabic, the right in English — a little
        above centre. It rounds only on the inward side, so it reads as attached
        to the edge rather than floating near it.

        Everything that has a side to it is derived from `isRTL` in one place
        below: which edge it sits on, which way the corners round, which way the
        arrow points, and which way it slides in from. Splitting those across
        logical and physical CSS is what put the corners off-screen before.
      */}
      <AnimatePresence>
        {!open && (
          /*
            Positioning lives on this wrapper, animation on the button inside.
            Both were on one element before, where the `-50%` that centres it
            vertically and the `x` that slides it in are the same CSS transform —
            so they overwrote each other and the tab stayed parked 40px off the
            edge, showing only a sliver.
          */
          <div
            className={`fixed top-[45%] z-50 -translate-y-1/2 ${isRTL ? 'left-0' : 'right-0'}`}
          >
          <motion.button
            type="button"
            style={{ width: peek ? 132 : 34 }}
            initial={{ opacity: 0, x: slideFrom }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: slideFrom }}
            transition={{ duration: 0.3, ease: EASE }}
            onHoverStart={() => setPeek(true)}
            onHoverEnd={() => setPeek(false)}
            onFocus={() => setPeek(true)}
            onBlur={() => setPeek(false)}
            onClick={() => setOpen(true)}
            aria-label={t('chat.open')}
            className={`flex h-[46px] items-center justify-center gap-2 overflow-hidden bg-navy-700 text-white shadow-pop transition-[width,background-color] duration-300 hover:bg-navy-800 ${
              isRTL ? 'rounded-l-none rounded-r-[9px]' : 'rounded-l-[9px] rounded-r-none'
            }`}
          >
            {/* The arrow points into the page — the direction the panel will
                come from — and nudges further in on hover. */}
            <Arrow
              size={22}
              strokeWidth={2.5}
              className={`shrink-0 transition-transform duration-300 ${
                peek ? (isRTL ? 'translate-x-0.5' : '-translate-x-0.5') : ''
              }`}
            />
            <motion.span
              initial={false}
              animate={{ width: peek ? 'auto' : 0, opacity: peek ? 1 : 0 }}
              transition={{ duration: 0.28, ease: EASE }}
              className="overflow-hidden whitespace-nowrap text-sm font-bold"
            >
              {t('chat.tab')}
            </motion.span>
            <motion.span
              initial={false}
              animate={{ width: peek ? 20 : 0, opacity: peek ? 1 : 0 }}
              transition={{ duration: 0.28, ease: EASE }}
              className="flex shrink-0 items-center overflow-hidden"
            >
              <MessageCircle size={18} strokeWidth={2} />
            </motion.span>
          </motion.button>
          </div>
        )}
      </AnimatePresence>

      {/* Conversation card */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ duration: 0.25, ease: EASE }}
            role="dialog"
            aria-label={t('chat.dialogLabel')}
            /* Anchored to the same edge as the tab it opened from, so the panel
               appears where the click happened. Below `sm` it spans the width
               with a small inset instead of sitting as a fixed 360px card wider
               than some phones. */
            className={`fixed bottom-5 left-2.5 right-2.5 z-50 flex h-[500px] max-h-[calc(100vh-3rem)] flex-col overflow-hidden rounded-2xl border border-rule bg-surface shadow-pop sm:w-[360px] ${
              isRTL ? 'sm:right-auto sm:left-5' : 'sm:left-auto sm:right-5'
            }`}
          >
            <div className="flex shrink-0 items-center gap-2.5 bg-navy-700 px-4 py-3.5 text-white">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15">
                <Sparkles size={15} className="text-gold-300" />
              </span>
              <div className="flex-1">
                <p className="text-sm font-bold">{t('chat.title')}</p>
                <p className="text-[11px] text-navy-100">{t('chat.status')}</p>
              </div>
              <button aria-label={t('chat.close')} onClick={() => setOpen(false)} className="rounded p-1 hover:bg-white/10">
                <X size={17} />
              </button>
            </div>

            <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-canvas p-3.5">
              {messages.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, ease: EASE }}
                  className={`flex ${m.from === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[86%] rounded-lg px-3.5 py-2.5 text-sm leading-relaxed ${
                      m.from === 'user'
                        ? 'bubble-user rounded-br-sm bg-navy-700 text-white'
                        : 'bubble-bot rounded-bl-sm border border-rule bg-surface text-ink'
                    }`}
                  >
                    {m.text}
                  </div>
                </motion.div>
              ))}

              {typing && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                  <div className="flex gap-1.5 rounded-lg rounded-bl-sm border border-rule bg-surface px-4 py-3">
                    {[0, 1, 2].map((d) => (
                      <motion.span
                        key={d}
                        className="h-1.5 w-1.5 rounded-full bg-ink-soft"
                        animate={{ y: [0, -4, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: d * 0.12 }}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </div>

            <form onSubmit={send} className="flex shrink-0 items-center gap-2 border-t border-rule bg-surface p-2.5">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t('chat.placeholder')}
                aria-label={t('chat.inputLabel')}
                className="flex-1 rounded-full bg-canvas px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500/20"
              />
              <motion.button
                type="submit"
                whileTap={{ scale: 0.9 }}
                aria-label={t('chat.send')}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-navy-700 text-white hover:bg-navy-800"
              >
                <Send size={15} className={isRTL ? 'rotate-180' : ''} />
              </motion.button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
