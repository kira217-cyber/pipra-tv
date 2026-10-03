import { useEffect, useState } from "react";
import { api } from "../api/axios";

// Fetches the currently-active in-player ad campaigns targeted at one
// specific video or Live TV channel — separate from the shared
// useSiteSettings bundle since this varies per watched item.
export const useAdCampaigns = ({ video, liveTv } = {}) => {
  const [campaigns, setCampaigns] = useState([]);

  useEffect(() => {
    if (!video && !liveTv) return undefined;

    let cancelled = false;

    const load = () => {
      api
        .get("/api/site/ad-campaigns", {
          params: video ? { video } : { liveTv },
        })
        .then(({ data }) => {
          if (!cancelled) setCampaigns(data?.data?.campaigns || []);
        })
        .catch(() => {
          if (!cancelled) setCampaigns([]);
        });
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [video, liveTv]);

  return { campaigns };
};

export default useAdCampaigns;
