// app/[locale]/admin/page.tsx
import { auth } from "@/auth";
import { redirect } from "next/navigation";

type Props = {
    params: Promise<{ locale: string }>;
};

export default async function AdminPage({ params }: Props) {
    const { locale } = await params;
    const session = await auth();

    if (!session?.user) {
        redirect(`/${locale}/admin/login`);
    }

    return (
        <section className="px-6 py-12">
            <h1 className="text-3xl font-bold">Admin</h1>
            <p className="mt-4 text-gray-600">You are signed in.</p>
        </section>
    );
}