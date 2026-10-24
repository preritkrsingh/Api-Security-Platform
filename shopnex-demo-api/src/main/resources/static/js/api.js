/**
 * ShopNex Demo API - Client SDK
 * Direct, decoupled REST communication with the ShopNex Spring Boot backend.
 */

const Api = (function () {
  // 1. Point BASE_URL to the VEYRION Gateway proxy route for your API:
  const BASE_URL = 'http://localhost:8080/proxy/api_ccbc4fa24254';

  // 2. Insert your secret API key generated from the VEYRION Dashboard:
  const API_KEY = 'YOUR_GENERATED_API_KEY';

  async function request(path, options = {}) {
    const url = `${BASE_URL}${path.startsWith('/') ? path : '/' + path}`;
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-API-Key': API_KEY, // <-- Attach the security key
      ...(options.headers || {})
    };

    const res = await fetch(url, {
      ...options,
      headers
    });

    return res;
  }


  return {
    async checkHealth() {
      try {
        const res = await request('/api/health');
        if (res.ok) return await res.json();
      } catch (e) { }
      return { status: 'DOWN' };
    },

    async fetchProducts(category = '', search = '', page = 0, size = 20, sortBy = 'id', sortDir = 'asc') {
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('size', size);
      params.append('sortBy', sortBy);
      params.append('sortDir', sortDir);
      if (category && category !== 'all') {
        params.append('category', category);
      }

      const res = await request(`/api/products?${params.toString()}`);
      if (!res.ok) {
        throw new Error(`Failed to fetch products: ${res.statusText}`);
      }
      return res.json();
    },

    async fetchProductById(id) {
      const res = await request(`/api/products/${id}`);
      if (!res.ok) throw new Error(`Product #${id} not found`);
      return res.json();
    },

    async createProduct(productData) {
      const res = await request('/api/products', {
        method: 'POST',
        body: JSON.stringify(productData)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to create product');
      }
      return data;
    },

    async deleteProduct(id) {
      const res = await request(`/api/products/${id}`, { method: 'DELETE' });
      if (!res.ok && res.status !== 204) {
        throw new Error(`Failed to delete product #${id}`);
      }
      return true;
    },

    async fetchCustomer(id) {
      const res = await request(`/api/customers/${id}`);
      if (!res.ok) throw new Error(`Customer #${id} not found`);
      return res.json();
    },

    async createCustomer(customerData) {
      const res = await request('/api/customers', {
        method: 'POST',
        body: JSON.stringify(customerData)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to create customer');
      }
      return data;
    },

    async createOrder(orderData) {
      const res = await request('/api/orders', {
        method: 'POST',
        body: JSON.stringify(orderData)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to place order');
      }
      return data;
    },

    async fetchOrders(page = 0, size = 20) {
      const res = await request(`/api/orders?page=${page}&size=${size}`);
      if (!res.ok) throw new Error('Failed to fetch orders');
      return res.json();
    },

    async fetchCustomerOrders(customerId) {
      const res = await request(`/api/orders/customer/${customerId}`);
      if (!res.ok) throw new Error(`Failed to fetch orders for customer #${customerId}`);
      return res.json();
    },

    // Authentication Endpoints (Amazon/Flipkart Style Login & Register)
    async login(email, password) {
      const res = await request('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Invalid email or password');
      }
      return data;
    },

    async register(userData) {
      const res = await request('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Registration failed');
      }
      return data;
    },

    async fetchProfile(customerId) {
      const res = await request(`/api/auth/me/${customerId}`);
      if (!res.ok) throw new Error('Failed to retrieve profile');
      return res.json();
    }
  };
})();
