import { SurfacePanel } from "@/components/ui/SurfacePanel";

type PromptCardProps = {
  promptMarkdown: string;
  promptNumber: number;
};

export function PromptCard({ promptMarkdown, promptNumber }: PromptCardProps) {
  return (
    <SurfacePanel className="space-y-4 px-5 py-5 sm:space-y-5 sm:px-8 sm:py-6">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.24em] text-ink-muted">
          Active prompt
        </p>
        <h2 className="mt-3 font-heading text-3xl leading-tight text-ink sm:text-4xl">
          Prompt {promptNumber}
        </h2>
      </div>
      <p className="max-w-reading text-base leading-relaxed text-ink sm:text-lg">
        {promptMarkdown}
      </p>
    </SurfacePanel>
  );
}
