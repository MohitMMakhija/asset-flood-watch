/** Builds a CARTO basemap tile URL, appending the CARTO Basemaps API key when configured. */
const CARTO_API_KEY = import.meta.env.VITE_CARTO_API_KEY as string | undefined;

export function cartoTileUrl(style: string) {
  const base = `https://{s}.basemaps.cartocdn.com/${style}/{z}/{x}/{y}{r}.png`;
  return CARTO_API_KEY ? `${base}?api_key=${encodeURIComponent(CARTO_API_KEY)}` : base;
}
