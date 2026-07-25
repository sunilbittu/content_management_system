"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/app/login/actions";
import { NAV_ITEMS } from "./nav-items";
import { can } from "@/lib/permissions";
import { ActionButton } from "./action-button";

const PAGE_NAMES: Record<string, string> = {
  "/dashboard": "Overview",
  "/content": "Content desk",
  "/media": "Media library",
  "/users": "People and access",
  "/audit": "Audit trail",
};

export function Topbar({
  email,
  permissions,
}: {
  email: string | undefined;
  permissions: string[];
}) {
  const pathname = usePathname();
  const items = NAV_ITEMS.filter((item) => !item.permission || can(permissions, item.permission));
  const sectionPath = Object.keys(PAGE_NAMES).find(
    (href) => pathname === href || (href !== "/dashboard" && pathname.startsWith(`${href}/`)),
  );
  const pageName = sectionPath ? PAGE_NAMES[sectionPath] : "Commerce CMS";

  return (
    <header className="sticky top-0 z-30 border-b border-[#dde1d4] bg-[var(--canvas)]">
      <div className="flex min-h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-9">
        <div className="flex min-w-0 items-center gap-3">
          <details className="group relative lg:hidden">
            <summary className="flex min-h-10 cursor-pointer list-none items-center gap-2 rounded-[5px] px-2 text-sm font-semibold text-[var(--ink)] [&::-webkit-details-marker]:hidden">
              <span className="flex w-5 flex-col gap-1.5" aria-hidden="true">
                <span className="h-0.5 w-5 rounded-full bg-current" />
                <span className="h-0.5 w-3.5 rounded-full bg-current transition-[width] group-open:w-5" />
              </span>
              Menu
            </summary>
            <nav
              className="surface-strong absolute left-0 top-12 w-64 p-2"
              aria-label="Mobile navigation"
            >
              {items.map((item, index) => {
                const active =
                  pathname === item.href ||
                  (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`flex min-h-11 items-center gap-3 rounded-[5px] px-3 text-sm ${
                      active
                        ? "bg-[#e7ebde] font-semibold text-[var(--ink)]"
                        : "text-[var(--ink-soft)] hover:bg-[#f1f3ea] hover:text-[var(--ink)]"
                    }`}
                  >
                    <span className="data-type w-5 text-[10px] text-[var(--ink-faint)]">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </details>

          <p className="truncate text-sm font-semibold text-[var(--ink)]">{pageName}</p>
        </div>

        <div className="flex min-w-0 items-center gap-2 sm:gap-4">
          <div className="hidden min-w-0 text-right sm:block">
            <p className="max-w-60 truncate text-xs font-semibold text-[var(--ink)]">{email}</p>
            <p className="mt-0.5 text-[11px] text-[var(--ink-faint)]">
              {permissions.length} capabilities
            </p>
          </div>
          <form action={signOut}>
            <ActionButton pendingLabel="Signing out" className="button-secondary">
              Sign out
            </ActionButton>
          </form>
        </div>
      </div>
    </header>
  );
}
