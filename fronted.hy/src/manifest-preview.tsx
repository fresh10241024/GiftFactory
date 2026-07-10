import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { GiftRenderer } from "./manifest-renderer/GiftRenderer";
import { loadManifestFromUrl } from "./manifest-renderer/loadManifest";
import type { GiftManifest } from "./manifest-renderer/types";
import { updateGiftConfig } from "./scripts/api.js";

function ManifestPreviewApp() {
  const [manifest, setManifest] = useState<GiftManifest | null>(null);
  const [source, setSource] = useState("");
  const [error, setError] = useState("");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const saveTimerRef = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    loadManifestFromUrl()
      .then((result) => {
        if (cancelled) return;
        setManifest(result.manifest);
        setSource(result.source);
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setError(err.message);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const slug = new URLSearchParams(window.location.search).get("slug");

  useEffect(() => {
    return () => {
      if (saveTimerRef.current !== null) {
        window.clearTimeout(saveTimerRef.current);
      }
    };
  }, []);

  function scheduleSave(nextManifest: GiftManifest) {
    if (!slug) return;

    setSaveState("saving");
    if (saveTimerRef.current !== null) {
      window.clearTimeout(saveTimerRef.current);
    }
    saveTimerRef.current = window.setTimeout(() => {
      updateGiftConfig(slug, nextManifest)
        .then(() => {
          setSaveState("saved");
          window.setTimeout(() => setSaveState("idle"), 1200);
        })
        .catch((err: Error) => {
          console.error(err);
          setSaveState("error");
        });
    }, 450);
  }

  if (error) {
    return (
      <div className="grid min-h-[100svh] place-items-center bg-[#050609] p-8 text-center text-white">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.28em] text-white/35">
            Manifest load failed
          </p>
          <h1 className="mt-4 text-2xl font-semibold">{error}</h1>
        </div>
      </div>
    );
  }

  if (!manifest) {
    return (
      <div className="grid min-h-[100svh] place-items-center bg-[#050609] p-8 text-center text-white">
        <p className="font-mono text-xs uppercase tracking-[0.28em] text-white/45">
          Loading Gift Manifest
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="pointer-events-none fixed left-4 top-4 z-[999] rounded-full border border-white/[0.08] bg-black/30 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-white/35 backdrop-blur-md">
        {source}
        {slug ? ` · ${saveState}` : ""}
      </div>
      <GiftRenderer
        manifest={manifest}
        onBlockDataChange={(blockId, nextData) => {
          setManifest((current) => {
            if (!current) return current;
            const nextManifest: GiftManifest = {
              ...current,
              blocks: current.blocks.map((block) =>
                block.id === blockId ? { ...block, data: nextData } : block,
              ),
            };
            scheduleSave(nextManifest);
            return nextManifest;
          });
        }}
      />
    </>
  );
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ManifestPreviewApp />
  </React.StrictMode>
);
