import { pgTable, uuid, text, integer, timestamp } from 'drizzle-orm/pg-core'

// Cover image shown on the category listing page
export const albums = pgTable('albums', {
    id: uuid('id').primaryKey().defaultRandom(),
    brand: text('brand'),                // e.g. "Janine Made by Love" (optional)
    name: text('name').notNull(),       // e.g. "Vanguard Collection 2025"
    category: text('category').notNull(),   // e.g. "brands-and-campaign"
    slug: text('slug').notNull().unique(),
    coverUrl: text('cover_url').notNull(),
    link: text('link'),
    objectPosition: text('object_position').notNull().default('center'),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at').defaultNow(),
})

// Individual photos inside an album
export const photos = pgTable('photos', {
    id: uuid('id').primaryKey().defaultRandom(),
    albumSlug: text('album_slug').notNull(),            // e.g. "vanguard-collection-2025"
    name: text('name'),
    cloudflareUrl: text('cloudflare_url').notNull(),
    cloudflareId: text('cloudflare_id'),
    objectPosition: text('object_position').notNull().default('center'),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at').defaultNow(),
})