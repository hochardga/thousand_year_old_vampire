type LoadingAnnouncementProps = {
  label?: string;
};

export function LoadingAnnouncement({
  label = "Loading the next passage.",
}: LoadingAnnouncementProps) {
  return (
    <div role="status" aria-live="polite" className="sr-only">
      {label}
    </div>
  );
}
