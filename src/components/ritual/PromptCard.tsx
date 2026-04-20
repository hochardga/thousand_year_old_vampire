import { SurfacePanel } from "@/components/ui/SurfacePanel";

type PromptCardProps = {
  promptMarkdown: string;
  promptNumber: number;
};

export function PromptCard({ promptMarkdown, promptNumber }: PromptCardProps) {
  return (
    <SurfacePanel className="space-y-5 px-6 py-6 sm:px-8">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.24em] text-ink-muted">
          Active prompt
        </p>
        <h2 className="mt-3 font-heading text-4xl leading-tight text-ink">
          Prompt {promptNumber}
        </h2>
      </div>
      <p className="max-w-reading text-lg leading-relaxed text-ink">
        {promptMarkdown}
      </p>
    </SurfacePanel>
  );
}
