import type { Metadata } from "next";
import { getPageMetadata } from "@/app/lib/page-metadata";
import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";

import { Link } from "@/app/i18n/routing";

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>;
}): Promise<Metadata> {
    const { locale } = await params;
    return getPageMetadata(locale, "privacy", "/privacy");
}

const sectionIds = [
    "controller",
    "collected",
    "purposes",
    "retention",
    "sharing",
    "cookies",
    "rights",
] as const;

const inlineLinkClass = "underline underline-offset-4 transition hover:text-black";

const richTags = {
    contact: (chunks: ReactNode) => (
        <Link href="/contact" className={inlineLinkClass}>
            {chunks}
        </Link>
    ),
    uoou: (chunks: ReactNode) => (
        <a
            href="https://uoou.gov.cz"
            target="_blank"
            rel="noopener noreferrer"
            className={inlineLinkClass}
        >
            {chunks}
        </a>
    ),
};

export default async function PrivacyPage() {
    const t = await getTranslations("privacy");

    return (
        <section className="mx-auto max-w-3xl px-6 py-12 text-gray-800">
            <h1 className="text-4xl font-bold">{t("heading")}</h1>
            <p className="mt-2 text-sm text-gray-500">{t("updated")}</p>
            <p className="mt-6 text-lg leading-relaxed">{t("intro")}</p>

            {sectionIds.map((id) => {
                const key = `sections.${id}` as const;
                const paragraph = (field: "text" | "how" | "complaint") =>
                    t.has(`${key}.${field}`) && (
                        <p className="mt-3 leading-relaxed">
                            {t.rich(`${key}.${field}`, richTags)}
                        </p>
                    );
                return (
                    <div key={id} className="mt-10">
                        <h2 className="text-2xl font-semibold text-gray-900">
                            {t(`${key}.heading`)}
                        </h2>
                        {paragraph("text")}
                        {t.has(`${key}.items`) && (
                            <ul className="mt-3 list-disc space-y-2 pl-6 leading-relaxed">
                                {(t.raw(`${key}.items`) as string[]).map((item) => (
                                    <li key={item}>{item}</li>
                                ))}
                            </ul>
                        )}
                        {paragraph("how")}
                        {paragraph("complaint")}
                    </div>
                );
            })}
        </section>
    );
}
