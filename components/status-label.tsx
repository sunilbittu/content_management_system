import type { ContentStatus } from "@/lib/types";

const STATUS_COLORS: Record<ContentStatus, string> = {
  draft: "bg-[#71786b]",
  in_review: "bg-[#9c712f]",
  changes_requested: "bg-[#9a5041]",
  approved: "bg-[#4e6e73]",
  scheduled: "bg-[#6a626f]",
  published: "bg-[#466648]",
  archived: "bg-[#8a8f84]",
};

export function StatusLabel({ status }: { status: ContentStatus }) {
  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap text-xs font-semibold capitalize text-[var(--ink-soft)]">
      <span className={`h-2 w-2 rounded-[2px] ${STATUS_COLORS[status]}`} aria-hidden="true" />
      {status.replaceAll("_", " ")}
    </span>
  );
}
