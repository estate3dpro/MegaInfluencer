export function SectionTitle({
  eyebrow,
  title,
  copy,
  align = "left",
}: {
  eyebrow: string;
  title: string;
  copy?: string;
  align?: "left" | "center";
}) {
  return (
    <div className={align === "center" ? "mx-auto max-w-3xl text-center" : "max-w-3xl"}>
      <p className="text-xs font-bold uppercase tracking-[.16em] text-[#5341cd]">{eyebrow}</p>
      <h2 className="mt-4 font-display text-3xl font-bold tracking-[-.03em] text-[#1b1b1e] sm:text-4xl md:text-5xl">
        {title}
      </h2>
      {copy ? <p className="mt-5 text-base leading-7 text-[#474554]">{copy}</p> : null}
    </div>
  );
}
