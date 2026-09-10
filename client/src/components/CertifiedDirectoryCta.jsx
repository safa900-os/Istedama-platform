import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, ArrowLeft, Building2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { CERTIFIED_DIRECTORY } from '../data/programme';
import { fadeUp, stagger, inView, EASE } from '../motion/presets';

/**
 * The invitation to browse certified enterprises.
 *
 * A two-column band: the invitation on the text side, a photograph opposite.
 * The photograph now exists at `/certified-meeting.jpg`. The drawn stand-in is
 * kept behind an `onError` guard rather than deleted: the file is supplied by
 * the organisation, and a deployment that ships without it should degrade to a
 * placeholder instead of a broken image.
 */
export default function CertifiedDirectoryCta() {
  const { t, isRTL } = useLanguage();
  const Arrow = isRTL ? ArrowLeft : ArrowRight;
  const [photoFailed, setPhotoFailed] = useState(false);

  return (
    <section className="mx-auto max-w-[1400px] px-3 py-16 sm:px-5">
      <motion.div
        variants={fadeUp}
        initial="hidden"
        whileInView="show"
        viewport={inView}
        className="overflow-hidden rounded-4xl border border-rule bg-navy-50 shadow-card"
      >
        <div className="grid items-stretch lg:grid-cols-2">
          {/* --------------------------------------------------- invitation */}
          <motion.div
            variants={stagger(0.08)}
            initial="hidden"
            whileInView="show"
            viewport={inView}
            className="flex flex-col justify-center px-6 py-12 text-center sm:px-12 sm:py-16"
          >
            <motion.h2
              variants={fadeUp}
              className="font-display text-[1.7rem] font-black leading-tight tracking-tight text-navy-900 sm:text-[2.15rem]"
            >
              {t('certified.title')}
            </motion.h2>

            <motion.div variants={fadeUp} className="mt-8 flex justify-center">
              <Link
                to={CERTIFIED_DIRECTORY.to}
                className="inline-flex items-center gap-2 rounded-full border-2 border-navy-700 px-8 py-3 text-sm font-black text-navy-700 transition-colors hover:bg-navy-700 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
              >
                {t('certified.cta')} <Arrow size={16} strokeWidth={2.4} />
              </Link>
            </motion.div>

            <motion.img
              variants={fadeUp}
              src="/promo/lockup.png"
              alt=""
              className="mx-auto mt-10 h-14 w-auto max-w-[60%] object-contain"
            />
          </motion.div>

          {/* -------------------------------------------------------- photo */}
          <motion.div
            initial={{ opacity: 0, x: isRTL ? -24 : 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={inView}
            transition={{ duration: 0.6, ease: EASE }}
            className="relative min-h-[260px] bg-navy-100 lg:min-h-[420px]"
          >
            {photoFailed ? (
              <div className="flex h-full w-full flex-col items-center justify-center gap-3 p-10 text-navy-600">
                <Building2 size={44} strokeWidth={1.3} />
                <p className="text-xs font-bold">{t('certified.photoPending')}</p>
              </div>
            ) : (
              <img
                src={CERTIFIED_DIRECTORY.photo}
                alt={t('certified.photoAlt')}
                onError={() => setPhotoFailed(true)}
                className="absolute inset-0 h-full w-full object-cover"
              />
            )}
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
