import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import MarketingLoading from "@/app/(marketing)/loading";
import ChroniclesLoading from "@/app/(app)/chronicles/loading";
import ChronicleSegmentLoading from "@/app/(app)/chronicles/[chronicleId]/loading";

describe("route loading boundaries", () => {
  it("announces loading state accessibly while keeping skeletons decorative", () => {
    const { rerender } = render(<MarketingLoading />);

    expect(screen.getByRole("status")).toHaveAttribute("aria-live", "polite");
    expect(screen.getByText("Loading the next passage.")).toBeInTheDocument();

    rerender(<ChroniclesLoading />);
    expect(screen.getByRole("status")).toHaveAttribute("aria-live", "polite");
    expect(screen.getByText("Loading the next passage.")).toBeInTheDocument();

    rerender(<ChronicleSegmentLoading />);
    expect(screen.getByRole("status")).toHaveAttribute("aria-live", "polite");
    expect(screen.getByText("Loading the next passage.")).toBeInTheDocument();
  });
});
