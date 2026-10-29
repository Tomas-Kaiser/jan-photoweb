// Admin-facing timestamps, always in the photographer's time zone. Format on
// the server and pass the string down: formatting inside a client component
// re-runs on hydration and can mismatch depending on the browser's locale
// and time zone.
export function formatPragueDateTime(date: Date, locale: string) {
  return date.toLocaleString(locale, {
    timeZone: "Europe/Prague",
    dateStyle: "medium",
    timeStyle: "short",
  });
}
