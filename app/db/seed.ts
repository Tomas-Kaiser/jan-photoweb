
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { albums, photos, portfolioHighlights } from "./schema";

const connectionString =
  process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!connectionString) {
  throw new Error("Missing DATABASE_URL or POSTGRES_URL");
}

const pool = new Pool({ connectionString });
const db = drizzle(pool);

type AlbumSeed = {
  name: string;
  slug: string;
  path: string;
  parentPath: string | null;
  coverCloudflareId: string;
  objectPosition?: string;
  sortOrder?: number;
};

const albumsData: AlbumSeed[] = [
  { name: "Brands and Campaign", slug: "brands-and-campaign", path: "brands-and-campaign", parentPath: null, coverCloudflareId: "3eef17ee-9681-4644-5fcd-1460f61bf900", objectPosition: "top30", sortOrder: 0 },
  { name: "Fashion Shows", slug: "fashion-shows", path: "fashion-shows", parentPath: null, coverCloudflareId: "2f2f9811-e3a0-4562-8ed7-efeb265b1500", objectPosition: "center", sortOrder: 1 },
  { name: "Portraits", slug: "portraits", path: "portraits", parentPath: null, coverCloudflareId: "71a2dd68-df7a-494e-eb73-dbbafb7e3800", objectPosition: "top", sortOrder: 2 },
  { name: "Visual Stories", slug: "visual-stories", path: "visual-stories", parentPath: null, coverCloudflareId: "92f6f6c1-e85f-498d-e175-a0c71c6efd00", objectPosition: "center", sortOrder: 3 },
  { name: "Weddings", slug: "weddings", path: "weddings", parentPath: null, coverCloudflareId: "1b3c4bc1-6bfe-4244-77b0-be81c4185f00", objectPosition: "top30", sortOrder: 4 },
  { name: "Couples", slug: "couples", path: "couples", parentPath: null, coverCloudflareId: "5fefadb3-5c3b-4379-ff48-f768cb600100", objectPosition: "top", sortOrder: 5 },
  { name: "Fashion and Editorials", slug: "fashion-and-editorials", path: "fashion-and-editorials", parentPath: null, coverCloudflareId: "6bd5f04a-5de2-4104-10da-daf20cee9300", objectPosition: "center", sortOrder: 6 },
  { name: "Fine Furs", slug: "fine-furs", path: "brands-and-campaign/fine-furs", parentPath: "brands-and-campaign", coverCloudflareId: "3eef17ee-9681-4644-5fcd-1460f61bf900", objectPosition: "top", sortOrder: 0 },
  { name: "Janine Made by Love", slug: "janine-made-by-love", path: "brands-and-campaign/janine-made-by-love", parentPath: "brands-and-campaign", coverCloudflareId: "67c0f9bf-7f87-4f65-baee-9fdf6810f700", objectPosition: "top30", sortOrder: 1 },
  { name: "Vanguard Collection 2025", slug: "vanguard-collection-2025", path: "brands-and-campaign/janine-made-by-love/vanguard-collection-2025", parentPath: "brands-and-campaign/janine-made-by-love", coverCloudflareId: "67c0f9bf-7f87-4f65-baee-9fdf6810f700", objectPosition: "top30", sortOrder: 0 },
  { name: "Spring Collection 2024", slug: "spring-collection-2024", path: "brands-and-campaign/janine-made-by-love/spring-collection-2024", parentPath: "brands-and-campaign/janine-made-by-love", coverCloudflareId: "14789a56-e5e8-4429-6df9-c78ec4ccf000", objectPosition: "top15", sortOrder: 1 },
  { name: "Autumn Collection 2024", slug: "autumn-collection-2024", path: "brands-and-campaign/janine-made-by-love/autumn-collection-2024", parentPath: "brands-and-campaign/janine-made-by-love", coverCloudflareId: "3d889cda-13a5-44f8-7300-225575d6ce00", objectPosition: "top", sortOrder: 2 },
  { name: "Infinimy", slug: "infinimy", path: "brands-and-campaign/infinimy", parentPath: "brands-and-campaign", coverCloudflareId: "bc482303-6466-4b8e-8062-801b2a7b7400", objectPosition: "top", sortOrder: 2 },
  { name: "Infinimy Collection 2024", slug: "infinimy-collection-2024", path: "brands-and-campaign/infinimy/infinimy-collection-2024", parentPath: "brands-and-campaign/infinimy", coverCloudflareId: "bc482303-6466-4b8e-8062-801b2a7b7400", objectPosition: "top", sortOrder: 0 },
  { name: "Hotel Pupp 2024", slug: "hotel-pupp-2024", path: "brands-and-campaign/hotel-pupp-2024", parentPath: "brands-and-campaign", coverCloudflareId: "a8865897-a6b4-4a87-53cf-f101a5ef8100", objectPosition: "top", sortOrder: 3 },
  { name: "Debbie Brown", slug: "debbie-brown", path: "fashion-shows/debbie-brown", parentPath: "fashion-shows", coverCloudflareId: "2f2f9811-e3a0-4562-8ed7-efeb265b1500", objectPosition: "top", sortOrder: 0 },
  { name: "Czech Fashion Week Marianske Lazne", slug: "czech-fashion-week-marianske-lazne", path: "fashion-shows/czech-fashion-week-marianske-lazne", parentPath: "fashion-shows", coverCloudflareId: "526afc0b-6cb7-4ee6-132b-8b4125946200", objectPosition: "top30", sortOrder: 1 },
  { name: "Mara a Market", slug: "mara-a-market", path: "couples/mara-a-market", parentPath: "couples", coverCloudflareId: "5fefadb3-5c3b-4379-ff48-f768cb600100", objectPosition: "top", sortOrder: 0 },
  { name: "Dasa a Filip", slug: "dasa-a-filip", path: "couples/dasa-a-filip", parentPath: "couples", coverCloudflareId: "302f0c15-eec3-4117-9d5b-34b80556fe00", objectPosition: "top", sortOrder: 1 },
  { name: "Wide Shooting", slug: "wide-shooting", path: "fashion-and-editorials/wide-shooting", parentPath: "fashion-and-editorials", coverCloudflareId: "72ceb85d-788a-416d-e52a-db5b22f17900", objectPosition: "top", sortOrder: 0 },
  { name: "Still in Style", slug: "still-in-style", path: "fashion-and-editorials/still-in-style", parentPath: "fashion-and-editorials", coverCloudflareId: "6bd5f04a-5de2-4104-10da-daf20cee9300", objectPosition: "top", sortOrder: 1 },
];

type PhotoVisibility = "public" | "highlights_only";

type PhotoSeed = {
  albumPath: string;
  name: string;
  cloudflareId: string;
  objectPosition?: string;
  sortOrder?: number;
  visibility?: PhotoVisibility;
};

const p = (
  albumPath: string,
  name: string,
  id: string,
  pos = "top",
  i = 0,
  visibility: PhotoVisibility = "public"
): PhotoSeed => ({
  albumPath,
  name,
  cloudflareId: id,
  objectPosition: pos,
  sortOrder: i,
  visibility,
});


const photosData: PhotoSeed[] = [
  ...([
    ["67c0f9bf-7f87-4f65-baee-9fdf6810f700", "81"], ["0daac82a-2e82-41d6-0a97-f91cd1b2fb00", "25"],
    ["5b1221a6-351a-4a91-7a1d-313b833ee000", "27"], ["b9297421-3c44-4d15-81b3-f2c395400a00", "34"],
    ["d2dd37f6-2dcc-4667-850d-16970c4bde00", "41"], ["8c0c336e-5a12-441f-0f74-0c5d736d5800", "44"],
    ["05f03a51-330c-429c-3174-8feac952f200", "52"], ["816a82dd-8ac1-4ac7-af2a-3f95df34e000", "54"],
    ["9c210625-6124-446a-e87d-80da97331900", "58"], ["c0b4e96b-a56f-4ab5-963c-4801d2b92500", "60"],
    ["06f99cc0-0faa-46f2-2433-f787f5235300", "62"], ["0a1cbc50-a73d-4c69-108c-3e06b53a2b00", "63"],
    ["770ebb3f-d5be-4016-2e04-a9c8b49a5600", "69"], ["a9faf13a-7b82-4984-b0df-806da1402a00", "73"],
    ["91d5cdfa-d9cc-4cf3-a483-e043bb16b100", "83"], ["0b9f551e-6648-4da3-80e3-3239b2abc800", "84"],
    ["f89e8c42-ccc9-4552-b752-f8268dd8ba00", "88"], ["5212bdeb-d8d7-4e1f-d97c-d89e0e1f4a00", "91"],
    ["71fcec33-ab2c-4d29-4f13-ca586eab8000", "92"],
  ] as [string, string][]).map(([id, num], i) =>
    p(
      "brands-and-campaign/janine-made-by-love/vanguard-collection-2025",
      `JANINE MADE BY LOVE - Vanguard ${num}`,
      id,
      "top",
      i
    )
  ),
  ...[
    "6a65c9f7-e8db-413f-0cd2-2ddb092f0900", "82c57836-cb03-4800-915d-1ce0126ae800", "9b68f3f3-9796-4810-8a38-46aeeed81a00",
    "f6a6c79d-77d1-4b8e-7e9b-3573d5382a00", "65a13da5-cd19-4d66-3902-9c88079a9900", "65c9897b-4771-40a4-7f39-29bcab158000",
    "34743daa-3e98-4a25-43ce-c29491489e00", "9b2e25e6-c475-4fee-d092-5a25d941a400", "14789a56-e5e8-4429-6df9-c78ec4ccf000",
    "a2af953e-b445-4291-01b9-790d8322f600", "5fba4ab7-0615-43e2-0f47-cfc17eb69b00", "0dad2acf-a79a-4ed5-044a-376e70c61700",
    "89e598cb-7e58-45be-35ed-1e7b9e3a1d00",
  ].map((id, i) =>
    p(
      "brands-and-campaign/janine-made-by-love/spring-collection-2024",
      `JANINE MADE BY LOVE ${i + 1}`,
      id,
      "top",
      i
    )
  ),
  ...[
    "3d889cda-13a5-44f8-7300-225575d6ce00", "5fde9906-6ca0-4696-093a-8d4f1d89cf00", "fa3f0458-6fb1-47eb-6bf2-17f6caef6800",
    "e2498a0d-0e02-4732-bffb-04400a55ef00", "bb512ba2-dfcc-485d-65dc-c02e111ea200", "f2ddf53a-fe11-4232-61db-66fd83a89000",
    "d321741a-d959-40ee-d995-4a38ed3a5c00", "ee01e24b-107c-450d-b5fb-e410a0cfcc00", "22b54848-d8bc-4cd5-45c8-3bf9a9bebb00",
  ].map((id, i) =>
    p(
      "brands-and-campaign/janine-made-by-love/autumn-collection-2024",
      `JANINE MADE BY LOVE ${i + 1}`,
      id,
      "top",
      i
    )
  ),
  ...[
    "bc482303-6466-4b8e-8062-801b2a7b7400", "266fd571-4c8c-4a93-a10f-ab9d30949000", "7dca3a6a-9333-422c-035a-b520f7e43300",
    "7ed113cb-8425-49b5-6ed8-1b286462ad00", "8c30fa17-1ef0-4fa6-e2d2-05a8a1d57b00", "9f1fc37e-1e2c-4d06-f390-2ea4b9a83d00",
    "5f772624-1977-48a1-349a-c9e1d48e2d00", "58fe6665-63f0-4dff-f16b-e3785a633e00", "594470e0-7b49-440c-716e-1cecf07df200",
    "fe5a2e71-6b91-4349-a36b-e4337f15c500", "5b9be6f2-597d-4017-bc91-da281f7e2a00", "f56db2a1-e717-48a9-7647-4e414e645000",
    "afc07cec-873a-4280-c07b-a9bfdde73000",
  ].map((id, i) =>
    p(
      "brands-and-campaign/infinimy/infinimy-collection-2024",
      `INFINIMY ${i + 1}`,
      id,
      "top",
      i
    )
  ),
  ...[
    "a8865897-a6b4-4a87-53cf-f101a5ef8100", "e84233ed-0ab1-4e61-e658-e3a8e8b44900", "9e4596f3-f27a-4d33-4e0a-794bfadf3600",
    "eafa4e3f-4ef0-4b19-0e4a-f5a23ed7f300", "14f9a7eb-1540-4a09-ef14-80fa77f15c00", "7566b550-4838-4d07-77ad-859ced8d1200",
    "f1c1cca7-91bf-4cc1-5afe-ccde5d04f300", "19cc2387-3139-46cb-3178-4ce4f8dcbf00", "8826ee5e-6c83-4a87-784b-8e090b9c8700",
    "e0dc79d9-87d0-435f-adc1-954da6d27000",
  ].map((id, i) =>
    p(
      "brands-and-campaign/hotel-pupp-2024",
      `Hotel Pupp ${i + 1}`,
      id,
      "top",
      i
    )
  ),
  ...[
    ["c136bb4c-b1f7-4a50-e8da-38b80910fc00", "25"], ["2f2f9811-e3a0-4562-8ed7-efeb265b1500", "23"],
    ["67e1379f-c257-475f-1a78-253a11a93a00", "22"], ["0191312e-5fa6-4851-05c1-4892abb97e00", "21"],
    ["0d2ad591-9d57-4ed8-ea44-d728f489a900", "20"], ["ded09576-89c8-4d94-770b-42ab3912b800", "19"],
    ["1f94e662-efb7-4b49-4868-bb511ffc6500", "18"], ["ea891179-a98e-447c-c09f-6dd0c38a5200", "16"],
    ["1eeafa70-2318-4bc6-eed7-134eae83e700", "15"], ["f42fe80d-eacb-481f-0c25-38586f3c7a00", "13"],
    ["51fafaa5-5408-4245-1d93-ea093d76e300", "12"], ["02040a24-6d16-4911-01fb-69023ed59600", "11"],
    ["9f8e4241-644c-4e2d-eb33-1234957ea300", "10"], ["c8f6475c-9150-4838-32c6-3ebeb7515400", "8"],
    ["e250c77f-48cf-44d6-959e-3f7461b56700", "7"], ["9148fa7a-8f23-434f-4a45-6e8f69f3ae00", "6"],
    ["5fa201aa-790d-4f29-bb5c-6711de6c6100", "5"], ["b5a567c4-9651-4385-793a-196222e7ee00", "3"],
    ["9a4f40d5-59c7-43c2-de9d-3f4c81c71a00", "4"], ["c136bb4c-b1f7-4a50-e8da-38b80910fc00", "2"],
  ].map(([id, num], i) =>
    p("fashion-shows/debbie-brown", `DEBBIE BROWN ${num}`, id, "top", i)
  ),
  ...[
    ["526afc0b-6cb7-4ee6-132b-8b4125946200", "1"], ["e832306c-a74b-478d-b4f3-73fba860b200", "52"],
    ["bf5faa8d-5f16-49e6-7c92-b5478fcb2e00", "75"], ["9e617bb5-62ed-4da2-11f1-330bb1d82b00", "114"],
    ["b14ee2ad-2fba-4754-bbf3-72fd1dd94f00", "117"], ["7242e299-6c20-40a9-967d-3432aae02300", "123"],
    ["d412a22c-c62e-42ef-1b6c-a113248cdb00", "163"], ["644d0478-0c13-4a8c-9e07-bb2b53b8f900", "180"],
    ["badcde70-dc76-46a5-1a6b-c8b5d2aa4c00", "199"], ["dabac763-bd00-4a6d-eb40-42a3e5504500", "201"],
    ["dabac763-bd00-4a6d-eb40-42a3e5504500", "205"], ["166d51e1-11c4-4ed6-6c57-bd0b739bc000", "208"],
    ["877043a8-5202-459a-e110-de567e91a100", "216"],
  ].map(([id, num], i) =>
    p(
      "fashion-shows/czech-fashion-week-marianske-lazne",
      `CFW Marianske Lazne ${num}`,
      id,
      "top",
      i
    )
  ),
  ...[
    "6bd5f04a-5de2-4104-10da-daf20cee9300", "3aea453e-90bd-479a-46a0-e2c916035300", "7b66d645-5332-41db-afea-c0fd24b22b00",
    "60680062-1cd1-4c05-1ef9-853475de1100", "ab564a41-78d8-4df4-a1ae-4ad12d3c7800", "ea92fd31-61ea-4207-d2a1-910ff0c94f00",
    "f6c47142-ccb0-49dd-bb45-44257a2d4a00",
  ].map((id, i) =>
    p(
      "fashion-and-editorials/still-in-style",
      `Still in Style ${String(i + 1).padStart(2, "0")}`,
      id,
      "top",
      i
    )
  ),
  ...[
    "72ceb85d-788a-416d-e52a-db5b22f17900", "0ed6883a-3978-46be-0773-97b50a45e800", "35c66228-6470-4221-cef9-bcb644e5a500",
    "87d11b5e-b6fb-4679-c739-452c99e42c00", "ad8a9ba4-6fe0-4262-3c37-31ee69fba400", "72cb6b04-4082-4ff6-8af5-2f51e51a4d00",
    "129987b9-8407-4a10-eb06-f5026336b200", "e0649c36-22cf-400a-7d1a-b79494a26b00", "65a6e4a5-f150-4896-6d22-205e2641fd00",
    "d11532a7-0b83-4b03-51ed-a45aaaf92300", "5a3040bc-b21c-43af-7182-ae5b9e0bb000", "b2d89ae9-8229-42e9-10af-87849d5a1200",
    "2c0ff312-acdb-4259-7160-cc54a4759c00", "8ae4539f-1916-45ba-e28b-5c8ed0e54a00", "a9691f73-0db9-49e8-2296-95cc95694200",
    "7fca7fd0-b63b-4fbf-42c8-3ab6bdf06900", "37d0d67c-4a3a-4346-b1fb-790a8e01cc00",
  ].map((id, i) =>
    p(
      "fashion-and-editorials/wide-shooting",
      `WIDE SHOOTING ${String(i + 1).padStart(2, "0")}`,
      id,
      "top",
      i
    )
  ),
  ...[
    "bf132444-3436-41c1-b11f-0b35e98b2500", "6e4feacc-0181-4ab2-72b6-b559be1f2c00", "1f7cd461-2d50-4684-9500-b438ac2a4200",
    "41486dd8-25d2-43b4-cac1-b0e4c8c07d00", "68cdb2a4-72eb-479b-f89a-1a4980f0ed00", "5fefadb3-5c3b-4379-ff48-f768cb600100",
    "7a627c4b-5b87-4cc0-0445-86ffb0936b00", "b04d55f6-f959-4026-4ae6-6b64731eb000", "29b99b41-b595-4d09-2782-d382f6d85600",
    "fbc210f5-a6df-447f-7a71-147b290c8800", "30cda42d-2aff-4a89-0b78-4a379d29d800",
  ].map((id, i) =>
    p("couples/mara-a-market", `Mara a Market ${String(i + 1).padStart(2, "0")}`, id, "top", i)
  ),
  ...[
    "0e326f64-ae5d-486f-5bd1-4a703196b400", "c1beb1f2-bee6-433d-b064-72ad31762d00", "73658a6f-2dae-44d8-fc59-3011e3f1be00",
    "b0c89a90-2f5c-47e2-6b7b-eb2ec7f6be00", "24fd4078-288b-4461-c3f1-3086762dc700", "f4c76a25-05f2-4114-6f5c-b3e171d5ef00",
    "85c489f7-6674-46ad-8152-737bb634c900", "26958ec2-f5f0-4071-b345-cccb89c6d100", "94aa7965-9871-4f2f-6f4a-1b8ffe68af00",
    "8644402e-ed7d-4938-2701-8be25d2ccd00", "302f0c15-eec3-4117-9d5b-34b80556fe00", "042d25fe-e7b5-42ed-175a-eb5b58982300",
    "3b88dfc9-08cb-47bb-b03b-0bd002878100", "45aa83c2-9ca3-47bb-6131-94af80dfbf00", "dac7c1c7-5a52-4ccf-6ecf-22119e072f00",
  ].map((id, i) =>
    p("couples/dasa-a-filip", `Dasa a Filip ${String(i + 1).padStart(2, "0")}`, id, "top", i)
  ),
  ...[
    ["3eef17ee-9681-4644-5fcd-1460f61bf900", "1"], ["3bab1222-816e-443d-536c-473f98263600", "2"],
    ["f5a152c9-df2e-4baa-6b41-2ed92b4a0500", "7"], ["56b9aef2-fe38-4241-3bde-2a768e99f300", "6"],
    ["0aaa1547-b726-4583-376a-ea7358f29300", "5"], ["5c7cc20d-6f0c-440d-0023-af8665a5c400", "4"],
    ["fabf1a57-47ec-45e6-977b-3c9589b72300", "3"],
  ].map(([id, num], i) =>
    p("brands-and-campaign/fine-furs", `Fine Furs ${num}`, id, "top", i)
  ),
  ...[
    "1b3c4bc1-6bfe-4244-77b0-be81c4185f00", "ef67c70d-38c8-477a-1e1a-e5bf26744e00", "62880405-5ff1-4d6e-a86d-8570c1863b00",
    "8c3e9e05-12ad-48ab-c3a0-e0efb3787c00", "159ff4bd-6b50-401f-5196-dca6f92dcc00", "398d7efc-e98b-49bb-b08b-2cda207b0100",
    "d015103c-8da0-4e03-f4df-0944f362ea00", "7c08ca2f-29f3-416f-a48f-2ddd86b81b00", "4c652be8-465b-47ab-b11b-a9422624d400",
    "c76999dc-8d63-4fce-f850-6a150ce8d500", "6664387b-e442-4a28-dc83-7452bbed0000", "825a73be-6cd3-4422-dd23-efb4a42a3b00",
    "2aedd0b1-6888-43ed-26e3-d20ac1243200", "bfc40693-e09d-4243-1c7b-d50c2e816b00", "3ca4e628-1651-4359-e003-1c859e60d500",
    "b5de0d58-31bc-4831-592d-8c6bb5c54e00", "923725de-98be-4b33-4edc-587fee50bf00", "8c6b22a7-9fae-424d-75b9-0da010ea0300",
    "ee8b4626-5875-4772-d2a5-74377e1a0700", "5cb403cf-65a0-4f94-b6a8-d9e68bb23200", "5ad8b6cd-6808-493b-4e2b-ec7e430f9c00",
  ].map((id, i) =>
    p("weddings", `Wedding ${i + 1}`, id, i === 0 ? "top30" : i === 1 ? "top15" : "top", i)
  ),
  ...[
    ["71a2dd68-df7a-494e-eb73-dbbafb7e3800", "New Portait 09"], ["770617be-5d4b-4fa0-2dbe-72a5da91c400", "New Portait 08"],
    ["8274b47b-1722-4bb7-95ec-32d23861d200", "New Portait 06"], ["d70a9f6b-cc76-44ab-ddc6-49eae892ca00", "New Portait 05"],
    ["70a28fef-d961-440b-c2cd-7b4b959c6700", "New Portait 04"], ["4fc44b1b-3b93-410b-4942-371ffb7f0300", "New Portait 03"],
    ["16f10ff3-5c79-4a1a-fb64-7a2932507400", "New Portait 02"], ["96348369-7303-4b6a-e18c-06d8a5149300", "New Portait 01"],
    ["935a93ce-f8d4-40a0-800f-511c81c6be00", "Port 10"], ["97d283e7-1e49-429c-c421-392c93ba3000", "Port 09"],
    ["59c2d30d-a6c3-47a1-ce94-3bbeb97c5b00", "Port 08"], ["bf11bc33-5287-43f2-b9da-83928d9e6f00", "Port 07"],
    ["6a22da20-388b-4a49-72f0-86d3720a1400", "Port 06"], ["efabe405-9681-4710-f0a8-83359d4e5900", "Port 05"],
    ["2aeaa7c0-fbd3-41ad-59bd-992ba40d5100", "Port 04"], ["cfbf4331-5921-44f4-9dce-610d5d2c3900", "Port 03"],
    ["a4b24e0f-c98a-4558-10a6-e7ccdc3a3e00", "Port 02"], ["a79c5e9b-db3e-4409-1fa3-ec9ffd654000", "Port 01"],
    ["d541f89a-a95a-40c4-bae6-aaa622ab2100", "Portrait 1"], ["946751b6-b367-4d03-e210-110b3ca53200", "Portrait 2"],
    ["069207ec-a54c-4de5-9d5c-1df29bbfd500", "Portrait 3"], ["b74fd435-1ad9-463f-12de-405fb29a6e00", "Portrait 4"],
    ["7606495c-a59a-48b0-05bc-dadd00d10a00", "Portrait 5"], ["4d753e76-c264-42f7-1394-c097bae94700", "Portrait 6"],
    ["31758c63-c86c-4cdb-a857-1ab37a0e3d00", "Portrait 7"], ["79882449-209d-4651-f384-cf67b0ffb100", "Portrait 8"],
    ["9682c2cf-bda1-4f8f-a30b-1765f7e9e700", "Portrait 9"], ["da6a911f-e6cf-421d-995f-23f0ca73ea00", "Portrait 10"],
  ].map(([id, name], i) => p("portraits", name, id, "top", i)),
  ...[
    "92f6f6c1-e85f-498d-e175-a0c71c6efd00", "98248836-86f0-4fbe-a9f1-84ce4e35df00", "cf5f8dc4-ed66-4970-fdf1-4ab686a96c00",
    "1e53840f-942c-4779-a7c7-d944ef8e6600", "b9456802-bc45-454e-76d1-bfa9068aa400", "41fc3e38-c116-4411-b231-a5fe01fd0000",
    "b36b4f37-ef0a-4a18-db1f-89888eaed600",
  ].map((id, i) =>
    p("visual-stories", `Visual story ${String(i + 1).padStart(2, "0")}`, id, "center", i)
  ),
];

async function insertAlbumsTree() {
  const insertedByPath = new Map<string, string>();
  const pending = [...albumsData];

  while (pending.length > 0) {
    const ready = pending.filter(
      (album) => album.parentPath === null || insertedByPath.has(album.parentPath)
    );

    if (ready.length === 0) {
      throw new Error("Could not resolve parent album paths during seed.");
    }

    const rows = ready.map((album) => ({
      name: album.name,
      slug: album.slug,
      path: album.path,
      parentId: album.parentPath ? insertedByPath.get(album.parentPath)! : null,
      coverCloudflareId: album.coverCloudflareId,
      objectPosition: album.objectPosition ?? "center",
      sortOrder: album.sortOrder ?? 0,
    }));

    const inserted = await db
      .insert(albums)
      .values(rows)
      .returning({ id: albums.id, path: albums.path });

    for (const row of inserted) {
      insertedByPath.set(row.path, row.id);
    }

    for (const album of ready) {
      const index = pending.findIndex((item) => item.path === album.path);
      if (index !== -1) pending.splice(index, 1);
    }
  }

  return insertedByPath;
}

const portfolioHighlightsData = [
  { cloudflareId: "c8f6475c-9150-4838-32c6-3ebeb7515400", sortOrder: 0 },
  { cloudflareId: "9682c2cf-bda1-4f8f-a30b-1765f7e9e700", sortOrder: 1 },
  { cloudflareId: "24fd4078-288b-4461-c3f1-3086762dc700", sortOrder: 2 },
  { cloudflareId: "3eef17ee-9681-4644-5fcd-1460f61bf900", sortOrder: 3 },
  { cloudflareId: "02040a24-6d16-4911-01fb-69023ed59600", sortOrder: 4 },
  { cloudflareId: "9b2e25e6-c475-4fee-d092-5a25d941a400", sortOrder: 5 },
];

async function seed() {
  try {
    await db.delete(portfolioHighlights);
    await db.delete(photos);
    await db.delete(albums);

    const albumIdByPath = await insertAlbumsTree();

    const insertedPhotos = await db
      .insert(photos)
      .values(
        photosData.map((photo) => {
          const albumId = albumIdByPath.get(photo.albumPath);
          if (!albumId) {
            throw new Error(`Album not found for photo: ${photo.albumPath}`);
          }
          return {
            albumId,
            name: photo.name,
            cloudflareId: photo.cloudflareId,
            objectPosition: photo.objectPosition ?? "center",
            visibility: photo.visibility ?? "public",
            sortOrder: photo.sortOrder ?? 0,
          };
        })
      )
      .returning({
        id: photos.id,
        cloudflareId: photos.cloudflareId,
      });

    const photoIdByCloudflareId = new Map(
      insertedPhotos.map((photo) => [photo.cloudflareId, photo.id])
    );

    await db.insert(portfolioHighlights).values(
      portfolioHighlightsData.map(({ cloudflareId, sortOrder }) => {
        const photoId = photoIdByCloudflareId.get(cloudflareId);

        if (!photoId) {
          throw new Error(
            `Portfolio highlight photo not found: ${cloudflareId}`
          );
        }

        return {
          photoId,
          sortOrder,
        };
      })
    );

    console.log("🎉 Seeding complete!");
  } finally {
    await pool.end();
  }
}

seed().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});
