import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const connectionString = process.env.NETLIFY_DATABASE_URL;

if (!connectionString) {
    throw new Error("NETLIFY_DATABASE_URL is not set");
}

const adapter = new PrismaPg(
    new Pool({
        connectionString,
    }),
);

declare global {
    var prisma: PrismaClient | undefined;
}

const prismaClient = globalThis.prisma || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
    globalThis.prisma = prismaClient;
}

export const prisma = prismaClient;
