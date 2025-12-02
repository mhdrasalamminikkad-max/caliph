import { defineConfig } from "drizzle-kit";

// Use a default dummy URL for development with in-memory storage
const databaseUrl = process.env.DATABASE_URL || "postgresql://localhost:5432/dummy";

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl,
  },
});
