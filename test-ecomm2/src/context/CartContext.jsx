import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { findProduct, SHIPPING_FLAT } from '../products.js';

const CART_KEY = 'shoply.cart';
const CartContext = createContext(null);

function loadCart() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function CartProvider({ children }) {
  const [cart, setCart] = useState(loadCart);

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }, [cart]);

  function addToCart(productId, qty = 1) {
    setCart((c) => ({ ...c, [productId]: (c[productId] || 0) + qty }));
  }

  function setQty(productId, qty) {
    setCart((c) => {
      const next = { ...c };
      if (qty <= 0) delete next[productId];
      else next[productId] = qty;
      return next;
    });
  }

  function removeFromCart(productId) {
    setCart((c) => {
      const next = { ...c };
      delete next[productId];
      return next;
    });
  }

  function clearCart() {
    setCart({});
  }

  const value = useMemo(() => {
    const ids = Object.keys(cart);
    const items = ids
      .map((id) => {
        const p = findProduct(id);
        return p ? { ...p, qty: cart[id] } : null;
      })
      .filter(Boolean);

    const itemCount = items.reduce((s, i) => s + i.qty, 0);
    const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
    const shipping = subtotal > 0 ? SHIPPING_FLAT : 0;
    const total = subtotal + shipping;

    return {
      cart,
      items,
      itemCount,
      subtotal,
      shipping,
      total,
      addToCart,
      setQty,
      removeFromCart,
      clearCart,
    };
  }, [cart]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within a CartProvider');
  return ctx;
}
