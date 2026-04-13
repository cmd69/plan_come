import type { Metadata } from "next";
import "./globals.css";
import NavWrapper from "@/components/nav/NavWrapper";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";

export const metadata: Metadata = {
  title: "PlanCome",
  description: "Planificador semanal de comidas",
  manifest: "/manifest.json",
  themeColor: "#2563eb",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "PlanCome",
  },
};

const themeScript = `
(function(){
  try {
    var t = localStorage.getItem('theme');
    if (t === 'dark') document.documentElement.classList.add('dark');
  } catch(e){}
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="icon" href="/icons/icon-96x96.png" sizes="96x96" type="image/png" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body className="min-h-screen">
        <NavWrapper>{children}</NavWrapper>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
