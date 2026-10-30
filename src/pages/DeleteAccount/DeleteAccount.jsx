import React, { useCallback, useState } from "react";
import { Link, useNavigate } from "react-router";
import { CheckCircle2, Clock, LogIn, ShieldCheck, Trash2 } from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import { Card } from "../../components/ui/ui";
import DeleteAccountModal from "../../components/AccountModals/DeleteAccountModal";

// pipratube.com/delete-account — the public page Google Play links to
// ("Delete account URL"): how to delete a PipraTube account, what is deleted
// and what is kept. Signed in, the button opens the same delete flow as the
// menu's Delete Account.

const STEPS = [
  ["Sign in", "Open pipratube.com or the PipraTube app and sign in to the account you want to delete.", "যে account delete করবেন, সেটিতে login করুন।"],
  ["Open Delete Account", "Open the menu (sidebar) and tap Delete Account, under Logout — or use the button on this page.", "Menu (sidebar)-এ Logout-এর নিচে Delete Account-এ চাপুন।"],
  ["Confirm", "Read what will be deleted and tick the box to confirm.", "কী কী মুছে যাবে তা পড়ে নিশ্চিত করুন।"],
  ["Verify it's you", "We send a one-time code to your phone (SMS) and/or email. Enter the codes.", "আপনার phone-এ SMS ও/বা email-এ পাঠানো code দিন।"],
  ["Done", "Your account and its data are deleted right away. You'll get a confirmation message.", "সাথে সাথে account ও সব data মুছে যাবে।"],
];

const DELETED = [
  "Your account: name, email, phone number, password and profile picture",
  "Your channel, with every video and Short, thumbnails and video files",
  "Your comments, replies, likes, playlists, subscriptions and watch history",
  "Notifications, badges, coin balance and coin history",
  "Identity verification details and ID / selfie pictures",
];

const KEPT = [
  "Payment records (coin purchases), earnings and payout records — kept for up to 5 years because tax and accounting laws require it, then deleted. They are no longer linked to a usable account.",
  "Gifts you already sent stay counted in the receiving creator's earnings.",
  "Server backups may hold copies for up to 30 days before they are overwritten.",
];

const DeleteAccount = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);

  return (
    <div className="mx-auto max-w-3xl space-y-5 pb-10">
      <div className="rounded-3xl border border-[#e3172f]/30 bg-gradient-to-br from-[#3a0d1f] to-card p-5 sm:p-7">
        <p className="text-sm font-semibold text-[#ff6b81]">PipraTube</p>
        <h1 className="mt-1 text-2xl font-extrabold sm:text-3xl">Delete your PipraTube account</h1>
        <p className="mt-2 text-sm leading-relaxed text-white/80">
          You can delete your PipraTube account and its data at any time, from the website or the PipraTube app. Deleting is permanent and can't be undone.
        </p>
        <p className="mt-1 text-sm leading-relaxed text-white/70">আপনার PipraTube account ও সব data যেকোনো সময় delete করতে পারবেন। এটা স্থায়ী — আর ফেরত আনা যাবে না।</p>
        <div className="mt-5">
          {user ? (
            <button type="button" onClick={() => setOpen(true)} className="flex cursor-pointer items-center gap-2 rounded-xl bg-[#e3172f] px-5 py-3 font-semibold hover:brightness-110">
              <Trash2 className="h-5 w-5" /> Delete my account
            </button>
          ) : (
            <Link to="/login" state={{ from: "/delete-account" }} className="bg-brand-gradient inline-flex items-center gap-2 rounded-xl px-5 py-3 font-semibold">
              <LogIn className="h-5 w-5" /> Sign in to delete your account
            </Link>
          )}
        </div>
      </div>

      <Card className="p-5 sm:p-6">
        <h2 className="text-lg font-bold">How to delete your account</h2>
        <ol className="mt-4 space-y-4">
          {STEPS.map(([title, text, bn], index) => (
            <li key={title} className="flex gap-3">
              <span className="bg-brand-gradient flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold">{index + 1}</span>
              <div>
                <p className="font-semibold">{title}</p>
                <p className="text-sm text-white/80">{text}</p>
                <p className="text-sm text-muted">{bn}</p>
              </div>
            </li>
          ))}
        </ol>
      </Card>

      <div className="grid gap-5 md:grid-cols-2">
        <Card className="p-5 sm:p-6">
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <Trash2 className="h-5 w-5 text-[#ff6b81]" /> What is deleted
          </h2>
          <ul className="mt-3 space-y-2 text-sm text-white/85">
            {DELETED.map((line) => (
              <li key={line} className="flex gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#4ade80]" /> {line}
              </li>
            ))}
          </ul>
        </Card>
        <Card className="p-5 sm:p-6">
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <Clock className="h-5 w-5 text-amber-300" /> What is kept, and for how long
          </h2>
          <ul className="mt-3 space-y-2 text-sm text-white/85">
            {KEPT.map((line) => (
              <li key={line} className="flex gap-2">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" /> {line}
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card className="p-5 text-sm text-white/80 sm:p-6">
        <h2 className="text-lg font-bold text-white">Can't sign in?</h2>
        <p className="mt-2">
          Use <Link to="/forgot-password" className="font-semibold text-brand hover:underline">Forgot password</Link> to get back into your account first, then delete it as above.
          If that doesn't work, email{" "}
          <a href="mailto:support@pipratube.com" className="font-semibold text-brand hover:underline">
            support@pipratube.com
          </a>{" "}
          from your account's email, or with your account's phone number, and we'll delete it within 7 days.
        </p>
      </Card>

      {open && (
        <DeleteAccountModal
          onClose={close}
          onDeleted={() => {
            setOpen(false);
            logout();
            navigate("/");
          }}
        />
      )}
    </div>
  );
};

export default DeleteAccount;
