import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { CheckCircle2, Clock, Coins as CoinsIcon, Gift, Loader2, ShoppingBag, Sparkles, XCircle } from "lucide-react";

import { Card, Chips, EmptyState, PageHeader, Spinner } from "../../components/ui/ui";
import { apiError, studioApi } from "../../api/studioApi";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { CoinMark, PackGrid } from "../../components/CoinShop/CoinShop";
import { timeAgo } from "../../utils/format";
import { toast } from "../../utils/alerts";

// My coins: the viewer's wallet, buying coins (OraclePay's payment page —
// bKash, Nagad …), and what happened to their coins. Coins are spent on
// gifts for creators.

const number = (n) => Number(n || 0).toLocaleString("en-US");
const KIND = {
  purchase: "Bought coins",
  gift_sent: "Sent a gift",
  gift_received: "Received a gift",
  referral: "Referral reward",
  convert: "Turned into money",
  admin: "Changed by PipraTube",
};
const PURCHASE = {
  PAID: { icon: CheckCircle2, className: "text-[#4ade80]", label: "Paid" },
  PENDING: { icon: Clock, className: "text-amber-300", label: "Waiting" },
  FAILED: { icon: XCircle, className: "text-[#ff6b81]", label: "Not paid" },
};


const Coins = () => {
  useDocumentTitle("My coins");
  const [params, setParams] = useSearchParams();
  const paidInvoice = params.get("paid");
  const [shop, setShop] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [tab, setTab] = useState("activity");
  const [buying, setBuying] = useState(null);

  const loadWallet = () =>
    studioApi
      .get("/api/coins/wallet")
      .then(({ data }) => setWallet(data.data))
      .catch((error) => toast.error(apiError(error, "Couldn't load your coins")));

  useEffect(() => {
    studioApi
      .get("/api/coins/packages")
      .then(({ data }) => setShop(data.data))
      .catch(() => setShop({ buying: false, packages: [] }));
    loadWallet();
  }, []);

  // Back from the payment page: the coins arrive when the gateway confirms,
  // usually within seconds — look again a few times.
  useEffect(() => {
    if (!paidInvoice) return undefined;
    let tries = 0;
    const timer = setInterval(() => {
      tries += 1;
      loadWallet();
      if (tries >= 6) clearInterval(timer);
    }, 4000);
    return () => clearInterval(timer);
  }, [paidInvoice]);

  const buy = async (pack) => {
    setBuying(pack.id);
    try {
      const { data } = await studioApi.post("/api/coins/buy", { packageId: pack.id });
      window.location.assign(data.data.paymentUrl);
    } catch (error) {
      toast.error(apiError(error, "Couldn't start the payment"));
      setBuying(null);
    }
  };

  if (!shop || !wallet) return <Spinner className="min-h-[60vh]" />;
  const w = wallet.wallet;
  const thisPurchase = paidInvoice ? wallet.purchases.find((p) => p.invoiceNumber === paidInvoice) : null;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader title="My coins" subtitle="Buy coins and send gifts to the creators you love" />

      {paidInvoice && (
        <Card className={`flex items-center gap-3 p-4 ${thisPurchase?.status === "PAID" ? "border-emerald-500/40 bg-emerald-500/10" : "border-amber-400/40 bg-amber-400/5"}`}>
          {thisPurchase?.status === "PAID" ? <CheckCircle2 className="h-7 w-7 text-[#4ade80]" /> : <Loader2 className="h-7 w-7 animate-spin text-amber-300" />}
          <p className="flex-1 text-sm">
            {thisPurchase?.status === "PAID"
              ? `${number(thisPurchase.coins)} coins were added to your wallet. Thank you!`
              : thisPurchase?.status === "FAILED"
                ? "This payment didn't go through, so no coins were added."
                : "Checking your payment — the coins appear here as soon as it's confirmed."}
          </p>
          <button type="button" onClick={() => setParams({}, { replace: true })} className="cursor-pointer text-xs text-muted hover:text-white">
            Close
          </button>
        </Card>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-amber-400/30 bg-gradient-to-br from-[#78350f] to-[#2a1306] p-5">
          <p className="text-sm text-amber-100/80">Your balance</p>
          <p className="mt-1 flex items-center gap-2 text-3xl font-extrabold">
            <CoinMark className="h-8 w-8" /> {number(w.total)}
          </p>
        </div>
        <div className="rounded-2xl border border-line bg-card p-5">
          <p className="flex items-center gap-1.5 text-sm text-muted">
            <ShoppingBag className="h-4 w-4" /> Bought
          </p>
          <p className="mt-1 text-2xl font-bold">{number(w.purchased)}</p>
          <p className="text-xs text-muted">For sending gifts</p>
        </div>
        <div className="rounded-2xl border border-line bg-card p-5">
          <p className="flex items-center gap-1.5 text-sm text-muted">
            <Gift className="h-4 w-4" /> Earned
          </p>
          <p className="mt-1 text-2xl font-bold">{number(w.earned)}</p>
          <p className="text-xs text-muted">From gifts and referrals — creators can turn them into money in Studio</p>
        </div>
      </div>

      <section>
        <h2 className="mb-3 flex items-center gap-2 text-xl font-bold">
          <Sparkles className="h-5 w-5 text-amber-300" /> Buy coins
        </h2>
        {!shop.buying ? (
          <EmptyState icon={CoinsIcon} title="Buying coins opens soon" text="You'll be able to buy coins with bKash, Nagad and more right here." />
        ) : shop.packages.length === 0 ? (
          <EmptyState icon={CoinsIcon} title="No coin packages yet" />
        ) : (
          <PackGrid packages={shop.packages} firstBonusPercent={shop.firstPurchaseBonusPercent} rate={shop.usdToBdt} buying={buying} onBuy={buy} />
        )}
        {shop.buying && (
          <p className="mt-2 text-xs text-muted">
            Prices are in US dollars. You pay the taka amount shown (1$ = ৳{shop.usdToBdt}) on a secure payment page — bKash, Nagad and more. The coins are added as soon as the payment is confirmed. Bought coins can't be refunded.
          </p>
        )}
      </section>

      <section>
        <Chips
          items={[
            { value: "activity", label: "Coin activity" },
            { value: "purchases", label: "Purchases" },
          ]}
          value={tab}
          onChange={setTab}
          className="mb-3"
        />
        <Card className="divide-y divide-line">
          {tab === "activity" &&
            (wallet.entries.length === 0 ? (
              <p className="p-8 text-center text-sm text-muted">No coin activity yet.</p>
            ) : (
              wallet.entries.map((e) => {
                const change = e.purchased + e.earned;
                return (
                  <div key={e.id} className="flex items-center gap-3 p-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">{KIND[e.kind] || e.kind}</p>
                      <p className="truncate text-xs text-muted">
                        {timeAgo(e.at)}
                        {e.note && e.kind !== "purchase" ? ` · ${e.note}` : ""}
                      </p>
                    </div>
                    <span className={`font-bold ${change >= 0 ? "text-[#4ade80]" : "text-[#ff6b81]"}`}>
                      {change >= 0 ? "+" : ""}
                      {number(change)}
                    </span>
                  </div>
                );
              })
            ))}
          {tab === "purchases" &&
            (wallet.purchases.length === 0 ? (
              <p className="p-8 text-center text-sm text-muted">No purchases yet.</p>
            ) : (
              wallet.purchases.map((p) => {
                const st = PURCHASE[p.status];
                const Icon = st.icon;
                return (
                  <div key={p.id} className="flex items-center gap-3 p-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">
                        {number(p.coins)} coins · ${p.price}
                        {p.bdtAmount > 0 && <span className="font-normal text-muted"> (৳{number(p.bdtAmount)})</span>}
                      </p>
                      <p className="truncate text-xs text-muted">
                        {timeAgo(p.createdAt)}
                        {p.transactionId && ` · ${p.transactionId}`}
                      </p>
                    </div>
                    <span className={`flex items-center gap-1 text-xs font-bold ${st.className}`}>
                      <Icon className="h-4 w-4" /> {st.label}
                    </span>
                  </div>
                );
              })
            ))}
        </Card>
      </section>
    </div>
  );
};

export default Coins;
