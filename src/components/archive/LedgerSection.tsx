import type { ReactNode } from "react";
import { SurfacePanel } from "@/components/ui/SurfacePanel";

type LedgerSectionProps = {
  children: ReactNode;
  description: string;
  title: string;
};

export function LedgerSection({ children, description, title }: LedgerSectionProps) {
  return (
    <SurfacePanel className="px-5 py-5 sm:px-6 sm:py-6">
      <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-ink-muted">
        Ledger section
      </p>
      <h2 className="mt-3 font-heading text-3xl leading-tight text-ink">
        {title}
      </h2>
      <p className="mt-2 max-w-reading text-sm leading-relaxed text-ink-muted">
        {description}
      </p>
      <div className="mt-5">{children}</div>
    </SurfacePanel>
  );
}
