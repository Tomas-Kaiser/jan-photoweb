"use client";

import { useRef } from "react";
import Image from "next/image";

import { Link } from "@/app/i18n/routing";

type Service = {
    id: string;
    title: string;
    text: string;
    button: string;
    href?: string;
    isExternal?: boolean;
    backgroundImage: string;
};

type Props = {
    services: Service[];
    previousLabel: string;
    nextLabel: string;
};

export default function ServiceCarousel({
    services,
    previousLabel,
    nextLabel,
}: Props) {
    const carouselRef = useRef<HTMLDivElement>(null);

    const scrollByCard = (direction: 1 | -1) => {
        const carousel = carouselRef.current;
        const card = carousel?.querySelector<HTMLElement>("[data-service-card]");

        if (!carousel || !card) return;

        carousel.scrollBy({
            left: direction * (card.offsetWidth + 24),
            behavior: "smooth",
        });
    };

    return (
        <div className="relative mt-12">
            <div ref={carouselRef} className="carousel w-full gap-6">
                {services.map((service) => (
                    <div
                        key={service.id}
                        data-service-card
                        className="carousel-item w-full md:w-[calc((100%-3rem)/3)]"
                    >
                        <article className="relative flex min-h-80 w-full flex-col overflow-hidden rounded-xl border border-gray-200 p-8 shadow-sm">
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
                                        href={service.href ? service.href : ''}
                                        className="mt-auto pt-8 font-semibold text-white underline underline-offset-4 transition hover:text-gray-200"
                                    >
                                        {service.button}
                                    </Link>
                                )}
                            </div>
                        </article>
                    </div>
                ))}
            </div>

            <button
                type="button"
                aria-label={previousLabel}
                onClick={() => scrollByCard(-1)}
                className="btn btn-circle absolute top-1/2 left-0 z-10 -translate-x-1/2 -translate-y-1/2 border-gray-200 bg-white/90 shadow-md hover:bg-white"
            >
                <svg
                    aria-hidden="true"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="m15 18-6-6 6-6"
                    />
                </svg>
            </button>
            <button
                type="button"
                aria-label={nextLabel}
                onClick={() => scrollByCard(1)}
                className="btn btn-circle absolute top-1/2 right-0 z-10 translate-x-1/2 -translate-y-1/2 border-gray-200 bg-white/90 shadow-md hover:bg-white"
            >
                <svg
                    aria-hidden="true"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="m9 18 6-6-6-6"
                    />
                </svg>
            </button>
        </div>
    );
}
