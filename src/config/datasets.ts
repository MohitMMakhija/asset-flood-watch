/**
 * Single source of truth for GIS dataset locations.
 * Files are served statically from `public/data/` by Vite (dev, build & preview).
 */
export const GIS_DATASETS = {
  flood: "/data/flood.geojson",
  substations: "/data/substations.geojson",
  ohl: "/data/ohl.geojson",
  cables: "/data/cables.geojson",
} as const;
