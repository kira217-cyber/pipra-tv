import React, { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router";
import { Lock, Mail, Phone, UserRound } from "lucide-react";
import { toast } from "react-toastify";

import AuthShell from "./AuthShell";
import { Field, PrimaryButton, inputClass } from "../../components/ui/ui";
import { useAuth } from "../../context/AuthContext";
import { apiError } from "../../api/studioApi";

const Register = () => {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ fullName: "", email: "", phone: "", password: "" });
  const [busy, setBusy] = useState(false);

  const target = location.state?.from || "/studio";

  if (user) return <Navigate to={target} replace />;

  const set = (key) => (event) => setForm((previous) => ({ ...previous, [key]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    if (form.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setBusy(true);
    try {
      await register({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password,
      });
      toast.success("Account created! Set up your channel next.");
      navigate("/studio/profile", { replace: true });
    } catch (error) {
      toast.error(apiError(error, "Sign up failed"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      title="Create your account"
      subtitle="Start your channel and share your videos with everyone"
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" state={location.state} className="font-semibold text-brand hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <Field label="Full name" icon={UserRound} required>
          <input required value={form.fullName} onChange={set("fullName")} className={inputClass} autoComplete="name" />
        </Field>
        <Field label="Email" icon={Mail} required>
          <input required type="email" value={form.email} onChange={set("email")} className={inputClass} autoComplete="email" />
        </Field>
        <Field label="Phone" icon={Phone} required>
          <input required type="tel" value={form.phone} onChange={set("phone")} placeholder="01XXXXXXXXX" className={inputClass} autoComplete="tel" />
        </Field>
        <Field label="Password" icon={Lock} required>
          <input
            required
            type="password"
            value={form.password}
            onChange={set("password")}
            placeholder="At least 6 characters"
            className={inputClass}
            autoComplete="new-password"
          />
        </Field>
        <PrimaryButton type="submit" disabled={busy} className="w-full">
          {busy ? "Creating account..." : "Create account"}
        </PrimaryButton>
      </form>
    </AuthShell>
  );
};

export default Register;
