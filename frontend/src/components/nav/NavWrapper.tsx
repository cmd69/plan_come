"use client";

import { usePathname } from "next/navigation";
import BottomNav from "./BottomNav";

export default function NavWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLogin = pathname === "/login";

  return (
    <>
      <main className={isLogin ? "" : "pb-16"}>{children}</main>
      {!isLogin && <BottomNav />}
    </>
  );
}
