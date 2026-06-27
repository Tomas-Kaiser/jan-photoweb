import "dotenv/config"
import * as dotenv from "dotenv"
import { defineConfig } from "drizzle-kit"

dotenv.config({ path: ".env.local" })

export default defineConfig({
    schema: "./app/db/schema.ts",
    out: "./drizzle",
    dialect: "postgresql",
    dbCredentials: {
        url: process.env.DATABASE_URL!,
    },
})