import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { loadEmailPreferences } from "@/app/lib/email-preferences";
import { updateEmailPreferences } from "./actions";

export const metadata: Metadata = {
  title: "Email preferences | Jan Hájek",
  // Every URL carries someone's signed address.
  robots: { index: false, follow: false },
};

type Props = {
  searchParams: Promise<{ t?: string | string[] }>;
};

const buttonClass =
  "w-full cursor-pointer rounded-full bg-brand-green px-6 py-3 font-semibold text-white transition hover:opacity-90";

// Opened from the "Manage email preferences" link in client emails
// ("?t=<signed token>", see app/lib/email-preferences-link.ts). Public and
// login-free: the token is the credential.
export default async function EmailPreferencesPage({ searchParams }: Props) {
  const { t: tokenParam } = await searchParams;
  const token = typeof tokenParam === "string" ? tokenParam : "";
  const t = await getTranslations("emailPreferences");
  const preferences = await loadEmailPreferences(token);

  return (
    <div className="mx-auto max-w-xl px-6 py-24">
      <section className="rounded-3xl bg-white p-7 text-center shadow-[0_10px_40px_-12px_rgba(1,68,33,0.18)] sm:p-10">
        <h1 className="font-display text-3xl font-semibold text-brand-green">
          {t("title")}
        </h1>

        {preferences.kind === "invalidLink" ? (
          <p className="mt-4 text-gray-600">{t("invalidLink")}</p>
        ) : null}

        {preferences.kind === "noClient" ? (
          <p className="mt-4 text-gray-600">
            {t("noClient", { email: preferences.email })}
          </p>
        ) : null}

        {preferences.kind === "found" ? (
          <form action={updateEmailPreferences} className="mt-4 space-y-4">
            <input type="hidden" name="token" value={token} />
            <input
              type="hidden"
              name="subscribed"
              value={preferences.subscribed ? "0" : "1"}
            />

            <p className="text-gray-600">
              {t(preferences.subscribed ? "subscribed" : "notSubscribed", {
                email: preferences.email,
              })}
            </p>

            {!preferences.subscribed ? (
              <p className="text-sm text-gray-600">{t("consent")}</p>
            ) : null}

            <button type="submit" className={buttonClass}>
              {t(preferences.subscribed ? "unsubscribe" : "subscribe")}
            </button>

            <p className="text-xs text-gray-500">{t("otherEmails")}</p>
          </form>
        ) : null}
      </section>
    </div>
  );
}
