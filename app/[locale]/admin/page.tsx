// app/[locale]/admin/page.tsx
import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

type Props = {
    params: Promise<{ locale: string }>;
};

export default async function AdminPage({ params }: Props) {
    const { locale } = await params;
    const session = await auth();
    const t = await getTranslations("admin");

    if (!session?.user) {
        redirect(`/${locale}/admin/login`);
    }

    const userName = session.user.name || session.user.email || t("dashboard.defaultUserName");

    const adminLinks = [
        {
            title: t("dashboard.albumsTitle"),
            description: t("dashboard.albumsDescription"),
            href: (locale: string) => `/${locale}/albums`,
        },
        {
            title: t("dashboard.highlightsTitle"),
            description: t("dashboard.highlightsDescription"),
            href: (locale: string) => `/${locale}/admin/portfolio-highlights`,
        },
    ];

    return (
        <section className="px-6 py-12">
            <div className="mx-auto max-w-5xl">
                <div className="mb-8">
                    <p className="text-sm font-medium uppercase tracking-wide text-green-700">
                        {t("dashboard.eyebrow")}
                    </p>
                    <h1 className="mt-2 text-3xl font-bold text-gray-900">{t("dashboard.welcome")}</h1>
                    <p className="mt-3 text-gray-600">
                        {t("dashboard.signedInAs")} <span className="font-medium text-gray-900">{userName}</span>.{" "}
                        {t("dashboard.chooseArea")}
                    </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    {adminLinks.map((item) => (
                        <Link
                            key={item.title}
                            href={item.href(locale)}
                            className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-gray-300 hover:shadow-md"
                        >
                            <div className="flex h-full flex-col">
                                <div className="flex items-start justify-between gap-3">
                                    <h2 className="text-xl font-semibold text-gray-900">
                                        {item.title}
                                    </h2>
                                    <span className="text-gray-400 transition group-hover:translate-x-1 group-hover:text-gray-600">
                                        →
                                    </span>
                                </div>

                                <p className="mt-3 text-sm leading-6 text-gray-600">
                                    {item.description}
                                </p>

                                <div className="mt-5 text-sm font-medium text-green-700">
                                    {t("dashboard.openSection")}
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}
