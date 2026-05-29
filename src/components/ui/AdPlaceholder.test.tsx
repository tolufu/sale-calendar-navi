import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AdPlaceholder } from "@/components/ui/AdPlaceholder";

describe("AdPlaceholder", () => {
  it("広告ラベルと差し替え用slotを表示する", () => {
    const { container } = render(<AdPlaceholder label="本文広告" slot="article-inline" />);
    expect(screen.getByText("Advertisement")).toBeInTheDocument();
    expect(screen.getByText("本文広告（審査前プレースホルダー）")).toBeInTheDocument();
    expect(container.querySelector("[data-ad-slot='article-inline']")).toBeInTheDocument();
  });
});
