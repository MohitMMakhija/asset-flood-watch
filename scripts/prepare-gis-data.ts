import * as shp from "shapefile";
import proj4 from "proj4";
import RBush from "rbush";
import booleanIntersects from "@turf/boolean-intersects";
import simplify from "@turf/simplify";
import { writeFileSync } from "fs";

const BNG =
  "+proj=tmerc +lat_0=49 +lon_0=-2 +k=0.9996012717 +x_0=400000 +y_0=-100000 +ellps=airy +towgs84=446.448,-125.157,542.06,0.15,0.247,0.842,-20.489 +units=m +no_defs";
const toWgs = proj4(BNG, "EPSG:4326");

type Feat = { type: "Feature"; properties: any; geometry: any };

async function read(path: string): Promise<Feat[]> {
  const src = await shp.open(path + ".shp", path + ".dbf");
  const out: Feat[] = [];
  while (true) {
    const r = await src.read();
    if (r.done) break;
    if (r.value?.geometry) out.push(r.value as Feat);
  }
  return out;
}

function eachRing(geom: any, cb: (ring: number[][]) => void) {
  const t = geom.type;
  if (t === "LineString") cb(geom.coordinates);
  else if (t === "MultiLineString" || t === "Polygon") geom.coordinates.forEach(cb);
  else if (t === "MultiPolygon") geom.coordinates.forEach((p: any) => p.forEach(cb));
  else if (t === "Point") cb([geom.coordinates]);
  else if (t === "MultiPoint") cb(geom.coordinates);
}

function bbox(geom: any): [number, number, number, number] {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  eachRing(geom, (r) => {
    for (const c of r) {
      if (c[0] < x0) x0 = c[0];
      if (c[0] > x1) x1 = c[0];
      if (c[1] < y0) y0 = c[1];
      if (c[1] > y1) y1 = c[1];
    }
  });
  return [x0, y0, x1, y1];
}

function segDist(p: number[], a: number[], b: number[]) {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const l2 = dx * dx + dy * dy;
  let t = l2 === 0 ? 0 : ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / l2;
  t = Math.max(0, Math.min(1, t));
  const px = a[0] + t * dx - p[0], py = a[1] + t * dy - p[1];
  return Math.sqrt(px * px + py * py);
}

function segSegDist(a: number[], b: number[], c: number[], d: number[]) {
  return Math.min(segDist(a, c, d), segDist(b, c, d), segDist(c, a, b), segDist(d, a, b));
}

function minDistance(g1: any, g2: any, limit: number): number {
  const rings1: number[][][] = [];
  const rings2: number[][][] = [];
  eachRing(g1, (r) => rings1.push(r));
  eachRing(g2, (r) => rings2.push(r));
  let best = Infinity;
  for (const r1 of rings1) {
    for (const r2 of rings2) {
      for (let i = 0; i < r1.length - 1 || r1.length === 1; i++) {
        const a = r1[i], b = r1[Math.min(i + 1, r1.length - 1)];
        for (let j = 0; j < r2.length - 1 || r2.length === 1; j++) {
          const c = r2[j], e = r2[Math.min(j + 1, r2.length - 1)];
          const d = segSegDist(a, b, c, e);
          if (d < best) best = d;
          if (best <= 0) return 0;
          if (r2.length === 1) break;
        }
        if (r1.length === 1) break;
      }
    }
    if (best < limit * 0.0001) break;
  }
  return best;
}

function project(geom: any) {
  const map = (c: any): any =>
    typeof c[0] === "number" ? toWgs.forward(c).map((v: number) => Math.round(v * 1e6) / 1e6) : c.map(map);
  return { type: geom.type, coordinates: map(geom.coordinates) };
}

const BUFFER = 250;

console.log("reading...");
const [subs, ohl, cab, fwaRaw] = await Promise.all([
  read("Substations/Substations"),
  read("OHL/OHL"),
  read("CABLE/CABLE"),
  read("Flood_Warning_Areas.shp/Flood_Warning_Areas"),
]);
console.log(subs.length, ohl.length, cab.length, fwaRaw.length);

// Simplify flood polygons in BNG metres (tolerance 15 m keeps intersection reliable)
const fwa = fwaRaw.map((f) => {
  let g = f.geometry;
  try {
    g = simplify({ type: "Feature", properties: {}, geometry: g } as any, {
      tolerance: 15,
      highQuality: false,
      mutate: true,
    }).geometry;
  } catch {}
  return { ...f, geometry: g };
});

type Node = { minX: number; minY: number; maxX: number; maxY: number; i: number };
const tree = new RBush<Node>();
tree.load(
  fwa.map((f, i) => {
    const [x0, y0, x1, y1] = bbox(f.geometry);
    return { minX: x0, minY: y0, maxX: x1, maxY: y1, i };
  }),
);

function classify(geom: any, intersectLevel: "HIGH" | "MEDIUM") {
  const [x0, y0, x1, y1] = bbox(geom);
  const cands = tree.search({
    minX: x0 - BUFFER,
    minY: y0 - BUFFER,
    maxX: x1 + BUFFER,
    maxY: y1 + BUFFER,
  });
  const hit: number[] = [];
  const near: number[] = [];
  const gf = { type: "Feature", properties: {}, geometry: geom } as any;
  for (const c of cands) {
    const ff = { type: "Feature", properties: {}, geometry: fwa[c.i].geometry } as any;
    let inter = false;
    try {
      inter = booleanIntersects(gf, ff);
    } catch {}
    if (inter) hit.push(c.i);
    else if (minDistance(geom, fwa[c.i].geometry, BUFFER) <= BUFFER) near.push(c.i);
  }
  const codes = (hit.length ? hit : near).map((i) => fwa[i].properties.fws_tacode);
  const names = (hit.length ? hit : near).map((i) => fwa[i].properties.ta_name);
  return {
    risk: hit.length ? intersectLevel : near.length ? "LOW" : "SAFE",
    floodCodes: codes.slice(0, 8),
    floodNames: names.slice(0, 8),
  };
}

function centroid(geom: any) {
  let sx = 0, sy = 0, n = 0;
  eachRing(geom, (r) => r.forEach((c) => { sx += c[0]; sy += c[1]; n++; }));
  return [sx / n, sy / n];
}

function build(
  feats: Feat[],
  kind: "substation" | "ohl" | "cable",
  level: "HIGH" | "MEDIUM",
  map: (p: any) => any,
) {
  const out = feats.map((f, idx) => {
    const r = classify(f.geometry, level);
    const props = { id: `${kind}-${idx}`, kind, ...map(f.properties), ...r };
    if (kind === "substation") {
      const c = toWgs.forward(centroid(f.geometry));
      (props as any).lng = Math.round(c[0] * 1e6) / 1e6;
      (props as any).lat = Math.round(c[1] * 1e6) / 1e6;
    }
    return { type: "Feature", properties: props, geometry: project(f.geometry) };
  });
  console.log(kind, "done", out.filter((f) => f.properties.risk !== "SAFE").length, "at risk");
  return { type: "FeatureCollection", features: out };
}

const str = (v: any) => (v === null || v === undefined || v === "" ? null : String(v).trim());

const subsOut = build(subs, "substation", "HIGH", (p) => ({
  name: str(p.Substation) ?? str(p.SUBSTATION) ?? "Unnamed substation",
  voltage: str(p.OPERATING_),
  status: str(p.STATUS),
  gid: p.GDO_GID,
}));
const ohlOut = build(ohl, "ohl", "MEDIUM", (p) => ({
  name: str(p.CIRCUIT1) ?? "Unnamed circuit",
  voltage: str(p.OPERATING_),
  towers: str(p.Towers_In),
  status: str(p.STATUS),
  gid: p.GDO_GID,
}));
const cabOut = build(cab, "cable", "MEDIUM", (p) => ({
  name: str(p.CABLE_ROUT) ?? "Unnamed cable route",
  voltage: str(p.OPERATING_),
  cableType: str(p.CABLE_TYPE),
  status: str(p.STATUS),
  gid: p.GDO_GID,
}));

const fwaOut = {
  type: "FeatureCollection",
  features: fwa.map((f) => ({
    type: "Feature",
    properties: {
      id: str(f.properties.fws_tacode),
      kind: "flood",
      name: str(f.properties.ta_name) ?? "Flood Warning Area",
      river: str(f.properties.river_sea),
      authority: str(f.properties.la_name),
      description: str(f.properties.descrip),
      area: str(f.properties.area),
    },
    geometry: project(f.geometry),
  })),
};

writeFileSync("out-flood.geojson", JSON.stringify(fwaOut));
writeFileSync("out-substations.geojson", JSON.stringify(subsOut));
writeFileSync("out-ohl.geojson", JSON.stringify(ohlOut));
writeFileSync("out-cables.geojson", JSON.stringify(cabOut));
console.log("written");
