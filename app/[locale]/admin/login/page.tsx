// app/[locale]/admin/login/page.tsx
"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";

export default function AdminLoginPage() {
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get("callbackUrl") || "/en/admin";

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    async function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError("");

        const result = await signIn("credentials", {
            email,
            password,
            redirect: false,
            callbackUrl,
        });

        if (result?.error) {
            setError("Invalid email or password");
            return;
        }

        window.location.href = result?.url || callbackUrl;
    }

    return (
        <section className="mx-auto max-w-md px-6 py-20">
            <h1 className="mb-2 text-3xl font-bold">Admin login</h1>
            <p className="mb-8 text-sm text-gray-600">
                Sign in to access the admin area.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="email" className="mb-2 block text-sm font-medium">
                        Email
                    </label>
                    <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full rounded-md border px-4 py-3 outline-none focus:ring-2 focus:ring-black"
                        placeholder="admin@example.com"
                        required
                    />
                </div>

                <div>
                    <label htmlFor="password" className="mb-2 block text-sm font-medium">
                        Password
                    </label>
                    <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full rounded-md border px-4 py-3 outline-none focus:ring-2 focus:ring-black"
                        placeholder="••••••••"
                        required
                    />
                </div>

                {error ? (
                    <p className="text-sm text-red-600">{error}</p>
                ) : null}

                <button
                    type="submit"
                    className="w-full rounded-md bg-black px-4 py-3 text-white"
                >
                    Sign in
                </button>
            </form>
        </section>
    );
}