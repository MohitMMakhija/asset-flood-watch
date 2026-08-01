import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Flood Impact Assessment | National Grid" },
      {
        name: "description",
        content:
          "Methodology, data sources and scope of the National Grid flood impact assessment proof of concept.",
      },
      { property: "og:title", content: "About the Flood Impact Assessment POC" },
      {
        property: "og:description",
        content: "Data sources, coordinate handling and GIS risk classification rules.",
      },
    ],
  }),
  component: About,
});

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-4 rounded-sm border border-border bg-card p-4">
      <h2 className="mb-2 text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h2>
      <div className="space-y-2 text-[12.5px] leading-relaxed">{children}</div>
    </section>
  );
}

function About() {
  return (
    <div className="h-full overflow-auto p-4">
      <h1 className="mb-1 text-[15px] font-semibold">About this Proof of Concept</h1>
      <p className="mb-4 max-w-3xl text-[12.5px] text-muted-foreground">
        Identify National Grid electricity assets that are spatially exposed to Environment Agency
        Flood Warning Areas.
      </p>

      <div className="max-w-3xl">
        <Section title="Data sources">
          <ul className="list-inside list-disc space-y-1">
            <li>Environment Agency Flood Warning Areas — 3,426 MultiPolygon features</li>
            <li>National Grid Substations — 592 Polygon site footprints</li>
            <li>National Grid Overhead Lines — 763 LineString features</li>
            <li>National Grid Underground Cables — 3,996 LineString features</li>
          </ul>
          <p className="text-muted-foreground">
            All map features, counts and risk classifications derive from these uploaded shapefiles.
            No synthetic assets, flood areas or risk results are generated.
          </p>
        </Section>

        <Section title="Coordinate reference systems">
          <p>
            The source shapefiles use British National Grid (EPSG:27700). They are reprojected once,
            during preprocessing, to WGS84 (EPSG:4326) for web mapping. Flood Warning Area geometry
            is simplified with a 15 m tolerance in projected metres — small enough that intersection
            results remain reliable, large enough for smooth rendering of 3,426 polygons.
          </p>
        </Section>

        <Section title="Risk classification (GIS only)">
          <ul className="list-inside list-disc space-y-1">
            <li>
              <strong>High</strong> — substation polygon footprint intersects a Flood Warning Area.
            </li>
            <li>
              <strong>Medium</strong> — overhead line or cable geometry intersects a Flood Warning
              Area.
            </li>
            <li>
              <strong>Low</strong> — no intersection, but within 250 m of a Flood Warning Area.
            </li>
            <li>
              <strong>Safe</strong> — no intersection and beyond 250 m.
            </li>
          </ul>
          <p className="text-muted-foreground">
            Substation exposure is tested against the real polygon footprint, never the centroid;
            centroid markers exist for visualisation only. Classification uses geometric predicates
            and planar distance in metres — no scores, no models, no AI.
          </p>
        </Section>

        <Section title="Performance approach">
          <p>
            Shapefile parsing, reprojection, simplification and the intersection / proximity
            analysis run once in a preprocessing step (scripts/prepare-gis-data.ts) using an R-tree
            bounding-box index over the flood polygons. The application loads optimised GeoJSON and
            renders it with canvas layers, so the demo starts quickly and stays responsive.
          </p>
        </Section>
      </div>
    </div>
  );
}
