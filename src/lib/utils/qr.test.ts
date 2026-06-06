import { describe, it, expect } from "vitest";
import { generateQR, generateQRCodeDataURL } from "./qr";

describe("generateQRCodeDataURL", () => {
  it("should generate a QR code data URL from a URL string", async () => {
    const dataUrl = await generateQRCodeDataURL("https://iapi.shop/mi-tienda");
    expect(dataUrl).toMatch(/^data:image\/png;base64,/);
  });
});

describe("generateQR", () => {
  it("should generate a QR code data URL from a slug", async () => {
    const dataUrl = await generateQR("mi-tienda", "https://iapi.shop");
    expect(dataUrl).toMatch(/^data:image\/png;base64,/);
  });

  it("should use NEXT_PUBLIC_SITE_URL as default base", async () => {
    const originalEnv = process.env.NEXT_PUBLIC_SITE_URL;
    process.env.NEXT_PUBLIC_SITE_URL = "https://custom.domain";
    const dataUrl = await generateQR("my-shop");
    expect(dataUrl).toMatch(/^data:image\/png;base64,/);
    process.env.NEXT_PUBLIC_SITE_URL = originalEnv;
  });

  it("should throw if slug is empty", async () => {
    await expect(generateQR("")).rejects.toThrow("Slug is required");
  });

  it("should throw if slug is undefined", async () => {
    await expect(generateQR(undefined as unknown as string)).rejects.toThrow(
      "Slug is required"
    );
  });

  it("should throw if slug is whitespace only", async () => {
    await expect(generateQR("   ")).rejects.toThrow("Slug is required");
  });
});