export function relativeTime(input: string | Date | null | undefined): string {
  if (!input) return "—";
  const date = typeof input === "string" ? new Date(input) : input;
  const diffMs = Date.now() - date.getTime();
  const sec = Math.floor(diffMs / 1000);
  if (sec < 60) return "Just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} min ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return hr === 1 ? "1 hour ago" : `${hr} hours ago`;
  const day = Math.floor(hr / 24);
  if (day === 0) return "Today";
  if (day === 1) return "Yesterday";
  if (day < 7) return `${day} days ago`;
  if (day < 14) return "Last week";
  if (day < 30) return `${Math.floor(day / 7)} weeks ago`;
  const mo = Math.floor(day / 30);
  if (mo < 12) return mo === 1 ? "1 month ago" : `${mo} months ago`;
  const yr = Math.floor(day / 365);
  return yr === 1 ? "1 year ago" : `${yr} years ago`;
}
