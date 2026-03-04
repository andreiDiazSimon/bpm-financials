import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const receiptNumber = searchParams.get("receiptNumber");
  const clientId = searchParams.get("clientId");

  try {
    if (receiptNumber) {
      // Get specific receipt
      const receipt = await prisma.$queryRaw`
        SELECT 
          r.*,
          c.name as "clientName",
          c.email as "clientEmail",
          i."invoiceNumber",
          i."totalAmount" as "invoiceTotal",
          i."projectName"
        FROM "financials"."Receipt" r
        LEFT JOIN "core3"."Client" c ON r."clientId" = c.id
        LEFT JOIN "core3"."Invoice" i ON r."invoiceId" = i.id
        WHERE r."receiptNumber" = ${receiptNumber}
      `;

      if (!receipt || (receipt as any[]).length === 0) {
        return NextResponse.json({ error: "Receipt not found" }, { status: 404 });
      }

      return NextResponse.json((receipt as any[])[0]);
    }

    // Get all receipts with filters
    let query = `
      SELECT 
        r.*,
        c.name as "clientName",
        i."invoiceNumber"
      FROM "financials"."Receipt" r
      LEFT JOIN "core3"."Client" c ON r."clientId" = c.id
      LEFT JOIN "core3"."Invoice" i ON r."invoiceId" = i.id
      WHERE 1=1
    `;

    const params: any[] = [];

    if (clientId) {
      query += ` AND r."clientId" = $${params.length + 1}`;
      params.push(parseInt(clientId));
    }

    query += ` ORDER BY r."createdAt" DESC`;

    const receipts = params.length > 0 
      ? await prisma.$queryRawUnsafe(query, ...params)
      : await prisma.$queryRawUnsafe(query);

    return NextResponse.json(receipts);
  } catch (error) {
    console.error("Error fetching receipts:", error);
    return NextResponse.json(
      { error: "Failed to fetch receipts" },
      { status: 500 }
    );
  }
}
