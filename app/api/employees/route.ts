import { NextRequest, NextResponse } from "next/server";
import { prismaHr2 } from "@/lib/prisma-hr2";

export async function GET(request: NextRequest) {
  try {
    const employees = await prismaHr2.employees.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        department: true,
        jobTitle: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(employees);
  } catch (error) {
    console.error("Error fetching employees:", error);
    return NextResponse.json(
      { error: "Failed to fetch employees" },
      { status: 500 }
    );
  }
}
