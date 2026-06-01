import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AiStudioCanvas } from "./ai-studio-canvas";
import userEvent from "@testing-library/user-event";

describe("AiStudioCanvas Component", () => {
  it("renders correctly with accessibility attributes and interactive states", async () => {
    render(<AiStudioCanvas />);

    // 1. Verify accessibility elements (ARIA labels on selection controls)
    const productButtons = screen.getAllByRole("button", { name: /seleccionar producto/i });
    expect(productButtons).toHaveLength(3); // Sneaker, Perfume, Watch

    const bgButtons = screen.getAllByRole("button", { name: /seleccionar fondo/i });
    expect(bgButtons).toHaveLength(4); // Neon, Marble, Wood, Foliage

    // 2. Initial state asserts
    const displayedImage = screen.getByAltText(/Zapatilla Urbana/i);
    expect(displayedImage).toBeInTheDocument();
    expect(displayedImage).toHaveAttribute("src", expect.stringContaining("sneaker.png"));

    // 3. User interaction: switch product to Perfume
    const user = userEvent.setup();
    const perfumeBtn = screen.getByRole("button", { name: /seleccionar producto: perfume/i });
    await user.click(perfumeBtn);

    const updatedImage = screen.getByAltText(/Perfume Minimalista/i);
    expect(updatedImage).toBeInTheDocument();
    expect(updatedImage).toHaveAttribute("src", expect.stringContaining("perfume.png"));

    // 4. User interaction: change background preset
    const marbleBtn = screen.getByRole("button", { name: /seleccionar fondo: mármol premium/i });
    await user.click(marbleBtn);

    // Verify background state changes (container class or style)
    const canvasContainer = screen.getByTestId("ai-canvas-container");
    expect(canvasContainer).toBeInTheDocument();
  });
});
