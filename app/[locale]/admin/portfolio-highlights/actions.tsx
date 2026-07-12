"use server";

import { revalidatePath } from "next/cache";
import { asc, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/app/db";
import { portfolioHighlights } from "@/app/db/schema";

async function requireAdmin() {
    const session = await auth();
    const isAdmin =
        !!session?.user &&
        (session.user as { role?: string }).role === "admin";

    if (!isAdmin) {
        throw new Error("Unauthorized");
    }
}

async function normalizeSortOrder() {
    const rows = await db
        .select({
            id: portfolioHighlights.id,
        })
        .from(portfolioHighlights)
        .orderBy(asc(portfolioHighlights.sortOrder), asc(portfolioHighlights.createdAt));

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

    revalidatePath("/admin/portfolio-highlights");
    revalidatePath("/");
}

export async function deletePortfolioHighlight(highlightId: string) {
    await requireAdmin();

    await db
        .delete(portfolioHighlights)
        .where(eq(portfolioHighlights.id, highlightId));

    await normalizeSortOrder();

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
        .orderBy(asc(portfolioHighlights.sortOrder), asc(portfolioHighlights.createdAt));

    const index = rows.findIndex((row) => row.id === highlightId);
    if (index <= 0) return;

    const reordered = [...rows];
    [reordered[index - 1], reordered[index]] = [reordered[index], reordered[index - 1]];

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
        .orderBy(asc(portfolioHighlights.sortOrder), asc(portfolioHighlights.createdAt));

    const index = rows.findIndex((row) => row.id === highlightId);
    if (index === -1 || index >= rows.length - 1) return;

    const reordered = [...rows];
    [reordered[index], reordered[index + 1]] = [reordered[index + 1], reordered[index]];

    for (const [sortOrder, row] of reordered.entries()) {
        await db
            .update(portfolioHighlights)
            .set({ sortOrder })
            .where(eq(portfolioHighlights.id, row.id));
    }

    revalidatePath("/admin/portfolio-highlights");
    revalidatePath("/");
}