import ClosingMemoryFall, {
  type ClosingMemoryFallData,
} from "../../blocks/closing-memory-fall/ClosingMemoryFall";
import OpeningTitle, {
  type OpeningTitleData,
} from "../../blocks/opening-title/OpeningTitle";
import PhotoExplorationUI, {
  type PhotoExplorationItem,
} from "../../blocks/photo-exploration-ui/PhotoExplorationUI";
import MediaStage from "../../blocks/media-stage/MediaStage";
import QuoteCard from "../../blocks/quote-card/QuoteCard";
import TextSection from "../../blocks/text-section/TextSection";
import TimelineStory from "../../blocks/timeline-story/TimelineStory";
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
          photoIndex === index ? { ...photo, detail, textSource: "user_edit" } : photo,
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

function normalizeBlockName(entry: { block?: string; type?: string }) {
  return entry.block ?? entry.type ?? "";
}

export const blockRegistry = {
  "opening-title": OpeningTitleBlock,
  "photo-exploration-ui": PhotoExplorationBlock,
  "closing-memory-fall": ClosingMemoryFallBlock,
  "text-section": TextSection,
  "media-stage": MediaStage,
  "quote-card": QuoteCard,
  "timeline-story": TimelineStory,
} as const;

export type RegisteredBlockId = keyof typeof blockRegistry;

export function getRegisteredBlock(blockName: string) {
  return blockRegistry[blockName as RegisteredBlockId];
}

export function isRegisteredBlock(blockId: string): blockId is RegisteredBlockId {
  return blockId in blockRegistry;
}

export { normalizeBlockName };
