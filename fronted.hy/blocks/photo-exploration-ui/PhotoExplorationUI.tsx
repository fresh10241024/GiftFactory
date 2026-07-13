"use client";

import { useMemo, useRef, useState, type CSSProperties } from "react";
import { AnimatePresence, animate, motion } from "framer-motion";
import html2canvas from "html2canvas";

export type PhotoExplorationItem = {
  id?: string;
  src: string;
  alt?: string;
  title: string;
  eyebrow?: string;
  summary: string;
  detail: string;
  originalText?: string;
  polishedText?: string;
  textSource?: "user" | "ai" | "user_edit" | string;
  primaryColor: string;
};

type PhotoExplorationUIProps = {
  photos: PhotoExplorationItem[];
  initialIndex?: number;
  className?: string;
  onUploadClick?: () => void;
  onTextChange?: (index: number, detail: string) => void;
};

const defaultPhotos: PhotoExplorationItem[] = [
  {
    src: "/1.webp",
    title: "The Summer We Kept",
    eyebrow: "MEMORY 01",
    summary: "A quiet afternoon folded into light, color, and the small details that stayed.",
    detail:
      "That day felt ordinary while it was happening, but it became one of those scenes that keeps returning. The light was soft, the air was slow, and everything around us seemed to make room for the moment.",
    primaryColor: "#9cc9ff",
  },
  {
    src: "/2.webp",
    title: "Blue Hour Promise",
    eyebrow: "MEMORY 02",
    summary: "A frame for the promise to meet again when the sky turns blue.",
    detail:
      "Some memories do not need a perfect photograph. They only need a color, a sentence, and the feeling that someone was exactly where they were supposed to be.",
    primaryColor: "#7adcc8",
  },
  {
    src: "/3.webp",
    title: "After the Rain",
    eyebrow: "MEMORY 03",
    summary: "The kind of stillness that arrives after laughter, weather, and long walks.",
    detail:
      "This one carries the aftertaste of rain and the comfort of being understood without explaining too much. It is simple, but it says enough.",
    primaryColor: "#c6a8ff",
  },
  {
    src: "/4.webp",
    title: "Last Light",
    eyebrow: "MEMORY 04",
    summary: "A small cinematic pause before the evening changed color.",
    detail:
      "The last light made everything look more deliberate. Even the silence felt designed. This card keeps that pause intact.",
    primaryColor: "#f4b88f",
  },
];

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function wrapIndex(index: number, length: number) {
  return ((index % length) + length) % length;
}

function circularOffset(index: number, active: number, length: number) {
  let offset = index - active;
  if (offset > length / 2) offset -= length;
  if (offset < -length / 2) offset += length;
  return offset;
}

function CoverCard({
  item,
  offset,
  active,
  onClick,
}: {
  item: PhotoExplorationItem;
  offset: number;
  active: boolean;
  onClick: () => void;
}) {
  const cardRef = useRef<HTMLButtonElement | null>(null);
  const rotateX = useRef(0);
  const rotateY = useRef(0);

  const distance = Math.abs(offset);
  const side = offset < 0 ? -1 : 1;
  const x = offset * 275;
  const z = -Math.min(distance, 3) * 165;
  const y = distance * 18;
  const rotate = active ? 0 : side * -54;
  const scale = active ? 1 : distance === 1 ? 0.68 : 0.54;
  const opacity = active ? 1 : distance <= 2 ? 0.72 : 0.34;
  const blur = active ? 0 : distance === 1 ? 1.2 : 3.5;

  function handlePointerMove(event: React.PointerEvent<HTMLButtonElement>) {
    if (!active || event.pointerType !== "mouse" || !cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width - 0.5;
    const py = (event.clientY - rect.top) / rect.height - 0.5;
    rotateX.current = py * -7;
    rotateY.current = px * 9;

    animate(cardRef.current, {
      rotateX: rotateX.current,
      rotateY: rotateY.current,
    }, {
      type: "spring",
      stiffness: 260,
      damping: 30,
      mass: 0.6,
    });
  }

  function resetTilt() {
    if (!cardRef.current) return;
    animate(cardRef.current, { rotateX: 0, rotateY: active ? 0 : rotate }, {
      type: "spring",
      stiffness: 220,
      damping: 28,
      mass: 0.7,
    });
  }

  return (
    <div
      className="pointer-events-none absolute inset-0 flex items-center justify-center"
      style={{ zIndex: active ? 30 : 20 - distance }}
    >
      <motion.button
        ref={cardRef}
        type="button"
        className="pointer-events-auto h-[310px] w-[310px] overflow-hidden rounded-[16px] border border-white/[0.14] bg-stone-100 p-0 shadow-[0_34px_90px_rgba(0,0,0,0.58)] outline-none"
        style={{
          transformStyle: "preserve-3d",
          transformOrigin: "50% 50%",
          WebkitTapHighlightColor: "transparent",
        }}
        initial={false}
        animate={{
          x,
          y,
          z,
          rotateY: rotate,
          scale,
          opacity,
          filter: `blur(${blur}px) saturate(${active ? 1.04 : 0.74}) brightness(${active ? 1 : 0.72})`,
        }}
        transition={{ type: "spring", stiffness: 140, damping: 24, mass: 0.9 }}
        onPointerMove={handlePointerMove}
        onPointerLeave={resetTilt}
        onClick={onClick}
        aria-label={`Open ${item.title}`}
      >
        <motion.img
          src={item.src}
          alt={item.alt ?? item.title}
          draggable={false}
          className="h-full w-full object-cover"
          animate={{
            scale: active ? 1.05 : 1.02,
          }}
          transition={{ type: "spring", stiffness: 180, damping: 24 }}
        />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_22%,rgba(255,255,255,0.16),transparent_38%),linear-gradient(to_bottom,transparent_52%,rgba(0,0,0,0.24))]" />
      </motion.button>
    </div>
  );
}

export default function PhotoExplorationUI({
  photos = defaultPhotos,
  initialIndex = 0,
  className = "",
  onUploadClick,
  onTextChange,
}: PhotoExplorationUIProps) {
  const items = photos.length > 0 ? photos : defaultPhotos;
  const [activeIndex, setActiveIndex] = useState(clamp(initialIndex, 0, items.length - 1));
  const [detailIndex, setDetailIndex] = useState<number | null>(null);
  const [details, setDetails] = useState(() => items.map((item) => item.detail));
  const [copied, setCopied] = useState(false);
  const detailCardRef = useRef<HTMLDivElement | null>(null);
  const dragStartX = useRef(0);
  const active = items[activeIndex];
  const detailItem = detailIndex === null ? null : items[detailIndex];
  const glowStyle = useMemo<CSSProperties>(() => ({
    "--active-color": active.primaryColor,
  } as CSSProperties), [active.primaryColor]);

  function go(direction: -1 | 1) {
    setActiveIndex((current) => wrapIndex(current + direction, items.length));
  }

  async function copyCard() {
    if (!detailCardRef.current) return;
    const canvas = await html2canvas(detailCardRef.current, {
      backgroundColor: null,
      scale: 2,
      useCORS: true,
    });

    canvas.toBlob(async (blob) => {
      if (!blob) return;
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type]: blob }),
      ]);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1300);
    });
  }

  return (
    <section
      className={`relative min-h-[100svh] overflow-hidden rounded-[20px] bg-[#11100f] text-[#f4ead8] ${className}`}
      style={glowStyle}
    >
      <motion.div
        className="pointer-events-none absolute inset-[-22%] opacity-70 blur-[72px]"
        animate={{
          background: `radial-gradient(circle at 50% 48%, ${active.primaryColor} 0%, rgba(17,16,15,0.04) 34%, rgba(17,16,15,0) 58%)`,
        }}
        transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
      />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,transparent_0%,rgba(0,0,0,0.12)_34%,rgba(0,0,0,0.64)_78%),linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[length:100%_100%,3px_3px]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.18] [background-image:url('data:image/svg+xml,%3Csvg_viewBox=%220_0_180_180%22_xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter_id=%22n%22%3E%3CfeTurbulence_type=%22fractalNoise%22_baseFrequency=%220.85%22_numOctaves=%222%22_stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect_width=%22100%25%22_height=%22100%25%22_filter=%22url(%23n)%22_opacity=%220.45%22/%3E%3C/svg%3E')]" />

      <button
        type="button"
        className="absolute right-5 top-5 z-20 grid h-11 w-11 place-items-center rounded-full border border-white/[0.08] bg-white/[0.025] text-lg text-white/25 backdrop-blur-md transition hover:border-white/20 hover:text-white/70"
        aria-label="Reserved action"
      >
        ≈
      </button>

      <div className="relative z-10 flex min-h-[100svh] flex-col items-center justify-center px-6 py-10">
        <motion.div
          className="relative h-[430px] w-full max-w-[1120px]"
          style={{ perspective: 1200, transformStyle: "preserve-3d" }}
          drag="x"
          dragElastic={0.08}
          dragMomentum={false}
          onDragStart={(_, info) => {
            dragStartX.current = info.point.x;
          }}
          onDragEnd={(_, info) => {
            const delta = info.point.x - dragStartX.current;
            const projected = delta + info.velocity.x * 0.18;
            if (projected < -70) go(1);
            if (projected > 70) go(-1);
          }}
        >
          {items.map((item, index) => {
            const offset = circularOffset(index, activeIndex, items.length);
            if (Math.abs(offset) > 2) return null;
            return (
              <CoverCard
                key={`${item.src}-${index}`}
                item={item}
                offset={offset}
                active={index === activeIndex}
                onClick={() => {
                  if (index === activeIndex) setDetailIndex(index);
                  else setActiveIndex(index);
                }}
              />
            );
          })}
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.div
            key={active.title}
            className="mt-6 max-w-[980px] text-center"
            initial={{ opacity: 0, y: 18, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -12, filter: "blur(8px)" }}
            transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
          >
            <h2 className="text-[clamp(2rem,4.1vw,3.75rem)] font-black leading-none tracking-[-0.04em] text-[#f8ead5] drop-shadow-[0_18px_40px_rgba(0,0,0,0.48)]">
              {active.title}
            </h2>
            <p className="mx-auto mt-5 max-w-[620px] text-sm leading-7 text-white/42">
              {active.summary}
            </p>
          </motion.div>
        </AnimatePresence>

        <div className="mt-8 flex items-center gap-5">
          <button
            type="button"
            onClick={() => go(-1)}
            className="grid h-12 w-12 place-items-center rounded-full border border-white/[0.12] bg-black/20 text-2xl text-white/70 backdrop-blur-md transition hover:border-white/35 hover:bg-white/[0.08]"
            aria-label="Previous photo"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            className="grid h-12 w-12 place-items-center rounded-full border border-white/[0.22] bg-white/[0.035] text-2xl text-white/86 shadow-[0_0_0_1px_rgba(255,255,255,0.05)] backdrop-blur-md transition hover:border-white/50 hover:bg-white/[0.08]"
            aria-label="Next photo"
          >
            ›
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={onUploadClick}
        className="absolute bottom-6 right-6 z-20 grid h-14 w-14 place-items-center rounded-full border border-white/[0.12] bg-white/[0.035] text-3xl font-light text-white/45 backdrop-blur-md transition hover:border-white/32 hover:text-white"
        aria-label="Upload photo"
      >
        +
      </button>

      <AnimatePresence>
        {detailItem && detailIndex !== null && (
          <motion.div
            className="fixed inset-0 z-50 grid place-items-center bg-black/72 p-5 backdrop-blur-[5px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              ref={detailCardRef}
              className="relative grid w-full max-w-[1080px] grid-cols-[minmax(320px,520px)_1fr] overflow-hidden rounded-[26px] border border-white/[0.1] bg-[#171414]/95 shadow-[0_40px_140px_rgba(0,0,0,0.75)] max-lg:grid-cols-1"
              initial={{ opacity: 0, y: 34, scale: 0.94, filter: "blur(14px)" }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: 20, scale: 0.96, filter: "blur(10px)" }}
              transition={{ type: "spring", stiffness: 150, damping: 22, mass: 0.85 }}
            >
              <button
                type="button"
                onClick={() => setDetailIndex(null)}
                className="absolute right-6 top-6 z-10 grid h-12 w-12 place-items-center rounded-full border border-white/[0.12] bg-black/25 text-3xl font-light text-white/80 transition hover:border-white/35 hover:bg-white/[0.08]"
                aria-label="Close detail"
              >
                ×
              </button>

              <div className="bg-[#eee8d2] p-7">
                <div className="aspect-square overflow-hidden border-[3px] border-[#1c1b18] bg-stone-200">
                  <img
                    src={detailItem.src}
                    alt={detailItem.alt ?? detailItem.title}
                    className="h-full w-full object-cover grayscale-[0.12]"
                  />
                </div>
                <div className="mt-5 flex justify-between px-2 font-mono text-[10px] font-bold tracking-[1.15em] text-[#1c1b18]">
                  <span>G</span><span>I</span><span>F</span><span>T</span>
                </div>
              </div>

              <div className="flex min-h-[520px] flex-col justify-center px-12 py-14 max-lg:min-h-0 max-lg:px-7">
                <p className="font-mono text-xs font-bold uppercase tracking-[0.42em] text-white/38">
                  {detailItem.eyebrow ?? "MEMORY"}
                </p>
                <h3 className="mt-4 text-[clamp(2rem,4vw,3.25rem)] font-black leading-none tracking-[-0.04em] text-[#f8ead5]">
                  {detailItem.title}
                </h3>
                <div className="my-7 h-px w-16 bg-white/14" />
                <textarea
                  value={details[detailIndex]}
                  onChange={(event) => {
                    const next = [...details];
                    next[detailIndex] = event.target.value;
                    setDetails(next);
                    onTextChange?.(detailIndex, event.target.value);
                  }}
                  className="min-h-[160px] resize-none rounded-xl border border-white/[0.08] bg-white/[0.025] p-4 text-lg leading-8 text-white/62 outline-none transition placeholder:text-white/20 focus:border-white/[0.22] focus:bg-white/[0.04]"
                  aria-label="Edit photo detail text"
                />
                <div className="mt-8 flex justify-end">
                  <button
                    type="button"
                    onClick={copyCard}
                    className="rounded-full border border-white/[0.14] px-6 py-3 font-mono text-xs font-bold uppercase tracking-[0.24em] text-[#f8ead5] transition hover:border-white/40 hover:bg-white/[0.08]"
                  >
                    {copied ? "已复制" : "复制卡片"}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
