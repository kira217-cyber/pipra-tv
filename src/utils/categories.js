// Category filters for the Videos page. `value` is the server's own
// category name (models/Video.js CATEGORY_OPTIONS) — labels are friendlier.
export const VIDEO_CATEGORIES = [
  { label: "All", value: "" },
  { label: "Movies", value: "Movie" },
  { label: "Natok", value: "Natok" },
  { label: "Drama", value: "Drama" },
  { label: "Action", value: "Action" },
  { label: "Romance", value: "Romance" },
  { label: "Comedy", value: "Comedy" },
  { label: "Horror", value: "Horror" },
  { label: "Thriller", value: "Thriller" },
  { label: "Sports", value: "Sports" },
  { label: "Kids", value: "Animation" },
  { label: "Documentary", value: "Documentary" },
  { label: "Educational", value: "Educational" },
  { label: "Other", value: "Other" },
];

export const categoryLabel = (value) =>
  VIDEO_CATEGORIES.find((item) => item.value === value)?.label || value;

// Home page rows, in display order. Titles come from admin → Home
// sections; the fallback is used until one has been set.
export const HOME_ROWS = [
  { key: "trending", fallback: "Trending Now" },
  { key: "freeMovie", fallback: "Free Movies" },
  { key: "topTen", fallback: "Top 10 Today", ranked: true },
  { key: "allOtt", fallback: "All OTT Platforms" },
  { key: "football", fallback: "Football" },
  { key: "hollywood", fallback: "Hollywood" },
  { key: "horror", fallback: "Horror" },
];
