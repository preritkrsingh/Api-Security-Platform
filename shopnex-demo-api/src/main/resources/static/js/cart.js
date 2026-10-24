/**
 * ShopNex - Reactive Cart State Manager
 */

const Cart = (function() {
  const STORAGE_KEY = 'shopnex_cart_items';
  let items = [];

  function loadCart() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      items = stored ? JSON.parse(stored) : [];
    } catch (e) {
      items = [];
    }
  }

  function saveCart() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {}
    window.dispatchEvent(new CustomEvent('shopnex-cart-updated', {
      detail: { items, count: getTotalCount(), total: getTotalAmount() }
    }));
  }

  loadCart();

  function getTotalCount() {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  }

  function getTotalAmount() {
    return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }

  return {
    getItems() {
      return [...items];
    },

    addItem(product, quantity = 1) {
      const existing = items.find(i => i.id === product.id);
      const currentQty = existing ? existing.quantity : 0;
      const newQty = currentQty + quantity;

      if (newQty > product.stockQuantity) {
        throw new Error(`Cannot add more than ${product.stockQuantity} items. Currently in cart: ${currentQty}`);
      }

      if (existing) {
        existing.quantity = newQty;
      } else {
        items.push({
          id: product.id,
          name: product.name,
          price: product.price,
          stockQuantity: product.stockQuantity,
          category: product.category,
          quantity: quantity
        });
      }
      saveCart();
    },

    updateQuantity(productId, quantity) {
      const item = items.find(i => i.id === productId);
      if (!item) return;

      if (quantity <= 0) {
        this.removeItem(productId);
        return;
      }

      if (quantity > item.stockQuantity) {
        throw new Error(`Maximum available stock is ${item.stockQuantity}`);
      }

      item.quantity = quantity;
      saveCart();
    },

    removeItem(productId) {
      items = items.filter(i => i.id !== productId);
      saveCart();
    },

    clearCart() {
      items = [];
      saveCart();
    },

    getTotalCount,
    getTotalAmount
  };
})();
