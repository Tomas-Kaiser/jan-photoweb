export function formatMoneyFromCents(cents: number, currency: string) {
  const units = cents / 100;
  const formatted = Number.isInteger(units) ? units.toString() : units.toFixed(2);
  return currency === "CZK" ? `${formatted} Kč` : `${formatted} ${currency}`;
}
