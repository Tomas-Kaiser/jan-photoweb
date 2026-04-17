import React from 'react'
import Image from 'next/image'

const AboutPage = () => {
    return (
        <section className="px-6 py-12 max-w-6xl mx-auto">
            <div className="flex flex-col lg:flex-row gap-10 items-start">
                {/* Text Block */}
                <div className="w-full lg:w-1/2 text-gray-800 order-1 lg:order-2">
                    <h1 className="text-4xl font-bold mb-6">About Me</h1>
                    <p className="mb-4 text-lg leading-relaxed">
                        Hello, I’m Jan Hajek — a photographer driven by a deep passion for capturing the beauty, emotion, and individuality of people through fashion and portraiture.
                    </p>

                    {/* Photo appears after intro on mobile, beside text on desktop */}
                    <div className="block lg:hidden mb-6">
                        <Image
                            src="https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/3861b556-534f-47cb-6a4a-c40ee75bca00/public"
                            alt="Jan Hajek"
                            width={600}
                            height={800}
                            className="rounded-lg object-cover shadow-lg w-full h-auto"
                            priority
                        />
                    </div>

                    <p className="mb-4 text-lg leading-relaxed">
                        From the moment I first held a camera, I knew photography would be more than a craft — it would be my way of telling stories. Every face, every glance, every moment holds something unique, and my mission is to reveal that essence through the lens.
                    </p>
                    <p className="mb-4 text-lg leading-relaxed">
                        I specialize in portrait and fashion photography, blending creativity with authenticity to craft visuals that resonate. For me, a photo isn’t just a snapshot — it’s a living expression of how I see the world.
                    </p>
                    <p className="mb-4 text-lg leading-relaxed">
                        If you’re looking for photographs that not only capture your presence but celebrate your uniqueness, you’re in the right place. Let’s create something unforgettable together.
                    </p>
                    <p className="text-lg font-semibold mt-6">With heart,<br />Jan Hajek</p>
                </div>

                {/* Photo for desktop view */}
                <div className="w-full lg:w-1/2 hidden lg:block order-2 lg:order-1">
                    <Image
                        src="https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/3861b556-534f-47cb-6a4a-c40ee75bca00/public"
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