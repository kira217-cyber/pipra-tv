import React, { useEffect, useState } from "react";
import { Clock, Coins, Gift, Loader2, Sparkles } from "lucide-react";

// The coin package cards (My coins page): picture, name, coins, free bonus
// coins, a tag ribbon, a glowing "best" card, a limited-offer countdown and
// the first-purchase bonus — everything set by the admin. Prices are in
// dollars; the taka shown under them is what the payment page charges.

const number = (n) => Number(n || 0).toLocaleString("en-US");
const usd = (n) => `$${Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: Number.isInteger(Number(n)) ? 0 : 2, maximumFractionDigits: 2 })}`;

export const CoinMark = ({ className = "h-5 w-5" }) => (
  <span className={`inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#fde68a] to-[#d97706] text-[#7c2d12] shadow-inner ${className}`}>
    <Coins className="h-[60%] w-[60%]" />
  </span>
);

// "2d 04:13:09" until `until`, ticking.
const Countdown = ({ until }) => {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const left = Math.max(0, new Date(until).getTime() - now);
  const s = Math.floor(left / 1000);
  const days = Math.floor(s / 86400);
  const clock = [Math.floor((s % 86400) / 3600), Math.floor((s % 3600) / 60), s % 60].map((n) => String(n).padStart(2, "0")).join(":");
  return (
    <span className="flex items-center justify-center gap-1 rounded-full bg-black/40 px-2 py-0.5 text-[11px] font-semibold text-amber-200">
      <Clock className="h-3 w-3" /> অফার শেষ {days > 0 ? `${days}দিন ` : ""}
      {clock}
    </span>
  );
};

const PackCard = ({ pack, firstBonusPercent, rate, busy, disabled, onBuy }) => {
  const base = pack.coins + (pack.bonusCoins || 0);
  const firstBonus = firstBonusPercent > 0 ? Math.floor((base * firstBonusPercent) / 100) : 0;
  // Extra coins compared with the plain rate of 100 coins a dollar.
  const extra = Math.round(((pack.coins + (pack.bonusCoins || 0) - pack.price * 100) / (pack.price * 100)) * 100);

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onBuy(pack)}
      className={`group relative flex cursor-pointer flex-col items-center overflow-hidden rounded-3xl border p-4 pt-6 text-center transition hover:-translate-y-1 disabled:cursor-wait disabled:opacity-70 ${
        pack.highlight
          ? "border-amber-300/70 bg-gradient-to-b from-[#4a2b05] via-[#2a1806] to-[#140d06] shadow-[0_0_28px_rgba(251,191,36,0.35)]"
          : "border-white/10 bg-gradient-to-b from-[#21182e] to-[#111019] hover:border-amber-400/50"
      }`}
    >
      {pack.label && (
        <span className={`absolute left-0 top-3 rounded-r-full px-3 py-0.5 text-[11px] font-bold text-white shadow ${pack.highlight ? "bg-gradient-to-r from-amber-500 to-orange-600" : "bg-gradient-to-r from-[#ff2d6f] to-[#c026d3]"}`}>
          {pack.label}
        </span>
      )}
      {pack.highlight && <Sparkles className="absolute right-3 top-3 h-5 w-5 text-amber-300" />}

      <div className="flex h-20 items-center justify-center">
        {pack.image ? <img src={pack.image} alt="" className="max-h-20 max-w-full object-contain drop-shadow-lg transition group-hover:scale-105" loading="lazy" /> : <CoinMark className="h-14 w-14" />}
      </div>
      {pack.name && <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-300">{pack.name}</p>}
      <p className="mt-1 text-3xl font-extrabold leading-none text-white">{number(pack.coins)}</p>
      <p className="text-xs text-muted">কয়েন</p>

      <div className="mt-2 flex min-h-[22px] flex-wrap items-center justify-center gap-1">
        {pack.bonusCoins > 0 && <span className="rounded-full bg-[#22c55e]/20 px-2 py-0.5 text-[11px] font-bold text-[#4ade80]">+{number(pack.bonusCoins)} ফ্রি</span>}
        {firstBonus > 0 && (
          <span className="flex items-center gap-1 rounded-full bg-[#a855f7]/20 px-2 py-0.5 text-[11px] font-bold text-[#d8b4fe]">
            <Gift className="h-3 w-3" />+{number(firstBonus)} প্রথম কেনায়
          </span>
        )}
        {!pack.bonusCoins && !firstBonus && extra > 0 && <span className="text-[11px] font-semibold text-[#4ade80]">+{extra}% বেশি</span>}
      </div>
      {(pack.bonusCoins > 0 || firstBonus > 0) && <p className="text-[11px] text-slate-300">মোট {number(base + firstBonus)} কয়েন</p>}
      {pack.offerEndsAt && (
        <div className="mt-1.5">
          <Countdown until={pack.offerEndsAt} />
        </div>
      )}

      <span className={`mt-3 flex w-full flex-col items-center justify-center rounded-xl py-1.5 text-white ${pack.highlight ? "bg-gradient-to-r from-amber-500 to-orange-600" : "bg-brand-gradient"}`}>
        <span className="flex items-center gap-1.5 text-base font-extrabold">
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          {usd(pack.price)}
        </span>
        {rate > 0 && <span className="text-[11px] font-medium text-white/85">≈ ৳{number(Math.ceil(pack.price * rate))}</span>}
      </span>
    </button>
  );
};

export const PackGrid = ({ packages, firstBonusPercent, rate, buying, onBuy }) => (
  <>
    {firstBonusPercent > 0 && (
      <div className="mb-3 flex items-center gap-2 rounded-2xl border border-[#a855f7]/40 bg-gradient-to-r from-[#a855f7]/20 to-[#ff2d6f]/10 px-4 py-2.5 text-sm">
        <Gift className="h-5 w-5 shrink-0 text-[#d8b4fe]" />
        <span>
          <b>প্রথম কেনায় +{firstBonusPercent}% বোনাস কয়েন!</b> যেকোনো প্যাক কিনলেই পাবেন।
        </span>
      </div>
    )}
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {packages.map((p) => (
        <PackCard key={p.id} pack={p} firstBonusPercent={firstBonusPercent} rate={rate} busy={buying === p.id} disabled={Boolean(buying)} onBuy={onBuy} />
      ))}
    </div>
  </>
);
