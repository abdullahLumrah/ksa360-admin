export type SouqSeller = {
  id?: string;
  name?: string;
  avatar?: string;
  phone?: string;
  whatsapp?: string;
  memberSince?: string;
  isVerified?: boolean;
};

export type SouqAd = {
  id: string;
  source?: string;
  categoryId: string;
  subcategoryId?: string | null;
  title: string;
  subtitle?: string;
  description?: string;
  price: number | null;
  isNegotiable?: boolean;
  currency?: string;
  condition?: string;
  images?: string[];
  video?: string;
  city: string;
  district?: string | null;
  make?: string;
  bodyType?: string;
  attributes?: Record<string, unknown>;
  seller?: SouqSeller;
  status: string;
  views: number;
  favoritesCount?: number;
  createdAt?: string;
  updatedAt?: string;
  originalUrl?: string | null;
};

const SPEC_KEYS = [
  ["make", "Make"],
  ["model", "Model"],
  ["year", "Year"],
  ["mileage", "Mileage"],
  ["transmission", "Gear"],
  ["fuel", "Fuel"],
  ["bodyType", "Body"],
  ["color", "Color"],
  ["engine", "Engine"],
  ["origin", "Origin"],
] as const;

function text(value: unknown) {
  if (value == null) return "";
  const raw = String(value).trim();
  return raw && raw !== "null" ? raw : "";
}

export function specPairs(ad: SouqAd) {
  const attrs = ad.attributes || {};
  const used = new Set<string>();
  const pairs: Array<[string, string]> = [];
  const push = (label: string, value: unknown, key?: string) => {
    let shown = text(value);
    if (!shown) return;
    if (key === "mileage" && /^\d+$/.test(shown)) {
      shown = `${Number(shown).toLocaleString("en-US")} km`;
    }
    pairs.push([label, shown]);
    if (key) used.add(key);
  };

  push("Make", ad.make || attrs.make, "make");
  for (const [key, label] of SPEC_KEYS) {
    if (key === "make") continue;
    push(label, attrs[key] ?? (key === "bodyType" ? ad.bodyType : ""), key);
  }
  if (ad.condition) push("Condition", ad.condition);
  if (ad.district) push("District", ad.district);
  if (ad.isNegotiable) push("Price", "Negotiable");

  for (const [key, value] of Object.entries(attrs)) {
    if (used.has(key) || value == null || typeof value === "object") continue;
    const label = key.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());
    push(label, value);
  }
  return pairs;
}
