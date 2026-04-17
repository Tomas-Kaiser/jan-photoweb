import React from 'react'
import AlbumsGrid from './AlbumsGrid'
import { objectPosition } from '../page';

const albumsCategory = [
    {
        name: "Brands and campaign",
        imgSrc: "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/67c0f9bf-7f87-4f65-baee-9fdf6810f700/public",
        link: "/albums/brands-and-campaign",
        objectPosition: objectPosition.top30
    }, {
        name: "Fashion Shows",
        imgSrc: "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/2f2f9811-e3a0-4562-8ed7-efeb265b1500/public",
        link: "/albums/fashion-shows",
        objectPosition: objectPosition.center
    },
    {
        name: "Portraits",
        imgSrc: "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/da6a911f-e6cf-421d-995f-23f0ca73ea00/public",
        link: "/albums/portraits",
        objectPosition: objectPosition.top30
    },
    {
        name: "Visual Stories",
        imgSrc: "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/92f6f6c1-e85f-498d-e175-a0c71c6efd00/public",
        link: "/albums/visual-stories",
        objectPosition: objectPosition.center
    },
    {
        name: "Weddings",
        imgSrc: "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/8c6b22a7-9fae-424d-75b9-0da010ea0300/public",
        link: "/albums/weddings",
        objectPosition: objectPosition.center
    }, {
        name: "Couples",
        imgSrc: "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/da5000a7-a695-4be6-b4b8-dbd28eeead00/public",
        link: "/albums/couples",
        objectPosition: objectPosition.top
    }, {
        name: "Fashion and Editorials",
        imgSrc: "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/6bd5f04a-5de2-4104-10da-daf20cee9300/public",
        link: "/albums/fashion-and-editorials",
        objectPosition: objectPosition.center
    }
]

const AlbumsPage = () => {
    return (
        <>
            <div className="text-center py-8 px-4 md:px-12 lg:px-24">
                <h2 className="text-3xl font-bold mb-4">Explore Our Signature Albums</h2>
                <p className="text-lg text-gray-600">
                    Each collection below captures a unique story, mood, and moment. Browse through to discover the artistry behind every frame.
                </p>
            </div>
            <AlbumsGrid photoCoverAlbums={albumsCategory} />
        </>
    )
}

export default AlbumsPage