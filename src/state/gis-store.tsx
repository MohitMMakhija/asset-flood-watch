import { useQuery } from "@tanstack/react-query";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { loadGisData } from "@/lib/gis/data";
import type { AssetKind, GisData, RiskLevel } from "@/lib/gis/types";

export type Selection =
  | { type: "flood"; id: string }
  | { type: "asset"; id: string }
  | null;

export interface LayerVisibility {
  flood: boolean;
  substation: boolean;
  ohl: boolean;
  cable: boolean;
}

export interface Filters {
  assetType: AssetKind | "all";
  risk: RiskLevel | "all";
}

/** Cross-page filter set from the map when drilling into a Flood Warning Area. */
export interface FloodFilter {
  id: string;
  name: string;
}

interface GisContextValue {
  data: GisData | undefined;
  isLoading: boolean;
  error: Error | null;
  layers: LayerVisibility;
  toggleLayer: (key: keyof LayerVisibility) => void;
  setLayers: (next: LayerVisibility) => void;
  filters: Filters;
  setFilters: (next: Partial<Filters>) => void;
  selection: Selection;
  select: (next: Selection) => void;
  /** increments whenever the map should fly to the current selection */
  zoomNonce: number;
  zoomToSelection: (next: Selection) => void;
  resetNonce: number;
  resetView: () => void;
  floodFilter: FloodFilter | null;
  setFloodFilter: (next: FloodFilter | null) => void;
}


const GisContext = createContext<GisContextValue | null>(null);

export function GisProvider({ children }: { children: ReactNode }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["gis-data"],
    queryFn: loadGisData,
    staleTime: Infinity,
    gcTime: Infinity,
    retry: 1,
  });

  const [layers, setLayersState] = useState<LayerVisibility>({
    flood: true,
    substation: true,
    ohl: true,
    cable: true,
  });
  const [filters, setFiltersState] = useState<Filters>({ assetType: "all", risk: "all" });
  const [selection, setSelection] = useState<Selection>(null);
  const [zoomNonce, setZoomNonce] = useState(0);
  const [resetNonce, setResetNonce] = useState(0);
  const [floodFilter, setFloodFilter] = useState<FloodFilter | null>(null);


  const toggleLayer = useCallback((key: keyof LayerVisibility) => {
    setLayersState((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const setFilters = useCallback((next: Partial<Filters>) => {
    setFiltersState((prev) => ({ ...prev, ...next }));
  }, []);

  const zoomToSelection = useCallback((next: Selection) => {
    setSelection(next);
    setZoomNonce((n) => n + 1);
  }, []);

  const resetView = useCallback(() => {
    setSelection(null);
    setFiltersState({ assetType: "all", risk: "all" });
    setLayersState({ flood: true, substation: true, ohl: true, cable: true });
    setResetNonce((n) => n + 1);
  }, []);

  const value = useMemo<GisContextValue>(
    () => ({
      data,
      isLoading,
      error: (error as Error) ?? null,
      layers,
      toggleLayer,
      setLayers: setLayersState,
      filters,
      setFilters,
      selection,
      select: setSelection,
      zoomNonce,
      zoomToSelection,
      resetNonce,
      resetView,
      floodFilter,
      setFloodFilter,
    }),
    [
      data,
      isLoading,
      error,
      layers,
      toggleLayer,
      filters,
      setFilters,
      selection,
      zoomNonce,
      zoomToSelection,
      resetNonce,
      resetView,
      floodFilter,
    ],
  );


  return <GisContext.Provider value={value}>{children}</GisContext.Provider>;
}

export function useGis() {
  const ctx = useContext(GisContext);
  if (!ctx) throw new Error("useGis must be used inside GisProvider");
  return ctx;
}
