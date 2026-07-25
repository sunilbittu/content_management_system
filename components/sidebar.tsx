"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "./nav-items";
import { can } from "@/lib/permissions";

function Brand() {
  return (
    <Link href="/dashboard" className="group flex items-center gap-3 text-[var(--rail-ink)]">
      <svg
        viewBox="0 0 32 32"
        className="h-7 w-7 shrink-0"
        aria-hidden="true"
        fill="none"
      >
        <path
          d="M7 7h18v6H13v6h12v6H7V7Z"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinejoin="round"
        />
        <path d="M13 13 7 19" stroke="#aebd8d" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
      <span className="text-[15px] font-semibold tracking-[-0.01em]">
        Commerce <span className="font-normal text-[var(--rail-muted)]">CMS</span>
      </span>
    </Link>
  );
}

export function Sidebar({ permissions }: { permissions: string[] }) {
  const pathname = usePathname();
  const items = NAV_ITEMS.filter((item) => !item.permission || can(permissions, item.permission));

  return (
    <aside className="sticky top-0 hidden h-screen w-[248px] shrink-0 flex-col bg-[var(--rail)] px-5 py-6 lg:flex">
      <Brand />

      <nav className="mt-14 flex flex-col gap-1" aria-label="Primary navigation">
        {items.map((item, index) => {
          const active =
            pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-11 items-center gap-4 rounded-[5px] px-3 text-sm transition-colors ${
                active
                  ? "bg-[var(--rail-raised)] font-semibold text-[var(--rail-ink)]"
                  : "text-[var(--rail-muted)] hover:bg-[#22291f] hover:text-[var(--rail-ink)]"
              }`}
            >
              <span className="data-type w-5 text-[10px] text-[#858e7e]">
                {String(index + 1).padStart(2, "0")}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto px-3 pb-1 text-xs leading-5 text-[#818a7a]">
        <p>Publishing control room</p>
        <p className="data-type mt-1 text-[10px]">RBAC / RLS ENABLED</p>
      </div>
    </aside>
  );
}

export { Brand };
