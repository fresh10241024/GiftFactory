import type { CSSProperties } from "react";
import type { BlockRendererProps } from "../../src/manifest-renderer/types";

export type MediaStageData = {
  src: string;
  kind?: "image" | "video" | "audio";
  alt?: string;
  caption?: string;
  accentColor?: string;
};

export default function MediaStage({ data }: BlockRendererProps) {
  const value = data as unknown as MediaStageData;
  const kind = value.kind ?? "image";
  const style = { "--manifest-accent": value.accentColor ?? "#b7ff4a" } as CSSProperties;

  return (
    <section className="grid min-h-[70svh] place-items-center bg-black px-6 py-16 text-white" style={style}>
      <figure className="w-full max-w-6xl">
        {kind === "video" ? (
          <video className="mx-auto max-h-[75svh] w-full object-contain" src={value.src} controls playsInline />
        ) : kind === "audio" ? (
          <div className="mx-auto flex max-w-xl flex-col gap-6 rounded-3xl border border-white/15 bg-white/5 p-8">
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-[var(--manifest-accent)]">A sound to keep</p>
            <audio className="w-full" src={value.src} controls />
          </div>
        ) : (
          <img className="mx-auto max-h-[75svh] w-full object-contain" src={value.src} alt={value.alt ?? "Gift memory"} />
        )}
        {value.caption && <figcaption className="mt-5 text-center text-sm text-white/55">{value.caption}</figcaption>}
      </figure>
    </section>
  );
}
