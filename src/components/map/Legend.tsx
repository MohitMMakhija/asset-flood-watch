const rows = [
  { label: "Flood Warning Area", className: "bg-layer-flood/30 border-layer-flood" },
  { label: "Substation", className: "bg-layer-substation border-layer-substation" },
  { label: "Overhead Line", className: "bg-layer-ohl border-layer-ohl", line: true },
  { label: "Underground Cable", className: "bg-layer-cable border-layer-cable", line: true },
  { label: "High risk", className: "bg-risk-high border-risk-high" },
  { label: "Medium risk", className: "bg-risk-medium border-risk-medium" },
  { label: "Low risk (within 250 m)", className: "bg-risk-low border-risk-low" },
];

export function Legend() {
  return (
    <div className="pointer-events-auto w-56 rounded-sm border border-border bg-chrome/95 p-2.5 backdrop-blur">
      <p className="mb-2 text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">
        Legend
      </p>
      <ul className="space-y-1.5">
        {rows.map((row) => (
          <li key={row.label} className="flex items-center gap-2 text-[11.5px]">
            <span
              className={`shrink-0 border ${row.className} ${
                row.line ? "h-0.5 w-4" : "size-3 rounded-[1px]"
              }`}
            />
            <span className="truncate">{row.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
