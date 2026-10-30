import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { Link, redirect } from "@/app/i18n/routing";
import {
  getContactEventTypes,
  hasMarketingConsent,
  ownsAGallery,
} from "@/app/lib/admin-contacts";
import { formatPragueDateTime } from "@/app/lib/format-date-time";
import { loadContacts } from "@/app/lib/load-contacts";
import ContactActions from "./ContactActions";

export default async function ContactsAdminPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();
  const isAdmin =
    !!session?.user && (session.user as { role?: string }).role === "admin";

  if (!isAdmin) {
    return redirect({ href: "/", locale });
  }

  const t = await getTranslations("admin");
  const contacts = await loadContacts();
  const consentingCount = contacts.filter(hasMarketingConsent).length;

  return (
    <div className="min-h-screen bg-brand-cream/30">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="mb-8 font-display text-4xl font-semibold text-brand-green">
          {t("contacts.pageTitle")}
        </h1>

        <section className="mb-10 rounded-3xl border border-brand-gold/15 bg-white p-6 shadow-[0_10px_35px_-20px_rgba(1,68,33,0.3)] sm:p-7">
          <h2 className="text-lg font-semibold text-gray-900">
            {t("contacts.exportTitle")}
          </h2>
          <p className="mt-2 rounded-xl bg-brand-gold/10 px-4 py-3 text-sm text-brand-gold-dark">
            {t("contacts.exportResyncReminder")}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-4">
            {/* A plain link: the route answers with a CSV attachment. The
                lint rule mistakes /api/admin/contacts for the
                /[locale]/admin/contacts page. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              href="/api/admin/contacts/export"
              className="inline-flex rounded-full bg-brand-green px-5 py-2.5 text-sm font-semibold text-white shadow-[0_6px_20px_-6px_rgba(1,68,33,0.5)] transition hover:bg-brand-green/90"
            >
              {t("contacts.exportButton")}
            </a>
            <span className="text-sm text-gray-600">
              {t("contacts.consentingCount", { count: consentingCount })}
            </span>
          </div>
        </section>

        {contacts.length === 0 ? (
          <p className="text-gray-600">{t("contacts.noContactsYet")}</p>
        ) : (
          <ul className="space-y-4">
            {contacts.map((contact) => {
              const eventTypes = getContactEventTypes(contact);

              return (
                <li
                  key={contact.id}
                  className="rounded-3xl border border-brand-gold/15 bg-white p-6 shadow-[0_10px_35px_-20px_rgba(1,68,33,0.3)] sm:p-7"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="font-display text-xl font-semibold text-brand-green">
                        {contact.name}
                      </h2>
                      <p className="mt-1 break-all text-sm text-gray-700">
                        {contact.email}
                        <span className="text-gray-400">
                          {" · "}
                          {contact.locale.toUpperCase()}
                        </span>
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-3 py-1 text-xs ${
                        hasMarketingConsent(contact)
                          ? "bg-brand-green font-semibold text-white"
                          : "bg-gray-100 font-medium text-gray-700"
                      }`}
                    >
                      {hasMarketingConsent(contact)
                        ? t("contacts.consentGiven", {
                            date: formatPragueDateTime(
                              contact.marketingConsentAt,
                              locale,
                            ),
                          })
                        : t("contacts.noConsent")}
                    </span>
                  </div>

                  {eventTypes.length ? (
                    <p className="mt-3 text-sm text-gray-600">
                      {t("contacts.eventTypesLabel")}:{" "}
                      {eventTypes
                        .map((type) => t(`proofGalleries.eventTypes.${type}`))
                        .join(", ")}
                    </p>
                  ) : null}

                  {contact.galleries.length ? (
                    <ul className="mt-3 space-y-1 text-sm">
                      {contact.galleries.map((gallery) => (
                        <li key={gallery.id}>
                          <Link
                            href={`/admin/proof-galleries/${gallery.id}`}
                            className="font-medium text-brand-green underline-offset-2 hover:underline"
                          >
                            {gallery.clientName}
                          </Link>
                          <span className="text-gray-500">
                            {" · "}
                            {t(`contacts.roles.${gallery.role}`)}
                            {gallery.eventType
                              ? ` · ${t(`proofGalleries.eventTypes.${gallery.eventType}`)}`
                              : null}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-3 text-sm text-gray-400">
                      {t("contacts.noGalleries")}
                    </p>
                  )}

                  <ContactActions
                    contact={{
                      id: contact.id,
                      name: contact.name,
                      hasConsent: hasMarketingConsent(contact),
                      ownsGallery: ownsAGallery(contact),
                    }}
                  />
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
