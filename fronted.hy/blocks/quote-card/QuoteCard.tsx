import type { CSSProperties } from "react";
import type { BlockRendererProps } from "../../src/manifest-renderer/types";

export type QuoteCardData = {
  quote: string;
  attribution?: string;
  accentColor?: string;
};

export default function QuoteCard({ data }: BlockRendererProps) {
  const value = data as unknown as QuoteCardData;
  const style = { "--manifest-accent": value.accentColor ?? "#b7ff4a" } as CSSProperties;

  return (
    <section className="grid min-h-[55svh] place-items-center bg-[#111] px-8 py-24 text-center text-white" style={style}>
      <blockquote className="max-w-5xl">
        <p className="text-[clamp(2rem,6vw,6rem)] leading-[1.05] tracking-[-0.04em]">“{value.quote}”</p>
        {value.attribution && <cite className="mt-8 block not-italic text-sm uppercase tracking-[0.25em] text-[var(--manifest-accent)]">{value.attribution}</cite>}
      </blockquote>
    </section>
  );
}
