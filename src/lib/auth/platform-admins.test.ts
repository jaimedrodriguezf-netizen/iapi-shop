import { describe, expect, it } from "vitest";

import { isBootstrapPlatformAdminEmail } from "./platform-admins";

describe("bootstrap platform admins", () => {
  it("treats admin@iapi.shop as a platform admin", () => {
    expect(isBootstrapPlatformAdminEmail("admin@iapi.shop")).toBe(true);
    expect(isBootstrapPlatformAdminEmail(" ADMIN@IAPI.SHOP ")).toBe(true);
  });

  it("does not grant admin to arbitrary users", () => {
    expect(isBootstrapPlatformAdminEmail("owner@iapi.shop")).toBe(false);
    expect(isBootstrapPlatformAdminEmail(undefined)).toBe(false);
  });
});
