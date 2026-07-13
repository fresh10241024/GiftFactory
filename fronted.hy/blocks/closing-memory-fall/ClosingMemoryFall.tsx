"use client";

import { useRef, useState, type CSSProperties, type PointerEvent, type TouchEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

export type ClosingMemoryFallData = {
  headline: string;
  message?: string;
  signature?: string;
  images?: string[];
  accentColor?: string;
};

type ClosingMemoryFallProps = ClosingMemoryFallData & {
  className?: string;
};

type FallingImage = {
  id: number;
  src: string;
  x: number;
  y: number;
  drift: number;
  rotate: number;
};

const defaultImages = ["/1.webp", "/2.webp", "/3.webp", "/4.webp", "/5.webp"];

const defaultData: Required<ClosingMemoryFallData> = {
  headline: "Keep this close",
  message: "Some memories do not end. They keep finding their way back into view.",
  signature: "With love",
  images: defaultImages,
  accentColor: "#f2b48d",
};

export default function ClosingMemoryFall({
  headline = defaultData.headline,
  message = defaultData.message,
  signature = defaultData.signature,
  images = defaultData.images,
  accentColor = defaultData.accentColor,
  className = "",
}: ClosingMemoryFallProps) {
  const reduceMotion = useReducedMotion();
  const rootRef = useRef<HTMLElement | null>(null);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);
  const distance = useRef(0);
  const imageIndex = useRef(0);
  const nextId = useRef(0);
  const [fallingImages, setFallingImages] = useState<FallingImage[]>([]);
  const usableImages = images.length > 0 ? images : defaultImages;

  function createFallingImage(clientX: number, clientY: number, deltaX: number) {
    if (reduceMotion || !rootRef.current) return;

    const rect = rootRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    if (y > rect.height - 170) return;

    const id = nextId.current++;
    const src = usableImages[imageIndex.current % usableImages.length];
    imageIndex.current += 1;

    setFallingImages((items) => [
      ...items.slice(-14),
      {
        id,
        src,
        x,
        y,
        drift: deltaX * 1.7 + (Math.random() - 0.5) * 80,
        rotate: (Math.random() - 0.5) * 34,
      },
    ]);

    window.setTimeout(() => {
      setFallingImages((items) => items.filter((item) => item.id !== id));
    }, 1500);
  }

  function trackPointer(clientX: number, clientY: number) {
    const previous = lastPoint.current;
    if (!previous) {
      lastPoint.current = { x: clientX, y: clientY };
      return;
    }

    const deltaX = clientX - previous.x;
    const deltaY = clientY - previous.y;
    distance.current += Math.abs(deltaX) + Math.abs(deltaY);

    if (distance.current > window.innerWidth / 9) {
      distance.current = 0;
      createFallingImage(clientX, clientY, deltaX);
    }

    lastPoint.current = { x: clientX, y: clientY };
  }

  function handlePointerMove(event: PointerEvent<HTMLElement>) {
    trackPointer(event.clientX, event.clientY);
  }

  function handleTouchMove(event: TouchEvent<HTMLElement>) {
    const touch = event.touches[0];
    if (!touch) return;
    trackPointer(touch.clientX, touch.clientY);
  }

  function handlePointerLeave() {
    lastPoint.current = null;
    distance.current = 0;
  }

  return (
    <section
      ref={rootRef}
      className={`relative grid min-h-[100svh] overflow-hidden bg-[#070706] text-[#f8ead5] ${className}`}
      style={{ "--closing-accent": accentColor } as CSSProperties}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onTouchMove={handleTouchMove}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_48%,color-mix(in_srgb,var(--closing-accent)_24%,transparent),transparent_34%),radial-gradient(circle_at_50%_100%,rgba(255,255,255,0.08),transparent_38%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.024)_1px,transparent_1px)] bg-[length:3px_3px] opacity-50" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_0%,rgba(0,0,0,0.2)_38%,rgba(0,0,0,0.82)_86%)]" />

      <AnimatePresence>
        {fallingImages.map((item) => (
          <motion.img
            key={item.id}
            src={item.src}
            alt=""
            draggable={false}
            className="pointer-events-none absolute z-20 h-[clamp(5.5rem,13vw,11rem)] w-[clamp(5.5rem,13vw,11rem)] rounded-[10px] border border-white/15 object-cover shadow-[0_22px_70px_rgba(0,0,0,0.55)]"
            style={{ left: item.x, top: item.y }}
            initial={{
              x: "-50%",
              y: "-50%",
              scale: 1.24,
              rotate: item.rotate,
              opacity: 0,
              filter: "blur(8px)",
            }}
            animate={{
              x: [`-50%`, `calc(-50% + ${item.drift}px)`, `calc(-50% + ${item.drift * 1.25}px)`],
              y: ["-50%", "62vh", "54vh", "118vh"],
              scale: [1.24, 0.96, 0.9, 0.86],
              rotate: [item.rotate, item.rotate * 0.3, item.rotate * -0.8],
              opacity: [0, 1, 1, 0],
              filter: ["blur(8px)", "blur(0px)", "blur(0px)", "blur(4px)"],
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 1.35,
              times: [0, 0.38, 0.58, 1],
              ease: ["easeOut", "easeIn", "easeIn"],
            }}
          />
        ))}
      </AnimatePresence>

      <div className="relative z-10 flex min-h-[100svh] flex-col items-center justify-center px-6 py-16 text-center">
        <motion.p
          className="mb-6 font-mono text-[10px] uppercase tracking-[0.34em] text-white/32"
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          Move gently through the memories
        </motion.p>

        <motion.h2
          className="max-w-[1050px] text-[clamp(3rem,9vw,9rem)] font-black uppercase leading-[0.86] tracking-[-0.065em]"
          initial={reduceMotion ? false : { opacity: 0, y: 28, filter: "blur(12px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true, amount: 0.58 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        >
          {headline}
        </motion.h2>

        <motion.p
          className="mt-8 max-w-[650px] text-[clamp(1rem,1.8vw,1.35rem)] leading-8 text-white/52"
          initial={reduceMotion ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.7, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
        >
          {message}
        </motion.p>

        <motion.div
          className="mt-12 h-px w-20 bg-white/16"
          initial={reduceMotion ? false : { scaleX: 0, opacity: 0 }}
          whileInView={{ scaleX: 1, opacity: 1 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.72, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        />

        <motion.p
          className="mt-8 font-mono text-xs uppercase tracking-[0.28em] text-[var(--closing-accent)]"
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.7, delay: 0.28, ease: [0.22, 1, 0.36, 1] }}
        >
          {signature}
        </motion.p>
      </div>
    </section>
  );
}
