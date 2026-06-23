import { render, screen, fireEvent } from "@testing-library/react";
import { expect, test, describe, vi } from "vitest";
import { ReciberaClient } from "./recibera-client";

// Mock to ignore PDF generator in unit tests
vi.mock("./pdf-receipt-generator", () => ({
  generateReceiptPDF: vi.fn(),
}));

describe("ReciberaClient", () => {
  test("renders initial empty form correctly", () => {
    render(<ReciberaClient tenantName="Mi Tienda" />);
    
    // Check key inputs exist
    expect(screen.getByLabelText(/Monto Recibido/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Concepto/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Nombre del Cliente/i)).toBeInTheDocument();
    
    // Export buttons should be disabled initially (or enabled with validation error when clicked)
    // We will ensure required fields are typed before enabling
    const pdfBtn = screen.getByTestId("download-pdf-btn");
    expect(pdfBtn).toBeDisabled();
  });

  test("enables export when required fields are filled", () => {
    render(<ReciberaClient tenantName="Mi Tienda" />);
    
    const amountInput = screen.getByLabelText(/Monto Recibido/i);
    const conceptInput = screen.getByLabelText(/Concepto/i);
    const pdfBtn = screen.getByTestId("download-pdf-btn");

    // Initially disabled
    expect(pdfBtn).toBeDisabled();

    // Fill required fields
    fireEvent.change(amountInput, { target: { value: "100.50" } });
    fireEvent.change(conceptInput, { target: { value: "Abono de mercadería" } });

    // Now it should be enabled
    expect(pdfBtn).not.toBeDisabled();
  });
});
