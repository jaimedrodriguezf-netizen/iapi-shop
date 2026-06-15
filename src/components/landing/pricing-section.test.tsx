import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PricingSection } from "./pricing-section";

describe("PricingSection Component", () => {
  it("renders the Free, Plus, and Pro plans", () => {
    render(<PricingSection />);

    // 1. Check plan names
    expect(screen.getByRole("heading", { name: "Free" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Plus" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Pro" })).toBeInTheDocument();

    // 2. Check prices
    expect(screen.getByText(/\$0/i)).toBeInTheDocument();
    expect(screen.getByText(/\$49.99/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Próximamente/i)).toHaveLength(1);

    // 3. Verify features
    expect(screen.getByText(/Hasta 10 productos activos/i)).toBeInTheDocument();
    expect(screen.getByText(/Hasta 300 productos activos/i)).toBeInTheDocument();
  });
});
