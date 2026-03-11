"use client";

import { Dock, TopBar, StatusBar } from "@/components/TenacitOS";
import { useState, useEffect } from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className="tenacios-shell" style={{ minHeight: "100vh" }}>
      <Dock />
      <TopBar />

      <main
        style={{
          marginLeft: isMobile ? "0" : "68px",
          marginTop: "48px",
          marginBottom: isMobile ? "92px" : "32px", // Extra space for bottom dock on mobile
          minHeight: "calc(100vh - 48px - 32px)",
          padding: isMobile ? "16px" : "24px",
          overflowX: "hidden",
        }}
      >
        {children}
      </main>

      <StatusBar />
    </div>
  );
}
