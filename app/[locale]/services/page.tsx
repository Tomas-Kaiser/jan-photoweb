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
            href: "/contact?service=couples",
            backgroundImage: "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/302f0c15-eec3-4117-9d5b-34b80556fe00/card",
        },
        {
            id: "wedding",
            title: t("weddings.title"),
            text: t("weddings.text"),
            button: t("weddings.btn"),
            href: "/contact?service=wedding",
            backgroundImage: "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/8d0ba214-31f8-470f-a3f2-1f247a40f000/card",
        },
        {
            id: "voucher",
            title: t("voucher.title"),
            text: t("voucher.text"),
            button: t("voucher.btn"),
            href: "/contact?service=voucher",
            backgroundImage: "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/50b4c52f-bd2f-4a2a-e144-06fd782ebe00/card",
        },
        {
            id: "workshops",
            title: t("workshops.title"),
            text: t("workshops.text"),
            button: t("workshops.btn"),
            href: "https://byjj.cz",
            isExternal: true,
            backgroundImage: "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/367c8001-42ef-40cc-7523-2d4ed4f04600/card",
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
