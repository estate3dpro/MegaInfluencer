import React from "react";

export function Pill({
  children,
  tone = "violet",
}: {
  children: React.ReactNode;
  tone?: "violet" | "green" | "pink";
}) {
  const styles = {
    violet: "border-[#5341cd]/20 bg-[#5341cd]/10 text-[#5341cd]",
    green: "border-[#00655a]/20 bg-[#00655a]/10 text-[#00655a]",
    pink: "border-[#a53361]/20 bg-[#a53361]/10 text-[#a53361]",
  };
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${styles[tone]}`}
    >
      <i className="h-1.5 w-1.5 rounded-full bg-current" />
      {children}
    </span>
  );
}
