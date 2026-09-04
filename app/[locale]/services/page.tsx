import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { Link } from "@/app/i18n/routing";
import ServiceCarousel from "@/app/components/ServiceCarousel";

export const metadata: Metadata = {
    title: "Photography Services | Jan Hájek",
    description:
        "Couples photoshoots, wedding photography, and gift vouchers from Jan Hájek.",
};

export default async function ServicesPage() {
    const t = await getTranslations("services");

    const services = [
        {
            id: "couples",
            title: t("couples.title"),
            text: t("couples.text"),
            button: t("couples.btn"),
            href: "/contact?service=couples"
        },
        {
            id: "wedding",
            title: t("weddings.title"),
            text: t("weddings.text"),
            button: t("weddings.btn"),
            href: "/contact?service=wedding"
        },
        {
            id: "voucher",
            title: t("voucher.title"),
            text: t("voucher.text"),
            button: t("voucher.btn"),
            href: "/contact?service=voucher"
        },
        {
            id: "workshops",
            title: t("workshops.title"),
            text: t("workshops.text"),
            button: t("workshops.btn"),
            href: "https://byjj.cz",
            isExternal: true,
        },
    ];

    return (
        <section className="bg-white px-6 py-16">
            <div className="mx-auto max-w-6xl">
                <h1 className="text-center text-4xl font-bold text-gray-900">
                    {t("heading")}
                </h1>
                <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-gray-600">
                    {t("text")}
                </p>
                <ServiceCarousel
                    services={services}
                    previousLabel={t("previous")}
                    nextLabel={t("next")}
                />
            </div>
        </section>
    );
}
