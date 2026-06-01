import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StorefrontMotionCanvas } from "./storefront-motion-canvas";
import userEvent from "@testing-library/user-event";

describe("StorefrontMotionCanvas Component", () => {
  it("renders the infinite product marquee and supports interactive cart simulations", async () => {
    render(<StorefrontMotionCanvas />);

    // 1. Verify that the marquee track renders product cards
    const marqueeProducts = screen.getAllByRole("img", { name: /producto marquee:/i });
    expect(marqueeProducts.length).toBeGreaterThanOrEqual(6); // Duplicated items for looping

    // 2. Verify phone mockup triggers and indicators
    const addBtn = screen.getByRole("button", { name: /agregar al carrito/i });
    expect(addBtn).toBeInTheDocument();

    const initialBadge = screen.queryByTestId("cart-badge");
    expect(initialBadge).toHaveTextContent("0");

    // 3. User interaction: Add item and verify badge increments
    const user = userEvent.setup();
    await user.click(addBtn);

    const updatedBadge = await screen.findByText("1");
    expect(updatedBadge).toBeInTheDocument();
  });
});
