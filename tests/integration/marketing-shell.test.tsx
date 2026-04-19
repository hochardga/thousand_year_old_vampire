import { render, screen } from "@testing-library/react";
import { HeroPanel } from "@/components/marketing/HeroPanel";

describe("marketing shell", () => {
  it("renders the approved hero copy and primary CTA", () => {
    render(<HeroPanel />);

    expect(
      screen.getByRole("heading", {
        name: "Enter the vampire's life before the rules get in the way.",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("A guided digital ritual for a solitary gothic life."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Begin the Chronicle" }),
    ).toHaveAttribute("href", "/sign-in");
  });
});
