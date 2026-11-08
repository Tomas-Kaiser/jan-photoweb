import type { Metadata } from "next";
import { getPageMetadata } from "@/app/lib/page-metadata";

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>;
}): Promise<Metadata> {
    const { locale } = await params;
    return getPageMetadata(locale, "contact", "/contact");
}

export default function ContactLayout({
    children,
}: Readonly<{ children: React.ReactNode }>) {
    return children;
}
