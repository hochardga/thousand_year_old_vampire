import { SurfacePanel } from "@/components/ui/SurfacePanel";

const guidanceItems = [
  {
    title: "What belongs in the entry?",
    body: "Write the immediate answer to the prompt: what the vampire did, chose, or suffered.",
  },
  {
    title: "What is an experience?",
    body: "Distill the lasting consequence into one sentence the chronicle can carry forward.",
  },
  {
    title: "How memories fill",
    body: "Each resolved prompt can set down another fragment until the mind reaches its limit.",
  },
  {
    title: "When the mind is full",
    body: "Choose which older memory to forget or move into a diary before the new experience can settle.",
  },
];

export function PlayGuidancePanel() {
  return (
    <SurfacePanel className="space-y-4 px-5 py-5">
      <p className="font-mono text-xs uppercase tracking-[0.22em] text-ink-muted">
        Keep your footing
      </p>
      <div className="space-y-4">
        {guidanceItems.map((item) => (
          <section key={item.title} className="space-y-1">
            <h2 className="text-sm font-medium text-ink">{item.title}</h2>
            <p className="text-sm leading-relaxed text-ink-muted">{item.body}</p>
          </section>
        ))}
      </div>
    </SurfacePanel>
  );
}
