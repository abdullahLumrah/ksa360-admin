import { mediaUrl } from "@/lib/api";

export function Thumb({ src, large = false }: { src?: string; large?: boolean }) {
  const href = mediaUrl(src);
  return (
    <span className={`thumb-box ${large ? "thumb-lg" : ""}`}>
      {href ? <img src={href} alt="" referrerPolicy="no-referrer" /> : null}
    </span>
  );
}

export function PageHeader({
  kicker,
  title,
  hint,
}: {
  kicker: string;
  title: string;
  hint?: string;
}) {
  return (
    <header className="mb-7">
      <p className="eyebrow">{kicker}</p>
      <h1 className="display mt-2">{title}</h1>
      {hint ? <p className="lede mt-2">{hint}</p> : null}
    </header>
  );
}

export function money(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return "";
  return `${new Intl.NumberFormat("en-US").format(value)} SAR`;
}

export function prettyStatus(value?: string | null) {
  return String(value || "unknown").replaceAll("_", " ");
}

export function prettyGender(value?: string | null) {
  const raw = (value || "").trim();
  if (!raw) return "—";
  return raw[0].toUpperCase() + raw.slice(1);
}

export function prettyDate(value?: string | null) {
  const raw = (value || "").trim();
  if (!raw) return "—";
  const dayOnly = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (dayOnly) {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${Number(dayOnly[3])} ${months[Number(dayOnly[2]) - 1]} ${dayOnly[1]}`;
  }
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return raw;
  return date.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
