import { describe, it, expect, vi, beforeEach } from "vitest";
import { generateProductDescription } from "./actions";

// Mock corregido de OpenAI
vi.mock("openai", () => {
  const OpenAI = vi.fn();
  OpenAI.prototype.chat = {
    completions: {
      create: vi.fn().mockResolvedValue({
        choices: [{ message: { content: "Una deliciosa hamburguesa con queso fundido." } }],
      }),
    },
  };
  return { default: OpenAI };
});

describe("AI Actions: generateProductDescription", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return a generated description based on name and category", async () => {
    const result = await generateProductDescription("Hamburguesa", "Comida");
    
    expect(result.success).toBe(true);
    expect(result.description).toContain("hamburguesa");
  });

  it("should fail if product name is too short", async () => {
    const result = await generateProductDescription("", "");
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});
