import React from 'react'
import Image from "next/image";

interface Props {
    visibility: string;
    src: string;
}

const HeroImage = ({ visibility, src }: Props) => {
    return (
        <div className={`${visibility} relative w-screen h-[calc(100vh-64px)]`}>
            <Image src={src} alt={"Hero photo"}
                fill
                style={{ objectFit: 'cover' }}></Image>
        </div>
    )
}

export default HeroImage