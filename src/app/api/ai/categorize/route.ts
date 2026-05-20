import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/db";
import { categories } from "@/db/schema/finance";
import { or, eq, isNull } from "drizzle-orm";
import { resolveEffectiveUserPlan } from "@/lib/subscription";
import { GoogleGenerativeAI, SchemaType, type Schema } from "@google/generative-ai";

if (!process.env.GOOGLE_GEMINI_API_KEY) {
  throw new Error("Missing GOOGLE_GEMINI_API_KEY environment variable");
}

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY);

// Static dictionary matching common Brazilian transaction descriptions to Category names and Types
const LOCAL_DICTIONARY: Record<string, { categoryName: string; type: "essential" | "non_essential" | "income" }> = {
  // Transport
  "uber": { categoryName: "Transporte", type: "non_essential" },
  "99app": { categoryName: "Transporte", type: "non_essential" },
  "99taxi": { categoryName: "Transporte", type: "non_essential" },
  "99 taxi": { categoryName: "Transporte", type: "non_essential" },
  "cabify": { categoryName: "Transporte", type: "non_essential" },
  "posto": { categoryName: "Transporte", type: "essential" },
  "combustivel": { categoryName: "Transporte", type: "essential" },
  "gasolina": { categoryName: "Transporte", type: "essential" },
  "metro": { categoryName: "Transporte", type: "essential" },
  "passagem": { categoryName: "Transporte", type: "essential" },
  
  // Delivery & Dining
  "ifood": { categoryName: "Alimentação", type: "non_essential" },
  "rappi": { categoryName: "Alimentação", type: "non_essential" },
  "ubereats": { categoryName: "Alimentação", type: "non_essential" },
  "uber eats": { categoryName: "Alimentação", type: "non_essential" },
  "mcdonald": { categoryName: "Alimentação", type: "non_essential" },
  "mc donald": { categoryName: "Alimentação", type: "non_essential" },
  "burger king": { categoryName: "Alimentação", type: "non_essential" },
  "habibs": { categoryName: "Alimentação", type: "non_essential" },
  "outback": { categoryName: "Alimentação", type: "non_essential" },
  "restaurante": { categoryName: "Alimentação", type: "non_essential" },
  "pizzaria": { categoryName: "Alimentação", type: "non_essential" },
  "lanche": { categoryName: "Alimentação", type: "non_essential" },

  // Supermarkets / Groceries
  "mercado": { categoryName: "Supermercado", type: "essential" },
  "supermercado": { categoryName: "Supermercado", type: "essential" },
  "carrefour": { categoryName: "Supermercado", type: "essential" },
  "pao de acucar": { categoryName: "Supermercado", type: "essential" },
  "pão de açúcar": { categoryName: "Supermercado", type: "essential" },
  "extra": { categoryName: "Supermercado", type: "essential" },
  "assai": { categoryName: "Supermercado", type: "essential" },
  "atacadao": { categoryName: "Supermercado", type: "essential" },
  "atacado": { categoryName: "Supermercado", type: "essential" },
  "hortifruti": { categoryName: "Supermercado", type: "essential" },
  "feira": { categoryName: "Supermercado", type: "essential" },

  // Streaming / Leisure / Subscriptions
  "netflix": { categoryName: "Assinaturas", type: "non_essential" },
  "spotify": { categoryName: "Assinaturas", type: "non_essential" },
  "disney": { categoryName: "Assinaturas", type: "non_essential" },
  "hbo": { categoryName: "Assinaturas", type: "non_essential" },
  "prime video": { categoryName: "Assinaturas", type: "non_essential" },
  "amazon prime": { categoryName: "Assinaturas", type: "non_essential" },
  "globoplay": { categoryName: "Assinaturas", type: "non_essential" },
  "youtube premium": { categoryName: "Assinaturas", type: "non_essential" },
  "academia": { categoryName: "Saúde", type: "non_essential" },

  // Bills / Utilities
  "enel": { categoryName: "Moradia", type: "essential" },
  "sabesp": { categoryName: "Moradia", type: "essential" },
  "light": { categoryName: "Moradia", type: "essential" },
  "energia": { categoryName: "Moradia", type: "essential" },
  "luz": { categoryName: "Moradia", type: "essential" },
  "agua": { categoryName: "Moradia", type: "essential" },
  "água": { categoryName: "Moradia", type: "essential" },
  "internet": { categoryName: "Moradia", type: "essential" },
  "aluguel": { categoryName: "Moradia", type: "essential" },
  "condominio": { categoryName: "Moradia", type: "essential" },
  "condomínio": { categoryName: "Moradia", type: "essential" },

  // Health
  "farmacia": { categoryName: "Saúde", type: "essential" },
  "farmácia": { categoryName: "Saúde", type: "essential" },
  "droga": { categoryName: "Saúde", type: "essential" },
  "drogasil": { categoryName: "Saúde", type: "essential" },
  "drogaria": { categoryName: "Saúde", type: "essential" },
  "medico": { categoryName: "Saúde", type: "essential" },
  "médico": { categoryName: "Saúde", type: "essential" },
  "consulta": { categoryName: "Saúde", type: "essential" },
  "exame": { categoryName: "Saúde", type: "essential" },
  "dentista": { categoryName: "Saúde", type: "essential" },

  // Income
  "salario": { categoryName: "Salário", type: "income" },
  "salário": { categoryName: "Salário", type: "income" },
  "remuneracao": { categoryName: "Salário", type: "income" },
  "remuneração": { categoryName: "Salário", type: "income" },
  "pagamento": { categoryName: "Outros", type: "income" },
  "recebimento": { categoryName: "Outros", type: "income" },
  "pix recebido": { categoryName: "Outros", type: "income" },
  "ted recebido": { categoryName: "Outros", type: "income" },
  "investimento": { categoryName: "Investimentos", type: "income" },
  "rendimento": { categoryName: "Investimentos", type: "income" },
};

const classificationSchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    categoryId: {
      type: SchemaType.STRING,
      description: "O ID da categoria mais provável para a descrição fornecida. Deve obrigatoriamente ser um ID da lista enviada.",
      nullable: false,
    },
    type: {
      type: SchemaType.STRING,
      description: "Classificação do gasto: 'essential' para necessidades básicas ou 'non_essential' para desejos/supérfluos (ignorar se a categoria for de receita/income).",
      enum: ["essential", "non_essential"],
      format: "enum",
      nullable: false,
    },
  },
  required: ["categoryId", "type"],
};

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
        { error: "Gating active: Autocomplete requires Pro plan" },
        { status: 403 }
      );
    }

    const { description, transactionType } = await request.json();

    if (!description || typeof description !== "string") {
      return NextResponse.json({ error: "Descrição inválida" }, { status: 400 });
    }

    // Fetch user and system categories
    const allCategories = await db.query.categories.findMany({
      where: or(eq(categories.userId, user.id), isNull(categories.userId)),
    });

    // 1. Try static dictionary matching (0-cost)
    const normalized = description.toLowerCase();
    let dictMatchKey = Object.keys(LOCAL_DICTIONARY).find((key) => normalized.includes(key));

    if (dictMatchKey) {
      const match = LOCAL_DICTIONARY[dictMatchKey];
      // Try to find the actual category in DB matching name and type (essential/non_essential map directly to category types in Penochao)
      const dbCategory = allCategories.find(
        (c) =>
          c.name.toLowerCase() === match.categoryName.toLowerCase() &&
          (transactionType === "income" ? c.type === "income" : c.type !== "income")
      );

      if (dbCategory) {
        return NextResponse.json({
          categoryId: dbCategory.id,
          type: dbCategory.type === "income" ? "income" : match.type,
          source: "dictionary",
        });
      }
    }

    // 2. Fall back to Gemini 2.5 Flash Lite
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash-lite",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: classificationSchema,
      },
    });

    // Format categories list for prompt
    const categoriesListString = allCategories
      .map((c) => `- ID: "${c.id}", Nome: "${c.name}", Tipo: "${c.type}"`)
      .join("\n");

    const prompt = `Classifique a seguinte descrição de transação financeira: "${description}"
Tipo geral de transação: ${transactionType === "income" ? "RECEITA/ENTRADA (income)" : "DESPESA/SAÍDA (expense)"}

Selecione a categoria correspondente mais adequada a partir da seguinte lista de categorias do usuário:
${categoriesListString}

Instruções:
- Selecione apenas uma categoria da lista acima.
- Retorne o ID exato selecionado no campo categoryId do JSON.
- Classifique despesas como "essential" (moradia, saúde, alimentação básica, contas básicas) ou "non_essential" (streaming, lazer, delivery, compras de roupas) no campo type.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const parsed = JSON.parse(text);

    return NextResponse.json({
      categoryId: parsed.categoryId,
      type: parsed.type,
      source: "gemini",
    });
  } catch (error) {
    console.error("Error in AI categorization route:", error);
    return NextResponse.json({ error: "Erro ao categorizar transação automaticamente" }, { status: 500 });
  }
}
