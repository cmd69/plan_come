import type { Metadata } from "next";
import "./globals.css";
import BottomNav from "@/components/nav/BottomNav";

export const metadata: Metadata = {
  title: "PlanCome",
  description: "Planificador semanal de comidas",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <main className="pb-16">{children}</main>
        <BottomNav />
      </body>
    </html>
  );
}
