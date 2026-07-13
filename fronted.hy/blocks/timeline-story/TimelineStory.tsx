import type { CSSProperties } from "react";
import type { BlockRendererProps } from "../../src/manifest-renderer/types";

type TimelineItem = { date?: string; title: string; body?: string; image?: string };
export type TimelineStoryData = { title?: string; items: TimelineItem[]; accentColor?: string };

export default function TimelineStory({ data }: BlockRendererProps) {
  const value = data as unknown as TimelineStoryData;
  const style = { "--manifest-accent": value.accentColor ?? "#b7ff4a" } as CSSProperties;

  return (
    <section className="bg-[#f0ede6] px-[8vw] py-24 text-[#151515]" style={style}>
      {value.title && <h2 className="mb-16 text-[clamp(2.5rem,7vw,7rem)] font-semibold leading-none tracking-[-0.06em]">{value.title}</h2>}
      <div className="mx-auto max-w-5xl divide-y divide-black/15">
        {value.items.map((item, index) => (
          <article className="grid gap-8 py-10 md:grid-cols-[9rem_1fr]" key={`${item.title}-${index}`}>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-black/45">{item.date ?? String(index + 1).padStart(2, "0")}</p>
            <div className="grid gap-6 md:grid-cols-[1fr_16rem]">
              <div>
                <h3 className="text-3xl font-medium tracking-[-0.03em]">{item.title}</h3>
                {item.body && <p className="mt-4 max-w-2xl whitespace-pre-line leading-relaxed text-black/60">{item.body}</p>}
              </div>
              {item.image && <img className="aspect-[4/3] w-full rounded-2xl object-cover" src={item.image} alt="" />}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
