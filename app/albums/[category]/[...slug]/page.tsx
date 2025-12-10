import React from "react";
import AlbumGrid from "../../AlbumGrid";
import { objectPosition } from "@/app/page";

export interface Photo {
  name: string;
  imgSrc: string;
  objectPosition: string;
}

const photos: Record<string, Photo[]> = {
  "vanguard-collection-2025": [
    {
      name: "JANINE MADE BY LOVE - Vanguard 81",
      imgSrc:
        "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/67c0f9bf-7f87-4f65-baee-9fdf6810f700/public",
      objectPosition: objectPosition.top,
    },
    {
      name: "JANINE MADE BY LOVE - Vanguard 25",
      imgSrc:
        "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/0daac82a-2e82-41d6-0a97-f91cd1b2fb00/public",
      objectPosition: objectPosition.top,
    },
    {
      name: "JANINE MADE BY LOVE - Vanguard 27",
      imgSrc:
        "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/5b1221a6-351a-4a91-7a1d-313b833ee000/public",
      objectPosition: objectPosition.top,
    },
    {
      name: "JANINE MADE BY LOVE - Vanguard 34",
      imgSrc:
        "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/b9297421-3c44-4d15-81b3-f2c395400a00/public",
      objectPosition: objectPosition.top,
    },
    {
      name: "JANINE MADE BY LOVE - Vanguard 41",
      imgSrc:
        "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/d2dd37f6-2dcc-4667-850d-16970c4bde00/public",
      objectPosition: objectPosition.top,
    },
    {
      name: "JANINE MADE BY LOVE - Vanguard 44",
      imgSrc:
        "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/8c0c336e-5a12-441f-0f74-0c5d736d5800/public",
      objectPosition: objectPosition.top,
    },
    {
      name: "JANINE MADE BY LOVE - Vanguard 52",
      imgSrc:
        "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/05f03a51-330c-429c-3174-8feac952f200/public",
      objectPosition: objectPosition.top,
    },
    {
      name: "JANINE MADE BY LOVE - Vanguard 54",
      imgSrc:
        "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/816a82dd-8ac1-4ac7-af2a-3f95df34e000/public",
      objectPosition: objectPosition.top,
    },
    {
      name: "JANINE MADE BY LOVE - Vanguard 58",
      imgSrc:
        "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/9c210625-6124-446a-e87d-80da97331900/public",
      objectPosition: objectPosition.top,
    },
    {
      name: "JANINE MADE BY LOVE - Vanguard 60",
      imgSrc:
        "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/c0b4e96b-a56f-4ab5-963c-4801d2b92500/public",
      objectPosition: objectPosition.top,
    },
    {
      name: "JANINE MADE BY LOVE - Vanguard 62",
      imgSrc:
        "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/06f99cc0-0faa-46f2-2433-f787f5235300/public",
      objectPosition: objectPosition.top,
    },
    {
      name: "JANINE MADE BY LOVE - Vanguard 63",
      imgSrc:
        "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/0a1cbc50-a73d-4c69-108c-3e06b53a2b00/public",
      objectPosition: objectPosition.top,
    },
    {
      name: "JANINE MADE BY LOVE - Vanguard 69",
      imgSrc:
        "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/770ebb3f-d5be-4016-2e04-a9c8b49a5600/public",
      objectPosition: objectPosition.top,
    },
    {
      name: "JANINE MADE BY LOVE - Vanguard 73",
      imgSrc:
        "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/a9faf13a-7b82-4984-b0df-806da1402a00/public",
      objectPosition: objectPosition.top,
    },
    {
      name: "JANINE MADE BY LOVE - Vanguard 83",
      imgSrc:
        "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/91d5cdfa-d9cc-4cf3-a483-e043bb16b100/public",
      objectPosition: objectPosition.top,
    },
    {
      name: "JANINE MADE BY LOVE - Vanguard 84",
      imgSrc:
        "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/0b9f551e-6648-4da3-80e3-3239b2abc800/public",
      objectPosition: objectPosition.top,
    },
    {
      name: "JANINE MADE BY LOVE - Vanguard 88",
      imgSrc:
        "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/f89e8c42-ccc9-4552-b752-f8268dd8ba00/public",
      objectPosition: objectPosition.top,
    },
    {
      name: "JANINE MADE BY LOVE - Vanguard 91",
      imgSrc:
        "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/5212bdeb-d8d7-4e1f-d97c-d89e0e1f4a00/public",
      objectPosition: objectPosition.top,
    },
    {
      name: "JANINE MADE BY LOVE - Vanguard 92",
      imgSrc:
        "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/71fcec33-ab2c-4d29-4f13-ca586eab8000/public",
      objectPosition: objectPosition.top,
    },
  ],
  "spring-collection-2024": [
    {
      name: "JANINE MADE BY LOVE 1",
      imgSrc:
        "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/6a65c9f7-e8db-413f-0cd2-2ddb092f0900/public",
      objectPosition: objectPosition.top,
    },
    {
      name: "JANINE MADE BY LOVE 2",
      imgSrc:
        "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/82c57836-cb03-4800-915d-1ce0126ae800/public",
      objectPosition: objectPosition.top,
    },
    {
      name: "JANINE MADE BY LOVE 3",
      imgSrc:
        "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/9b68f3f3-9796-4810-8a38-46aeeed81a00/public",
      objectPosition: objectPosition.top,
    },
    {
      name: "JANINE MADE BY LOVE 4",
      imgSrc:
        "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/f6a6c79d-77d1-4b8e-7e9b-3573d5382a00/public",
      objectPosition: objectPosition.top,
    },
    {
      name: "JANINE MADE BY LOVE 5",
      imgSrc:
        "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/65a13da5-cd19-4d66-3902-9c88079a9900/public",
      objectPosition: objectPosition.top,
    },
    {
      name: "JANINE MADE BY LOVE 6",
      imgSrc:
        "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/65c9897b-4771-40a4-7f39-29bcab158000/public",
      objectPosition: objectPosition.top,
    },
    {
      name: "JANINE MADE BY LOVE 7",
      imgSrc:
        "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/34743daa-3e98-4a25-43ce-c29491489e00/public",
      objectPosition: objectPosition.top,
    },
    {
      name: "JANINE MADE BY LOVE 8",
      imgSrc:
        "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/9b2e25e6-c475-4fee-d092-5a25d941a400/public",
      objectPosition: objectPosition.top,
    },
    {
      name: "JANINE MADE BY LOVE 9",
      imgSrc:
        "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/14789a56-e5e8-4429-6df9-c78ec4ccf000/public",
      objectPosition: objectPosition.top,
    },
    {
      name: "JANINE MADE BY LOVE 10",
      imgSrc:
        "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/a2af953e-b445-4291-01b9-790d8322f600/public",
      objectPosition: objectPosition.top,
    },
    {
      name: "JANINE MADE BY LOVE 11",
      imgSrc:
        "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/5fba4ab7-0615-43e2-0f47-cfc17eb69b00/public",
      objectPosition: objectPosition.top,
    },
    {
      name: "JANINE MADE BY LOVE 12",
      imgSrc:
        "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/0dad2acf-a79a-4ed5-044a-376e70c61700/public",
      objectPosition: objectPosition.top,
    },
    {
      name: "JANINE MADE BY LOVE 13",
      imgSrc:
        "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/89e598cb-7e58-45be-35ed-1e7b9e3a1d00/public",
      objectPosition: objectPosition.top,
    },
  ],
  "autumn-collection-2024": [
    {
      name: "JANINE MADE BY LOVE 1",
      imgSrc:
        "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/3d889cda-13a5-44f8-7300-225575d6ce00/public",
      objectPosition: objectPosition.top,
    },
    {
      name: "JANINE MADE BY LOVE 2",
      imgSrc:
        "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/5fde9906-6ca0-4696-093a-8d4f1d89cf00/public",
      objectPosition: objectPosition.top,
    },
    {
      name: "JANINE MADE BY LOVE 3",
      imgSrc:
        "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/fa3f0458-6fb1-47eb-6bf2-17f6caef6800/public",
      objectPosition: objectPosition.top,
    },
    {
      name: "JANINE MADE BY LOVE 4",
      imgSrc:
        "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/e2498a0d-0e02-4732-bffb-04400a55ef00/public",
      objectPosition: objectPosition.top,
    },
    {
      name: "JANINE MADE BY LOVE 5",
      imgSrc:
        "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/bb512ba2-dfcc-485d-65dc-c02e111ea200/public",
      objectPosition: objectPosition.top,
    },
    {
      name: "JANINE MADE BY LOVE 6",
      imgSrc:
        "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/f2ddf53a-fe11-4232-61db-66fd83a89000/public",
      objectPosition: objectPosition.top,
    },
    {
      name: "JANINE MADE BY LOVE 7",
      imgSrc:
        "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/d321741a-d959-40ee-d995-4a38ed3a5c00/public",
      objectPosition: objectPosition.top,
    },
    {
      name: "JANINE MADE BY LOVE 8",
      imgSrc:
        "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/ee01e24b-107c-450d-b5fb-e410a0cfcc00/public",
      objectPosition: objectPosition.top,
    },
    {
      name: "JANINE MADE BY LOVE 9",
      imgSrc:
        "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/22b54848-d8bc-4cd5-45c8-3bf9a9bebb00/public",
      objectPosition: objectPosition.top,
    },
  ],
  "infinimy-collection-2024": [
    {
      name: "INFINIMY 1",
      imgSrc:
        "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/bc482303-6466-4b8e-8062-801b2a7b7400/public",
      objectPosition: objectPosition.top,
    },
    {
      name: "INFINIMY 2",
      imgSrc:
        "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/266fd571-4c8c-4a93-a10f-ab9d30949000/public",
      objectPosition: objectPosition.top,
    },
    {
      name: "INFINIMY 3",
      imgSrc:
        "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/7dca3a6a-9333-422c-035a-b520f7e43300/public",
      objectPosition: objectPosition.top,
    },
    {
      name: "INFINIMY 4",
      imgSrc:
        "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/7ed113cb-8425-49b5-6ed8-1b286462ad00/public",
      objectPosition: objectPosition.top,
    },
    {
      name: "INFINIMY 5",
      imgSrc:
        "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/8c30fa17-1ef0-4fa6-e2d2-05a8a1d57b00/public",
      objectPosition: objectPosition.top,
    },
    {
      name: "INFINIMY 6",
      imgSrc:
        "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/9f1fc37e-1e2c-4d06-f390-2ea4b9a83d00/public",
      objectPosition: objectPosition.top,
    },
    {
      name: "INFINIMY 7",
      imgSrc:
        "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/5f772624-1977-48a1-349a-c9e1d48e2d00/public",
      objectPosition: objectPosition.top,
    },
    {
      name: "INFINIMY 8",
      imgSrc:
        "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/58fe6665-63f0-4dff-f16b-e3785a633e00/public",
      objectPosition: objectPosition.top,
    },
    {
      name: "INFINIMY 9",
      imgSrc:
        "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/594470e0-7b49-440c-716e-1cecf07df200/public",
      objectPosition: objectPosition.top,
    },
    {
      name: "INFINIMY 10",
      imgSrc:
        "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/fe5a2e71-6b91-4349-a36b-e4337f15c500/public",
      objectPosition: objectPosition.top,
    },
    {
      name: "INFINIMY 11",
      imgSrc:
        "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/5b9be6f2-597d-4017-bc91-da281f7e2a00/public",
      objectPosition: objectPosition.top,
    },
    {
      name: "INFINIMY 12",
      imgSrc:
        "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/f56db2a1-e717-48a9-7647-4e414e645000/public",
      objectPosition: objectPosition.top,
    },
    {
      name: "INFINIMY 13",
      imgSrc:
        "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/afc07cec-873a-4280-c07b-a9bfdde73000/public",
      objectPosition: objectPosition.top,
    },
  ],
  "hotel-pupp-2024": [
    {
      name: "Hotel Pupp 1",
      imgSrc:
        "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/a8865897-a6b4-4a87-53cf-f101a5ef8100/public",
      objectPosition: objectPosition.top,
    },
    {
      name: "Hotel Pupp 2",
      imgSrc:
        "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/e84233ed-0ab1-4e61-e658-e3a8e8b44900/public",
      objectPosition: objectPosition.top,
    },
    {
      name: "Hotel Pupp 3",
      imgSrc:
        "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/9e4596f3-f27a-4d33-4e0a-794bfadf3600/public",
      objectPosition: objectPosition.top,
    },
    {
      name: "Hotel Pupp 4",
      imgSrc:
        "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/eafa4e3f-4ef0-4b19-0e4a-f5a23ed7f300/public",
      objectPosition: objectPosition.top,
    },
    {
      name: "Hotel Pupp 5",
      imgSrc:
        "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/14f9a7eb-1540-4a09-ef14-80fa77f15c00/public",
      objectPosition: objectPosition.top,
    },
    {
      name: "Hotel Pupp 6",
      imgSrc:
        "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/7566b550-4838-4d07-77ad-859ced8d1200/public",
      objectPosition: objectPosition.top,
    },
    {
      name: "Hotel Pupp 7",
      imgSrc:
        "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/f1c1cca7-91bf-4cc1-5afe-ccde5d04f300/public",
      objectPosition: objectPosition.top,
    },
    {
      name: "Hotel Pupp 8",
      imgSrc:
        "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/19cc2387-3139-46cb-3178-4ce4f8dcbf00/public",
      objectPosition: objectPosition.top,
    },
    {
      name: "Hotel Pupp 9",
      imgSrc:
        "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/8826ee5e-6c83-4a87-784b-8e090b9c8700/public",
      objectPosition: objectPosition.top,
    },
    {
      name: "Hotel Pupp 10",
      imgSrc:
        "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/e0dc79d9-87d0-435f-adc1-954da6d27000/public",
      objectPosition: objectPosition.top,
    },
  ],
  "debbie-brown": [
    {
      name: "DEBBIE BROWN 25",
      imgSrc:
        "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/c136bb4c-b1f7-4a50-e8da-38b80910fc00/public",
      objectPosition: objectPosition.top,
    },
    {
      name: "DEBBIE BROWN 23",
      imgSrc:
        "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/2f2f9811-e3a0-4562-8ed7-efeb265b1500/public",
      objectPosition: objectPosition.top,
    },
    {
      name: "DEBBIE BROWN 22",
      imgSrc:
        "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/67e1379f-c257-475f-1a78-253a11a93a00/public",
      objectPosition: objectPosition.top,
    },
    {
      name: "DEBBIE BROWN 21",
      imgSrc:
        "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/0191312e-5fa6-4851-05c1-4892abb97e00/public",
      objectPosition: objectPosition.top,
    },
    {
      name: "DEBBIE BROWN 20",
      imgSrc:
        "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/0d2ad591-9d57-4ed8-ea44-d728f489a900/public",
      objectPosition: objectPosition.top,
    },
    {
      name: "DEBBIE BROWN 19",
      imgSrc:
        "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/ded09576-89c8-4d94-770b-42ab3912b800/public",
      objectPosition: objectPosition.top,
    },
    {
      name: "DEBBIE BROWN 18",
      imgSrc:
        "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/1f94e662-efb7-4b49-4868-bb511ffc6500/public",
      objectPosition: objectPosition.top,
    },
    {
      name: "DEBBIE BROWN 16",
      imgSrc:
        "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/ea891179-a98e-447c-c09f-6dd0c38a5200/public",
      objectPosition: objectPosition.top,
    },
    {
      name: "DEBBIE BROWN 15",
      imgSrc:
        "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/1eeafa70-2318-4bc6-eed7-134eae83e700/public",
      objectPosition: objectPosition.top,
    },
    {
      name: "DEBBIE BROWN 13",
      imgSrc:
        "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/f42fe80d-eacb-481f-0c25-38586f3c7a00/public",
      objectPosition: objectPosition.top,
    },
    {
      name: "DEBBIE BROWN 12",
      imgSrc:
        "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/51fafaa5-5408-4245-1d93-ea093d76e300/public",
      objectPosition: objectPosition.top,
    },
    {
      name: "DEBBIE BROWN 11",
      imgSrc:
        "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/02040a24-6d16-4911-01fb-69023ed59600/public",
      objectPosition: objectPosition.top,
    },
    {
      name: "DEBBIE BROWN 10",
      imgSrc:
        "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/9f8e4241-644c-4e2d-eb33-1234957ea300/public",
      objectPosition: objectPosition.top,
    },
    {
      name: "DEBBIE BROWN 8",
      imgSrc:
        "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/c8f6475c-9150-4838-32c6-3ebeb7515400/public",
      objectPosition: objectPosition.top,
    },
    {
      name: "DEBBIE BROWN 7",
      imgSrc:
        "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/e250c77f-48cf-44d6-959e-3f7461b56700/public",
      objectPosition: objectPosition.top,
    },
    {
      name: "DEBBIE BROWN 6",
      imgSrc:
        "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/9148fa7a-8f23-434f-4a45-6e8f69f3ae00/public",
      objectPosition: objectPosition.top,
    },
    {
      name: "DEBBIE BROWN 5",
      imgSrc:
        "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/5fa201aa-790d-4f29-bb5c-6711de6c6100/public",
      objectPosition: objectPosition.top,
    },
    {
      name: "DEBBIE BROWN 3",
      imgSrc:
        "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/b5a567c4-9651-4385-793a-196222e7ee00/public",
      objectPosition: objectPosition.top,
    },
    {
      name: "DEBBIE BROWN 4",
      imgSrc:
        "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/9a4f40d5-59c7-43c2-de9d-3f4c81c71a00/public",
      objectPosition: objectPosition.top,
    },
    {
      name: "DEBBIE BROWN 2",
      imgSrc:
        "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/c136bb4c-b1f7-4a50-e8da-38b80910fc00/public",
      objectPosition: objectPosition.top,
    },
  ],
  "stillin-style": [
    {
      name: "Stillin 01",
      imgSrc:
        "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/6bd5f04a-5de2-4104-10da-daf20cee9300/public",
      objectPosition: objectPosition.top,
    },
    {
      name: "Stillin 02",
      imgSrc:
        "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/3aea453e-90bd-479a-46a0-e2c916035300/public",
      objectPosition: objectPosition.top,
    },
    {
      name: "Stillin 03",
      imgSrc:
        "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/7b66d645-5332-41db-afea-c0fd24b22b00/public",
      objectPosition: objectPosition.top,
    },
    {
      name: "Stillin 04",
      imgSrc:
        "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/60680062-1cd1-4c05-1ef9-853475de1100/public",
      objectPosition: objectPosition.top,
    },
    {
      name: "Stillin 05",
      imgSrc:
        "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/ab564a41-78d8-4df4-a1ae-4ad12d3c7800/public",
      objectPosition: objectPosition.top,
    },
    {
      name: "Stillin 06",
      imgSrc:
        "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/ea92fd31-61ea-4207-d2a1-910ff0c94f00/public",
      objectPosition: objectPosition.top,
    },
    {
      name: "Stillin 07",
      imgSrc:
        "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/f6c47142-ccb0-49dd-bb45-44257a2d4a00/public",
      objectPosition: objectPosition.top,
    },
  ],
  "wide-shooting": [
    {
      name: "WIDE SHOOTING 01",
      imgSrc:
        "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/72ceb85d-788a-416d-e52a-db5b22f17900/public",
      objectPosition: objectPosition.top,
    },
    {
      name: "WIDE SHOOTING 02",
      imgSrc:
        "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/0ed6883a-3978-46be-0773-97b50a45e800/public",
      objectPosition: objectPosition.top,
    },
    {
      name: "WIDE SHOOTING 03",
      imgSrc:
        "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/35c66228-6470-4221-cef9-bcb644e5a500/public",
      objectPosition: objectPosition.top,
    },
    {
      name: "WIDE SHOOTING 04",
      imgSrc:
        "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/87d11b5e-b6fb-4679-c739-452c99e42c00/public",
      objectPosition: objectPosition.top,
    },
    {
      name: "WIDE SHOOTING 05",
      imgSrc:
        "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/ad8a9ba4-6fe0-4262-3c37-31ee69fba400/public",
      objectPosition: objectPosition.top,
    },
    {
      name: "WIDE SHOOTING 06",
      imgSrc:
        "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/72cb6b04-4082-4ff6-8af5-2f51e51a4d00/public",
      objectPosition: objectPosition.top,
    },
    {
      name: "WIDE SHOOTING 07",
      imgSrc:
        "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/129987b9-8407-4a10-eb06-f5026336b200/public",
      objectPosition: objectPosition.top,
    },
    {
      name: "WIDE SHOOTING 08",
      imgSrc:
        "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/e0649c36-22cf-400a-7d1a-b79494a26b00/public",
      objectPosition: objectPosition.top,
    },
    {
      name: "WIDE SHOOTING 09",
      imgSrc:
        "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/65a6e4a5-f150-4896-6d22-205e2641fd00/public",
      objectPosition: objectPosition.top,
    },
    {
      name: "WIDE SHOOTING 10",
      imgSrc:
        "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/d11532a7-0b83-4b03-51ed-a45aaaf92300/public",
      objectPosition: objectPosition.top,
    },
    {
      name: "WIDE SHOOTING 11",
      imgSrc:
        "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/5a3040bc-b21c-43af-7182-ae5b9e0bb000/public",
      objectPosition: objectPosition.top,
    },
    {
      name: "WIDE SHOOTING 12",
      imgSrc:
        "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/b2d89ae9-8229-42e9-10af-87849d5a1200/public",
      objectPosition: objectPosition.top,
    },
    {
      name: "WIDE SHOOTING 13",
      imgSrc:
        "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/2c0ff312-acdb-4259-7160-cc54a4759c00/public",
      objectPosition: objectPosition.top,
    },
    {
      name: "WIDE SHOOTING 14",
      imgSrc:
        "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/8ae4539f-1916-45ba-e28b-5c8ed0e54a00/public",
      objectPosition: objectPosition.top,
    },
    {
      name: "WIDE SHOOTING 15",
      imgSrc:
        "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/a9691f73-0db9-49e8-2296-95cc95694200/public",
      objectPosition: objectPosition.top,
    },
    {
      name: "WIDE SHOOTING 16",
      imgSrc:
        "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/7fca7fd0-b63b-4fbf-42c8-3ab6bdf06900/public",
      objectPosition: objectPosition.top,
    },
    {
      name: "WIDE SHOOTING 18",
      imgSrc:
        "https://imagedelivery.net/nGg_6H5MpzveW4sWn4-OFg/37d0d67c-4a3a-4346-b1fb-790a8e01cc00/public",
      objectPosition: objectPosition.top,
    },
  ],
};

interface Props {
  params: { category: string; slug: string[] };
}

const Album = async ({ params }: Props) => {
  const { category, slug: segments } = params;
  const artist = category.replaceAll("-", " ");
  const collection = segments[segments.length - 1];
  const collectionName = collection.replaceAll("-", " ");
  const album = photos[collection];

  return (
    <section className="pt-10 pb-10">
      <div className="text-center ">
        <h2 className="text-4xl font-extrabold text-gray-900 mb-2 capitalize tracking-tight">
          {artist}
        </h2>
        <p className="text-lg text-gray-600 italic capitalize">
          {collectionName}
        </p>
      </div>
      <div className="w-16 h-1 mx-auto my-6 bg-gray-300 rounded-full" />

      <AlbumGrid photos={album || []} />
    </section>
  );
};

export default Album;
