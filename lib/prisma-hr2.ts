import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/client-hr2/client";

const connectionString = `${process.env.DATABASE_URL_HR2}`;

const adapter = new PrismaPg({ connectionString });
const prismaHr2 = new PrismaClient({ adapter });

export { prismaHr2 };