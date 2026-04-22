import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EmptyState } from "@/components/ui/EmptyState";
import { QuietAlert } from "@/components/ui/QuietAlert";
import { SkeletonBlock } from "@/components/ui/SkeletonBlock";

describe("phase 3 route-state primitives", () => {
  it("renders route-safe empty-state copy and CTA", () => {
    render(
      <EmptyState
        eyebrow="Empty state"
        title="No chronicle has been opened yet."
        body="Begin the first one when you are ready."
        actionHref="/sign-in"
        actionLabel="Begin the Chronicle"
      />,
    );

    expect(screen.getByText("Empty state")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "No chronicle has been opened yet." }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Begin the Chronicle" }),
    ).toHaveAttribute("href", "/sign-in");
  });

  it("renders quiet retry messaging without raw error text", () => {
    render(
      <QuietAlert
        title="The chronicle ledger could not be read just now."
        body="Try again when you are ready."
        actionLabel="Try again"
      />,
    );

    expect(
      screen.getByText("Try again when you are ready."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
  });

  it("marks skeleton regions as decorative placeholders", () => {
    const { container } = render(<SkeletonBlock className="h-20 w-full" />);
    expect(container.firstChild).toHaveAttribute("aria-hidden", "true");
  });
});
