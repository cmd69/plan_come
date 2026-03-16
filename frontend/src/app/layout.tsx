import type { Metadata } from "next";
import "./globals.css";
import NavWrapper from "@/components/nav/NavWrapper";

export const metadata: Metadata = {
  title: "PlanCome",
  description: "Planificador semanal de comidas",
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
      </head>
      <body className="min-h-screen">
        <NavWrapper>{children}</NavWrapper>
      </body>
    </html>
  );
}
