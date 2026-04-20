import { SurfacePanel } from "@/components/ui/SurfacePanel";
import { HeroPanel } from "@/components/marketing/HeroPanel";

const valueProps = [
  {
    title: "Start quickly without losing the mood",
    body: "Guided setup helps the fiction arrive before the bookkeeping starts to crowd it.",
  },
  {
    title: "Let the archive carry the centuries",
    body: "The chronicle keeps the memories, losses, and returning threads in reach without turning into admin.",
  },
  {
    title: "Preserve authorship",
    body: "The app structures the ritual and protects the consequences. Your writing remains the artifact.",
  },
];

export default function MarketingPage() {
  return (
    <main className="pb-10">
      <HeroPanel />
      <div className="mx-auto grid max-w-shell gap-4 px-4 pb-10 sm:px-6 lg:grid-cols-3 lg:px-10">
        {valueProps.map((valueProp) => (
          <SurfacePanel
            key={valueProp.title}
            className="px-5 py-5 sm:px-6 sm:py-6"
          >
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-ink-muted">
              Why it matters
            </p>
            <h2 className="mt-3 font-heading text-3xl leading-tight text-ink">
              {valueProp.title}
            </h2>
            <p className="mt-3 text-base leading-relaxed text-ink-muted">
              {valueProp.body}
            </p>
          </SurfacePanel>
        ))}
      </div>
    </main>
  );
}
