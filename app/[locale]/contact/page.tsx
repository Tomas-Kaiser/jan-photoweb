'use client';
import React, { useRef, useState } from 'react';
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import {
    CONTACT_ENQUIRY_TYPES,
    isContactEnquiryType,
    type ContactEnquiryType,
} from "@/app/lib/contact-enquiry";

type Status = "idle" | "submitting" | "success" | "error";

const ContactPage = () => {
    const t = useTranslations("contact");
    const searchParams = useSearchParams();
    const formRef = useRef<HTMLFormElement>(null);
    const [renderedAt] = useState(() => Date.now());
    const [status, setStatus] = useState<Status>("idle");
    const service = searchParams.get("service");
    const initialType = isContactEnquiryType(service) ? service : "";
    const draftFor = (type: ContactEnquiryType) => t(`form.drafts.${type}`);
    const [enquiryType, setEnquiryType] = useState<ContactEnquiryType | "">(initialType);
    const [message, setMessage] = useState(initialType ? draftFor(initialType) : "");
    const isDraft = CONTACT_ENQUIRY_TYPES.some((type) => draftFor(type) === message);

    // Swaps the draft for the new type's, but never overwrites anything the
    // visitor has written themselves.
    function handleTypeChange(value: string) {
        if (!isContactEnquiryType(value)) {
            setEnquiryType("");
            return;
        }
        setEnquiryType(value);
        if (!message.trim() || isDraft) {
            setMessage(draftFor(value));
        }
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setStatus("submitting");
        const formData = new FormData(e.currentTarget);

        try {
            const response = await fetch('/api/contact', {
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                setStatus("success");
                formRef.current?.reset();
                setEnquiryType("");
                setMessage("");
            } else {
                setStatus("error");
            }
        } catch {
            setStatus("error");
        }
    }

    return (
        <section className="px-6 py-12 max-w-3xl mx-auto">
            <h1 className="text-4xl font-bold mb-6 text-center">{t("heading")}</h1>
            <p className="text-lg text-gray-700 mb-10 text-center">
                {t("text")}
            </p>

            <div aria-live="polite">
                {status === "success" ? (
                    <div
                        role="alert"
                        className="alert mb-6 border border-green-200 bg-green-50 text-green-800"
                    >
                        <span>{t("form.success")}</span>
                    </div>
                ) : null}
                {status === "error" ? (
                    <div
                        role="alert"
                        className="alert mb-6 border border-red-200 bg-red-50 text-red-800"
                    >
                        <span>{t("form.error")}</span>
                    </div>
                ) : null}
            </div>

            <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
                <input type="hidden" name="ts" value={renderedAt} />
                {/* display: none (not off-screen positioning) so browser autofill skips it. */}
                <div style={{ display: "none" }} aria-hidden="true">
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

                {/* Enquiry type */}
                <div>
                    <label htmlFor="enquiryType" className="block text-sm font-medium text-gray-800 mb-1">
                        {t("form.enquiryType")}
                    </label>
                    <select
                        id="enquiryType"
                        name="enquiryType"
                        required
                        value={enquiryType}
                        onChange={(e) => handleTypeChange(e.target.value)}
                        className="w-full border border-gray-300 rounded-md bg-white px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black"
                    >
                        <option value="" disabled>
                            {t("form.enquiryTypePlaceholder")}
                        </option>
                        {CONTACT_ENQUIRY_TYPES.map((type) => (
                            <option key={type} value={type}>
                                {t(`form.enquiryTypes.${type}`)}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Message */}
                <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-800 mb-1">
                        {t("form.message")}
                    </label>
                    <textarea
                        id="message"
                        name="message"
                        rows={8}
                        required
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black resize-none"
                    />
                    {isDraft ? (
                        <p className="mt-1 text-sm text-gray-500">{t("form.draftHint")}</p>
                    ) : null}
                </div>

                {/* Submit Button */}
                <div className="flex justify-center">
                    <button
                        type="submit"
                        disabled={status === "submitting"}
                        className="bg-black text-white px-6 py-2 rounded-md hover:bg-gray-800 transition cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {status === "submitting" ? t("form.sending") : t("form.btn")}
                    </button>
                </div>
            </form>
        </section>
    );
};

export default ContactPage;
