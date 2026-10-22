import { studioApi } from "./studioApi";
import { trackAction } from "../hooks/presenceSocket";

// Signed-in actions: reactions, subscriptions, comments, playlists,
// notifications. Each returns the `data` payload from the server.
const data = (promise) => promise.then((response) => response.data.data);

// Same call, plus a line in admin → Live analytics' activity feed.
const tracked = (label, promise) => data(promise).then((result) => {
  trackAction(label);
  return result;
});

export const reactToVideo = (videoId, value) =>
  tracked(value === "like" ? "Liked a video" : value === "dislike" ? "Disliked a video" : "Removed a rating", studioApi.post(`/api/videos/${videoId}/reaction`, { value }));

export const subscribe = (channelId) => tracked("Subscribed to a channel", studioApi.post(`/api/channels/${channelId}/subscribe`, {}));
export const unsubscribe = (channelId) => data(studioApi.delete(`/api/channels/${channelId}/subscribe`));
export const setBell = (channelId, notify) => data(studioApi.patch(`/api/channels/${channelId}/subscribe`, { notify }));

export const listComments = (client, videoId, { sort = "top", page = 1 } = {}) =>
  data(client.get(`/api/videos/${videoId}/comments`, { params: { sort, page } }));
export const listReplies = (client, commentId) => data(client.get(`/api/comments/${commentId}/replies`));
// A voice recording ({ blob, peaks }) or a picture (File) goes as a form upload.
export const addComment = (videoId, text, parent, { voice, image } = {}) => {
  let body = { text, parent };
  if (voice || image) {
    body = new FormData();
    body.append("text", text || "");
    if (parent) body.append("parent", parent);
    if (voice) {
      const ext = voice.blob.type.includes("mp4") ? "m4a" : voice.blob.type.includes("ogg") ? "ogg" : "webm";
      body.append("voice", voice.blob, `voice.${ext}`);
      body.append("peaks", JSON.stringify(voice.peaks || []));
    }
    if (image) body.append("image", image);
  }
  const label = voice ? "Sent a voice comment" : parent ? "Replied to a comment" : "Commented";
  return tracked(label, studioApi.post(`/api/videos/${videoId}/comments`, body));
};
export const editComment = (id, text) => data(studioApi.patch(`/api/comments/${id}`, { text }));
export const deleteComment = (id) => data(studioApi.delete(`/api/comments/${id}`));
export const likeComment = (id) => data(studioApi.post(`/api/comments/${id}/like`, {}));
export const pinComment = (id) => data(studioApi.post(`/api/comments/${id}/pin`, {}));
export const heartComment = (id) => data(studioApi.post(`/api/comments/${id}/heart`, {}));
// Pays coins and posts the gift as a comment (or, with replyTo, a reply).
export const sendGift = ({ videoId, giftId, text, replyTo }) => tracked("Sent a gift", studioApi.post("/api/gifts/send", { videoId, giftId, text, replyTo }));

export const myPlaylists = (videoId) => data(studioApi.get("/api/me/playlists", { params: { video: videoId } }));
export const togglePlaylistVideo = (playlistId, videoId, add) =>
  tracked(add ? "Saved a video" : "Unsaved a video", studioApi.post(`/api/playlists/${playlistId}/videos`, { video: videoId, add }));
export const createPlaylist = (body) => data(studioApi.post("/api/playlists", body));

export const notifications = (page = 1) => data(studioApi.get("/api/notifications", { params: { page } }));
export const unreadCount = () => data(studioApi.get("/api/notifications/unread-count"));
export const readAll = () => data(studioApi.post("/api/notifications/read-all", {}));
