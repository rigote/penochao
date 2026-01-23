import { NextRequest, NextResponse } from "next/server";
import { extractInvoiceData } from "@/lib/gemini";
import { extractText } from "unpdf";
import { getServerSession } from "next-auth";
import { db } from "@/db";
import { aiUsageLogs } from "@/db/schema/ai-logs";
import { invoices } from "@/db/schema/finance";
import { sql, gte, and, lt, eq, count } from "drizzle-orm";

// Budget configuration
const MONTHLY_BUDGET_BRL = 20.00;
// Estimated costs for Gemini 2.5 Flash Lite (Approx. + IOF/Spread safety margin)
const COST_PER_MILLION_INPUT = 0.90; // ~$0.10 USD + margin -> R$ 0.90 (Conservative)
const COST_PER_MILLION_OUTPUT = 3.00; // ~$0.40 USD + margin -> R$ 3.00 (Conservative)

// Free plan limit
const FREE_PLAN_MONTHLY_LIMIT = 3;

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
    const user = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.email, session.user!.email!),
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 401 }
      );
    }

    // Check free plan limit
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const endOfMonth = new Date(startOfMonth);
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);

    if (user.plan === "free") {
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

      if (usage.count >= FREE_PLAN_MONTHLY_LIMIT) {
        return NextResponse.json(
          { error: `Limite de ${FREE_PLAN_MONTHLY_LIMIT} faturas mensais atingido. Faça upgrade para o plano Pro.` },
          { status: 429 }
        );
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

    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "Only PDF files are supported" },
        { status: 400 }
      );
    }

    // Convert file to Buffer for pdf-parse
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

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
        { error: "Could not extract text from PDF. It might be an image-only PDF." },
        { status: 422 }
      );
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

    // Process with Gemini
    const inputTokensEstimate = Math.ceil(text.length / 4);
    const data = await extractInvoiceData(text);

    // Log Usage
    const outputTokensEstimate = JSON.stringify(data).length / 4;
    const inputCost = (inputTokensEstimate / 1_000_000) * COST_PER_MILLION_INPUT;
    const outputCost = (outputTokensEstimate / 1_000_000) * COST_PER_MILLION_OUTPUT;
    const totalCost = inputCost + outputCost;

    await db.insert(aiUsageLogs).values({
      id: crypto.randomUUID(),
      userId: user.id,
      model: "gemini-2.5-flash-lite",
      inputType: "pdf_invoice",
      inputTokens: Math.ceil(inputTokensEstimate),
      outputTokens: Math.ceil(outputTokensEstimate),
      costBrl: (totalCost).toFixed(6),
    });

    // Register invoice to track usage for free plan limit
    await db.insert(invoices).values({
      userId: user.id,
      fileName: file.name,
      fileUrl: "", // Not storing file, just tracking usage
      extractedData: data,
      status: "processed",
      processedAt: new Date(),
    });

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Error processing invoice:", error);
    return NextResponse.json(
      { error: "Failed to process invoice" },
      { status: 500 }
    );
  }
}
