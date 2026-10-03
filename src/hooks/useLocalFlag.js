import { useState } from "react";

const read = (key) => {
  try {
    return localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
};

// An on/off flag remembered on this device — likes, saves and subscribes
// live here until the server has real endpoints for them. Follows `key`
// if it changes (e.g. once the channel id has loaded).
export const useLocalFlag = (key) => {
  const [state, setState] = useState(() => ({ key, on: read(key) }));
  const on = state.key === key ? state.on : read(key);

  const toggle = () => {
    const next = !on;
    try {
      localStorage.setItem(key, next ? "1" : "0");
    } catch {
      // Storage blocked — the flag just won't persist.
    }
    setState({ key, on: next });
  };

  return [on, toggle];
};

export default useLocalFlag;
