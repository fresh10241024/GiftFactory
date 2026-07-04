import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { GiftRenderer } from "./manifest-renderer/GiftRenderer";
import { loadManifestFromUrl } from "./manifest-renderer/loadManifest";
import type { GiftManifest } from "./manifest-renderer/types";

function ManifestPreviewApp() {
  const [manifest, setManifest] = useState<GiftManifest | null>(null);
  const [source, setSource] = useState("");
  const [error, setError] = useState("");

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
      </div>
      <GiftRenderer manifest={manifest} />
    </>
  );
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ManifestPreviewApp />
  </React.StrictMode>
);
