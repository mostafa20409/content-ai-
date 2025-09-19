// src/types/dashboard.ts
export interface DashboardUser {
  id: string;
  name: string;
  email: string;
  role: string;
  subscription: string;
  usage: {
    ads: number;
    keywords: number;
    content: number;
    books: number;
  };
  contentCount: number;
  booksCount: number;
  adsCount: number;
  createdAt: Date;
  lastUpdated: Date;
}

export interface ContentItem {
  id: string;
  title: string;
  type: string;
  status: string;
  views: number;
  date: string;
  category: string;
}

export interface BookItem {
  id: string;
  title: string;
  author: string;
  pages: number;
  status: string;
  downloads: number;
  date: string;
}

export interface AdItem {
  id: string;
  title: string;
  platform: string;
  status: string;
  clicks: number;
  impressions: number;
  date: string;
}