import { Home, Maximize2, Minimize2 } from "lucide-react";
import { useState } from "react";

import { useGis } from "@/state/gis-store";

export function MapToolbar({ containerRef }: { containerRef: React.RefObject<HTMLDivElement | null> }) {
  const { resetView } = useGis();
  const [full, setFull] = useState(false);

  const toggleFullscreen = async () => {
    const el = containerRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      await document.exitFullscreen();
      setFull(false);
    } else {
      await el.requestFullscreen();
      setFull(true);
    }
  };

  return (
    <div className="pointer-events-auto flex flex-col overflow-hidden rounded-sm border border-border bg-chrome/95">
      <button
        onClick={resetView}
        title="Home / reset view"
        className="border-b border-border p-1.5 text-foreground hover:bg-accent"
      >
        <Home className="size-4" />
      </button>
      <button
        onClick={toggleFullscreen}
        title="Fullscreen"
        className="p-1.5 text-foreground hover:bg-accent"
      >
        {full ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
      </button>
    </div>
  );
}
