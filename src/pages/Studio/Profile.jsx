import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  AtSign,
  Bell,
  BadgeCheck,
  Calendar,
  Camera,
  FileText,
  Globe,
  Languages,
  LayoutGrid,
  Link2,
  Lock,
  Mail,
  MapPin,
  Pencil,
  Phone,
  PlayCircle,
  PlusCircle,
  Save,
  Settings,
  Trash2,
  UserRound,
  Users,
} from "lucide-react";
import { toast } from "react-toastify";

import { Avatar, Card, GhostButton, Logo, PrimaryButton, inputClass } from "../../components/ui/ui";
import { apiError, studioApi } from "../../api/studioApi";
import { useAuth } from "../../context/AuthContext";
import { creatorHandle } from "../../utils/menu";
import { IMG, mediaUrl } from "../../utils/format";
import { FacebookIcon, InstagramIcon, TiktokIcon, YoutubeIcon } from "../../layout/socialIcons";

const COUNTRIES = ["Bangladesh", "India", "Nepal", "Pakistan", "Saudi Arabia", "United Arab Emirates", "United Kingdom", "United States", "Other"];
const GENDERS = ["Male", "Female", "Other", "Prefer not to say"];
const CHANNEL_CATEGORIES = ["Entertainment", "Movies", "Natok & Drama", "Music", "Kids", "Sports", "News", "Education", "Comedy", "Lifestyle"];
const LANGUAGES = ["Bangla", "English", "Hindi", "Urdu", "Arabic"];

const LINK_TYPES = [
  { match: /youtube|youtu\.be/i, icon: YoutubeIcon, bg: "#ff0000" },
  { match: /facebook|fb\.com/i, icon: FacebookIcon, bg: "#1877f2" },
  { match: /instagram/i, icon: InstagramIcon, bg: "linear-gradient(45deg,#f9ce34,#ee2a7b,#6228d7)" },
  { match: /tiktok/i, icon: TiktokIcon, bg: "#000" },
];

// Profile details the server doesn't store yet stay on this device.
const extrasKey = (id) => `pipra_profile_extras_${id}`;
const DEFAULT_EXTRAS = {
  dob: "",
  country: "Bangladesh",
  gender: "",
  description: "সবার জন্য বিনোদন! নতুন সিনেমা, নাটক, কার্টুন, খেলা এবং আরও অনেক কিছু — সব একসাথে PipraTV তে।",
  category: "Entertainment",
  language: "Bangla",
  links: [],
  appLanguage: "English",
  emailNotifications: true,
  pushNotifications: true,
};

const readExtras = (id) => {
  try {
    return { ...DEFAULT_EXTRAS, ...JSON.parse(localStorage.getItem(extrasKey(id)) || "{}") };
  } catch {
    return DEFAULT_EXTRAS;
  }
};

const Section = ({ icon: Icon, color, title, subtitle, action, children }) => (
  <Card className="p-4 sm:p-5">
    <div className="mb-4 flex items-start gap-3">
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white" style={{ background: color }}>
        <Icon className="h-6 w-6" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-lg font-bold">{title}</p>
        <p className="text-sm text-muted">{subtitle}</p>
      </div>
      {action}
    </div>
    {children}
  </Card>
);

// Compact labelled box from the design: label on top, value below, icon left.
const Box = ({ icon: Icon, label, children, className = "" }) => (
  <label className={`flex items-center gap-3 rounded-xl border border-line bg-black/20 px-3 py-2 focus-within:border-brand/60 ${className}`}>
    <Icon className="h-5 w-5 shrink-0 text-muted" />
    <span className="min-w-0 flex-1">
      <span className="block text-xs text-muted">{label}</span>
      {children}
    </span>
  </label>
);

const boxInput = "w-full bg-transparent text-[15px] text-white outline-none disabled:text-white [color-scheme:dark]";

const Toggle = ({ on, onChange }) => (
  <button
    type="button"
    role="switch"
    aria-checked={on}
    onClick={() => onChange(!on)}
    className={`relative h-7 w-12 shrink-0 cursor-pointer rounded-full transition ${on ? "bg-[#2f86e6]" : "bg-white/15"}`}
  >
    <span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-all ${on ? "left-6" : "left-1"}`} />
  </button>
);

const PasswordPrompt = ({ onCancel, onConfirm, busy }) => {
  const [password, setPassword] = useState("");
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70 p-4 sm:items-center">
      <Card className="w-full max-w-sm p-5">
        <p className="text-lg font-bold">Confirm your password</p>
        <p className="mt-1 text-sm text-muted">Changing your name, email or phone needs your current password.</p>
        <label className="mt-4 flex items-center gap-3 rounded-xl border border-white/15 bg-black/20 px-3">
          <Lock className="h-5 w-5 text-muted" />
          <input
            autoFocus
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && password && onConfirm(password)}
            className={inputClass}
            placeholder="Current password"
          />
        </label>
        <div className="mt-5 flex gap-3">
          <GhostButton onClick={onCancel} disabled={busy} className="flex-1">
            Cancel
          </GhostButton>
          <PrimaryButton onClick={() => onConfirm(password)} disabled={busy || !password} className="flex-1 py-2.5 text-sm">
            {busy ? "Saving..." : "Confirm"}
          </PrimaryButton>
        </div>
      </Card>
    </div>
  );
};

const initialAccount = (user) => ({
  fullName: user.fullName || "",
  email: user.email || "",
  phone: user.phone || "",
  channelName: user.channel?.name || "",
});

const Profile = () => {
  const { user, refreshProfile, logout } = useAuth();
  const navigate = useNavigate();

  const [account, setAccount] = useState(() => initialAccount(user));
  const [extras, setExtras] = useState(() => readExtras(user.id));
  const [logoFile, setLogoFile] = useState(null);
  const [cover, setCover] = useState(() => {
    try {
      return localStorage.getItem(`pipra_cover_${user.id}`);
    } catch {
      return null;
    }
  });
  const [editPersonal, setEditPersonal] = useState(false);
  const [editChannel, setEditChannel] = useState(!user.channel);
  const [newLink, setNewLink] = useState(null);
  const [askPassword, setAskPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  const logoPreview = useMemo(() => (logoFile ? URL.createObjectURL(logoFile) : null), [logoFile]);
  useEffect(() => () => logoPreview && URL.revokeObjectURL(logoPreview), [logoPreview]);

  const setA = (key) => (event) => setAccount((previous) => ({ ...previous, [key]: event.target.value }));
  const setE = (key) => (event) => setExtras((previous) => ({ ...previous, [key]: event.target.value }));

  const original = initialAccount(user);
  const accountChanged =
    account.fullName.trim() !== original.fullName ||
    account.email.trim().toLowerCase() !== original.email ||
    account.phone.trim() !== original.phone;
  const credentialsChanged =
    account.email.trim().toLowerCase() !== original.email || account.phone.trim() !== original.phone;
  const channelChanged = account.channelName.trim() !== original.channelName || Boolean(logoFile);

  const pickCover = (file) => {
    if (!file) return;
    if (file.size > 1.5 * 1024 * 1024) {
      toast.error("Cover image must be under 1.5MB for now");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      try {
        localStorage.setItem(`pipra_cover_${user.id}`, reader.result);
      } catch {
        toast.error("Couldn't save the cover on this device");
      }
      setCover(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const save = async (currentPassword) => {
    if (accountChanged && !currentPassword) {
      setAskPassword(true);
      return;
    }

    setSaving(true);
    try {
      try {
        localStorage.setItem(extrasKey(user.id), JSON.stringify(extras));
      } catch {
        // Storage blocked — extras just won't persist.
      }

      if (channelChanged) {
        if (!account.channelName.trim()) throw new Error("Channel name is required");
        const form = new FormData();
        form.append("name", account.channelName.trim());
        if (logoFile) form.append("logo", logoFile);
        await studioApi.put("/api/studio/channel", form);
      }

      if (accountChanged) {
        await studioApi.put("/api/studio/profile", {
          fullName: account.fullName.trim(),
          email: account.email.trim(),
          phone: account.phone.trim(),
          currentPassword,
        });
      }

      if (credentialsChanged) {
        // The server signs every device out when email/phone change.
        toast.success("Saved! Please sign in again with your new details.");
        logout();
        navigate("/login", { replace: true });
        return;
      }

      const fresh = await refreshProfile();
      setAccount(initialAccount(fresh));
      setLogoFile(null);
      setAskPassword(false);
      setEditPersonal(false);
      setEditChannel(false);
      toast.success("Changes saved");
    } catch (error) {
      toast.error(error?.response ? apiError(error, "Couldn't save changes") : error.message);
    } finally {
      setSaving(false);
    }
  };

  const cancel = () => {
    setAccount(initialAccount(user));
    setExtras(readExtras(user.id));
    setLogoFile(null);
    setEditPersonal(false);
    setEditChannel(!user.channel);
  };

  const addLink = () => {
    const url = newLink?.trim();
    if (!url) return;
    if (!/^https?:\/\//i.test(url)) {
      toast.error("Links must start with https://");
      return;
    }
    setExtras((previous) => ({ ...previous, links: [...previous.links, url] }));
    setNewLink(null);
  };

  const displayName = account.channelName || user.fullName;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">Account & Profile</h1>
        <p className="mt-1 text-sm text-muted sm:text-base">Manage your personal information and channel details</p>
      </div>

      {/* Cover + identity */}
      <div className="relative overflow-hidden rounded-2xl border border-line">
        <div className="relative h-28 sm:h-40">
          {cover ? (
            <img src={cover} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-r from-[#1c0a14] via-[#2a0d2a] to-[#3a0d1f]">
              <Logo className="h-14 opacity-90 sm:h-20" />
            </div>
          )}
          <label className="absolute right-3 top-3 flex cursor-pointer items-center gap-2 rounded-xl border border-white/20 bg-black/60 px-3 py-2 text-sm backdrop-blur">
            <Camera className="h-4 w-4" /> Change Cover
            <input type="file" accept="image/*" className="hidden" onChange={(event) => pickCover(event.target.files?.[0])} />
          </label>
        </div>
        <div className="flex items-end gap-4 bg-card px-4 pb-4">
          <label className="relative -mt-12 cursor-pointer" title="Change channel logo">
            <Avatar
              src={logoPreview || mediaUrl(user.channel?.logo, IMG.avatar)}
              name={displayName}
              size="h-24 w-24 sm:h-28 sm:w-28"
            />
            <span className="absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full border-2 border-card bg-card-2">
              <Camera className="h-4 w-4" />
            </span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(event) => {
                setLogoFile(event.target.files?.[0] || null);
                setEditChannel(true);
              }}
            />
          </label>
          <div className="min-w-0 pt-3">
            <p className="flex items-center gap-2 text-xl font-bold sm:text-2xl">
              <span className="truncate">{displayName}</span>
              <BadgeCheck className="h-6 w-6 shrink-0 fill-[#2f86e6] text-white" />
            </p>
            <p className="text-sm text-muted">{creatorHandle(user)}</p>
            <p className="text-sm text-slate-300">Content Creator</p>
          </div>
        </div>
      </div>

      <Section
        icon={UserRound}
        color="#ff2d6f"
        title="Personal Information"
        subtitle="Update your personal details"
        action={
          <GhostButton onClick={() => setEditPersonal((value) => !value)}>
            <Pencil className="h-4 w-4" /> {editPersonal ? "Done" : "Edit"}
          </GhostButton>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Box icon={UserRound} label="Full Name">
            <input disabled={!editPersonal} value={account.fullName} onChange={setA("fullName")} className={boxInput} />
          </Box>
          <Box icon={Mail} label="Email Address">
            <input disabled={!editPersonal} type="email" value={account.email} onChange={setA("email")} className={boxInput} />
          </Box>
          <Box icon={Phone} label="Phone Number">
            <input disabled={!editPersonal} type="tel" value={account.phone} onChange={setA("phone")} className={boxInput} />
          </Box>
          <Box icon={Calendar} label="Date of Birth">
            <input disabled={!editPersonal} type="date" value={extras.dob} onChange={setE("dob")} className={boxInput} />
          </Box>
          <Box icon={MapPin} label="Country">
            <select disabled={!editPersonal} value={extras.country} onChange={setE("country")} className={`${boxInput} cursor-pointer`}>
              {COUNTRIES.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </Box>
          <Box icon={Users} label="Gender">
            <select disabled={!editPersonal} value={extras.gender} onChange={setE("gender")} className={`${boxInput} cursor-pointer`}>
              <option value="">Select</option>
              {GENDERS.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </Box>
        </div>
      </Section>

      <Section
        icon={PlayCircle}
        color="#7c3aed"
        title="Channel Information"
        subtitle={user.channel ? "Update your channel details" : "Create your channel so viewers can find you"}
        action={
          <GhostButton onClick={() => setEditChannel((value) => !value)}>
            <Pencil className="h-4 w-4" /> {editChannel ? "Done" : "Edit"}
          </GhostButton>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Box icon={Mail} label="Channel Name">
            <input
              disabled={!editChannel}
              value={account.channelName}
              onChange={setA("channelName")}
              placeholder="Your channel name"
              className={`${boxInput} placeholder:text-slate-500`}
            />
          </Box>
          <Box icon={AtSign} label="Channel Handle">
            <input disabled value={creatorHandle({ ...user, channel: { name: account.channelName } })} className={boxInput} />
          </Box>
          <Box icon={FileText} label="Channel Description" className="sm:col-span-2">
            <textarea
              disabled={!editChannel}
              rows={2}
              value={extras.description}
              onChange={setE("description")}
              className={`${boxInput} resize-none`}
            />
          </Box>
          <Box icon={LayoutGrid} label="Category">
            <select disabled={!editChannel} value={extras.category} onChange={setE("category")} className={`${boxInput} cursor-pointer`}>
              {CHANNEL_CATEGORIES.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </Box>
          <Box icon={Globe} label="Language">
            <select disabled={!editChannel} value={extras.language} onChange={setE("language")} className={`${boxInput} cursor-pointer`}>
              {LANGUAGES.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </Box>
        </div>
      </Section>

      <Section
        icon={Link2}
        color="#16a34a"
        title="Links"
        subtitle="Add your social media links"
        action={
          <GhostButton onClick={() => setNewLink("")}>
            <PlusCircle className="h-4 w-4" /> Add Link
          </GhostButton>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2">
          {extras.links.map((url, index) => {
            const type = LINK_TYPES.find((item) => item.match.test(url));
            const Icon = type?.icon;
            return (
              <div key={url + index} className="flex items-center gap-3 rounded-xl border border-line bg-black/20 px-3 py-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white" style={{ background: type?.bg || "#334155" }}>
                  {Icon ? <Icon /> : <Link2 className="h-4 w-4" />}
                </span>
                <a href={url} target="_blank" rel="noreferrer" className="min-w-0 flex-1 truncate text-sm hover:underline">
                  {url}
                </a>
                <button
                  type="button"
                  aria-label="Remove link"
                  onClick={() => setExtras((previous) => ({ ...previous, links: previous.links.filter((_, i) => i !== index) }))}
                  className="cursor-pointer text-muted hover:text-white"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            );
          })}
          {newLink !== null && (
            <div className="flex items-center gap-2 rounded-xl border border-brand/50 bg-black/20 px-3">
              <Link2 className="h-5 w-5 text-muted" />
              <input
                autoFocus
                value={newLink}
                onChange={(event) => setNewLink(event.target.value)}
                onKeyDown={(event) => event.key === "Enter" && addLink()}
                placeholder="https://youtube.com/@yourchannel"
                className={`${inputClass} h-11 text-sm`}
              />
              <button type="button" onClick={addLink} className="cursor-pointer text-sm font-semibold text-brand">
                Add
              </button>
            </div>
          )}
          {extras.links.length === 0 && newLink === null && <p className="text-sm text-muted">No links yet.</p>}
        </div>
      </Section>

      <Section icon={Settings} color="#d97706" title="Preferences" subtitle="Manage your preferences">
        <div className="divide-y divide-line rounded-xl border border-line">
          <label className="flex items-center gap-3 px-3 py-3">
            <Languages className="h-5 w-5 text-muted" />
            <span className="flex-1 text-sm">Language</span>
            <select
              value={extras.appLanguage}
              onChange={setE("appLanguage")}
              className="cursor-pointer bg-transparent text-sm text-slate-300 outline-none [color-scheme:dark]"
            >
              <option>English</option>
              <option>বাংলা</option>
            </select>
          </label>
          <div className="flex items-center gap-3 px-3 py-3">
            <Mail className="h-5 w-5 text-muted" />
            <span className="flex-1">
              <span className="block text-sm">Email Notifications</span>
              <span className="block text-xs text-muted">Receive important updates via email</span>
            </span>
            <Toggle on={extras.emailNotifications} onChange={(value) => setExtras((p) => ({ ...p, emailNotifications: value }))} />
          </div>
          <div className="flex items-center gap-3 px-3 py-3">
            <Bell className="h-5 w-5 text-muted" />
            <span className="flex-1">
              <span className="block text-sm">Push Notifications</span>
              <span className="block text-xs text-muted">Get notified about comments, likes and more</span>
            </span>
            <Toggle on={extras.pushNotifications} onChange={(value) => setExtras((p) => ({ ...p, pushNotifications: value }))} />
          </div>
        </div>

        <div className="mt-5 flex gap-3">
          <PrimaryButton onClick={() => save()} disabled={saving} className="flex-[2]">
            <Save className="h-5 w-5" /> {saving ? "Saving..." : "Save Changes"}
          </PrimaryButton>
          <GhostButton onClick={cancel} disabled={saving} className="flex-1">
            Cancel
          </GhostButton>
        </div>
      </Section>

      {askPassword && (
        <PasswordPrompt busy={saving} onCancel={() => setAskPassword(false)} onConfirm={(password) => save(password)} />
      )}
    </div>
  );
};

export default Profile;
