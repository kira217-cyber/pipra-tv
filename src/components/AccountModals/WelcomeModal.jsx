import React, { useEffect, useState } from "react";
import { Mail, MessageSquareText, PartyPopper, X } from "lucide-react";

import { WELCOME_EVENT } from "../../api/studioApi";

// "Congratulations!" after signing up or signing in (AuthContext fires
// WELCOME_EVENT). The server sends the same news by email or SMS.
const WelcomeModal = () => {
  const [shown, setShown] = useState(null); // { kind, name, via }

  useEffect(() => {
    const onWelcome = (event) => setShown(event.detail || { kind: "login" });
    window.addEventListener(WELCOME_EVENT, onWelcome);
    return () => window.removeEventListener(WELCOME_EVENT, onWelcome);
  }, []);

  if (!shown) return null;
  const close = () => setShown(null);
  const first = String(shown.name || "").trim().split(" ")[0];
  const register = shown.kind === "register";
  const ViaIcon = shown.via === "phone" ? MessageSquareText : Mail;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={close}>
      <div
        role="dialog"
        aria-label="Congratulations"
        onClick={(event) => event.stopPropagation()}
        className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-brand/40 bg-gradient-to-b from-[#3a0d1f] via-[#1a1020] to-[#0f1115] p-6 text-center shadow-[0_20px_60px_-15px_#ff2d6f]"
      >
        <button type="button" onClick={close} aria-label="Close" className="absolute right-3 top-3 cursor-pointer rounded-full p-1.5 text-white/70 hover:bg-white/10 hover:text-white">
          <X className="h-5 w-5" />
        </button>
        <div className="pointer-events-none absolute inset-x-0 top-2 flex justify-around text-2xl" aria-hidden="true">
          <span className="animate-bounce">🎉</span>
          <span className="animate-bounce [animation-delay:150ms]">✨</span>
          <span className="animate-bounce [animation-delay:300ms]">🎊</span>
        </div>
        <span className="bg-brand-gradient mx-auto mt-6 flex h-20 w-20 items-center justify-center rounded-full shadow-lg shadow-brand/40">
          <PartyPopper className="h-10 w-10" />
        </span>
        <h2 className="mt-4 text-2xl font-extrabold">Congratulations{first ? `, ${first}` : ""}!</h2>
        <p className="mt-2 text-[15px] leading-relaxed text-white/85">
          {register ? "আপনার PipraTube account সফলভাবে তৈরি হয়েছে। PipraTube-এ আপনাকে স্বাগতম!" : "আপনি সফলভাবে login করেছেন। আবার স্বাগতম!"}
        </p>
        {shown.via && (
          <p className="mt-3 flex items-center justify-center gap-1.5 rounded-xl bg-white/5 px-3 py-2 text-xs text-white/70">
            <ViaIcon className="h-4 w-4 shrink-0" /> আপনার {shown.via === "phone" ? "মোবাইলে SMS" : "email-এ"} একটি congratulation message পাঠানো হয়েছে
          </p>
        )}
        <button type="button" onClick={close} className="bg-brand-gradient mt-5 w-full cursor-pointer rounded-xl py-3 font-semibold">
          {register ? "শুরু করুন" : "ঠিক আছে"}
        </button>
      </div>
    </div>
  );
};

export default WelcomeModal;
