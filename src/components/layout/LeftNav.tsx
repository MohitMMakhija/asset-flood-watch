import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, Map, AlertTriangle, Info, Sparkles } from "lucide-react";

const items = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/map", label: "Map", icon: Map },
  { to: "/assets-at-risk", label: "Assets at Risk", icon: AlertTriangle },
  { to: "/about", label: "About", icon: Info },
  { to: "/future-ai-enhancements", label: "Future AI Enhancements", icon: Sparkles },
] as const;


export function LeftNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav className="flex w-14 shrink-0 flex-col border-r border-border bg-chrome py-2 lg:w-48">
      {items.map((item) => {
        const active = pathname === item.to;
        return (
          <Link
            key={item.to}
            to={item.to}
            title={item.label}
            className={`flex items-center gap-3 border-l-2 px-4 py-2.5 text-[12.5px] tracking-wide transition-colors ${
              active
                ? "border-l-primary bg-accent font-semibold text-primary"
                : "border-l-transparent text-muted-foreground hover:bg-secondary hover:text-primary"
            }`}
          >
            <item.icon className="size-4 shrink-0" />
            <span className="hidden lg:inline">{item.label}</span>
          </Link>
        );
      })}
      <div className="mt-auto hidden px-4 py-3 text-[10.5px] leading-relaxed text-muted-foreground lg:block">
        <div className="num">EPSG:27700 → EPSG:4326</div>
        <div>Proof of Concept</div>
      </div>
    </nav>
  );
}
