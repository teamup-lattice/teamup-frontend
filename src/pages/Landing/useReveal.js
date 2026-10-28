import { useEffect, useRef } from "react";

function useReveal({ staggerChildren = false, reveal = true, once = true } = {}) {
  const ref = useRef(null);

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      return undefined;
    }

    const targets =
      reveal && staggerChildren ? Array.from(node.children) : [node];

    if (reveal) {
      targets.forEach((target, index) => {
        target.dataset.revealReady = "true";
        if (staggerChildren) {
          target.style.setProperty("--reveal-delay", `${index * 80}ms`);
        }
      });
    } else {
      node.dataset.inView = "false";
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (reveal) {
              entry.target.dataset.revealed = "true";
            } else {
              node.dataset.inView = "true";
            }

            if (once) {
              observer.unobserve(entry.target);
            }
          } else if (!reveal) {
            node.dataset.inView = "false";
          }
        });
      },
      { threshold: 0.15 },
    );

    targets.forEach((target) => observer.observe(target));

    return () => {
      observer.disconnect();
      if (reveal) {
        targets.forEach((target) => {
          delete target.dataset.revealReady;
          delete target.dataset.revealed;
          target.style.removeProperty("--reveal-delay");
        });
      } else {
        delete node.dataset.inView;
      }
    };
  }, [once, reveal, staggerChildren]);

  return ref;
}

export default useReveal;
