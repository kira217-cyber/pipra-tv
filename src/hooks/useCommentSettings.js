import { useEffect, useState } from "react";

import { api } from "../api/axios";

// What comments may carry besides text — voice, pictures — as the admin set
// it (Admin → Comment settings). Asked once per visit.
let settingsPromise = null;
const loadSettings = () => {
  settingsPromise ||= api
    .get("/api/comments/settings")
    .then(({ data }) => data.data.settings)
    .catch(() => {
      settingsPromise = null;
      return { voice: { enabled: false }, image: { enabled: false } };
    });
  return settingsPromise;
};

export const useCommentSettings = () => {
  const [settings, setSettings] = useState(null);
  useEffect(() => {
    let alive = true;
    loadSettings().then((s) => alive && setSettings(s));
    return () => {
      alive = false;
    };
  }, []);
  return settings;
};

export default useCommentSettings;
