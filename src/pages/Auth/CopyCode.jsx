import React, { useEffect, useState } from "react";
import { Link } from "react-router";
import { Check, Copy } from "lucide-react";

import AuthShell from "./AuthShell";
import { PrimaryButton } from "../../components/ui/ui";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";

// The "Copy code" button in the verification email opens this page
// (/copy-code#123456 — the part after # never reaches any server). Mail
// apps can't copy from inside an email, so the code is copied here: right
// away when the browser allows it, otherwise with one tap.
const CopyCode = () => {
  useDocumentTitle("Copy your code");
  const [code] = useState(() => (window.location.hash.slice(1).match(/^\d{4,8}$/) || [""])[0]);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
    } catch {
      // Clipboard blocked — the digits can still be selected and copied.
    }
  };

  useEffect(() => {
    if (!code) return;
    navigator.clipboard
      ?.writeText(code)
      .then(() => setCopied(true))
      .catch(() => {});
  }, [code]);

  if (!code) {
    return (
      <AuthShell title="No code here" subtitle="Open this page from the button in your PipraTube email">
        <Link to="/register" className="block text-center text-sm font-semibold text-brand hover:underline">
          Go to sign up
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Your verification code" subtitle="Paste it on the sign-up page to finish">
      <div className="flex justify-center gap-2 select-all" aria-label={`Code ${code}`}>
        {code.split("").map((digit, index) => (
          <span key={index} className="flex h-14 w-11 items-center justify-center rounded-xl border border-brand/40 bg-brand/10 font-mono text-2xl font-bold text-white">
            {digit}
          </span>
        ))}
      </div>
      <PrimaryButton type="button" onClick={copy} className="mt-6 w-full">
        {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />} {copied ? "Copied" : "Copy code"}
      </PrimaryButton>
      {copied && <p className="mt-3 text-center text-sm text-[#4ade80]">The code is copied — go back and paste it.</p>}
    </AuthShell>
  );
};

export default CopyCode;
