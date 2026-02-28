import type { FeedCategory } from "../../types";

const CONFIG: Record<FeedCategory, { label: string; classes: string }> = {
  finance: { label: "Finance",  classes: "bg-cyan/10 text-cyan border-cyan/20" },
  sports:  { label: "Sports",   classes: "bg-emerald/10 text-emerald border-emerald/20" },
  weather: { label: "Weather",  classes: "bg-amber/10 text-amber border-amber/20" },
  custom:  { label: "Custom",   classes: "bg-violet/10 text-violet border-violet/20" },
};

interface Props {
  category: FeedCategory;
  size?: "sm" | "md";
}

export default function CategoryBadge({ category, size = "sm" }: Props) {
  const { label, classes } = CONFIG[category] ?? CONFIG.custom;
  const sizeClass = size === "md"
    ? "text-xs px-3 py-1 font-medium"
    : "text-[11px] px-2 py-0.5 font-medium";

  return (
    <span className={`inline-flex items-center rounded-full border font-mono tracking-wide uppercase ${sizeClass} ${classes}`}>
      {label}
    </span>
  );
}