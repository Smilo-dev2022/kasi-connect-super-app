import { render, screen } from "@testing-library/react";
import AppHeader from "../AppHeader";

describe("AppHeader", () => {
  it("renders the provided title", () => {
    render(<AppHeader title="Dashboard" />);
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
  });
});
