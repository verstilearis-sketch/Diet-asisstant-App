"use client";

import { useEffect, useState } from "react";

/**
 * Detects whether the site is being viewed on a phone (narrow viewport).
 * Used to serve a compact mobile layout vs the full desktop experience.
 */
export function useIsMobile(breakpoint = 768): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(() =>
    typeof window !== "undefined" ? window.innerWidth < breakpoint : false
  );

  useEffect(() => {
    const query = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const update = () => {
      const mobile = query.matches;
      setIsMobile(mobile);
      document.documentElement.dataset.device = mobile ? "mobile" : "desktop";
    };
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, [breakpoint]);

  return isMobile;
}
