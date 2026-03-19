import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/client-core1/client";

const connectionString = `${process.env.DATABASE_URL_CORE1}`;

const adapter = new PrismaPg({ connectionString });
const prismaCore1 = new PrismaClient({ adapter });

export { prismaCore1 };