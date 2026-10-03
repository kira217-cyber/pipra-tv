import React, { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router";
import { Eye, EyeOff, Lock, Sparkles, UserRound } from "lucide-react";
import { toast } from "react-toastify";

import AuthShell from "./AuthShell";
import { Field, PrimaryButton, inputClass } from "../../components/ui/ui";
import { useAuth } from "../../context/AuthContext";
import { apiError } from "../../api/studioApi";

const Login = () => {
  const { user, login, loginDemo } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  const target = location.state?.from || "/studio";

  if (user) return <Navigate to={target} replace />;

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      await login({ identifier: identifier.trim(), password });
      toast.success("Welcome back!");
      navigate(target, { replace: true });
    } catch (error) {
      toast.error(apiError(error, "Sign in failed"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to upload videos and manage your channel"
      footer={
        <>
          New to PipraTV?{" "}
          <Link to="/register" state={location.state} className="font-semibold text-brand hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <Field label="Email or phone" icon={UserRound} required>
          <input
            required
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
            placeholder="you@example.com"
            autoComplete="username"
            className={inputClass}
          />
        </Field>
        <Field label="Password" icon={Lock} required>
          <input
            required
            type={show ? "text" : "password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="••••••"
            autoComplete="current-password"
            className={inputClass}
          />
          <button type="button" onClick={() => setShow((value) => !value)} className="cursor-pointer text-muted" aria-label="Show password">
            {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </Field>
        <PrimaryButton type="submit" disabled={busy} className="w-full">
          {busy ? "Signing in..." : "Sign in"}
        </PrimaryButton>
      </form>

      <div className="my-5 flex items-center gap-3 text-xs text-muted">
        <span className="h-px flex-1 bg-line" /> or <span className="h-px flex-1 bg-line" />
      </div>

      <button
        type="button"
        onClick={() => {
          loginDemo();
          toast.success("You're in the demo account — nothing you do here is saved.");
          navigate(target, { replace: true });
        }}
        className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-brand/50 bg-brand/10 px-5 py-3 font-semibold text-white transition hover:bg-brand/20"
      >
        <Sparkles className="h-5 w-5 text-brand" /> Try Demo Account
      </button>
      <p className="mt-2 text-center text-xs text-muted">See the creator pages without signing up.</p>
    </AuthShell>
  );
};

export default Login;
