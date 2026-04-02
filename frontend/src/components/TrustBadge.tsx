import { ShieldCheck, Award, Crown } from "lucide-react";

type BadgeLevel = "verified" | "trusted" | "top";

interface TrustBadgeProps {
  level: BadgeLevel;
  size?: "sm" | "md";
}

const config: Record<BadgeLevel, { icon: typeof ShieldCheck; label: string; className: string }> = {
  verified: {
    icon: ShieldCheck,
    label: "Verified",
    className: "bg-primary/10 text-primary border-primary/20",
  },
  trusted: {
    icon: Award,
    label: "Trusted",
    className: "bg-trust-light text-trust border-trust/20",
  },
  top: {
    icon: Crown,
    label: "Top Lender",
    className: "bg-warning/10 text-warning border-warning/20",
  },
};

const TrustBadge = ({ level, size = "sm" }: TrustBadgeProps) => {
  const { icon: Icon, label, className } = config[level];
  const sizeClasses = size === "sm" ? "px-2 py-0.5 text-xs gap-1" : "px-3 py-1 text-sm gap-1.5";

  return (
    <span className={`inline-flex items-center rounded-full border font-medium ${className} ${sizeClasses}`}>
      <Icon size={size === "sm" ? 12 : 14} />
      {label}
    </span>
  );
};

export default TrustBadge;
