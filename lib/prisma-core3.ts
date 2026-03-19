import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/client-core3/client";

const connectionString = `${process.env.DATABASE_URL_CORE3}`;

const adapter = new PrismaPg({ connectionString });
const prismaCore3 = new PrismaClient({ adapter });

export { prismaCore3 };