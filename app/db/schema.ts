import {
    pgTable,
    uuid,
    text,
    integer,
    timestamp,
    uniqueIndex,
    index,
    foreignKey,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const albums = pgTable(
    "albums",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        parentId: uuid("parent_id"),
        name: text("name").notNull(),
        slug: text("slug").notNull(),
        path: text("path").notNull(),
        coverUrl: text("cover_url").notNull(),
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
    ]
);

export const photos = pgTable(
    "photos",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        albumId: uuid("album_id").notNull(),
        name: text("name"),
        cloudflareUrl: text("cloudflare_url").notNull(),
        cloudflareId: text("cloudflare_id"),
        objectPosition: text("object_position").default("center").notNull(),
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

export const photosRelations = relations(photos, ({ one }) => ({
    album: one(albums, {
        fields: [photos.albumId],
        references: [albums.id],
    }),
}));