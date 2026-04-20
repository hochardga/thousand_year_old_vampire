import { render, screen } from "@testing-library/react";
import { AuthForm } from "@/components/ui/AuthForm";

describe("sign-in shell", () => {
  it("renders the quiet magic-link form contract", () => {
    render(<AuthForm action={async () => {}} next="/chronicles" />);

    expect(screen.getByLabelText("Email address")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Send the Link" }),
    ).toBeInTheDocument();
    expect(screen.getByDisplayValue("/chronicles")).toHaveAttribute(
      "type",
      "hidden",
    );
  });
});
