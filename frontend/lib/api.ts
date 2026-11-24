const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; message?: string }> {
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || `Request failed with status ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error(`[API Error] ${endpoint}:`, error);
    throw error;
  }
}

// Health check
export async function checkBackendHealth() {
  return fetchApi('/health');
}

// Factories
export async function getFactories(params?: { country?: string; process?: string; product?: string }) {
  const query = params ? `?${new URLSearchParams(params as Record<string, string>).toString()}` : '';
  return fetchApi(`/factories${query}`);
}

// Buyers
export async function getBuyers() {
  return fetchApi('/buyers');
}

// Products
export async function getProducts(category?: string) {
  const query = category ? `?category=${encodeURIComponent(category)}` : '';
  return fetchApi(`/products${query}`);
}

// Orders
export async function getMyOrders() {
  return fetchApi('/orders/my');
}

export async function createOrder(orderData: Record<string, unknown>) {
  return fetchApi('/orders', {
    method: 'POST',
    body: JSON.stringify(orderData),
  });
}
