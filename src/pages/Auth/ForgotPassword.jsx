import React, { useEffect, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router";
import { ArrowLeft, Eye, EyeOff, KeyRound, Lock, Mail, Phone, UserRound } from "lucide-react";

import AuthShell from "./AuthShell";
import { Field, PrimaryButton, inputClass } from "../../components/ui/ui";
import { useAuth } from "../../context/AuthContext";
import { apiError, studioApi } from "../../api/studioApi";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { toast } from "../../utils/alerts";

// Forgot password: the account's mobile number or email → a code by SMS or
// email (whichever was given) → a new password, and the viewer is signed in.

const isPhone = (value) => /^(\+?88)?01[3-9]\d{8}$/.test(String(value).replace(/[\s-]/g, ""));

const ForgotPassword = () => {
  useDocumentTitle("Forgot password");
  const { user, saveSession } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [identifier, setIdentifier] = useState(location.state?.identifier || "");
  const [sentTo, setSentTo] = useState(null); // { identifier, method } once a code is out
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [wait, setWait] = useState(0);

  useEffect(() => {
    if (wait <= 0) return undefined;
    const timer = setTimeout(() => setWait((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [wait]);

  if (user && !busy) return <Navigate to="/" replace />;

  const sendCode = async (event) => {
    event?.preventDefault();
    const value = identifier.trim();
    if (!value) {
      toast.error("Enter your mobile number or email");
      return;
    }
    setBusy(true);
    try {
      const { data } = await studioApi.post("/api/auth/password/forgot", { identifier: value });
      setSentTo({ identifier: value, method: data.data.method });
      setWait(60);
      toast.success(data.message);
    } catch (error) {
      toast.error(apiError(error, "Couldn't send the code"));
    } finally {
      setBusy(false);
    }
  };

  const reset = async (event) => {
    event.preventDefault();
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setBusy(true);
    try {
      const { data } = await studioApi.post("/api/auth/password/reset", { identifier: sentTo.identifier, code: code.trim(), newPassword: password });
      saveSession(data.data);
      toast.success("Password changed — welcome back!");
      navigate("/", { replace: true });
    } catch (error) {
      toast.error(apiError(error, "Couldn't change the password"));
      setBusy(false);
    }
  };

  const footer = (
    <Link to="/login" className="inline-flex items-center gap-1 font-semibold text-brand hover:underline">
      <ArrowLeft className="h-4 w-4" /> Back to sign in
    </Link>
  );

  if (!sentTo) {
    return (
      <AuthShell title="Forgot password?" subtitle="We'll send a code to your phone or email" footer={footer}>
        <form onSubmit={sendCode} className="space-y-4">
          <Field label="Mobile number or email" icon={isPhone(identifier) ? Phone : identifier.includes("@") ? Mail : UserRound} required>
            <input
              required
              autoFocus
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              placeholder="01XXXXXXXXX or you@example.com"
              autoComplete="username"
              className={inputClass}
            />
          </Field>
          <p className="-mt-1 text-xs text-muted">Use the number or email of your PipraTube account. A phone number gets the code by SMS; an email gets it by email.</p>
          <PrimaryButton type="submit" disabled={busy} className="w-full">
            {busy ? "Sending code..." : "Send code"}
          </PrimaryButton>
        </form>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Choose a new password" subtitle={`Enter the code we sent ${sentTo.method === "phone" ? "by SMS to" : "to"} ${sentTo.identifier}`} footer={footer}>
      <form onSubmit={reset} className="space-y-4">
        <Field label={sentTo.method === "phone" ? "Code from the SMS" : "Code from the email"} icon={KeyRound} required>
          <div className="flex w-full gap-2">
            <input
              required
              autoFocus
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder="6-digit code"
              className={`${inputClass} tracking-widest`}
            />
            <button type="button" onClick={sendCode} disabled={wait > 0 || busy} className="shrink-0 cursor-pointer rounded-xl border border-white/15 px-3 text-sm font-semibold disabled:cursor-default disabled:opacity-50">
              {wait > 0 ? `Resend ${wait}s` : "Resend"}
            </button>
          </div>
        </Field>
        <Field label="New password" icon={Lock} required>
          <input
            required
            type={show ? "text" : "password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="At least 6 characters"
            autoComplete="new-password"
            className={inputClass}
          />
          <button type="button" onClick={() => setShow((value) => !value)} className="cursor-pointer text-muted" aria-label="Show password">
            {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </Field>
        <PrimaryButton type="submit" disabled={busy} className="w-full">
          {busy ? "Saving..." : "Save new password & sign in"}
        </PrimaryButton>
        <button type="button" onClick={() => setSentTo(null)} className="block w-full cursor-pointer text-center text-sm text-muted hover:text-white">
          Use a different number or email
        </button>
      </form>
    </AuthShell>
  );
};

export default ForgotPassword;
