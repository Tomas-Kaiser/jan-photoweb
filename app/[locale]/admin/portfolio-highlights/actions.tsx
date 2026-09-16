"use server";

import { revalidatePath } from "next/cache";
import { asc, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/app/db";
import { photos, portfolioHighlights } from "@/app/db/schema";
import { getOrCreateHighlightsAlbumId } from "@/app/lib/highlights-album";
import { deleteCloudflareImage } from "@/app/lib/cloudflare-images";

async function requireAdmin() {
  const session = await auth();
  const isAdmin =
    !!session?.user && (session.user as { role?: string }).role === "admin";

  if (!isAdmin) {
    throw new Error("Unauthorized");
  }
}

async function insertHighlightPointer(photoId: string) {
  const rows = await db
    .select({
      id: portfolioHighlights.id,
      sortOrder: portfolioHighlights.sortOrder,
    })
    .from(portfolioHighlights)
    .orderBy(asc(portfolioHighlights.sortOrder));

  const nextSortOrder = rows.length;

  await db.insert(portfolioHighlights).values({
    photoId,
    sortOrder: nextSortOrder,
  });
}

async function normalizeSortOrder() {
  const rows = await db
    .select({
      id: portfolioHighlights.id,
    })
    .from(portfolioHighlights)
    .orderBy(
      asc(portfolioHighlights.sortOrder),
      asc(portfolioHighlights.createdAt),
    );

  for (const [index, row] of rows.entries()) {
    await db
      .update(portfolioHighlights)
      .set({ sortOrder: index })
      .where(eq(portfolioHighlights.id, row.id));
  }
}

export async function addPortfolioHighlight(photoId: string) {
  await requireAdmin();

  const existing = await db
    .select({ id: portfolioHighlights.id })
    .from(portfolioHighlights)
    .where(eq(portfolioHighlights.photoId, photoId));

  if (existing.length > 0) {
    return;
  }

  await insertHighlightPointer(photoId);

  revalidatePath("/admin/portfolio-highlights");
  revalidatePath("/");
}

// Uploads a brand-new photo file straight into highlights, with no visible
// album of its own — it's stored in a reserved, hidden album (created lazily
// on first use) and tagged `highlights_only` so it never appears in any
// album's own photo grid, only in the homepage highlights carousel.
export async function uploadPhotoToHighlights(
  cloudflareId: string,
  name: string,
) {
  await requireAdmin();

  const albumId = await getOrCreateHighlightsAlbumId(cloudflareId);

  const [insertedPhoto] = await db
    .insert(photos)
    .values({
      albumId,
      name: name || null,
      cloudflareId,
      objectPosition: "center",
      visibility: "highlights_only",
      sortOrder: -1,
    })
    .returning({ id: photos.id });

  await insertHighlightPointer(insertedPhoto.id);

  revalidatePath("/admin/portfolio-highlights");
  revalidatePath("/");
}

export async function deletePortfolioHighlight(highlightId: string) {
  await requireAdmin();

  const [highlight] = await db
    .select({
      photoId: portfolioHighlights.photoId,
    })
    .from(portfolioHighlights)
    .where(eq(portfolioHighlights.id, highlightId))
    .limit(1);

  await db
    .delete(portfolioHighlights)
    .where(eq(portfolioHighlights.id, highlightId));

  await normalizeSortOrder();

  // A highlights_only photo has no life outside this list — once its
  // highlight is removed it would otherwise sit forever as orphaned data
  // (and an orphaned Cloudflare image), so delete it along with the
  // pointer instead of leaving it behind.
  if (highlight) {
    const [photo] = await db
      .select({
        id: photos.id,
        cloudflareId: photos.cloudflareId,
        visibility: photos.visibility,
      })
      .from(photos)
      .where(eq(photos.id, highlight.photoId))
      .limit(1);

    if (photo && photo.visibility === "highlights_only") {
      if (photo.cloudflareId) {
        await deleteCloudflareImage(photo.cloudflareId).catch((error) => {
          console.error(
            "Failed to delete highlight image from Cloudflare:",
            error,
          );
        });
      }

      await db.delete(photos).where(eq(photos.id, photo.id));
    }
  }

  revalidatePath("/admin/portfolio-highlights");
  revalidatePath("/");
}

export async function movePortfolioHighlightLeft(highlightId: string) {
  await requireAdmin();

  const rows = await db
    .select({
      id: portfolioHighlights.id,
      photoId: portfolioHighlights.photoId,
      sortOrder: portfolioHighlights.sortOrder,
      createdAt: portfolioHighlights.createdAt,
    })
    .from(portfolioHighlights)
    .orderBy(
      asc(portfolioHighlights.sortOrder),
      asc(portfolioHighlights.createdAt),
    );

  const index = rows.findIndex((row) => row.id === highlightId);
  if (index <= 0) return;

  const reordered = [...rows];
  [reordered[index - 1], reordered[index]] = [
    reordered[index],
    reordered[index - 1],
  ];

  for (const [sortOrder, row] of reordered.entries()) {
    await db
      .update(portfolioHighlights)
      .set({ sortOrder })
      .where(eq(portfolioHighlights.id, row.id));
  }

  revalidatePath("/admin/portfolio-highlights");
  revalidatePath("/");
}

export async function movePortfolioHighlightRight(highlightId: string) {
  await requireAdmin();

  const rows = await db
    .select({
      id: portfolioHighlights.id,
      photoId: portfolioHighlights.photoId,
      sortOrder: portfolioHighlights.sortOrder,
      createdAt: portfolioHighlights.createdAt,
    })
    .from(portfolioHighlights)
    .orderBy(
      asc(portfolioHighlights.sortOrder),
      asc(portfolioHighlights.createdAt),
    );

  const index = rows.findIndex((row) => row.id === highlightId);
  if (index === -1 || index >= rows.length - 1) return;

  const reordered = [...rows];
  [reordered[index], reordered[index + 1]] = [
    reordered[index + 1],
    reordered[index],
  ];

  for (const [sortOrder, row] of reordered.entries()) {
    await db
      .update(portfolioHighlights)
      .set({ sortOrder })
      .where(eq(portfolioHighlights.id, row.id));
  }

  revalidatePath("/admin/portfolio-highlights");
  revalidatePath("/");
}
