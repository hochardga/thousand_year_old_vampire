import { render, screen } from "@testing-library/react";
import MarketingPage from "@/app/(marketing)/page";

describe("marketing shell", () => {
  it("renders the approved hero copy and primary CTA", () => {
    render(<MarketingPage />);

    expect(
      screen.getByRole("heading", {
        name: "Enter the vampire's life before the rules get in the way.",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Private beta. Cross-device. Quietly guided."),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Built for players who want the literary depth of the original without the analog burden, while the launch remains deliberately small.",
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
    expect(screen.getAllByText(/private beta/i)).toHaveLength(2);
  });
});
