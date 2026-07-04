"use client";

import { motion, useReducedMotion } from "framer-motion";

export type OpeningTitleData = {
  headline: string;
  subheadline?: string;
  kicker?: string;
  image?: string;
  imageAlt?: string;
  accentColor?: string;
};

type OpeningTitleProps = OpeningTitleData & {
  className?: string;
  onAdvance?: () => void;
};

const defaultData: Required<OpeningTitleData> = {
  headline: "For the one who stayed",
  subheadline: "A small website made from our memories.",
  kicker: "Gift Factory presents",
  image: "/1.webp",
  imageAlt: "Opening memory",
  accentColor: "#b7ff4a",
};

function splitHeadline(headline: string) {
  const words = headline.trim().split(/\s+/).filter(Boolean);
  if (words.length <= 3) return [headline, ""];
  const midpoint = Math.ceil(words.length / 2);
  return [words.slice(0, midpoint).join(" "), words.slice(midpoint).join(" ")];
}

export default function OpeningTitle({
  headline = defaultData.headline,
  subheadline = defaultData.subheadline,
  kicker = defaultData.kicker,
  image = defaultData.image,
  imageAlt = defaultData.imageAlt,
  accentColor = defaultData.accentColor,
  className = "",
  onAdvance,
}: OpeningTitleProps) {
  const reduceMotion = useReducedMotion();
  const [lineA, lineB] = splitHeadline(headline);
  const lineTransition = reduceMotion
    ? { duration: 0 }
    : { type: "spring" as const, stiffness: 92, damping: 18, mass: 1.05 };

  return (
    <section
      className={`relative grid min-h-[100svh] overflow-hidden bg-[#050505] text-white ${onAdvance ? "cursor-pointer" : ""} ${className}`}
      style={{ "--opening-accent": accentColor } as React.CSSProperties}
      tabIndex={onAdvance ? 0 : undefined}
      role={onAdvance ? "button" : undefined}
      aria-label={onAdvance ? "Continue to the next scene" : undefined}
      onClick={onAdvance}
      onKeyDown={(event) => {
        if (!onAdvance) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onAdvance();
        }
      }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_58%_45%,color-mix(in_srgb,var(--opening-accent)_30%,transparent),transparent_32%),linear-gradient(rgba(255,255,255,0.028)_1px,transparent_1px)] bg-[length:100%_100%,3px_3px] opacity-80" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_0%,rgba(0,0,0,0.22)_45%,rgba(0,0,0,0.84)_86%)]" />

      <div className="relative z-10 flex min-h-[100svh] flex-col justify-center px-[clamp(1.25rem,5vw,5.5rem)] py-10">
        <motion.div
          className="mb-8 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.32em] text-white/38"
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className="h-px w-12 bg-white/22" />
          {kicker}
        </motion.div>

        <div className="relative">
          <motion.h1
            className="relative z-10 max-w-[1180px] text-[clamp(4.1rem,13vw,13.5rem)] font-black uppercase leading-[0.78] tracking-[-0.075em] text-white"
            aria-label={headline}
          >
            <motion.span
              className="block origin-left whitespace-nowrap will-change-transform"
              initial={reduceMotion ? false : { x: "-18vw", rotate: -4, opacity: 0, filter: "blur(12px)" }}
              animate={{ x: 0, rotate: -1.4, opacity: 1, filter: "blur(0px)" }}
              transition={lineTransition}
            >
              {lineA}
            </motion.span>
            {lineB && (
              <motion.span
                className="ml-[8vw] block origin-left whitespace-nowrap text-white/92 will-change-transform"
                initial={reduceMotion ? false : { x: "22vw", rotate: 5, opacity: 0, filter: "blur(12px)" }}
                animate={{ x: 0, rotate: 1.6, opacity: 1, filter: "blur(0px)" }}
                transition={{ ...lineTransition, delay: reduceMotion ? 0 : 0.08 }}
              >
                {lineB}
              </motion.span>
            )}
          </motion.h1>

          {image && (
            <motion.div
              className="absolute left-[58%] top-[38%] z-20 h-[clamp(5.5rem,12vw,11rem)] w-[clamp(5.5rem,12vw,11rem)] overflow-hidden rounded-[18px] border border-white/15 bg-[var(--opening-accent)] shadow-[0_28px_90px_rgba(0,0,0,0.62)]"
              initial={reduceMotion ? false : { scale: 0.72, rotate: 15, opacity: 0, y: 28 }}
              animate={{ scale: 1, rotate: -5, opacity: 1, y: 0 }}
              transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 150, damping: 18, delay: 0.32 }}
            >
              <img
                src={image}
                alt={imageAlt || headline}
                className="h-full w-full object-cover mix-blend-multiply saturate-125"
                draggable={false}
              />
              <div className="pointer-events-none absolute inset-0 bg-[var(--opening-accent)]/20" />
            </motion.div>
          )}
        </div>

        <motion.p
          className="mt-12 max-w-[620px] text-[clamp(1rem,1.7vw,1.35rem)] leading-8 text-white/54"
          initial={reduceMotion ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.72, delay: reduceMotion ? 0 : 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          {subheadline}
        </motion.p>

        {onAdvance && (
          <motion.div
            className="absolute bottom-8 left-1/2 -translate-x-1/2 font-mono text-[10px] uppercase tracking-[0.26em] text-white/28"
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: reduceMotion ? 0 : 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            Click to continue
          </motion.div>
        )}
      </div>
    </section>
  );
}
