import { describe, it, expect } from "vitest";
import { buildWhatsAppUrl, buildWhatsAppCartUrl, formatCartMessage } from "./whatsapp";

describe("buildWhatsAppUrl", () => {
  it("should generate a correct WhatsApp URL with encoded product name", () => {
    const url = buildWhatsAppUrl("+593987654321", "Paracetamol 500mg");
    expect(url).toBe(
      "https://wa.me/593987654321?text=Hola%2C%20me%20interesa%3A%20Paracetamol%20500mg"
    );
  });

  it("should encode special characters in product names", () => {
    const url = buildWhatsAppUrl("+593987654321", "Café & Té orgánico");
    expect(url).toContain("593987654321");
    expect(url).toContain("Caf%C3%A9");
    expect(url).toContain("%26"); // & encoded
  });

  it("should strip spaces and dashes from phone numbers", () => {
    const url = buildWhatsAppUrl("+59 398 765 4321", "Test Product");
    expect(url).toContain("593987654321");
  });

  it("should throw if phone is empty", () => {
    expect(() => buildWhatsAppUrl("", "Test Product")).toThrow(
      "Phone number is required"
    );
  });

  it("should throw if phone is undefined", () => {
    expect(() => buildWhatsAppUrl(undefined as unknown as string, "Test")).toThrow(
      "Phone number is required"
    );
  });

  it("should throw if phone is whitespace only", () => {
    expect(() => buildWhatsAppUrl("   ", "Test Product")).toThrow(
      "Phone number is required"
    );
  });
});

describe("formatCartMessage", () => {
  it("should format a multi-item order with total", () => {
    const message = formatCartMessage("Burger Shop", [
      { name: "Hamburguesa", quantity: 2, price: 10 },
      { name: "Papas Fritas", quantity: 1, price: 5 },
    ]);

    expect(message).toContain("*Nuevo Pedido - Burger Shop*");
    expect(message).toContain("• 2x Hamburguesa - $20.00");
    expect(message).toContain("• 1x Papas Fritas - $5.00");
    expect(message).toContain("*Total: $25.00*");
    expect(message).toContain("Muchas gracias!");
  });

  it("should include order reference when provided", () => {
    const message = formatCartMessage("Burger Shop", [
      { name: "Hamburguesa", quantity: 1, price: 10 },
    ], { orderRef: "A1B2C3" });

    expect(message).toContain("_Orden #A1B2C3_");
  });

  it("should not include order reference when not provided", () => {
    const message = formatCartMessage("Burger Shop", [
      { name: "Hamburguesa", quantity: 1, price: 10 },
    ]);

    expect(message).not.toContain("_Orden #");
  });

  it("should truncate product names longer than 120 characters", () => {
    const longName = "A".repeat(200);
    const message = formatCartMessage("Shop", [
      { name: longName, quantity: 1, price: 10 },
    ]);

    // The name in the message should be truncated to 120 chars + "…"
    const truncatedInMessage = "A".repeat(120) + "…";
    expect(message).toContain(truncatedInMessage);
    expect(message).not.toContain("A".repeat(200));
  });

  it("should not truncate names at or under 120 characters", () => {
    const name120 = "A".repeat(120);
    const message = formatCartMessage("Shop", [
      { name: name120, quantity: 1, price: 10 },
    ]);

    expect(message).toContain(name120);
  });
});

describe("buildWhatsAppCartUrl", () => {
  it("should build a cart URL with encoded message", () => {
    const message = formatCartMessage("Burger Shop", [
      { name: "Hamburguesa", quantity: 2, price: 10 },
    ]);
    const url = buildWhatsAppCartUrl("+593987654321", message);

    expect(url).toContain("https://wa.me/593987654321?text=");
    expect(url).toContain(encodeURIComponent(message));
  });

  it("should strip +, spaces and dashes from phone", () => {
    const url = buildWhatsAppCartUrl("+59 398-765 4321", "test");
    expect(url).toContain("593987654321");
  });

  it("should throw if phone is empty", () => {
    expect(() => buildWhatsAppCartUrl("", "test")).toThrow("Phone number is required");
  });

  it("should throw if phone is whitespace only", () => {
    expect(() => buildWhatsAppCartUrl("   ", "test")).toThrow("Phone number is required");
  });
});