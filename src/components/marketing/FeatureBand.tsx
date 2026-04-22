import Image from "next/image";
import { SurfacePanel } from "@/components/ui/SurfacePanel";

const featureBands = [
  {
    title: "Start quickly without losing the mood",
    body: "Guided setup gets you into the fiction in minutes without flattening the ritual.",
    image: "/og/play-surface.png",
    alt: "The active prompt writing surface",
  },
  {
    title: "Let the archive carry the centuries",
    body: "Memories, losses, and return paths stay readable without becoming admin.",
    image: "/og/archive-surface.png",
    alt: "The archive route with memory cards and event timeline",
  },
  {
    title: "Preserve authorship",
    body: "The product holds the rules and consequences still. The writing remains yours.",
    image: "/og/recap-surface.png",
    alt: "The recap route leading back into the current prompt",
  },
];

export function FeatureBand() {
  return (
    <div className="mx-auto grid max-w-shell gap-4 px-4 pb-12 sm:px-6 lg:grid-cols-3 lg:px-10">
      {featureBands.map((feature) => (
        <SurfacePanel
          key={feature.title}
          className="overflow-hidden px-5 py-5 sm:px-6 sm:py-6"
        >
          <div className="relative aspect-[4/3] overflow-hidden rounded-panel border border-ink/8">
            <Image
              src={feature.image}
              alt={feature.alt}
              fill
              className="object-cover"
              sizes="(min-width: 1024px) 30vw, 100vw"
            />
          </div>
          <h2 className="mt-4 font-heading text-3xl leading-tight text-ink">
            {feature.title}
          </h2>
          <p className="mt-3 text-base leading-relaxed text-ink-muted">
            {feature.body}
          </p>
        </SurfacePanel>
      ))}
    </div>
  );
}
