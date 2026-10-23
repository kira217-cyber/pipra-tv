import React, { useEffect, useState } from "react";
import { Link } from "react-router";
import { ArrowLeft } from "lucide-react";

import { Card, Chips, PageHeader, Spinner } from "../../components/ui/ui";
import { HistoryRows } from "../../components/CoinShop/CoinHistory";
import { apiError, studioApi } from "../../api/studioApi";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { toast } from "../../utils/alerts";

// Coin history: every change to the viewer's coins, and every purchase,
// newest first, a page at a time.
const CoinHistory = () => {
  useDocumentTitle("Coin history");
  const [type, setType] = useState("activity");
  const [state, setState] = useState({ type: null, items: [], page: 0, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(false);
  const shown = state.type === type ? state : { items: [], page: 0, totalPages: 1, total: 0 };

  const fetchPage = (page) =>
    studioApi
      .get("/api/coins/history", { params: { type, page } })
      .then(({ data }) => {
        const d = data.data;
        setState((prev) => ({ type, items: page === 1 || prev.type !== type ? d.items : [...prev.items, ...d.items], page: d.page, totalPages: d.totalPages, total: d.total }));
      })
      .catch((error) => toast.error(apiError(error, "Couldn't load the history")));

  const loadMore = () => {
    setLoading(true);
    fetchPage(shown.page + 1).finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <PageHeader title="Coin history" subtitle="Every coin you bought, sent, received or turned into money">
        <Link to="/coins" className="flex items-center gap-1.5 rounded-xl border border-line px-4 py-2.5 text-sm font-semibold hover:bg-white/10">
          <ArrowLeft className="h-4 w-4" /> My coins
        </Link>
      </PageHeader>
      <Chips
        items={[
          { value: "activity", label: "Coin activity" },
          { value: "purchases", label: "Purchases" },
        ]}
        value={type}
        onChange={setType}
      />
      {shown.page === 0 ? (
        <Spinner className="py-16" />
      ) : (
        <>
          <p className="text-xs text-muted">{shown.total.toLocaleString("en-US")} in total</p>
          <Card className="divide-y divide-line">
            <HistoryRows type={type} items={shown.items} />
          </Card>
          {shown.page < shown.totalPages && (
            <button
              type="button"
              disabled={loading}
              onClick={loadMore}
              className="mx-auto block cursor-pointer rounded-xl border border-line px-5 py-2.5 text-sm font-semibold hover:bg-white/10 disabled:opacity-50"
            >
              {loading ? "Loading…" : "Show more"}
            </button>
          )}
        </>
      )}
    </div>
  );
};

export default CoinHistory;
