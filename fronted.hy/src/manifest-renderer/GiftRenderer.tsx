import { blockRegistry, isRegisteredBlock } from "./blockRegistry";
import type { GiftManifest } from "./types";

type GiftRendererProps = {
  manifest: GiftManifest;
};

export function GiftRenderer({ manifest }: GiftRendererProps) {
  if (manifest.version !== "1.0") {
    return (
      <div className="grid min-h-[100svh] place-items-center bg-[#050609] p-8 text-center text-white">
        Unsupported gift manifest version: {manifest.version}
      </div>
    );
  }

  return (
    <main className="min-h-[100svh] bg-[#050609]">
      {manifest.blocks.map((entry, index) => {
        if (!isRegisteredBlock(entry.block)) {
          return (
            <section
              key={entry.id}
              data-gift-block-index={index}
              className="grid min-h-[60svh] place-items-center bg-[#050609] p-8 text-center text-white"
            >
              Unknown block: {entry.block}
            </section>
          );
        }

        const BlockComponent = blockRegistry[entry.block];
        return (
          <div key={entry.id} data-gift-block-index={index}>
            <BlockComponent
              blockId={entry.id}
              data={entry.data}
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
