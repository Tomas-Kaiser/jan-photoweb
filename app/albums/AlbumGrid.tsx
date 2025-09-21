import Image from 'next/image';
import React from 'react';

interface photo {
    imgSrc: string;
    objectPosition: string;
}

interface Props {
    photos: photo[];
}

const AlbumGrid = ({ photos }: Props) => {
    const getGridColsClass = (count: number) => {
        if (count >= 5) return 'xl:grid-cols-5 lg:grid-cols-4 md:grid-cols-3 sm:grid-cols-2 grid-cols-1';
        if (count === 4) return 'lg:grid-cols-4 md:grid-cols-3 sm:grid-cols-2 grid-cols-1';
        if (count === 3) return 'md:grid-cols-3 sm:grid-cols-2 grid-cols-1';
        if (count === 2) return 'sm:grid-cols-2 grid-cols-1';
        return 'grid-cols-1';
    };

    return (
        <div className={`grid ${getGridColsClass(photos.length)} gap-0 p-0`}>
            {photos.map((photo, index) => (
                <Image
                    key={index}
                    src={photo.imgSrc}
                    alt={index.toString()}
                    width={400}
                    height={300}
                    style={{ objectPosition: photo.objectPosition }}
                    className={`object-cover w-full h-100 transition-transform duration-300 group-hover:scale-105 cursor-pointer`}
                />
            ))}
        </div>
    );
}

export default AlbumGrid