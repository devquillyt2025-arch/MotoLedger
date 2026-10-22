const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

export const rupees = (n: number) => inr.format(n);

export const num = (n: number, digits = 0) =>
  n.toLocaleString("en-IN", { maximumFractionDigits: digits });

export function shortDate(iso: string) {
  // iso is a plain YYYY-MM-DD; parse as local so it never shifts a day.
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** Today's date as YYYY-MM-DD in India time, regardless of server timezone. */
export function todayIST() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
}
