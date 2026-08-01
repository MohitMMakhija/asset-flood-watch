import type { ReactNode } from "react";

import { Header } from "./Header";
import { LeftNav } from "./LeftNav";
import { StatusBar } from "./StatusBar";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <Header />
      <div className="flex min-h-0 flex-1">
        <LeftNav />
        <main className="min-w-0 flex-1 overflow-hidden">{children}</main>
      </div>
      <StatusBar />
    </div>
  );
}
