import type { CSSProperties } from "react";
import type { BlockRendererProps } from "../../src/manifest-renderer/types";

export type TextSectionData = {
  eyebrow?: string;
  title: string;
  body?: string;
  align?: "left" | "center" | "right";
  accentColor?: string;
};

export default function TextSection({ data }: BlockRendererProps) {
  const value = data as unknown as TextSectionData;
  const align = value.align ?? "left";
  const style = { "--manifest-accent": value.accentColor ?? "#b7ff4a" } as CSSProperties;

  return (
    <section className="flex min-h-[55svh] items-center px-[8vw] py-24 text-white" style={style}>
      <div className={`mx-auto w-full max-w-4xl text-${align}`}>
        {value.eyebrow && <p className="mb-5 font-mono text-xs uppercase tracking-[0.3em] text-[var(--manifest-accent)]">{value.eyebrow}</p>}
        <h2 className="text-[clamp(2.5rem,8vw,8rem)] font-semibold leading-[0.9] tracking-[-0.06em]">{value.title}</h2>
        {value.body && <p className="mt-8 max-w-2xl whitespace-pre-line text-[clamp(1rem,1.7vw,1.4rem)] leading-relaxed text-white/65">{value.body}</p>}
      </div>
    </section>
  );
}
