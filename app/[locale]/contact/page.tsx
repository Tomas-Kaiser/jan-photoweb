'use client';
import React, { useRef, useState } from 'react';
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

const ContactPage = () => {
    const t = useTranslations("contact");
    const searchParams = useSearchParams();
    const formRef = useRef<HTMLFormElement>(null);
    const [renderedAt] = useState(() => Date.now());
    const service = searchParams.get("service");
    const serviceMessages = {
        couples: t("form.couplesMessage"),
        wedding: t("form.weddingMessage"),
        voucher: t("form.voucherMessage"),
    };
    const initialMessage =
        service && service in serviceMessages
            ? serviceMessages[service as keyof typeof serviceMessages]
            : "";

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);

        const response = await fetch('/api/contact', {
            method: 'POST',
            body: formData,
        });

        if (response.ok) {
            alert('Message sent!');
            formRef.current?.reset(); // ✅ Safely reset the form
        } else {
            alert('Something went wrong.');
        }
    }

    return (
        <section className="px-6 py-12 max-w-3xl mx-auto">
            <h1 className="text-4xl font-bold mb-6 text-center">{t("heading")}</h1>
            <p className="text-lg text-gray-700 mb-10 text-center">
                {t("text")}
            </p>

            <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
                <input type="hidden" name="ts" value={renderedAt} />
                <div
                    style={{ position: "absolute", left: "-9999px", top: "-9999px" }}
                    aria-hidden="true"
                >
                    <label htmlFor="website">Leave this field blank</label>
                    <input
                        type="text"
                        id="website"
                        name="website"
                        tabIndex={-1}
                        autoComplete="off"
                    />
                </div>

                {/* Name */}
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-800 mb-1">
                        {t("form.name")}
                    </label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        required
                        className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black"
                    />
                </div>

                {/* Email */}
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-800 mb-1">
                        {t("form.email")}
                    </label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        required
                        className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black"
                    />
                </div>

                {/* Message */}
                <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-800 mb-1">
                        {t("form.message")}
                    </label>
                    <textarea
                        id="message"
                        name="message"
                        rows={5}
                        required
                        defaultValue={initialMessage}
                        className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black resize-none"
                    />
                </div>

                {/* Submit Button */}
                <div className="flex justify-center">
                    <button
                        type="submit"
                        className="bg-black text-white px-6 py-2 rounded-md hover:bg-gray-800 transition cursor-pointer"
                    >
                        {t("form.btn")}
                    </button>
                </div>
            </form>
        </section>
    );
};

export default ContactPage;
