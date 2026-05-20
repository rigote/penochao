import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/db";
import { expenses, incomes, categories } from "@/db/schema/finance";
import { eq, and, gte, lte } from "drizzle-orm";
import { decrypt, decryptNumber } from "@/lib/encryption";
import { startOfMonth, endOfMonth, format } from "date-fns";
import { resolveEffectiveUserPlan } from "@/lib/subscription";
import { GoogleGenerativeAI } from "@google/generative-ai";

if (!process.env.GOOGLE_GEMINI_API_KEY) {
  throw new Error("Missing GOOGLE_GEMINI_API_KEY environment variable");
}

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY);

type ChatMessage = {
  role: "user" | "model";
  content: string;
};

function normalizeGeminiHistory(messages: ChatMessage[], displayName: string) {
  const normalized = messages
    .filter((msg) => msg.role === "user" || msg.role === "model")
    .filter((msg) => typeof msg.content === "string" && msg.content.trim().length > 0);

  while (normalized[0]?.role === "model") {
    normalized.shift();
  }

  return normalized.map((msg) => ({
    role: msg.role,
    parts: [
      {
        text:
          msg.role === "model"
            ? msg.content.replace(/\bPro\b/g, displayName)
            : msg.content,
      },
    ],
  }));
}

function getDisplayName(name: string | null | undefined, email: string) {
  const fallbackName = email.split("@")[0];
  return (name?.trim() || fallbackName).split(" ")[0];
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const foundUser = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.email, session.user!.email!),
    });

    if (!foundUser) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    const user = await resolveEffectiveUserPlan(foundUser);

    if (user.plan !== "pro") {
      return NextResponse.json(
        { error: "Esta funcionalidade é exclusiva para assinantes do plano Pro." },
        { status: 403 }
      );
    }

    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Mensagens inválidas" }, { status: 400 });
    }

    // 1. Gather current month finance context
    const currentDate = new Date();
    const startDate = format(startOfMonth(currentDate), "yyyy-MM-dd");
    const endDate = format(endOfMonth(currentDate), "yyyy-MM-dd");

    // Fetch incomes
    const allIncomes = await db
      .select({ amount: incomes.amount })
      .from(incomes)
      .where(
        and(
          eq(incomes.userId, user.id),
          gte(incomes.occurrenceDate, startDate),
          lte(incomes.occurrenceDate, endDate)
        )
      );

    const totalIncomes = allIncomes.reduce((sum, inc) => {
      try {
        return sum + parseFloat(decryptNumber(inc.amount));
      } catch {
        return sum;
      }
    }, 0);

    // Fetch expenses with category info
    const allExpenses = await db
      .select({
        description: expenses.description,
        amount: expenses.amount,
        type: expenses.type,
        categoryName: categories.name,
      })
      .from(expenses)
      .leftJoin(categories, eq(expenses.categoryId, categories.id))
      .where(
        and(
          eq(expenses.userId, user.id),
          gte(expenses.occurrenceDate, startDate),
          lte(expenses.occurrenceDate, endDate)
        )
      );

    const decryptedExpenses = allExpenses.map((exp) => {
      let amount = 0;
      let desc = "";
      try {
        amount = parseFloat(decryptNumber(exp.amount));
        desc = decrypt(exp.description);
      } catch (err) {
        // Fallback
      }
      return {
        description: desc,
        amount,
        type: exp.type as "essential" | "non_essential",
        category: exp.categoryName || "Sem categoria",
      };
    });

    const totalExpenses = decryptedExpenses.reduce((sum, e) => sum + e.amount, 0);
    const balance = totalIncomes - totalExpenses;

    // Group expenses by category
    const categoryTotals: Record<string, number> = {};
    decryptedExpenses.forEach((e) => {
      categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
    });

    const categorySummaryString = Object.entries(categoryTotals)
      .map(([cat, amt]) => `- ${cat}: R$ ${amt.toFixed(2)}`)
      .join("\n");

    const displayName = getDisplayName(foundUser.name, foundUser.email);

    // 2. Build system instructions
    const systemPrompt = `Você é o "Pézinho", um consultor financeiro pessoal com IA do Penochão.
Seu objetivo é ajudar ${displayName} a organizar suas finanças com dicas práticas, objetivas e fáceis de entender.
Chame a pessoa pelo nome "${displayName}" quando fizer sentido. Não chame a pessoa de "Pro", "usuário Pro" ou "assinante Pro".

SITUAÇÃO FINANCEIRA DO USUÁRIO NESTE MÊS DE ${format(currentDate, "MMMM / yyyy").toUpperCase()}:
- Total de Entradas: R$ ${totalIncomes.toFixed(2)}
- Total de Despesas: R$ ${totalExpenses.toFixed(2)}
- Saldo Atual: R$ ${balance.toFixed(2)} (${balance < 0 ? "NEGATIVO - O usuário está gastando mais do que ganha!" : "POSITIVO - Continue motivando o usuário a economizar"})

GASTOS POR CATEGORIA NESTE MÊS:
${categorySummaryString || "Nenhum gasto registrado ainda."}

DIRETRIZES DE RESPOSTA:
1. Responda em PORTUGUÊS (Brasil) com tom amigável, direto e focado em soluções.
2. Seja conciso! Evite respostas gigantescas.
3. Se o usuário estiver no vermelho (saldo negativo), sugira cortes específicos nas categorias onde ele mais gastou.
4. Use formatação Markdown (como negrito e tabelas se necessário) para tornar a resposta visualmente limpa e moderna.
5. Separe parágrafos e itens com uma linha em branco. Use listas Markdown válidas para passos ou recomendações.
6. Não invente transações que não existam na lista. Seja fidedigno aos dados fornecidos.`;

    // 3. Call Gemini
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash-lite",
      systemInstruction: systemPrompt,
    });

    const lastMessage = messages[messages.length - 1];

    if (lastMessage.role !== "user" || typeof lastMessage.content !== "string") {
      return NextResponse.json({ error: "A última mensagem deve ser do usuário." }, { status: 400 });
    }

    // Gemini chat history must start with a user turn. The UI stores an
    // assistant welcome message locally, so strip that before starting chat.
    const history = normalizeGeminiHistory(messages.slice(0, -1), displayName);

    const chat = model.startChat({
      history,
    });

    const result = await chat.sendMessage(lastMessage.content);
    const reply = result.response.text();

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("Error in AI chat api:", error);
    return NextResponse.json({ error: "Erro ao processar conversa." }, { status: 500 });
  }
}
