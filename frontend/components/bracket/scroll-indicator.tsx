"use client";

import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";

export function ScrollIndicator({
  containerRef,
  count,
}: {
  containerRef: React.RefObject<HTMLDivElement | null>;
  count: number;
}) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    function handleScroll() {
      if (!container) return;
      const scrollLeft = container.scrollLeft;
      const width = container.clientWidth;
      const index = Math.round(scrollLeft / width);
      setActiveIndex(index);
    }

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, [containerRef]);

  return (
    <div className="flex justify-center gap-1.5 py-2">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "size-1.5 rounded-full transition-colors",
            i === activeIndex ? "bg-foreground/60" : "bg-foreground/15",
          )}
        />
      ))}
    </div>
  );
}
