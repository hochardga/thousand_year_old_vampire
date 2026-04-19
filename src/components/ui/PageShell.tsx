import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";

type PageShellProps = ComponentPropsWithoutRef<"div">;

export function PageShell({ className, ...props }: PageShellProps) {
  return (
    <div
      className={cn(
        "mx-auto flex min-h-screen w-full max-w-shell flex-col px-4 py-6 sm:px-6 lg:px-10 lg:py-10",
        className,
      )}
      {...props}
    />
  );
}
