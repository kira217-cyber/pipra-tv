import { useEffect } from "react";

import { trackAd } from "../utils/adEvents";

// Counts one view of an ad once at least half of it has been on screen for
// a second.
export const useAdView = (ref, id, where) => {
  useEffect(() => {
    const el = ref.current;
    if (!el || !id) return undefined;
    let timer = null;
    let counted = false;
    const observer = new IntersectionObserver(
      ([entry]) => {
        clearTimeout(timer);
        if (entry.isIntersecting && !counted) {
          timer = setTimeout(() => {
            counted = true;
            trackAd(id, "view", where);
            observer.disconnect();
          }, 1000);
        }
      },
      { threshold: 0.5 },
    );
    observer.observe(el);
    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [ref, id, where]);
};

export default useAdView;
