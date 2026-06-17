import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { ConsentCheckbox } from "./consent-checkbox";

// We test the feature flag behavior by testing the component with the real constant value.
// Since LEGAL_LINKS_ENABLED defaults to true, the component renders.
// A separate integration test verifies the feature flag gate works end-to-end.

describe("ConsentCheckbox", () => {
  const defaultProps = {
    checked: false,
    onChange: vi.fn(),
    disabled: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders checkbox with legal links when enabled", () => {
    render(<ConsentCheckbox {...defaultProps} />);

    expect(screen.getByRole("checkbox")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /términos y condiciones/i })).toHaveAttribute("href", "/legal/terminos");
    expect(screen.getByRole("link", { name: /política de privacidad/i })).toHaveAttribute("href", "/legal/privacidad");
  });

  it("calls onChange when checkbox is toggled", () => {
    const onChange = vi.fn();
    render(<ConsentCheckbox {...defaultProps} onChange={onChange} />);

    fireEvent.click(screen.getByRole("checkbox"));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it("calls onChange with false when unchecked", () => {
    const onChange = vi.fn();
    render(<ConsentCheckbox checked={true} onChange={onChange} disabled={false} />);

    fireEvent.click(screen.getByRole("checkbox"));
    expect(onChange).toHaveBeenCalledWith(false);
  });

  it("disables checkbox when disabled prop is true", () => {
    render(<ConsentCheckbox {...defaultProps} disabled={true} />);

    expect(screen.getByRole("checkbox")).toBeDisabled();
  });

  it("renders label text with required consent message", () => {
    render(<ConsentCheckbox {...defaultProps} />);

    expect(screen.getByText(/acepto/i)).toBeInTheDocument();
  });

  it("links open in same tab (no target=_blank)", () => {
    render(<ConsentCheckbox {...defaultProps} />);

    const termsLink = screen.getByRole("link", { name: /términos y condiciones/i });
    const privacyLink = screen.getByRole("link", { name: /política de privacidad/i });

    expect(termsLink).not.toHaveAttribute("target", "_blank");
    expect(privacyLink).not.toHaveAttribute("target", "_blank");
  });

  it("returns null when LEGAL_LINKS_ENABLED is false", async () => {
    vi.doMock("@/lib/legal/constants", () => ({
      LEGAL_LINKS_ENABLED: false,
      CURRENT_LEGAL_VERSION: "1",
      REPORT_REASONS: ["Productos ilegales"],
    }));

    vi.resetModules();

    const { ConsentCheckbox: MockedCheckbox } = await import("./consent-checkbox");
    const { container } = render(<MockedCheckbox {...defaultProps} />);
    expect(container.innerHTML).toBe("");

    vi.doUnmock("@/lib/legal/constants");
    vi.resetModules();
  });
});