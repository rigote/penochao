import { NextRequest, NextResponse } from "next/server";
import { extractBankStatementData, type ExtractedBankStatementData } from "@/lib/gemini";
import { extractText } from "unpdf";
import { getServerSession } from "next-auth";
import { db } from "@/db";
import { aiUsageLogs } from "@/db/schema/ai-logs";
import { invoices } from "@/db/schema/finance";
import { couponRedemptions } from "@/db/schema/coupons";
import { sql, gte, and, lt, eq, count, desc } from "drizzle-orm";
import { encryptJSON } from "@/lib/encryption";
import { resolveEffectiveUserPlan } from "@/lib/subscription";

// Budget configuration
const MONTHLY_BUDGET_BRL = 20.00;
// Estimated costs for Gemini 2.5 Flash Lite (Approx. + IOF/Spread safety margin)
const COST_PER_MILLION_INPUT = 0.90; // ~$0.10 USD + margin -> R$ 0.90 (Conservative)
const COST_PER_MILLION_OUTPUT = 3.00; // ~$0.40 USD + margin -> R$ 3.00 (Conservative)

// Helper to parse PDF using unpdf
const parsePdf = async (buffer: Buffer) => {
  // unpdf requires Uint8Array, not Buffer
  const uint8Array = new Uint8Array(buffer);
  const result = await extractText(uint8Array);

  // unpdf returns { totalPages, text } where text is array of strings (one per page)
  if (result && result.text && Array.isArray(result.text)) {
    return result.text.join('\n\n'); // Join pages with double newline
  }

  return '';
};

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }

    // Get user from database
    const foundUser = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.email, session.user!.email!),
    });

    if (!foundUser) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 401 }
      );
    }

    const user = await resolveEffectiveUserPlan(foundUser);

    if (user.plan !== "pro") {
      return NextResponse.json(
        { error: "O processamento de faturas com IA está disponível apenas no plano Pro." },
        { status: 403 }
      );
    }

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const endOfMonth = new Date(startOfMonth);
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);

    const [usage] = await db
      .select({ count: count() })
      .from(invoices)
      .where(
        and(
          eq(invoices.userId, user.id),
          gte(invoices.createdAt, startOfMonth),
          lt(invoices.createdAt, endOfMonth)
        )
      );

    if (user.plan === "pro") {
      // Check if user has an active courtesy redemption with invoice limit
      const activeCourtesy = await db.query.couponRedemptions.findFirst({
        where: and(
          eq(couponRedemptions.userId, user.id),
          gte(couponRedemptions.courtesyExpiresAt, new Date())
        ),
        orderBy: [desc(couponRedemptions.redeemedAt)],
      });

      if (activeCourtesy?.invoiceLimit) {
        if (usage.count >= activeCourtesy.invoiceLimit) {
          return NextResponse.json(
            { error: `Limite de ${activeCourtesy.invoiceLimit} faturas mensais atingido para seu cupom de cortesia.` },
            { status: 429 }
          );
        }
      }
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    const allowedMimeTypes = ["application/pdf", "image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (!allowedMimeTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Apenas arquivos PDF e Imagens (JPEG, PNG, WEBP) são suportados." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let bankStatementData;
    let inputTokensEstimate = 0;
    const isImage = file.type.startsWith("image/");

    if (isImage) {
      // For images, pass buffer directly to extractBankStatementData
      bankStatementData = await extractBankStatementData({
        buffer,
        mimeType: file.type
      });
      // Gemini 2.5 Flash Lite image input is billed at ~258 tokens per image
      inputTokensEstimate = 300;
    } else {
      // Extract text from PDF
      let text = "";
      try {
        const pages = await parsePdf(buffer);
        text = Array.isArray(pages) ? pages.join('\n') : String(pages);
      } catch (e) {
        console.error("PDF Parsing logic failed:", e);
        return NextResponse.json({ error: "Failed to read PDF file content" }, { status: 422 });
      }

      if (!text || text.trim().length === 0) {
        return NextResponse.json(
          { error: "Não foi possível extrair o texto do PDF. O PDF pode ser composto apenas por imagens desprotegidas." },
          { status: 422 }
        );
      }

      inputTokensEstimate = Math.ceil(text.length / 4);
      bankStatementData = await extractBankStatementData(text);
    }

    // CHECK BUDGET
    const [usageStats] = await db
      .select({ totalCost: sql<string>`COALESCE(SUM(${aiUsageLogs.costBrl}), 0)` })
      .from(aiUsageLogs)
      .where(gte(aiUsageLogs.createdAt, startOfMonth));

    const currentCost = parseFloat(usageStats.totalCost);

    if (currentCost >= MONTHLY_BUDGET_BRL) {
      console.warn(`Monthly AI Budget Exceeded: R$ ${currentCost.toFixed(2)} / R$ ${MONTHLY_BUDGET_BRL.toFixed(2)}`);
      return NextResponse.json(
        { error: "Sistema de IA em manutenção temporária (Cota Atingida). Tente novamente mês que vem." },
        { status: 429 }
      );
    }

    // Log Usage
    const outputTokensEstimate = JSON.stringify(bankStatementData).length / 4;
    const inputCost = (inputTokensEstimate / 1_000_000) * COST_PER_MILLION_INPUT;
    const outputCost = (outputTokensEstimate / 1_000_000) * COST_PER_MILLION_OUTPUT;
    const totalCost = inputCost + outputCost;

    await db.insert(aiUsageLogs).values({
      id: crypto.randomUUID(),
      userId: user.id,
      model: "gemini-2.5-flash-lite",
      inputType: isImage ? "image_invoice" : "pdf_invoice",
      inputTokens: Math.ceil(inputTokensEstimate),
      outputTokens: Math.ceil(outputTokensEstimate),
      costBrl: (totalCost).toFixed(6),
    });

    // For backward compatibility, if there's only one transaction, return it in the old format
    // Otherwise, return the full bank statement data
    if (bankStatementData.transactions.length === 1) {
      const singleTransaction = bankStatementData.transactions[0];
      
      // Register invoice to track usage for free plan limit
      await db.insert(invoices).values({
        userId: user.id,
        fileName: file.name,
        fileUrl: "", // Not storing file, just tracking usage
        extractedData: encryptJSON(singleTransaction),
        status: "processed",
        processedAt: new Date(),
      });

      return NextResponse.json({ data: singleTransaction });
    } else {
      // Multiple transactions - return the full bank statement data
      // Note: We're not creating individual invoice records here to avoid hitting limits
      // The frontend will handle creating multiple invoices
      return NextResponse.json({ 
        data: bankStatementData,
        isBankStatement: true,
        transactionCount: bankStatementData.transactions.length
      });
    }
  } catch (error) {
    console.error("Error processing invoice:", error);
    return NextResponse.json(
      { error: "Failed to process invoice" },
      { status: 500 }
    );
  }
}
