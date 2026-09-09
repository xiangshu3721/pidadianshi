"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "倒一倒", icon: "🎙️" },
  { href: "/today", label: "报告", icon: "📊" },
  { href: "/diary", label: "日记", icon: "📅" },
] as const;

export default function TabBar() {
  const pathname = usePathname();

  return (
    <nav className="tab-bar" aria-label="主导航">
      {TABS.map((tab) => {
        const active =
          tab.href === "/"
            ? pathname === "/" || pathname === "/record"
            : pathname === tab.href || pathname.startsWith(tab.href + "/");
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`tab-item${active ? " active" : ""}`}
            aria-current={active ? "page" : undefined}
          >
            <span className="tab-icon" aria-hidden>
              {tab.icon}
            </span>
            <span className="tab-label">{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
