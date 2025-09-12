import { render, screen } from "@testing-library/react";
import Hero from "../Hero";

describe("Hero", () => {
  it("shows brand and primary CTAs", () => {
    render(<Hero />);
    expect(screen.getByText("KasiLink")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /join the community/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /learn more/i }),
    ).toBeInTheDocument();
  });
});
