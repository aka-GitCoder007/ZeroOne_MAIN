export interface Project {
  _id?: string;
  id: number | string;
  customerName: string;
  name: string;
  image?: string;
  websiteUrl?: string;
  price: number;
  status: "Pending" | "Delivered" | string;
  date: string;
  showInWork?: boolean;
  showInClientReviews?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ReviewProjectRef {
  _id?: string;
  id?: number | string;
  name: string;
  customerName: string;
  showInClientReviews?: boolean;
  image?: string;
}

export interface Review {
  _id?: string;
  id: number | string;
  projectId: string | number | ReviewProjectRef;
  author: string;
  text: string;
  stars: number; // 1 - 5
  isApproved: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface Quotation {
  _id?: string;
  id: number | string;
  requestId: string;
  fullName: string;
  companyName?: string;
  email: string;
  phone: string;
  services: string[];
  otherService?: string;
  projectName: string;
  description: string;
  hasExistingWebsite: boolean;
  websiteUrl?: string;
  budget: string;
  timeline: string;
  contactPreference: string[];
  additionalInformation?: string;
  status: "New" | "Contacted" | "Quoted" | "Converted" | "Closed" | string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthUser {
  id: string;
  username: string;
  role: "admin" | string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export interface DashboardMetrics {
  projects: {
    total: number;
    delivered: number;
    reviewProjects: number;
  };
  reviews: {
    total: number;
    averageRating: number;
  };
  quotations: {
    new: number;
    quoted: number;
    converted: number;
  };
  payments: {
    total: number;
    paid: number;
    failed: number;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  count?: number;
  data?: T;
}

export interface PaymentRecord {
  _id?: string;
  orderId: string;
  paymentId?: string;
  amount: number;
  currency: string;
  status: "Created" | "Paid" | "Failed" | string;
  createdAt?: string;
}
