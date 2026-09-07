import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Image from "next/image";

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
            id: "portrait",
            title: t("portrait.title"),
            text: t("portrait.text"),
            button: t("portrait.btn"),
            href: "/contact?service=portrait",
            backgroundImage: "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/a4b24e0f-c98a-4558-10a6-e7ccdc3a3e00/card",
        },
        {
            id: "personalWorkshops",
            title: t("personalWorkshops.title"),
            text: t("personalWorkshops.text"),
            button: t("personalWorkshops.btn"),
            href: "/contact?service=personal-workshops",
            backgroundImage: "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/16f10ff3-5c79-4a1a-fb64-7a2932507400/card",
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
            id: "other",
            title: t("other.title"),
            text: t("other.text"),
            button: t("other.btn"),
            href: "/contact?service=other",
            backgroundImage: "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/50c784ff-0022-47f1-34d2-712371221800/full",
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
                <div className="mt-12 grid gap-6 md:grid-cols-3">
                    {services.map((service) => (
                        <article
                            key={service.id}
                            className="relative flex min-h-80 flex-col overflow-hidden rounded-xl border border-gray-200 p-8 shadow-sm"
                        >
                            <Image
                                src={service.backgroundImage}
                                alt=""
                                fill
                                className="object-cover"
                            />
                            <div className="absolute inset-0 bg-black/50" />
                            <div className="relative flex h-full flex-col text-white">
                                <h2 className="text-2xl font-semibold">
                                    {service.title}
                                </h2>
                                <p className="mt-4 text-gray-100">{service.text}</p>
                                {service.isExternal ? (
                                    <a
                                        href={service.href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="mt-auto pt-8 font-semibold text-white underline underline-offset-4 transition hover:text-gray-200"
                                    >
                                        {service.button}
                                    </a>
                                ) : (
                                    <Link
                                        href={service.href ? service.href : ""}
                                        className="mt-auto pt-8 font-semibold text-white underline underline-offset-4 transition hover:text-gray-200"
                                    >
                                        {service.button}
                                    </Link>
                                )}
                            </div>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
}
