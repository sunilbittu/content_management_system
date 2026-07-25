import Link from "next/link";
import { NAV_ITEMS } from "./nav-items";
import { can } from "@/lib/permissions";

export function Sidebar({ permissions }: { permissions: string[] }) {
  const items = NAV_ITEMS.filter((item) => !item.permission || can(permissions, item.permission));

  return (
    <nav className="flex w-56 shrink-0 flex-col gap-1 border-r border-neutral-200 bg-white p-4">
      <div className="mb-4 px-2 text-lg font-semibold text-neutral-900">Commerce CMS</div>
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="rounded-md px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900"
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
