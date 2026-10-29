export function LockIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      className={className}
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M5 8V6a5 5 0 0 1 10 0v2h.5A1.5 1.5 0 0 1 17 9.5v7A1.5 1.5 0 0 1 15.5 18h-11A1.5 1.5 0 0 1 3 16.5v-7A1.5 1.5 0 0 1 4.5 8H5Zm2 0h6V6a3 3 0 0 0-6 0v2Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

// Shown in place of a stage panel the gallery hasn't reached yet.
export function LockedNotice({ children }: { children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-brand-gold/15 bg-white p-6 shadow-[0_10px_35px_-20px_rgba(1,68,33,0.3)] sm:p-7">
      <p className="flex items-center gap-1.5 text-sm text-gray-500">
        <LockIcon className="h-4 w-4 shrink-0" />
        {children}
      </p>
    </section>
  );
}
