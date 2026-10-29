import { asc } from "drizzle-orm";
import { finalPhotos } from "@/app/db/schema";

// The one order final photos are listed in — the admin's finals section,
// the client's finals gallery and the "download all" zip all use it, so the
// photographer sees exactly what the client sees.
export const finalPhotoOrder = [
  asc(finalPhotos.sortOrder),
  asc(finalPhotos.createdAt),
] as const;
