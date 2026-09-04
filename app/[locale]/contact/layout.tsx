import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Contact Jan Hájek | Photography",
    description: "Get in touch with photographer Jan Hájek.",
};

export default function ContactLayout({
    children,
}: Readonly<{ children: React.ReactNode }>) {
    return children;
}
