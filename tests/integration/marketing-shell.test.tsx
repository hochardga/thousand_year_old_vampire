import { render, screen } from "@testing-library/react";
import MarketingPage from "@/app/(marketing)/page";

describe("marketing shell", () => {
  it("renders the approved hero copy and primary CTA", () => {
    render(<MarketingPage />);

    expect(
      screen.getByText("A guided digital ritual for a solitary gothic life."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "Enter the vampire's life before the rules get in the way.",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "A faithful digital edition for players who want the literary depth of the original without the analog burden.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", {
        name: "Begin the Chronicle",
      }),
    ).toHaveAttribute("href", "/sign-in");
  });

  it("renders the three launch value bands and beta posture note", () => {
    render(<MarketingPage />);

    expect(
      screen.getByRole("heading", {
        name: "Start quickly without losing the mood",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "Let the archive carry the centuries",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "Preserve authorship",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "This beta is a careful adaptation in progress. The product is public enough to explain itself, but not presented as a broad official release while launch conditions are still being clarified.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByAltText("The active prompt writing surface"),
    ).toBeInTheDocument();
    expect(
      screen.getByAltText("The archive route with memory cards and event timeline"),
    ).toBeInTheDocument();
    expect(
      screen.getByAltText("The recap route leading back into the current prompt"),
    ).toBeInTheDocument();
  });
});
