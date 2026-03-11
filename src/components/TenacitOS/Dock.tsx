"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Monitor,
  FolderOpen,
  Bot,
  Building2,
  Activity,
  Clock,
  Puzzle,
  DollarSign,
  Settings,
  History,
  Users,
  GraduationCap,
  ExternalLink,
  MapPin,
} from "lucide-react";

const dockItems = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/system", label: "System Monitor", icon: Monitor },
  { href: "/files", label: "Files", icon: FolderOpen },
  { href: "/agents", label: "Agents", icon: Bot },
  { href: "/office", label: "Office", icon: Building2 },
  { href: "/activity", label: "Activity", icon: Activity },
  { href: "/cron", label: "Cron Jobs", icon: Clock },
  { href: "/sessions", label: "Sessions", icon: History },
  { href: "/skills", label: "Skills", icon: Puzzle },
  { href: "/costs", label: "Costs & Analytics", icon: DollarSign },
  { href: "/settings", label: "Settings", icon: Settings },
];

const projectItems = [
  { port: 3100, label: "CRM", icon: Users },
  { port: 5174, label: "SAT Prep", icon: GraduationCap },
  { url: "https://funeralpriceguide.com", label: "FPG", icon: ExternalLink },
  { port: 3200, label: "Nebby", icon: MapPin },
];

export function Dock() {
  const pathname = usePathname();
  const [hostname, setHostname] = useState("localhost");

  useEffect(() => {
    setHostname(window.location.hostname);
  }, []);

  return (
    <aside
      className="dock"
      style={{
        position: "fixed",
        left: 0,
        top: 0,
        bottom: 0,
        width: "68px",
        backgroundColor: "var(--surface)",
        borderRight: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "12px 6px",
        gap: "4px",
        zIndex: 50,
        overflowY: "auto",
      }}
    >
      {dockItems.map((item) => {
        const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className="dock-item group relative"
            style={{
              width: "56px",
              height: "56px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "4px",
              borderRadius: "8px",
              backgroundColor: isActive ? "var(--accent-soft)" : "transparent",
              transition: "all 150ms ease",
              position: "relative",
              textDecoration: "none",
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.backgroundColor = "var(--surface-hover)";
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.backgroundColor = "transparent";
              }
            }}
          >
            {/* Icon */}
            <Icon
              style={{
                width: "22px",
                height: "22px",
                color: isActive ? "var(--accent)" : "var(--text-secondary)",
                strokeWidth: isActive ? 2.5 : 2,
              }}
            />

            {/* Label */}
            <span
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "9px",
                fontWeight: isActive ? 600 : 500,
                color: isActive ? "var(--accent)" : "var(--text-muted)",
                textAlign: "center",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                maxWidth: "52px",
              }}
            >
              {item.label.split(" ")[0]}
            </span>

            {/* Tooltip - shown on hover via CSS */}
            <span
              className="absolute left-[72px] top-1/2 -translate-y-1/2 px-3 py-2 rounded-lg text-sm whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50"
              style={{
                backgroundColor: "var(--surface-elevated)",
                border: "1px solid var(--border)",
                color: "var(--text-primary)",
                fontSize: "12px",
                fontWeight: 500,
              }}
            >
              {item.label}
            </span>
          </Link>
        );
      })}

      {/* Divider */}
      <div
        style={{
          width: "36px",
          height: "1px",
          backgroundColor: "var(--border)",
          margin: "4px 0",
          flexShrink: 0,
        }}
      />

      {/* External project links */}
      {projectItems.map((item) => {
        const href = item.url || `http://${hostname}:${item.port}`;
        const Icon = item.icon;

        return (
          <a
            key={item.label}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="dock-item group relative"
            style={{
              width: "56px",
              height: "56px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "4px",
              borderRadius: "8px",
              backgroundColor: "transparent",
              transition: "all 150ms ease",
              position: "relative",
              textDecoration: "none",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "var(--surface-hover)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            <Icon
              style={{
                width: "22px",
                height: "22px",
                color: "#60a5fa",
                strokeWidth: 2,
              }}
            />
            <span
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "9px",
                fontWeight: 500,
                color: "#60a5fa",
                textAlign: "center",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                maxWidth: "52px",
              }}
            >
              {item.label}
            </span>

            {/* Tooltip */}
            <span
              className="absolute left-[72px] top-1/2 -translate-y-1/2 px-3 py-2 rounded-lg text-sm whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50"
              style={{
                backgroundColor: "var(--surface-elevated)",
                border: "1px solid var(--border)",
                color: "var(--text-primary)",
                fontSize: "12px",
                fontWeight: 500,
              }}
            >
              {item.label} ↗
            </span>
          </a>
        );
      })}
    </aside>
  );
}
