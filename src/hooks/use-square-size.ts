import { useEffect, useRef, useState } from "react";

interface UseSquareSizeOptions {
  minSize?: number;
  maxSize?: number;
  bottomOffset?: number;
}

/**
 * Measures the real available width and remaining viewport height at the
 * element's position and returns the largest square that fits both — so
 * the board fills a wide monitor and never overflows a short mobile
 * viewport. Must be attached to a plain, unsized wrapper (not the square
 * element itself), otherwise the square's own pinned size would be fed
 * back into the next measurement and it could never grow again.
 */
export function useSquareSize({
  minSize = 220,
  maxSize = 900,
  bottomOffset = 24,
}: UseSquareSizeOptions = {}) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<number | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    function measure() {
      if (!el) return;
      const { width, top } = el.getBoundingClientRect();
      const availableHeight = window.innerHeight - top - bottomOffset;
      const next = Math.min(width, availableHeight, maxSize);
      setSize(Math.max(minSize, next));
    }

    measure();
    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(el);
    window.addEventListener("resize", measure);
    window.addEventListener("orientationchange", measure);
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", measure);
      window.removeEventListener("orientationchange", measure);
    };
  }, [minSize, maxSize, bottomOffset]);

  return { ref, size };
}
