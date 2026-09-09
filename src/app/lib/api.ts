import {
  ApiResponse,
  AuthResponse,
  AuthUser,
  Project,
  Review,
  Quotation,
  DashboardMetrics,
  PaymentRecord
} from "../types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://zeroone-main-mx5h.onrender.com/api/v1";

const AUTH_TOKEN_KEY = "zeroone_admin_token";

export const getAuthToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(AUTH_TOKEN_KEY);
};

export const setAuthToken = (token: string): void => {
  if (typeof window !== "undefined") {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  }
};

export const removeAuthToken = (): void => {
  if (typeof window !== "undefined") {
    localStorage.removeItem(AUTH_TOKEN_KEY);
  }
};

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = getAuthToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    let data: any = {};
    try {
      data = await response.json();
    } catch {
      data = {};
    }

    if (!response.ok) {
      const errorMessage = data.message || `Server error (${response.status})`;
      return {
        success: false,
        message: errorMessage,
      };
    }

    return {
      success: true,
      message: data.message,
      count: data.count,
      data: data.data !== undefined ? data.data : (data as T),
    };
  } catch (error: any) {
    console.error(`API Error [${endpoint}]:`, error);
    return {
      success: false,
      message: error.message || "Network error. Please check your connection or backend server.",
    };
  }
}

export const api = {
  // Authentication
  auth: {
    login: async (username: string, password: string): Promise<ApiResponse<AuthResponse>> => {
      const res = await request<AuthResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });
      if (res.success && res.data?.token) {
        setAuthToken(res.data.token);
      }
      return res;
    },
    getMe: async (): Promise<ApiResponse<{ user: AuthUser }>> => {
      return request<{ user: AuthUser }>("/auth/me", {
        method: "GET",
      });
    },
    logout: (): void => {
      removeAuthToken();
    },
  },

  // Projects
  projects: {
    getAll: async (section?: "work" | "reviews", status?: string): Promise<ApiResponse<Project[]>> => {
      const params = new URLSearchParams();
      if (section) params.append("section", section);
      if (status) params.append("status", status);
      const query = params.toString() ? `?${params.toString()}` : "";
      return request<Project[]>(`/projects${query}`, { method: "GET" });
    },
    getById: async (id: string): Promise<ApiResponse<Project>> => {
      return request<Project>(`/projects/${id}`, { method: "GET" });
    },
    create: async (projectData: Partial<Project>): Promise<ApiResponse<Project>> => {
      return request<Project>("/projects", {
        method: "POST",
        body: JSON.stringify(projectData),
      });
    },
    update: async (id: string, projectData: Partial<Project>): Promise<ApiResponse<Project>> => {
      return request<Project>(`/projects/${id}`, {
        method: "PUT",
        body: JSON.stringify(projectData),
      });
    },
    delete: async (id: string): Promise<ApiResponse<void>> => {
      return request<void>(`/projects/${id}`, { method: "DELETE" });
    },
  },

  // Reviews
  reviews: {
    getAll: async (projectId?: string, isApproved?: boolean): Promise<ApiResponse<Review[]>> => {
      const params = new URLSearchParams();
      if (projectId) params.append("projectId", projectId);
      if (isApproved !== undefined) params.append("isApproved", String(isApproved));
      const query = params.toString() ? `?${params.toString()}` : "";
      return request<Review[]>(`/reviews${query}`, { method: "GET" });
    },
    create: async (reviewData: {
      projectId: string;
      text: string;
      author?: string;
      stars: number;
    }): Promise<ApiResponse<Review>> => {
      return request<Review>("/reviews", {
        method: "POST",
        body: JSON.stringify(reviewData),
      });
    },
    update: async (id: string, updateData: Partial<Review>): Promise<ApiResponse<Review>> => {
      return request<Review>(`/reviews/${id}`, {
        method: "PUT",
        body: JSON.stringify(updateData),
      });
    },
    delete: async (id: string): Promise<ApiResponse<void>> => {
      return request<void>(`/reviews/${id}`, { method: "DELETE" });
    },
  },

  // Quotations
  quotations: {
    create: async (quotationData: Partial<Quotation>): Promise<ApiResponse<Quotation>> => {
      return request<Quotation>("/quotations", {
        method: "POST",
        body: JSON.stringify(quotationData),
      });
    },
    getAll: async (status?: string): Promise<ApiResponse<Quotation[]>> => {
      const query = status ? `?status=${encodeURIComponent(status)}` : "";
      return request<Quotation[]>(`/quotations${query}`, { method: "GET" });
    },
    getById: async (id: string): Promise<ApiResponse<Quotation>> => {
      return request<Quotation>(`/quotations/${id}`, { method: "GET" });
    },
    updateStatus: async (id: string, status: string): Promise<ApiResponse<Quotation>> => {
      return request<Quotation>(`/quotations/${id}`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      });
    },
    delete: async (id: string): Promise<ApiResponse<void>> => {
      return request<void>(`/quotations/${id}`, { method: "DELETE" });
    },
  },

  // Admin Metrics
  admin: {
    getMetrics: async (): Promise<ApiResponse<DashboardMetrics>> => {
      return request<DashboardMetrics>("/admin/metrics", { method: "GET" });
    },
  },

  // Payments
  payments: {
    createOrder: async (amount: number, currency = "INR"): Promise<ApiResponse<{ order: any; paymentRecord: PaymentRecord }>> => {
      return request<{ order: any; paymentRecord: PaymentRecord }>("/payments/create-order", {
        method: "POST",
        body: JSON.stringify({ amount, currency }),
      });
    },
    verify: async (orderId: string, paymentId: string, signature?: string): Promise<ApiResponse<PaymentRecord>> => {
      return request<PaymentRecord>("/payments/verify", {
        method: "POST",
        body: JSON.stringify({ orderId, paymentId, signature }),
      });
    },
    getAll: async (): Promise<ApiResponse<PaymentRecord[]>> => {
      return request<PaymentRecord[]>("/payments", { method: "GET" });
    },
  },
};

export default api;
