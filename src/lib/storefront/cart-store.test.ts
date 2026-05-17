import { describe, it, expect, beforeEach } from "vitest";
import { useCart } from "./cart-store";

describe("Shopping Cart Logic - V4 (Tenant Isolated)", () => {
  beforeEach(() => {
    useCart.setState({ carts: {} });
  });

  it("should add a product to a specific tenant cart", () => {
    const { addItem, getTenantItems } = useCart.getState();
    addItem("t1", { id: "1", name: "H1", price: 10 });
    
    expect(getTenantItems("t1").length).toBe(1);
    expect(getTenantItems("t2").length).toBe(0);
  });

  it("should increment quantity in the correct tenant cart", () => {
    const { addItem, getTenantItems } = useCart.getState();
    addItem("t1", { id: "1", name: "H1", price: 10 });
    addItem("t1", { id: "1", name: "H1", price: 10 });
    
    expect(getTenantItems("t1")[0].quantity).toBe(2);
  });

  it("should isolate totals per tenant", () => {
    const { addItem, getTenantTotal } = useCart.getState();
    addItem("t1", { id: "1", name: "H1", price: 10 });
    addItem("t2", { id: "2", name: "H2", price: 50 });
    
    expect(getTenantTotal("t1")).toBe(10);
    expect(getTenantTotal("t2")).toBe(50);
  });

  it("should clear only the specified tenant cart", () => {
    const { addItem, clearCart, getTenantItems } = useCart.getState();
    addItem("t1", { id: "1", name: "H1", price: 10 });
    addItem("t2", { id: "2", name: "H2", price: 50 });
    
    clearCart("t1");
    expect(getTenantItems("t1").length).toBe(0);
    expect(getTenantItems("t2").length).toBe(1);
  });
});
