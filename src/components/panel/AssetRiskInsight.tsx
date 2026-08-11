import { Sparkles } from "lucide-react";
import { useCallback, useState } from "react";

import { RiskBadge } from "@/components/common/RiskBadge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { generateAssetRiskInsight, type AssetRiskInsight } from "@/lib/ai/asset-insight";
import type { AssetProperties } from "@/lib/gis/types";

function List({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <section>
      <h3 className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h3>
      <ul className="space-y-1.5 text-[12.5px] leading-relaxed">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="mt-[7px] size-1.5 shrink-0 rounded-full bg-brand" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function AssetRiskInsightAction({ asset }: { asset: AssetProperties }) {
  const [open, setOpen] = useState(false);
  const [insight, setInsight] = useState<AssetRiskInsight | null>(null);
  const [busy, setBusy] = useState(false);

  const run = useCallback(async () => {
    setOpen(true);
    setBusy(true);
    setInsight(await generateAssetRiskInsight(asset));
    setBusy(false);
  }, [asset]);

  return (
    <>
      <button
        type="button"
        onClick={run}
        title="Generate a risk insight from this asset's data (AI Risk Insight Preview)"
        className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-sm border border-primary/50 bg-primary/10 px-2.5 py-1.5 text-[12px] font-medium text-primary transition-colors hover:bg-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Sparkles className="size-3.5" />✦ AI Risk Insight
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          overlayClassName="z-[3000]"
          className="z-[3001] flex max-h-[88vh] w-[calc(100vw-2rem)] max-w-3xl flex-col gap-4 overflow-hidden"
        >
          <DialogHeader className="shrink-0">
            <DialogTitle className="text-[15px]">✦ AI Risk Insight Preview</DialogTitle>
            <DialogDescription className="text-[11.5px]">
              Future AI capability. This insight is generated locally from the selected asset's
              recorded data using deterministic logic — no LLM or external AI service is used at
              this stage.
            </DialogDescription>
          </DialogHeader>

          <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-y-auto md:grid-cols-[minmax(0,260px)_minmax(0,1fr)]">
            {/* Supporting context: asset + locator map */}
            <aside className="order-1 min-w-0 space-y-3 rounded-md border border-border bg-muted/30 p-3">
              <div>
                <h3 className="text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Selected asset
                </h3>
                <p className="mt-1 break-words text-[13px] font-semibold">{asset.name}</p>
                <p className="text-[11.5px] uppercase text-muted-foreground">{asset.kind}</p>
              </div>
              <AssetContextMap asset={asset} />
              <dl className="space-y-1 text-[11.5px]">
                {asset.voltage && (
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted-foreground">Voltage</dt>
                    <dd className="text-right">{asset.voltage}</dd>
                  </div>
                )}
                {asset.status && (
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted-foreground">Status</dt>
                    <dd className="text-right">{asset.status}</dd>
                  </div>
                )}
                {asset.lat != null && asset.lng != null && (
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted-foreground">Location</dt>
                    <dd className="text-right">
                      {asset.lat.toFixed(4)}, {asset.lng.toFixed(4)}
                    </dd>
                  </div>
                )}
                {asset.floodNames.length > 0 && (
                  <div>
                    <dt className="text-muted-foreground">Flood warning areas</dt>
                    <dd className="mt-0.5 break-words">{asset.floodNames.join(", ")}</dd>
                  </div>
                )}
              </dl>
            </aside>

            {/* Primary focus: the AI insight */}
            <div className="relative order-2 min-w-0">
              {busy || !insight ? (
                <p className="py-6 text-[12.5px] text-muted-foreground">
                  Analysing selected asset data…
                </p>
              ) : (
                <div className="space-y-4">
                  <section>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-[13.5px] font-semibold">{insight.headline}</h3>
                      {!insight.insufficientData && <RiskBadge risk={insight.risk} />}
                    </div>
                    <h4 className="mt-2 text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Risk assessment
                    </h4>
                    <p className="mt-1 text-[12.5px] leading-relaxed">{insight.assessment}</p>
                  </section>

                  <List title="Why this asset is at risk" items={insight.reasons} />
                  <List title="Recommended focus" items={insight.recommendedFocus} />

                  <p className="border-t border-border pt-2 text-[10.5px] text-muted-foreground">
                    Generated {new Date(insight.generatedAt).toLocaleString()} · local deterministic
                    generator · replaceable with Azure-hosted AI processing
                  </p>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
