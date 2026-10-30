import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, CheckCircle2, Mail, MessageSquareText, Trash2, X } from "lucide-react";

import { apiError, studioApi } from "../../api/studioApi";
import { toast } from "../../utils/alerts";

// Delete account: a warning first, then the codes sent to the account's
// phone (SMS) and email — or its password when no code can be sent — and the
// server deletes the account with everything on it (routes/auth.js).
// `onDeleted` runs once the person has seen the result (sign out there).

const LOST = [
  "আপনার channel এবং সব video ও Shorts",
  "আপনার সব comment, like, playlist ও watch history",
  "Subscriber, subscription ও notification",
  "Coin balance, earnings ও badge — ফেরত পাওয়া যাবে না",
  "Profile ছবি, identity document সহ account-এর সব তথ্য",
];

const box = "h-11 w-full rounded-xl border border-white/15 bg-black/30 px-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-[#e3172f]/70";

const CodeRow = ({ contact, value, onChange }) => {
  const [sending, setSending] = useState(false);
  const [wait, setWait] = useState(0);

  useEffect(() => {
    if (!wait) return undefined;
    const timer = setTimeout(() => setWait((n) => n - 1), 1000);
    return () => clearTimeout(timer);
  }, [wait]);

  const send = async () => {
    setSending(true);
    try {
      const { data } = await studioApi.post("/api/auth/account/delete/code", { via: contact.via });
      toast.success(data.message);
      setWait(60);
    } catch (error) {
      toast.error(apiError(error, "Code পাঠানো যায়নি"));
    } finally {
      setSending(false);
    }
  };

  const Icon = contact.via === "phone" ? MessageSquareText : Mail;
  return (
    <div className="rounded-2xl border border-line bg-black/20 p-3">
      <p className="flex min-w-0 items-center gap-2 text-sm font-semibold">
        <Icon className="h-4 w-4 shrink-0 text-muted" /> {contact.via === "phone" ? "Phone" : "Email"}: <span className="min-w-0 truncate text-white/80">{contact.masked}</span>
      </p>
      <div className="mt-2 flex gap-2">
        <input
          value={value}
          onChange={(event) => onChange(event.target.value.replace(/\D/g, "").slice(0, 6))}
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder="Code লিখুন"
          className={`${box} min-w-0 flex-1 text-base tracking-[0.3em] placeholder:tracking-normal`}
        />
        <button
          type="button"
          onClick={send}
          disabled={sending || wait > 0}
          className="w-[6.5rem] shrink-0 cursor-pointer whitespace-nowrap rounded-xl border border-white/15 text-sm font-semibold hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {sending ? "Sending…" : wait > 0 ? `${wait}s` : "Send code"}
        </button>
      </div>
    </div>
  );
};

const DeleteAccountModal = ({ onClose, onDeleted }) => {
  const [step, setStep] = useState("warn"); // warn → verify → done
  const [agree, setAgree] = useState(false);
  const [info, setInfo] = useState(null);
  const [codes, setCodes] = useState({});
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    studioApi
      .get("/api/auth/account/delete")
      .then(({ data }) => setInfo(data.data))
      .catch((error) => {
        toast.error(apiError(error, "Couldn't open account deletion"));
        onClose();
      });
  }, [onClose]);

  const close = () => (step === "done" ? onDeleted() : busy ? null : onClose());
  const ready = info && (info.needsPassword ? password.length > 0 : info.contacts.every((c) => (codes[c.via] || "").length >= 4));

  const remove = async () => {
    setBusy(true);
    try {
      await studioApi.post("/api/auth/account/delete", info.needsPassword ? { password } : { codes });
      setStep("done");
    } catch (error) {
      toast.error(apiError(error, "Account delete করা যায়নি"));
    } finally {
      setBusy(false);
    }
  };

  // On the body, so a menu drawer around the button can't clip it.
  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/75 p-4" onClick={close}>
      <div
        role="dialog"
        aria-label="Delete account"
        onClick={(event) => event.stopPropagation()}
        className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl border border-[#e3172f]/40 bg-card p-5 sm:p-6"
      >
        {step !== "done" && (
          <button type="button" onClick={close} aria-label="Close" className="absolute right-3 top-3 cursor-pointer rounded-full p-1.5 text-white/70 hover:bg-white/10 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        )}

        {step === "warn" && (
          <>
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#e3172f]/15">
              <AlertTriangle className="h-7 w-7 text-[#ff6b81]" />
            </span>
            <h2 className="mt-3 text-xl font-extrabold text-[#ff6b81]">Account স্থায়ীভাবে delete করবেন?</h2>
            <p className="mt-1 text-sm text-white/75">এটা আর ফেরত আনা যাবে না। নিচের সবকিছু চিরতরে মুছে যাবে:</p>
            {info?.channel && (
              <p className="mt-3 rounded-xl bg-[#e3172f]/10 px-3 py-2 text-sm">
                Channel <b>{info.channel.name}</b> — {info.channel.videos}টি video সহ
              </p>
            )}
            <ul className="mt-3 space-y-1.5 text-sm text-white/85">
              {LOST.map((line) => (
                <li key={line} className="flex gap-2">
                  <Trash2 className="mt-0.5 h-4 w-4 shrink-0 text-[#ff6b81]" /> {line}
                </li>
              ))}
            </ul>
            <label className="mt-4 flex cursor-pointer items-start gap-2.5 rounded-xl border border-line p-3 text-sm">
              <input type="checkbox" checked={agree} onChange={(event) => setAgree(event.target.checked)} className="mt-0.5 h-4 w-4 accent-[#e3172f]" />
              আমি বুঝেছি, আমার account ও সব data স্থায়ীভাবে delete হয়ে যাবে।
            </label>
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row">
              <button type="button" onClick={onClose} className="w-full whitespace-nowrap rounded-xl py-3 font-semibold sm:flex-1 cursor-pointer border border-white/15 hover:bg-white/10">
                Cancel
              </button>
              <button
                type="button"
                disabled={!agree || !info}
                onClick={() => setStep("verify")}
                className="w-full whitespace-nowrap rounded-xl py-3 font-semibold sm:flex-1 cursor-pointer bg-[#e3172f] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Continue
              </button>
            </div>
          </>
        )}

        {step === "verify" && info && (
          <>
            <h2 className="pr-8 text-xl font-extrabold">যাচাই করুন যে এটা আপনি</h2>
            {info.needsPassword ? (
              <>
                <p className="mt-1 text-sm text-white/75">Account delete করতে আপনার password দিন।</p>
                <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password" autoComplete="current-password" className={`${box} mt-4`} />
              </>
            ) : (
              <>
                <p className="mt-1 text-sm text-white/75">
                  {info.contacts.length > 1 ? "আপনার phone ও email দুটোতেই code পাঠান, তারপর দুটো code দিন।" : "Code পাঠান, তারপর code-টি দিন।"}
                </p>
                <div className="mt-4 space-y-3">
                  {info.contacts.map((contact) => (
                    <CodeRow key={contact.via} contact={contact} value={codes[contact.via] || ""} onChange={(value) => setCodes((previous) => ({ ...previous, [contact.via]: value }))} />
                  ))}
                </div>
              </>
            )}
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row">
              <button type="button" onClick={() => setStep("warn")} disabled={busy} className="w-full whitespace-nowrap rounded-xl py-3 font-semibold sm:flex-1 cursor-pointer border border-white/15 hover:bg-white/10 disabled:opacity-50">
                Back
              </button>
              <button
                type="button"
                disabled={!ready || busy}
                onClick={remove}
                className="flex w-full whitespace-nowrap rounded-xl py-3 font-semibold sm:flex-1 cursor-pointer items-center justify-center gap-2 bg-[#e3172f] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-[1.4]"
              >
                <Trash2 className="h-4 w-4 shrink-0" /> {busy ? "Deleting…" : "Delete account"}
              </button>
            </div>
          </>
        )}

        {step === "done" && (
          <div className="py-2 text-center">
            <CheckCircle2 className="mx-auto h-14 w-14 text-[#4ade80]" />
            <h2 className="mt-3 text-xl font-extrabold">আপনার account delete হয়েছে</h2>
            <p className="mt-1 text-sm text-white/75">আপনার account, channel, video ও সব data মুছে ফেলা হয়েছে। আবার যেকোনো সময় নতুন account খুলতে পারবেন।</p>
            <button type="button" onClick={onDeleted} className="bg-brand-gradient mt-5 w-full cursor-pointer rounded-xl py-3 font-semibold">
              ঠিক আছে
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
};

export default DeleteAccountModal;
