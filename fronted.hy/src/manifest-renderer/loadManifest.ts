import { mockGiftManifest } from "./mockManifest";
import type { GiftManifest } from "./types";

type ManifestLoadResult = {
  manifest: GiftManifest;
  source: string;
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function validateGiftManifest(value: unknown): GiftManifest {
  if (!isObject(value)) {
    throw new Error("Manifest must be a JSON object.");
  }

  if (value.version !== "1.0") {
    throw new Error("Manifest version must be 1.0.");
  }

  if (!isObject(value.meta)) {
    throw new Error("Manifest meta is required.");
  }

  if (!Array.isArray(value.blocks)) {
    throw new Error("Manifest blocks must be an array.");
  }

  const ids = new Set<string>();
  value.blocks.forEach((entry, index) => {
    if (!isObject(entry)) throw new Error(`Block ${index} must be an object.`);
    if (typeof entry.id !== "string" || !entry.id) {
      throw new Error(`Block ${index} is missing id.`);
    }
    if (ids.has(entry.id)) {
      throw new Error(`Duplicate block id: ${entry.id}`);
    }
    ids.add(entry.id);
    if (typeof entry.block !== "string" || !entry.block) {
      throw new Error(`Block ${entry.id} is missing block type.`);
    }
    if (!isObject(entry.data)) {
      throw new Error(`Block ${entry.id} data must be an object.`);
    }
  });

  return value as GiftManifest;
}

async function fetchJson(url: string) {
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch manifest: ${response.status}`);
  }

  return response.json();
}

export async function loadManifestFromUrl(): Promise<ManifestLoadResult> {
  const params = new URLSearchParams(window.location.search);
  const manifestUrl = params.get("manifestUrl");
  const slug = params.get("slug");

  if (manifestUrl) {
    const manifest = validateGiftManifest(await fetchJson(manifestUrl));
    return { manifest, source: manifestUrl };
  }

  if (slug) {
    const manifest = validateGiftManifest(await fetchJson(`/api/gifts/${slug}/config`));
    return { manifest, source: `/api/gifts/${slug}/config` };
  }

  return { manifest: mockGiftManifest, source: "mockGiftManifest" };
}
