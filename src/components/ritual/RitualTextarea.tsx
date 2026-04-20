"use client";

type RitualTextareaProps = {
  hint?: string;
  label: string;
  name: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  value: string;
};

export function RitualTextarea({
  hint,
  label,
  name,
  onChange,
  placeholder,
  rows = 5,
  value,
}: RitualTextareaProps) {
  return (
    <div className="space-y-3">
      <label
        htmlFor={name}
        className="font-mono text-xs uppercase tracking-[0.22em] text-ink-muted"
      >
        {label}
      </label>
      <textarea
        id={name}
        name={name}
        rows={rows}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="min-h-32 w-full rounded-soft border border-ink/10 bg-bg/70 px-4 py-3 text-base leading-relaxed text-ink shadow-inner shadow-ink/5 outline-none transition-colors duration-160 ease-ritual placeholder:text-ink-muted/70 focus:border-gold/70"
      />
      {hint ? (
        <p className="text-sm leading-relaxed text-ink-muted">{hint}</p>
      ) : null}
    </div>
  );
}
