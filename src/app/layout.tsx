import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "نظام إدارة المحتوى",
  description: "نظام متكامل لإدارة المحتوى",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" data-scroll-behavior="smooth">
      <body className={inter.className}>
        {children}
        {process.env.NODE_ENV === 'production' && <ServiceWorkerRegistration />}
      </body>
    </html>
  );
}