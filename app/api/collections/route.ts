import { NextResponse } from "next/server";
import { getCollectionsData } from "@/lib/collections";
import { prismaCore3 } from "@/lib/prisma-core3";
import { prismaCore1 } from "@/lib/prisma-core1";

export async function GET() {
  try {
    const data = await getCollectionsData();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching collections:", error);
    return NextResponse.json(
      { error: "Failed to fetch collections data" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { invoiceId, amount, paymentMethod, reference, notes, clientId } = body;

    if (!invoiceId || !amount || !paymentMethod) {
      return NextResponse.json(
        { error: "Missing required fields: invoiceId, amount, paymentMethod" },
        { status: 400 }
      );
    }

    // Get client's bank account number if payment method is BANK_TRANSFER
    let bankAccountInfo: { bankAccountNumber: string; clientName: string } | null = null;
    if (paymentMethod === "BANK_TRANSFER" && clientId) {
      const client = await prismaCore1.client.findUnique({
        where: { id: parseInt(clientId) },
        select: { bankAccountNumber: true, company: true, firstName: true, lastName: true },
      });
      if (client?.bankAccountNumber) {
        bankAccountInfo = {
          bankAccountNumber: client.bankAccountNumber,
          clientName: client.company || `${client.firstName} ${client.lastName}`,
        };
      }
    }

    // Create the payment
    const payment = await prismaCore3.payment.create({
      data: {
        invoiceId: parseInt(invoiceId),
        amount: amount,
        paymentMethod: paymentMethod,
        reference: reference || null,
        notes: notes || (bankAccountInfo ? `Bank Transfer to: ${bankAccountInfo.clientName} - Account: ${bankAccountInfo.bankAccountNumber}` : null),
      },
    });

    // Update invoice status based on payments
    const invoice = await prismaCore3.invoice.findUnique({
      where: { id: parseInt(invoiceId) },
      include: { Payment: true },
    });

    if (invoice) {
      const totalPaid = invoice.Payment.reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0);
      const totalAmount = parseFloat(invoice.totalAmount.toString());

      let newStatus = invoice.status;
      if (totalPaid >= totalAmount) {
        newStatus = "PAID";
        await prismaCore3.invoice.update({
          where: { id: parseInt(invoiceId) },
          data: { status: "PAID", paidAt: new Date() },
        });
      } else if (totalPaid > 0) {
        newStatus = "PARTIALLY_PAID";
        await prismaCore3.invoice.update({
          where: { id: parseInt(invoiceId) },
          data: { status: "PARTIALLY_PAID" },
        });
      }
    }

    return NextResponse.json({ success: true, payment, bankAccountInfo });
  } catch (error) {
    console.error("Error recording payment:", error);
    return NextResponse.json(
      { error: "Failed to record payment" },
      { status: 500 }
    );
  }
}
