import { Project, Review } from "../types";

export const initialProjects: Project[] = [
  {
    id: 1,
    customerName: "Acme Corp",
    name: "Nexus AI Platform",
    price: 250000,
    status: "Delivered",
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=800",
    websiteUrl: "https://nexus-ai-demo.example.com",
    date: "2026-08-10"
  },
  {
    id: 2,
    customerName: "Global Tech Inc",
    name: "FinTech Dashboard",
    price: 180000,
    status: "Delivered",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=800",
    websiteUrl: "https://fintech-dashboard.example.com",
    date: "2026-08-15"
  },
  {
    id: 3,
    customerName: "Vanguard Mobility",
    name: "Autonomous Mobility Suite",
    price: 320000,
    status: "Delivered",
    image: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=800",
    websiteUrl: "https://vanguard-mobility.example.com",
    date: "2026-08-20"
  },
  {
    id: 4,
    customerName: "Aetheria Fashion",
    name: "Haute Couture AR Portal",
    price: 210000,
    status: "Delivered",
    image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=800",
    websiteUrl: "https://aetheria-couture.example.com",
    date: "2026-08-22"
  },
  {
    id: 5,
    customerName: "Startup Inc",
    name: "E-Commerce Mobile App",
    price: 120000,
    status: "Pending",
    image: "https://images.unsplash.com/photo-1512428559087-560fa5ceab42?auto=format&fit=crop&q=80&w=800",
    websiteUrl: "",
    date: "2026-08-25"
  }
];

export const initialReviews: Review[] = [
  {
    id: 101,
    projectId: 1,
    author: "Sarah J. (CTO, Acme Corp)",
    text: "ZER0ONE completely transformed our online presence. Outstanding architecture and flawless execution!",
    stars: 5,
    isApproved: true,
    createdAt: "2026-08-12"
  },
  {
    id: 102,
    projectId: 1,
    author: "Michael T. (Product Lead)",
    text: "Delivered ahead of time with insane attention to UI micro-interactions.",
    stars: 5,
    isApproved: true,
    createdAt: "2026-08-14"
  },
  {
    id: 103,
    projectId: 2,
    author: "David L. (VP Engineering)",
    text: "Sleek, responsive, and ultra-fast. Our financial traders loved the real-time telemetry component.",
    stars: 5,
    isApproved: true,
    createdAt: "2026-08-17"
  },
  {
    id: 104,
    projectId: 2,
    author: "Elena Rostova (Head of UX)",
    text: "Minimalist aesthetic combined with heavy-duty performance. Zero complaints.",
    stars: 4,
    isApproved: true,
    createdAt: "2026-08-19"
  },
  {
    id: 105,
    projectId: 3,
    author: "Marcus Vance (Founder)",
    text: "ZER0ONE redefined what a digital agency can deliver. High luxury design system.",
    stars: 5,
    isApproved: true,
    createdAt: "2026-08-21"
  },
  {
    id: 106,
    projectId: 4,
    author: "Sophia Chen (Creative Director)",
    text: "The webGL and AR integration blew our luxury client base away.",
    stars: 5,
    isApproved: true,
    createdAt: "2026-08-23"
  }
];
