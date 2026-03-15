import type { Metadata } from "next";
import "./globals.css";

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
      <body className="min-h-screen bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
