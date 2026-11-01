import * as dotenv from "dotenv"
dotenv.config({ path: ".env.local" })

import { drizzle } from "drizzle-orm/node-postgres"
import { Pool } from "pg"
import * as schema from "./schema"

const pool = new Pool({
    connectionString: process.env.DATABASE_URL!,
    // Fail a request rather than hang it if the database can't be reached.
    connectionTimeoutMillis: 10_000,
})

// Neon closes idle connections when its compute suspends. pg reports that
// here, and without a listener the error would crash the process; the pool
// drops the dead client and connects a new one when next needed.
pool.on("error", (error) => {
    console.error("Idle database connection lost:", error.message)
})

export const db = drizzle(pool, { schema })