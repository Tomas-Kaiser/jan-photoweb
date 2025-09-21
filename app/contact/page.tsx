'use client';
import React from 'react'

const ContactPage = () => {
    return (
        <section className="px-6 py-12 max-w-3xl mx-auto">
            <h1 className="text-4xl font-bold mb-6 text-center">Let’s Connect</h1>
            <p className="text-lg text-gray-700 mb-10 text-center">
                Whether you’re looking to collaborate, book a shoot, or just say hello — I’d love to hear from you.
            </p>

            <form className="space-y-6">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-800 mb-1">
                        Name
                    </label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        required
                        className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black"
                    />
                </div>

                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-800 mb-1">
                        Email
                    </label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        required
                        className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black"
                    />
                </div>

                <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-800 mb-1">
                        Message
                    </label>
                    <textarea
                        id="message"
                        name="message"
                        rows={5}
                        required
                        className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black resize-none"
                    />
                </div>

                <div className="flex justify-center">
                    <button
                        type="submit"
                        className="bg-black text-white px-6 py-2 rounded-md hover:bg-gray-800 transition cursor-pointer"
                    >
                        Send Message
                    </button>
                </div>
            </form>
        </section>
    );
}

export default ContactPage