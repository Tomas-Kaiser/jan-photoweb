import { getTranslations } from "next-intl/server";
import Link from "next/link";

export type BreadcrumbItem = {
    label: string;
    href?: string;
    translate?: boolean;
};

type Props = {
    items?: BreadcrumbItem[] | null;
};

export default async function Breadcrumbs(props: Props) {
    const t = await getTranslations("common");
    const items = Array.isArray(props?.items) ? props.items : [];

    if (items.length === 0) return null;

    return (
        <div className="breadcrumbs max-w-full text-left text-sm">
            <ul>
                {items.map((item, index) => {
                    const isLast = index === items.length - 1;
                    const label = item.translate ? t(item.label) : item.label;

                    return (
                        <li key={`${item.label}-${item.href ?? index}`}>
                            {item.href && !isLast ? (
                                <Link href={item.href}>{label}</Link>
                            ) : (
                                <span>{label}</span>
                            )}
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}