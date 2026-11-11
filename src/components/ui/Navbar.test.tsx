import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Navbar from "./Navbar";

describe("Navbar", () => {
  it("renders logo and navigation links", () => {
    render(<Navbar />);

    expect(screen.getByRole("link", { name: /cinema view/i })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "Movies" })).toHaveAttribute("href", "/movies");
    expect(screen.getByRole("button", { name: /cari film/i })).toBeInTheDocument();
  });
});
