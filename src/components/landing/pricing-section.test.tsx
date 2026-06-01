import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PricingSection } from "./pricing-section";
import userEvent from "@testing-library/user-event";

describe("PricingSection Component", () => {
  it("renders plans and toggles prices between monthly and annual billing", async () => {
    render(<PricingSection />);

    // 1. Verify toggle button renders
    const toggleBtn = screen.getByRole("checkbox", { name: /facturación anual/i });
    expect(toggleBtn).toBeInTheDocument();
    expect(toggleBtn).not.toBeChecked();

    // 2. Check initial monthly prices
    expect(screen.getByText(/\$0/i)).toBeInTheDocument();
    expect(screen.getByText(/\$29/i)).toBeInTheDocument();
    expect(screen.getByText(/\$79/i)).toBeInTheDocument();

    // 3. Click toggle to switch to annual billing
    const user = userEvent.setup();
    await user.click(toggleBtn);
    expect(toggleBtn).toBeChecked();

    // 4. Check that prices updated to annual discount rates
    expect(screen.getByText(/\$23/i)).toBeInTheDocument();
    expect(screen.getByText(/\$63/i)).toBeInTheDocument();
  });
});
