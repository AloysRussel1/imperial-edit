import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  light?: boolean;
  className?: string;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  light = false,
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3",
        align === "center" ? "items-center text-center" : "items-start text-left",
        className
      )}
    >
      {eyebrow ? <p className="text-xs uppercase tracking-widest2 text-imperial-gold">{eyebrow}</p> : null}
      <h2
        className={cn(
          "font-display text-3xl md:text-4xl",
          light ? "text-imperial-ivory" : "text-imperial-black"
        )}
      >
        {title}
      </h2>
      {description ? (
        <p className={cn("max-w-2xl text-balance", light ? "text-imperial-ivory/70" : "text-imperial-black/60")}>
          {description}
        </p>
      ) : null}
    </div>
  );
}
