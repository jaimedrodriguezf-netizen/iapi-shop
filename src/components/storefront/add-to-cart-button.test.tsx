import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AddToCartButton } from "./add-to-cart-button";

describe("AddToCartButton brand color styling", () => {
  it("applies the custom brand-color background style", () => {
    const product = {
      id: "prod-1",
      name: "Hamburguesa Vegana",
      price: 12.50,
      image_url: "https://example.com/hamb.jpg",
      tenant_id: "tenant-123",
    };

    render(<AddToCartButton product={product} />);

    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();
    expect(button).toHaveStyle({ color: "var(--brand-color)" });
  });
});
