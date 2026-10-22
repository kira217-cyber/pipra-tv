import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { Gift, Loader2, PlusCircle, X } from "lucide-react";

import { apiError, studioApi } from "../../api/studioApi";
import { sendGift } from "../../api/engage";
import { toast } from "../../utils/alerts";

// "গিফট পাঠান": the gift catalogue in tabs, the viewer's coin balance and
// a link to buy more. Sending pays in coins and posts the gift as a comment
// (to the creator) or as a reply (to `replyTo`'s author).

const number = (n) => Number(n || 0).toLocaleString("en-US");

export const CoinDot = ({ className = "h-3.5 w-3.5" }) => <span className={`inline-block shrink-0 rounded-full bg-gradient-to-br from-[#fde68a] to-[#d97706] ring-1 ring-[#92400e]/40 ${className}`} />;

// The gift a comment carries.
export const GiftBadge = ({ gift }) => (
  <span className="inline-flex items-center gap-2 rounded-2xl border border-[#ff2d6f]/30 bg-gradient-to-r from-[#ff2d6f]/15 to-[#c026d3]/15 py-1 pl-1 pr-3">
    {gift.image ? <img src={gift.image} alt="" className="h-9 w-9 object-contain" loading="lazy" /> : <Gift className="h-7 w-7 text-brand" />}
    <span className="text-sm">
      <span className="text-slate-300">sent a </span>
      <b className="text-white">{gift.name}</b>
    </span>
    <span className="flex items-center gap-1 text-xs font-semibold text-amber-300">
      <CoinDot /> {number(gift.price)}
    </span>
  </span>
);

const GiftPanel = ({ videoId, replyTo, toName, text = "", onSent, onClose }) => {
  const [data, setData] = useState(null);
  const [tab, setTab] = useState("all");
  const [picked, setPicked] = useState(null);
  const [message, setMessage] = useState(text);
  const [busy, setBusy] = useState(false);
  // The latest onClose, so the effects below run once, not on every render.
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  });

  useEffect(() => {
    studioApi
      .get("/api/gifts")
      .then(({ data: res }) => setData(res.data))
      .catch((error) => {
        toast.error(apiError(error, "Couldn't load the gifts"));
        closeRef.current();
      });
  }, []);

  useEffect(() => {
    const onKey = (event) => event.key === "Escape" && closeRef.current();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const balance = data?.wallet?.total || 0;
  const gifts = (data?.gifts || []).filter((g) => tab === "all" || g.category === tab);
  const short = picked && picked.price > balance;

  const send = async () => {
    if (!picked) return;
    setBusy(true);
    try {
      const result = await sendGift({ videoId, giftId: picked.id, text: message.trim(), replyTo });
      toast.success(`${picked.name} sent to ${toName} 🎁`);
      onSent(result);
      onClose();
    } catch (error) {
      toast.error(apiError(error, "Couldn't send the gift"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/60 sm:items-center sm:p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="flex max-h-[88vh] w-full flex-col rounded-t-3xl border border-line bg-[#14161d] shadow-2xl sm:max-w-md sm:rounded-3xl">
        <div className="flex items-center justify-between px-5 pb-2 pt-4">
          <div>
            <p className="text-lg font-bold">গিফট পাঠান</p>
            {toName && <p className="text-xs text-muted">to {toName}</p>}
          </div>
          <button type="button" aria-label="Close" onClick={onClose} className="cursor-pointer rounded-full p-1.5 hover:bg-white/10">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="no-scrollbar flex gap-1 overflow-x-auto border-b border-line px-4">
          {[{ key: "all", label: "সব গিফট" }, ...(data?.categories || [])].map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => setTab(c.key)}
              className={`shrink-0 cursor-pointer border-b-2 px-3 py-2 text-sm font-medium transition ${tab === c.key ? "border-[#a855f7] text-white" : "border-transparent text-muted hover:text-white"}`}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="min-h-48 overflow-y-auto p-3">
          {!data ? (
            <div className="flex h-48 items-center justify-center text-muted">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : gifts.length === 0 ? (
            <p className="py-14 text-center text-sm text-muted">No gifts here yet.</p>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {gifts.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setPicked(g)}
                  className={`relative flex cursor-pointer flex-col items-center rounded-2xl border p-2 transition ${picked?.id === g.id ? "border-[#ff2d6f] bg-[#ff2d6f]/10" : "border-transparent bg-white/[0.04] hover:bg-white/[0.08]"}`}
                >
                  {g.tag && <span className="absolute -top-1 left-1 rounded-md bg-brand px-1.5 text-[10px] font-bold text-white">{g.tag}</span>}
                  <img src={g.image} alt="" className="h-12 w-12 object-contain" loading="lazy" />
                  <span className="mt-1 w-full truncate text-center text-[11px] text-slate-200">{g.name}</span>
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-300">
                    <CoinDot className="h-3 w-3" /> {number(g.price)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {picked && (
          <div className="px-4 pb-2">
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={300}
              placeholder="Add a message (optional)"
              className="h-10 w-full rounded-xl border border-white/10 bg-black/30 px-3 text-sm text-white outline-none placeholder:text-muted focus:border-brand/60"
            />
          </div>
        )}

        <div className="flex items-center gap-2 border-t border-line p-4">
          <p className="flex flex-1 items-center gap-1.5 text-sm">
            <CoinDot className="h-5 w-5" /> আপনার ব্যালান্স: <b>{number(balance)}</b>
          </p>
          {!picked || short ? (
            <Link to="/coins" onClick={onClose} className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#ff2d6f] to-[#c026d3] px-4 py-2 text-sm font-semibold text-white">
              <PlusCircle className="h-4 w-4" /> কয়েন কিনুন
            </Link>
          ) : (
            <button type="button" onClick={send} disabled={busy} className="flex cursor-pointer items-center gap-1.5 rounded-full bg-gradient-to-r from-[#ff2d6f] to-[#c026d3] px-5 py-2 text-sm font-semibold text-white disabled:opacity-60">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Gift className="h-4 w-4" />} পাঠান · {number(picked.price)}
            </button>
          )}
        </div>
        {short && <p className="-mt-2 px-4 pb-3 text-xs text-amber-300">You need {number(picked.price - balance)} more coins for this gift.</p>}
      </div>
    </div>
  );
};

export default GiftPanel;
