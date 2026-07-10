export type GiftManifest = {
  version: "1.0";
  meta: {
    language: "zh" | "en";
    theme: string;
    title?: string;
    recipientName?: string;
    senderName?: string;
    occasion?: string;
    createdBy?: "ai" | "user" | "mixed";
  };
  blocks: GiftManifestBlock[];
};

export type GiftManifestBlock = {
  id: string;
  block: string;
  data: Record<string, unknown>;
};

export type BlockRendererProps = {
  data: Record<string, unknown>;
  blockId: string;
  onAdvance?: () => void;
  onDataChange?: (nextData: Record<string, unknown>) => void;
};
