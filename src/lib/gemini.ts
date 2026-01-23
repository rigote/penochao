import { GoogleGenerativeAI, SchemaType, type Schema } from "@google/generative-ai";

if (!process.env.GOOGLE_GEMINI_API_KEY) {
  throw new Error("Missing GOOGLE_GEMINI_API_KEY environment variable");
}

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY);

export interface ExtractedInvoiceData {
  description: string;
  amount: number;
  date: string; // YYYY-MM-DD
  categoryType: "essential" | "non_essential";
  recurrence: "monthly" | "once";
  confidence: number;
}

const schema: Schema = {
  description: "Invoice extraction schema",
  type: SchemaType.OBJECT,
  properties: {
    description: {
      type: SchemaType.STRING,
      description: "Brief description of the expense (e.g., 'Amazon Purchase', 'Electricity Bill')",
      nullable: false,
    },
    amount: {
      type: SchemaType.NUMBER,
      description: "Total amount of the expense",
      nullable: false,
    },
    date: {
      type: SchemaType.STRING,
      description: "Date of the expense in YYYY-MM-DD format",
      nullable: false,
    },
    categoryType: {
      type: SchemaType.STRING,
      description: "Classification of the expense",
      enum: ["essential", "non_essential"],
      format: "enum",
      nullable: false,
    },
    recurrence: {
      type: SchemaType.STRING,
      description: "Recurrence of the expense",
      enum: ["monthly", "once"],
      format: "enum",
      nullable: false,
    },
    confidence: {
      type: SchemaType.NUMBER,
      description: "Confidence score between 0 and 1",
      nullable: false,
    },
  },
  required: ["description", "amount", "date", "categoryType", "recurrence", "confidence"],
};

export async function extractInvoiceData(text: string): Promise<ExtractedInvoiceData> {
  // Using Flash-Lite for cost efficiency ($0.10/1M input) in 2026/late 2025
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash-lite",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: schema,
    },
  });

  const prompt = `Extract consumption data from this invoice text. 
If text is unreadable, return 0 amount and low confidence.
Text:
"""
${text}
"""`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const textResponse = response.text();

    const parsed = JSON.parse(textResponse) as ExtractedInvoiceData;
    return parsed;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    // Return safe fallback instead of throwing to prevent app crash on AI error
    return {
      description: "Erro na leitura automática",
      amount: 0,
      date: new Date().toISOString().split('T')[0],
      categoryType: "essential",
      recurrence: "once",
      confidence: 0
    };
  }
}
