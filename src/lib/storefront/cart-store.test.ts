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

  it("should calculate total correctly for a single item", () => {
    const { addItem, getTenantTotal } = useCart.getState();
    addItem("t1", { id: "1", name: "H1", price: 10 });
    
    expect(getTenantTotal("t1")).toBe(10);
  });

  it("should calculate total correctly when adding same product twice (increment)", () => {
    const { addItem, getTenantTotal } = useCart.getState();
    addItem("t1", { id: "1", name: "H1", price: 10 });
    addItem("t1", { id: "1", name: "H1", price: 10 });
    
    // qty = 2, price = 10 each, total = 20
    expect(getTenantTotal("t1")).toBe(20);
  });

  it("should remove an item from the cart", () => {
    const { addItem, removeItem, getTenantItems, getTenantTotal } = useCart.getState();
    addItem("t1", { id: "1", name: "H1", price: 10 });
    addItem("t1", { id: "2", name: "H2", price: 25 });
    
    removeItem("t1", "2");
    
    expect(getTenantItems("t1").length).toBe(1);
    expect(getTenantItems("t1")[0].id).toBe("1");
    expect(getTenantTotal("t1")).toBe(10);
  });

  it("should remove item when updating quantity to zero", () => {
    const { addItem, updateQuantity, getTenantItems } = useCart.getState();
    addItem("t1", { id: "1", name: "H1", price: 10 });
    addItem("t1", { id: "1", name: "H1", price: 10 }); // qty = 2
    
    updateQuantity("t1", "1", 0);
    
    expect(getTenantItems("t1").length).toBe(0);
  });

  it("should update quantity of an existing item", () => {
    const { addItem, updateQuantity, getTenantItems, getTenantTotal } = useCart.getState();
    addItem("t1", { id: "1", name: "H1", price: 10 });
    
    updateQuantity("t1", "1", 5);
    
    expect(getTenantItems("t1")[0].quantity).toBe(5);
    expect(getTenantTotal("t1")).toBe(50);
  });

  it("should preserve image_url when adding items", () => {
    const { addItem, getTenantItems } = useCart.getState();
    addItem("t1", { id: "1", name: "H1", price: 10, image_url: "https://example.com/img.jpg" });
    
    expect(getTenantItems("t1")[0].image_url).toBe("https://example.com/img.jpg");
  });

  it("should return empty array for unknown tenant", () => {
    const { getTenantItems, getTenantTotal } = useCart.getState();
    
    expect(getTenantItems("unknown")).toEqual([]);
    expect(getTenantTotal("unknown")).toBe(0);
  });

  it("should calculate multi-item total correctly", () => {
    const { addItem, getTenantTotal } = useCart.getState();
    addItem("t1", { id: "1", name: "Burger", price: 10 });
    addItem("t1", { id: "2", name: "Fries", price: 5 });
    addItem("t1", { id: "1", name: "Burger", price: 10 }); // qty now 2
    
    // Burger: 2 × $10 = $20, Fries: 1 × $5 = $5, Total = $25
    expect(getTenantTotal("t1")).toBe(25);
  });
});
