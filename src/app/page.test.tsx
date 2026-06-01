import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Home from "./page";

describe("public landing page", () => {
  it("shows a public marketing landing without product database content", () => {
    render(<Home />);

    const heading = screen.getByRole("heading", { name: /vende con qr/i });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveClass("text-balance");
    expect(screen.getByRole("link", { name: /crear mi tienda/i })).toHaveAttribute("href", "/register");
    expect(screen.getAllByRole("link", { name: /iniciar sesión/i })[0]).toHaveAttribute("href", "/login");
    expect(screen.queryByText(/agregar al carrito/i)).not.toBeInTheDocument();
  });
});
