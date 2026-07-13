export type GiftManifest = {
  version: "1.0";
  design?: {
    background?: string;
    foreground?: string;
    accent?: string;
    font?: string;
    motion?: string;
    radius?: string;
  };
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
  type?: string;
  data: Record<string, unknown>;
  layout?: string;
  variant?: string;
};

export type BlockRendererProps = {
  data: Record<string, unknown>;
  blockId: string;
  onAdvance?: () => void;
  onDataChange?: (nextData: Record<string, unknown>) => void;
};
