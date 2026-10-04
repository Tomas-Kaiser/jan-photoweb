import {
    pgTable,
    pgEnum,
    uuid,
    text,
    integer,
    boolean,
    timestamp,
    jsonb,
    uniqueIndex,
    index,
    foreignKey,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const photoVisibilityEnum = pgEnum("photo_visibility", [
    "public",
    "highlights_only",
]);

export const proofGalleryStatusEnum = pgEnum("proof_gallery_status", [
    "draft",
    "active",
    "submitted",
    "paid",
    "closed",
]);

export const proofOrderStatusEnum = pgEnum("proof_order_status", [
    "pending_payment",
    "paid",
]);

export const proofPhotoRatingEnum = pgEnum("proof_photo_rating", [
    "rather_no",
    "rather_yes",
]);

export const albums = pgTable(
    "albums",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        parentId: uuid("parent_id"),
        name: text("name").notNull(),
        slug: text("slug").notNull(),
        path: text("path").notNull(),
        coverCloudflareId: text("cover_cloudflare_id").notNull(),
        objectPosition: text("object_position").default("center").notNull(),
        sortOrder: integer("sort_order").default(0).notNull(),
        createdAt: timestamp("created_at").defaultNow().notNull(),
    },
    (table) => [
        foreignKey({
            columns: [table.parentId],
            foreignColumns: [table.id],
            name: "albums_parent_id_fkey",
        }).onDelete("cascade"),

        uniqueIndex("albums_path_unique").on(table.path),
        uniqueIndex("albums_parent_slug_unique").on(table.parentId, table.slug),
        index("albums_parent_id_idx").on(table.parentId),
        index("albums_sort_order_idx").on(table.sortOrder),
        index("albums_parent_sort_order_idx").on(table.parentId, table.sortOrder),
    ]
);

export const photos = pgTable(
    "photos",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        albumId: uuid("album_id").notNull(),
        name: text("name"),
        cloudflareId: text("cloudflare_id").notNull(),
        objectPosition: text("object_position").default("center").notNull(),
        visibility: photoVisibilityEnum("visibility").default("public").notNull(),
        sortOrder: integer("sort_order").default(0).notNull(),
        createdAt: timestamp("created_at").defaultNow().notNull(),
    },
    (table) => [
        foreignKey({
            columns: [table.albumId],
            foreignColumns: [albums.id],
            name: "photos_album_id_fkey",
        }).onDelete("cascade"),

        index("photos_album_id_idx").on(table.albumId),
        index("photos_sort_order_idx").on(table.sortOrder),
        index("photos_visibility_idx").on(table.visibility),
        index("photos_album_sort_order_idx").on(table.albumId, table.sortOrder),
    ]
);

export const portfolioHighlights = pgTable(
    "portfolio_highlights",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        photoId: uuid("photo_id").notNull(),
        sortOrder: integer("sort_order").default(0).notNull(),
        createdAt: timestamp("created_at").defaultNow().notNull(),
    },
    (table) => [
        foreignKey({
            columns: [table.photoId],
            foreignColumns: [photos.id],
            name: "portfolio_highlights_photo_id_fkey",
        }).onDelete("cascade"),

        uniqueIndex("portfolio_highlights_photo_id_unique").on(table.photoId),
        index("portfolio_highlights_sort_order_idx").on(table.sortOrder),
    ]
);

export const proofGalleries = pgTable(
    "proof_galleries",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        token: text("token").notNull(),
        clientName: text("client_name").notNull(),
        baseCostCents: integer("base_cost_cents").default(0).notNull(),
        freePhotoCount: integer("free_photo_count").default(10).notNull(),
        extraPhotoPriceCents: integer("extra_photo_price_cents")
            .default(0)
            .notNull(),
        currency: text("currency").default("CZK").notNull(),
        status: proofGalleryStatusEnum("status").default("draft").notNull(),
        message: text("message"),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        expiresAt: timestamp("expires_at"),
        finalsPublishedAt: timestamp("finals_published_at"),
    },
    (table) => [uniqueIndex("proof_galleries_token_unique").on(table.token)]
);

export const proofPhotos = pgTable(
    "proof_photos",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        galleryId: uuid("gallery_id").notNull(),
        cloudflareId: text("cloudflare_id").notNull(),
        fileName: text("file_name").notNull(),
        sortOrder: integer("sort_order").default(0).notNull(),
        selected: boolean("selected").default(false).notNull(),
        selectedAt: timestamp("selected_at"),
        rating: proofPhotoRatingEnum("rating"),
        comment: text("comment"),
        createdAt: timestamp("created_at").defaultNow().notNull(),
    },
    (table) => [
        foreignKey({
            columns: [table.galleryId],
            foreignColumns: [proofGalleries.id],
            name: "proof_photos_gallery_id_fkey",
        }).onDelete("cascade"),

        index("proof_photos_gallery_id_idx").on(table.galleryId),
        index("proof_photos_gallery_sort_order_idx").on(
            table.galleryId,
            table.sortOrder
        ),
    ]
);

export const proofOrders = pgTable(
    "proof_orders",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        galleryId: uuid("gallery_id").notNull(),
        selectedPhotoIds: jsonb("selected_photo_ids").notNull().$type<string[]>(),
        includedCount: integer("included_count").notNull(),
        extraCount: integer("extra_count").notNull(),
        totalCents: integer("total_cents").notNull(),
        status: proofOrderStatusEnum("status").default("pending_payment").notNull(),
        submittedAt: timestamp("submitted_at").defaultNow().notNull(),
        confirmedAt: timestamp("confirmed_at"),
    },
    (table) => [
        foreignKey({
            columns: [table.galleryId],
            foreignColumns: [proofGalleries.id],
            name: "proof_orders_gallery_id_fkey",
        }).onDelete("cascade"),

        uniqueIndex("proof_orders_gallery_id_unique").on(table.galleryId),
    ]
);

export const finalPhotos = pgTable(
    "final_photos",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        galleryId: uuid("gallery_id").notNull(),
        r2Key: text("r2_key").notNull(),
        fileName: text("file_name").notNull(),
        sizeBytes: integer("size_bytes").notNull(),
        previewCloudflareId: text("preview_cloudflare_id").notNull(),
        // Original pixel dimensions, captured client-side at upload time —
        // used to compute the justified-gallery layout (aspect ratio per
        // photo), not available from Cloudflare Images itself. Nullable so
        // finals uploaded before this existed don't need a backfill.
        width: integer("width"),
        height: integer("height"),
        sortOrder: integer("sort_order").default(0).notNull(),
        createdAt: timestamp("created_at").defaultNow().notNull(),
    },
    (table) => [
        foreignKey({
            columns: [table.galleryId],
            foreignColumns: [proofGalleries.id],
            name: "final_photos_gallery_id_fkey",
        }).onDelete("cascade"),

        index("final_photos_gallery_id_idx").on(table.galleryId),
        index("final_photos_gallery_sort_order_idx").on(
            table.galleryId,
            table.sortOrder
        ),
    ]
);

export const albumsRelations = relations(albums, ({ one, many }) => ({
    parent: one(albums, {
        fields: [albums.parentId],
        references: [albums.id],
        relationName: "album_children",
    }),
    children: many(albums, {
        relationName: "album_children",
    }),
    photos: many(photos),
}));

export const photosRelations = relations(photos, ({ one, many }) => ({
    album: one(albums, {
        fields: [photos.albumId],
        references: [albums.id],
    }),
    portfolioHighlights: many(portfolioHighlights),
}));

export const portfolioHighlightsRelations = relations(
    portfolioHighlights,
    ({ one }) => ({
        photo: one(photos, {
            fields: [portfolioHighlights.photoId],
            references: [photos.id],
        }),
    })
);

export const proofGalleriesRelations = relations(
    proofGalleries,
    ({ many, one }) => ({
        photos: many(proofPhotos),
        order: one(proofOrders, {
            fields: [proofGalleries.id],
            references: [proofOrders.galleryId],
        }),
        finalPhotos: many(finalPhotos),
    })
);

export const finalPhotosRelations = relations(finalPhotos, ({ one }) => ({
    gallery: one(proofGalleries, {
        fields: [finalPhotos.galleryId],
        references: [proofGalleries.id],
    }),
}));

export const proofPhotosRelations = relations(proofPhotos, ({ one }) => ({
    gallery: one(proofGalleries, {
        fields: [proofPhotos.galleryId],
        references: [proofGalleries.id],
    }),
}));

export const proofOrdersRelations = relations(proofOrders, ({ one }) => ({
    gallery: one(proofGalleries, {
        fields: [proofOrders.galleryId],
        references: [proofGalleries.id],
    }),
}));