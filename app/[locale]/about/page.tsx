import React from 'react'
import Image from 'next/image'
import { useTranslations } from "next-intl";

const AboutPage = () => {
    const t = useTranslations("aboutMe");

    return (
        <section className="px-6 py-12 max-w-6xl mx-auto">
            <div className="flex flex-col lg:flex-row gap-10 items-start">
                {/* Text Block */}
                <div className="w-full lg:w-1/2 text-gray-800 order-1 lg:order-2">
                    <h1 className="text-4xl font-bold mb-6">{t("heading")}</h1>
                    <p className="mb-4 text-lg leading-relaxed">
                        {t("text-1")}
                    </p>

                    {/* Photo appears after intro on mobile, beside text on desktop */}
                    <div className="block lg:hidden mb-6">
                        <Image
                            src="https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/3861b556-534f-47cb-6a4a-c40ee75bca00/full"
                            alt="Jan Hajek"
                            width={600}
                            height={800}
                            className="rounded-lg object-cover shadow-lg w-full h-auto"
                            priority
                        />
                    </div>

                    <p className="mb-4 text-lg leading-relaxed">
                        {t("text-2")}
                    </p>
                    <p className="mb-4 text-lg leading-relaxed">
                        {t("text-3")}
                    </p>
                    <p className="mb-4 text-lg leading-relaxed">
                        {t("text-4")}
                    </p>
                    <p className="text-lg font-semibold mt-6">{t("text-5")}<br />{t("text-6")}</p>
                </div>

                {/* Photo for desktop view */}
                <div className="w-full lg:w-1/2 hidden lg:block order-2 lg:order-1">
                    <Image
                        src="https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/3861b556-534f-47cb-6a4a-c40ee75bca00/full"
                        alt="Jan Hajek"
                        width={600}
                        height={800}
                        className="rounded-lg object-cover shadow-lg w-full h-auto"
                        priority
                    />
                </div>
            </div>
        </section>
    )
}

export default AboutPage