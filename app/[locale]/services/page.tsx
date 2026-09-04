import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { Link } from "@/app/i18n/routing";

export const metadata: Metadata = {
    title: "Photography Services | Jan Hájek",
    description:
        "Couples photoshoots, wedding photography, and gift vouchers from Jan Hájek.",
};

export default async function ServicesPage() {
    const t = await getTranslations("services");

    const services = [
        {
            key: "couples",
            title: t("couples.title"),
            text: t("couples.text"),
            button: t("couples.btn"),
        },
        {
            key: "wedding",
            title: t("weddings.title"),
            text: t("weddings.text"),
            button: t("weddings.btn"),
        },
        {
            key: "voucher",
            title: t("voucher.title"),
            text: t("voucher.text"),
            button: t("voucher.btn"),
        },
    ];

    return (
        <section className="bg-stone-50 px-6 py-16">
            <div className="mx-auto max-w-6xl">
                <h1 className="text-center text-4xl font-bold text-gray-900">
                    {t("heading")}
                </h1>
                <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-gray-600">
                    {t("text")}
                </p>
                <div className="mt-12 grid gap-6 md:grid-cols-3">
                    {services.map((service) => (
                        <article
                            key={service.key}
                            className="flex min-h-80 flex-col rounded-xl border border-stone-200 bg-white p-8 shadow-sm"
                        >
                            <h2 className="text-2xl font-semibold text-gray-900">
                                {service.title}
                            </h2>
                            <p className="mt-4 text-gray-600">{service.text}</p>
                            <Link
                                href={`/contact?service=${service.key}`}
                                className="mt-auto pt-8 font-semibold text-gray-900 underline underline-offset-4 transition hover:text-gray-600"
                            >
                                {service.button}
                            </Link>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
}
