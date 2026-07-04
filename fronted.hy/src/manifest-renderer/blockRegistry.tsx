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

function PhotoExplorationBlock({ data }: BlockRendererProps) {
  return (
    <PhotoExplorationUI
      photos={(data.photos as PhotoExplorationItem[] | undefined) ?? []}
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
