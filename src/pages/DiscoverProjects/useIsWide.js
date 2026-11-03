import { useEffect, useState } from "react";

// True when the element is at least minWidth wide. Measuring the page area
// (not the window) keeps the layout right whether or not the sidebar is open.
function useIsWide(ref, minWidth) {
  const [isWide, setIsWide] = useState(() => window.innerWidth >= 1024);

  useEffect(() => {
    const element = ref.current;
    if (!element) return undefined;

    const observer = new ResizeObserver(([entry]) => {
      setIsWide(entry.contentRect.width >= minWidth);
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, minWidth]);

  return isWide;
}

export default useIsWide;