import type { CSSProperties } from "react";
import { getRegisteredBlock, normalizeBlockName } from "./blockRegistry";
import type { GiftManifest } from "./types";

type GiftRendererProps = {
  manifest: GiftManifest;
  onBlockDataChange?: (blockId: string, nextData: Record<string, unknown>) => void;
};

export function GiftRenderer({ manifest, onBlockDataChange }: GiftRendererProps) {
  if (manifest.version !== "1.0") {
    return (
      <div className="grid min-h-[100svh] place-items-center bg-[#050609] p-8 text-center text-white">
        Unsupported gift manifest version: {manifest.version}
      </div>
    );
  }

  const design = manifest.design ?? {};
  const style = {
    background: design.background ?? "#050609",
    color: design.foreground ?? "#ffffff",
    "--manifest-accent": design.accent ?? "#b7ff4a",
    "--manifest-radius": design.radius ?? "24px",
  } as CSSProperties;

  return (
    <main className="min-h-[100svh]" style={style}>
      {manifest.blocks.map((entry, index) => {
        const blockName = normalizeBlockName(entry);
        const BlockComponent = getRegisteredBlock(blockName);
        if (!BlockComponent) {
          return (
            <section
              key={entry.id}
              data-gift-block-index={index}
              className="grid min-h-[60svh] place-items-center bg-[#050609] p-8 text-center text-white"
            >
              Unsupported block: {blockName}
            </section>
          );
        }

        return (
          <div key={entry.id} data-gift-block-index={index}>
            <BlockComponent
              blockId={entry.id}
              data={entry.data}
              onDataChange={(nextData) => onBlockDataChange?.(entry.id, nextData)}
              onAdvance={
                index < manifest.blocks.length - 1
                  ? () => {
                      document
                        .querySelector(`[data-gift-block-index="${index + 1}"]`)
                        ?.scrollIntoView({ behavior: "smooth", block: "start" });
                    }
                  : undefined
              }
            />
          </div>
        );
      })}
    </main>
  );
}
