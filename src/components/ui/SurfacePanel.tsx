import type { ComponentPropsWithoutRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const surfacePanelVariants = cva(
  "rounded-panel border border-ink/10 bg-surface/95 text-ink shadow-float backdrop-blur-sm transition-colors duration-240 ease-ritual",
  {
    variants: {
      tone: {
        default: "",
        muted: "bg-surface-muted/90",
        nocturne: "border-gold/20 bg-nocturne text-surface",
      },
    },
    defaultVariants: {
      tone: "default",
    },
  },
);

type SurfacePanelProps = ComponentPropsWithoutRef<"section"> &
  VariantProps<typeof surfacePanelVariants>;

export function SurfacePanel({
  className,
  tone,
  "data-tone": dataTone,
  ...props
}: SurfacePanelProps) {
  return (
    <section
      data-tone={tone === "nocturne" ? "nocturne" : dataTone}
      className={cn(surfacePanelVariants({ tone }), className)}
      {...props}
    />
  );
}
