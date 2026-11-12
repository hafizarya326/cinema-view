import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import SceneErrorBoundary from "./SceneErrorBoundary";

function BrokenScene(): never {
  throw new Error("scene crashed");
}

describe("SceneErrorBoundary", () => {
  it("shows the fallback when the scene throws", () => {
    // React logs caught render errors; keep the test output clean.
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    render(
      <SceneErrorBoundary fallback={<p>Peta kursi 2D</p>}>
        <BrokenScene />
      </SceneErrorBoundary>,
    );

    expect(screen.getByText("Peta kursi 2D")).toBeInTheDocument();
    expect(screen.queryByText("Scene 3D")).toBeNull();
    consoleError.mockRestore();
  });

  it("renders the scene while it works", () => {
    render(
      <SceneErrorBoundary fallback={<p>Peta kursi 2D</p>}>
        <p>Scene 3D</p>
      </SceneErrorBoundary>,
    );

    expect(screen.getByText("Scene 3D")).toBeInTheDocument();
  });
});
