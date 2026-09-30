/**
 * Basemap tile configuration.
 * Uses the free OpenStreetMap standard tile layer — no API key required.
 * Kept behind a single helper so the basemap can be swapped in one place.
 */
export function basemapTileUrl() {
  return "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
}

export const BASEMAP_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
