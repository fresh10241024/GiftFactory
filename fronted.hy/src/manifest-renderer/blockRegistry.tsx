import ClosingMemoryFall, {
  type ClosingMemoryFallData,
} from "../../blocks/closing-memory-fall/ClosingMemoryFall";
import OpeningTitle, {
  type OpeningTitleData,
} from "../../blocks/opening-title/OpeningTitle";
import PhotoExplorationUI, {
  type PhotoExplorationItem,
} from "../../blocks/photo-exploration-ui/PhotoExplorationUI";
import type { BlockRendererProps } from "./types";

function OpeningTitleBlock({ data, onAdvance }: BlockRendererProps) {
  return <OpeningTitle {...(data as OpeningTitleData)} onAdvance={onAdvance} />;
}

function PhotoExplorationBlock({ data, onDataChange }: BlockRendererProps) {
  const photos = (data.photos as PhotoExplorationItem[] | undefined) ?? [];
  return (
    <PhotoExplorationUI
      photos={photos}
      onTextChange={(index, detail) => {
        const nextPhotos = photos.map((photo, photoIndex) =>
          photoIndex === index ? { ...photo, detail } : photo,
        );
        onDataChange?.({
          ...data,
          photos: nextPhotos,
        });
      }}
    />
  );
}

function ClosingMemoryFallBlock({ data }: BlockRendererProps) {
  return <ClosingMemoryFall {...(data as ClosingMemoryFallData)} />;
}

export const blockRegistry = {
  "opening-title": OpeningTitleBlock,
  "photo-exploration-ui": PhotoExplorationBlock,
  "closing-memory-fall": ClosingMemoryFallBlock,
} as const;

export type RegisteredBlockId = keyof typeof blockRegistry;

export function isRegisteredBlock(blockId: string): blockId is RegisteredBlockId {
  return blockId in blockRegistry;
}
