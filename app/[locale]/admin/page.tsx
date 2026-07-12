// app/[locale]/admin/page.tsx
import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

type Props = {
    params: Promise<{ locale: string }>;
};

const adminLinks = [
    {
        title: "Albums",
        description: "Create, edit, and organize albums.",
        href: (locale: string) => `/${locale}/albums`,
    },
    {
        title: "Portfolio highlights",
        description: "Choose which photos appear in the homepage highlights slider.",
        href: (locale: string) => `/${locale}/admin/portfolio-highlights`,
    },
];

export default async function AdminPage({ params }: Props) {
    const { locale } = await params;
    const session = await auth();

    if (!session?.user) {
        redirect(`/${locale}/admin/login`);
    }

    const userName = session.user.name || session.user.email || "Admin";

    return (
        <section className="px-6 py-12">
            <div className="mx-auto max-w-5xl">
                <div className="mb-8">
                    <p className="text-sm font-medium uppercase tracking-wide text-green-700">
                        Admin panel
                    </p>
                    <h1 className="mt-2 text-3xl font-bold text-gray-900">Welcome back</h1>
                    <p className="mt-3 text-gray-600">
                        Signed in as <span className="font-medium text-gray-900">{userName}</span>.
                        Choose an area to manage below.
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
                                    Open section
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}