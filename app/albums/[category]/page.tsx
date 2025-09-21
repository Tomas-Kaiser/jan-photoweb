import React from 'react'
import { objectPosition } from '@/app/page';
import AlbumsGrid from '../AlbumsGrid';
import AlbumGrid from '../AlbumGrid';

const photoCoverAlbumsByCatogery: Record<string, any> = {
    "brands-and-campaign": [
        {
            title: "Janine Made by Love",
            name: "Vanguard Collection 2025",
            imgSrc: "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/67c0f9bf-7f87-4f65-baee-9fdf6810f700/public",
            link: "/albums/brands-and-campaign/janine-made-by-love/vanguard-collection-2025",
            objectPosition: objectPosition.top30,
        },
        {
            title: "Janine Made by Love",
            name: "Spring Collection 2024",
            imgSrc: "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/14789a56-e5e8-4429-6df9-c78ec4ccf000/public",
            link: "/albums/brands-and-campaign/janine-made-by-love/spring-collection-2024",
            objectPosition: objectPosition.top15,
        },
        {
            title: "Janine Made by Love",
            name: "Autumn Collection 2024",
            imgSrc: "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/3d889cda-13a5-44f8-7300-225575d6ce00/public",
            link: "/albums/brands-and-campaign/janine-made-by-love/autumn-collection-2024",
            objectPosition: objectPosition.top,
        },
        {
            // title: "Janine Made by Love",
            name: "Infinimy Collection 2024",
            imgSrc: "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/bc482303-6466-4b8e-8062-801b2a7b7400/public",
            link: "/albums/brands-and-campaign/infinimy/infinimy-collection-2024",
            objectPosition: objectPosition.top,
        },
        {
            name: "Hotel Pupp 2024",
            imgSrc: "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/a8865897-a6b4-4a87-53cf-f101a5ef8100/public",
            link: "/albums/brands-and-campaign/hotel-pupp-2024",
            objectPosition: objectPosition.top,
        },
    ],
    "weddings": [
        {
            imgSrc: "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/1b3c4bc1-6bfe-4244-77b0-be81c4185f00/public",
            objectPosition: objectPosition.top30,
        },
        {
            imgSrc: "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/ef67c70d-38c8-477a-1e1a-e5bf26744e00/public",
            objectPosition: objectPosition.top15,
        },
        {
            imgSrc: "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/62880405-5ff1-4d6e-a86d-8570c1863b00/public",
            objectPosition: objectPosition.top,
        },
        {
            imgSrc: "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/8c3e9e05-12ad-48ab-c3a0-e0efb3787c00/public",
            objectPosition: objectPosition.top,
        },
        {
            imgSrc: "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/159ff4bd-6b50-401f-5196-dca6f92dcc00/public",
            objectPosition: objectPosition.top,
        },
        {
            imgSrc: "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/398d7efc-e98b-49bb-b08b-2cda207b0100/public",
            objectPosition: objectPosition.top,
        },
        {
            imgSrc: "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/d015103c-8da0-4e03-f4df-0944f362ea00/public",
            objectPosition: objectPosition.top,
        },
        {
            imgSrc: "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/7c08ca2f-29f3-416f-a48f-2ddd86b81b00/public",
            objectPosition: objectPosition.top,
        },
        {
            imgSrc: "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/4c652be8-465b-47ab-b11b-a9422624d400/public",
            objectPosition: objectPosition.top,
        },
        {
            imgSrc: "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/c76999dc-8d63-4fce-f850-6a150ce8d500/public",
            objectPosition: objectPosition.top,
        },
        {
            imgSrc: "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/6664387b-e442-4a28-dc83-7452bbed0000/public",
            objectPosition: objectPosition.top,
        },
        {
            imgSrc: "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/825a73be-6cd3-4422-dd23-efb4a42a3b00/public",
            objectPosition: objectPosition.top,
        },
        {
            imgSrc: "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/2aedd0b1-6888-43ed-26e3-d20ac1243200/public",
            objectPosition: objectPosition.top,
        },
        {
            imgSrc: "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/bfc40693-e09d-4243-1c7b-d50c2e816b00/public",
            objectPosition: objectPosition.top,
        },
        {
            imgSrc: "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/3ca4e628-1651-4359-e003-1c859e60d500/public",
            objectPosition: objectPosition.top,
        },
        {
            imgSrc: "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/b5de0d58-31bc-4831-592d-8c6bb5c54e00/public",
            objectPosition: objectPosition.top,
        },
        {
            imgSrc: "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/923725de-98be-4b33-4edc-587fee50bf00/public",
            objectPosition: objectPosition.top,
        },
        {
            imgSrc: "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/8c6b22a7-9fae-424d-75b9-0da010ea0300/public",
            objectPosition: objectPosition.top,
        },
        {
            imgSrc: "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/ee8b4626-5875-4772-d2a5-74377e1a0700/public",
            objectPosition: objectPosition.top,
        },
        {
            imgSrc: "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/5cb403cf-65a0-4f94-b6a8-d9e68bb23200/public",
            objectPosition: objectPosition.top,
        },
        {
            imgSrc: "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/5ad8b6cd-6808-493b-4e2b-ec7e430f9c00/public",
            objectPosition: objectPosition.top,
        },
    ],
    "fashion-shows": [
        {
            name: "Debbie Brown",
            imgSrc: "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/2f2f9811-e3a0-4562-8ed7-efeb265b1500/public",
            link: "/albums/brands-and-campaign/debbie-brown",
            objectPosition: objectPosition.top,
        },
        {
            name: "Czech Fashion Week Marianske lazne",
            imgSrc: "https://img.freepik.com/free-vector/coming-soon-background-with-focus-light-effect-design_1017-27277.jpg?w=2000",
            link: "/albums",
            objectPosition: objectPosition.center,
        }
    ],
    'portraits': [
        {
            name: "Port 10",
            imgSrc: "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/935a93ce-f8d4-40a0-800f-511c81c6be00/public",
            objectPosition: objectPosition.top,
        },
        {
            name: "Port 09",
            imgSrc: "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/97d283e7-1e49-429c-c421-392c93ba3000/public",
            objectPosition: objectPosition.top,
        },
        {
            name: "Port 08",
            imgSrc: "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/59c2d30d-a6c3-47a1-ce94-3bbeb97c5b00/public",
            objectPosition: objectPosition.top,
        },
        {
            name: "Port 07",
            imgSrc: "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/bf11bc33-5287-43f2-b9da-83928d9e6f00/public",
            objectPosition: objectPosition.top,
        },
        {
            name: "Port 06",
            imgSrc: "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/6a22da20-388b-4a49-72f0-86d3720a1400/public",
            objectPosition: objectPosition.top,
        },
        {
            name: "Port 05",
            imgSrc: "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/efabe405-9681-4710-f0a8-83359d4e5900/public",
            objectPosition: objectPosition.top,
        },
        {
            name: "Port 04",
            imgSrc: "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/2aeaa7c0-fbd3-41ad-59bd-992ba40d5100/public",
            objectPosition: objectPosition.top,
        },
        {
            name: "Port 03",
            imgSrc: "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/cfbf4331-5921-44f4-9dce-610d5d2c3900/public",
            objectPosition: objectPosition.top,
        },
        {
            name: "Port 02",
            imgSrc: "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/a4b24e0f-c98a-4558-10a6-e7ccdc3a3e00/public",
            objectPosition: objectPosition.top,
        },
        {
            name: "Port 01",
            imgSrc: "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/a79c5e9b-db3e-4409-1fa3-ec9ffd654000/public",
            objectPosition: objectPosition.top,
        },
        {
            name: "Portrait 1",
            imgSrc: "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/d541f89a-a95a-40c4-bae6-aaa622ab2100/public",
            objectPosition: objectPosition.top,
        },
        {
            name: "Portrait 2",
            imgSrc: "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/946751b6-b367-4d03-e210-110b3ca53200/public",
            objectPosition: objectPosition.top,
        },
        {
            name: "Portrait 3",
            imgSrc: "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/069207ec-a54c-4de5-9d5c-1df29bbfd500/public",
            objectPosition: objectPosition.top,
        },
        {
            name: "Portrait 4",
            imgSrc: "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/b74fd435-1ad9-463f-12de-405fb29a6e00/public",
            objectPosition: objectPosition.top,
        },
        {
            name: "Portrait 5",
            imgSrc: "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/7606495c-a59a-48b0-05bc-dadd00d10a00/public",
            objectPosition: objectPosition.top,
        },
        {
            name: "Portrait 6",
            imgSrc: "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/4d753e76-c264-42f7-1394-c097bae94700/public",
            objectPosition: objectPosition.top,
        },
        {
            name: "Portrait 7",
            imgSrc: "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/31758c63-c86c-4cdb-a857-1ab37a0e3d00/public",
            objectPosition: objectPosition.top,
        },
        {
            name: "Portrait 8",
            imgSrc: "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/79882449-209d-4651-f384-cf67b0ffb100/public",
            objectPosition: objectPosition.top,
        },
        {
            name: "Portrait 9",
            imgSrc: "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/9682c2cf-bda1-4f8f-a30b-1765f7e9e700/public",
            objectPosition: objectPosition.top,
        },
        {
            name: "Portrait 10",
            imgSrc: "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/da6a911f-e6cf-421d-995f-23f0ca73ea00/public",
            objectPosition: objectPosition.top,
        },
    ],
    "visual-stories": [
        {
            name: "Visual story 01",
            imgSrc: "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/92f6f6c1-e85f-498d-e175-a0c71c6efd00/public",
            objectPosition: objectPosition.center,
        },
        {
            name: "Visual story 02",
            imgSrc: "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/98248836-86f0-4fbe-a9f1-84ce4e35df00/public",
            objectPosition: objectPosition.center,
        },
        {
            name: "Visual story 03",
            imgSrc: "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/cf5f8dc4-ed66-4970-fdf1-4ab686a96c00/public",
            objectPosition: objectPosition.center,
        },
        {
            name: "Visual story 04",
            imgSrc: "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/1e53840f-942c-4779-a7c7-d944ef8e6600/public",
            objectPosition: objectPosition.center,
        },
        {
            name: "Visual story 05",
            imgSrc: "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/b9456802-bc45-454e-76d1-bfa9068aa400/public",
            objectPosition: objectPosition.center,
        },
        {
            name: "Visual story 06",
            imgSrc: "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/41fc3e38-c116-4411-b231-a5fe01fd0000/public",
            objectPosition: objectPosition.center,
        },
        {
            name: "Visual story 07",
            imgSrc: "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/b36b4f37-ef0a-4a18-db1f-89888eaed600/public",
            objectPosition: objectPosition.center,
        }
    ],
    "couples": [
        {
            name: "Honza a Ondra",
            imgSrc: "https://img.freepik.com/free-vector/coming-soon-background-with-focus-light-effect-design_1017-27277.jpg?w=2000",
            link: "/albums/couples/honza-a-ondra",
            objectPosition: objectPosition.top,
        },
        {
            name: "Dasa a Filip",
            imgSrc: "https://img.freepik.com/free-vector/coming-soon-background-with-focus-light-effect-design_1017-27277.jpg?w=2000",
            link: "/albums/couples/dasa-a-filip",
            objectPosition: objectPosition.top,
        },
        {
            name: "Simca a Mara",
            imgSrc: "https://img.freepik.com/free-vector/coming-soon-background-with-focus-light-effect-design_1017-27277.jpg?w=2000",
            link: "/albums/couples/simca-a-mara",
            objectPosition: objectPosition.top,
        },
    ],
    "fashion-and-editorials": [
        {
            name: "Wide Shooting",
            imgSrc: "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/72ceb85d-788a-416d-e52a-db5b22f17900/public",
            link: "/albums/fashion-and-editorials/wide-shooting",
            objectPosition: objectPosition.top,
        },
        {
            name: "Still in Style",
            imgSrc: "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/6bd5f04a-5de2-4104-10da-daf20cee9300/public",
            link: "/albums/fashion-and-editorials/stillin-style",
            objectPosition: objectPosition.top,
        },
        {
            name: "Calvin Klein Underwear",
            imgSrc: "https://img.freepik.com/free-vector/coming-soon-background-with-focus-light-effect-design_1017-27277.jpg?w=2000",
            link: "/albums/fashion-and-editorials/calvin-klein-underwear",
            objectPosition: objectPosition.top,
        },
        {
            name: "Urban Style",
            imgSrc: "https://img.freepik.com/free-vector/coming-soon-background-with-focus-light-effect-design_1017-27277.jpg?w=2000",
            link: "/albums/fashion-and-editorials/urban-style",
            objectPosition: objectPosition.top,
        },
        {
            name: "Bauhaus Style",
            imgSrc: "https://img.freepik.com/free-vector/coming-soon-background-with-focus-light-effect-design_1017-27277.jpg?w=2000",
            link: "/albums/fashion-and-editorials/bauhaus-style",
            objectPosition: objectPosition.top,
        },
    ]
};

interface Props {
    params: { category: string }
}

const AlbumCategory = async ({ params }: Props) => {
    const { category } = await params;
    const album = photoCoverAlbumsByCatogery[category];
    console.log("Album:", album);

    return (
        <>
            <div className="text-center py-8 px-4 md:px-12 lg:px-24">
                <h2 className="text-3xl font-bold mb-4">{category.replace(/-/g, ' ').toUpperCase()}</h2>
                {album[0].link && <p className="text-lg text-gray-600">
                    Each collection below captures a unique story, mood, and moment. Browse through to discover the artistry behind every frame.
                </p>}
            </div>
            {album[0].link && <AlbumsGrid photoCoverAlbums={album} />}
            {!album[0].link && <AlbumGrid photos={album} />}

        </>
    )
}

export default AlbumCategory