"use client";

import { Component, type ReactNode } from "react";

/**
 * Catches a 3D scene that crashes while rendering and shows the given fallback
 * (the 2D seat map) instead of an empty viewport.
 */
export default class SceneErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
