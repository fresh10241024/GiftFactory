import React from "react";
import { createRoot } from "react-dom/client";
import PhotoExplorationUI, {
  type PhotoExplorationItem,
} from "../blocks/photo-exploration-ui/PhotoExplorationUI";
import { mockGiftManifest } from "./manifest-renderer/mockManifest";

const photoBlock = mockGiftManifest.blocks.find(
  (block) => block.block === "photo-exploration-ui"
);

const photos = (photoBlock?.data.photos as PhotoExplorationItem[] | undefined) ?? [];

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <PhotoExplorationUI photos={photos} />
  </React.StrictMode>
);
