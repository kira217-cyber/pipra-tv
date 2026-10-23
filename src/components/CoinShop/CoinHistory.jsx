import React from "react";
import { Link } from "react-router";
import { ArrowDownLeft, ArrowUpRight, CheckCircle2, Clock, History, X, XCircle } from "lucide-react";

import { CoinMark } from "./CoinShop";
import { timeAgo } from "../../utils/format";

// Coin history rows (My coins and the Coin history page), and the
// congratulations shown when a purchase has gone through.

const number = (n) => Number(n || 0).toLocaleString("en-US", { maximumFractionDigits: 2 });
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
const dateText = (value) => new Date(value).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });

// `type` activity (coin changes) or purchases.
export const HistoryRows = ({ type, items }) => {
  if (items.length === 0) return <p className="p-8 text-center text-sm text-muted">{type === "purchases" ? "No purchases yet." : "No coin activity yet."}</p>;
  if (type === "purchases") {
    return items.map((p) => {
      const st = PURCHASE[p.status] || PURCHASE.PENDING;
      const Icon = st.icon;
      return (
        <div key={p.id} className="flex items-center gap-3 p-3">
          <CoinMark className="h-9 w-9 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">
              {number(p.coins)} coins · ${p.price}
              {p.bdtAmount > 0 && <span className="font-normal text-muted"> (৳{number(p.bdtAmount)})</span>}
            </p>
            <p className="truncate text-xs text-muted" title={dateText(p.createdAt)}>
              {dateText(p.createdAt)} · {p.invoiceNumber}
              {p.transactionId && ` · ${p.transactionId}`}
            </p>
          </div>
          <span className={`flex items-center gap-1 text-xs font-bold ${st.className}`}>
            <Icon className="h-4 w-4" /> {st.label}
          </span>
        </div>
      );
    });
  }
  return items.map((e) => {
    const change = Math.round((e.purchased + e.earned) * 100) / 100;
    const Arrow = change >= 0 ? ArrowDownLeft : ArrowUpRight;
    return (
      <div key={e.id} className="flex items-center gap-3 p-3">
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${change >= 0 ? "bg-[#4ade80]/15 text-[#4ade80]" : "bg-[#ff6b81]/15 text-[#ff6b81]"}`}>
          <Arrow className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">{KIND[e.kind] || e.kind}</p>
          <p className="truncate text-xs text-muted" title={dateText(e.at)}>
            {timeAgo(e.at)}
            {e.note ? ` · ${e.note}` : ""}
          </p>
        </div>
        <span className={`font-bold ${change >= 0 ? "text-[#4ade80]" : "text-[#ff6b81]"}`}>
          {change >= 0 ? "+" : ""}
          {number(change)}
        </span>
      </div>
    );
  });
};

// The payment went through: a celebration with what was added.
export const PurchaseCelebration = ({ purchase, historyTo = "/coins/history", onClose }) => {
  const bonus = (purchase.bonusCoins || 0) + (purchase.firstBonus || 0);
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        role="dialog"
        aria-label="Coins added"
        onClick={(event) => event.stopPropagation()}
        className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-amber-400/40 bg-gradient-to-b from-[#3b1d06] via-[#1a1208] to-[#0f1115] p-6 text-center shadow-[0_20px_60px_-15px_#f59e0b]"
      >
        <button type="button" onClick={onClose} aria-label="Close" className="absolute right-3 top-3 cursor-pointer rounded-full p-1.5 text-white/70 hover:bg-white/10 hover:text-white">
          <X className="h-5 w-5" />
        </button>
        <div className="pointer-events-none absolute inset-x-0 top-2 flex justify-around text-2xl" aria-hidden="true">
          <span className="animate-bounce">🎉</span>
          <span className="animate-bounce [animation-delay:150ms]">✨</span>
          <span className="animate-bounce [animation-delay:300ms]">🎊</span>
        </div>
        <CoinMark className="mx-auto mt-6 h-20 w-20 drop-shadow-[0_0_24px_rgba(251,191,36,0.6)]" />
        <h2 className="mt-4 text-2xl font-extrabold">Congratulations!</h2>
        <p className="mt-1 text-sm text-amber-100/80">Your payment went through</p>
        <p className="mt-4 text-4xl font-extrabold text-amber-300">+{number(purchase.coins)}</p>
        <p className="text-sm text-amber-100/80">coins added to your wallet{bonus > 0 ? ` (including ${number(bonus)} bonus)` : ""}</p>
        <div className="mt-4 space-y-1 rounded-2xl bg-white/5 p-3 text-left text-xs">
          <p className="flex justify-between gap-3">
            <span className="text-muted">Paid</span>
            <span className="font-semibold">
              ${purchase.price}
              {purchase.bdtAmount > 0 && ` (৳${number(purchase.bdtAmount)})`}
            </span>
          </p>
          <p className="flex justify-between gap-3">
            <span className="text-muted">Invoice</span>
            <span className="truncate font-semibold">{purchase.invoiceNumber}</span>
          </p>
        </div>
        <div className="mt-5 flex gap-2">
          <Link to={historyTo} onClick={onClose} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-white/15 py-2.5 text-sm font-semibold hover:bg-white/10">
            <History className="h-4 w-4" /> History
          </Link>
          <button type="button" onClick={onClose} className="bg-brand-gradient flex-1 cursor-pointer rounded-xl py-2.5 text-sm font-semibold">
            Great!
          </button>
        </div>
      </div>
    </div>
  );
};
