import Link from "next/link";

export type BreadcrumbItem = {
    label: string;
    href?: string;
};

type Props = {
    items?: BreadcrumbItem[] | null;
};

export default function Breadcrumbs(props: Props) {
    const items = Array.isArray(props?.items) ? props.items : [];

    if (items.length === 0) return null;

    return (
        <div className="breadcrumbs max-w-full text-left text-sm">
            <ul>
                {items.map((item, index) => {
                    const isLast = index === items.length - 1;

                    return (
                        <li key={`${item.label}-${item.href ?? index}`}>
                            {item.href && !isLast ? (
                                <Link href={item.href}>{item.label}</Link>
                            ) : (
                                <span>{item.label}</span>
                            )}
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}