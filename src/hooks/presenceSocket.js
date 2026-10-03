import { io } from "socket.io-client";

import { api } from "../api/axios";

// One shared socket for the whole tab — every player/page/action tracker
// reuses it instead of opening a new connection each time.
let sharedSocket = null;

const getVisitorId = () => {
  const key = "otv_visitor_id";
  let id = localStorage.getItem(key);
  if (!id) {
    id =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    localStorage.setItem(key, id);
  }
  return id;
};

export const getPresenceSocket = () => {
  if (sharedSocket) return sharedSocket;

  sharedSocket = io(`${api.defaults.baseURL}/analytics-feed`, {
    auth: { role: "client", visitorId: getVisitorId() },
    transports: ["websocket", "polling"],
  });

  return sharedSocket;
};

// Fire-and-forget action tag for the admin "Site Analytics" live activity
// feed — pass a short label ("Played video", "Skipped ad") and an optional
// short detail string (a title, a channel name, etc.).
export const trackAction = (action, meta) => {
  getPresenceSocket().emit("user:action", { action, meta });
};

export default getPresenceSocket;
