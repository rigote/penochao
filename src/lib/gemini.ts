import { GoogleGenerativeAI } from "@google/generative-ai";

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

export async function extractInvoiceData(text: string): Promise<ExtractedInvoiceData> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `You are an expert at extracting financial information from invoices and bills.

Extract the key details from the following text (which may be from a PDF invoice, bill, or receipt):

TEXT:
"""
${text}
"""

Your task:
1. Find the TOTAL AMOUNT to be paid (look for terms like "Total", "Valor Total", "Amount Due", "A Pagar", etc.)
2. Find the DUE DATE or ISSUE DATE (look for "Vencimento", "Data", "Due Date", etc.)
3. Identify what this expense is for (company name, service type, product, etc.)
4. Determine if it's essential (utilities, rent, health) or non-essential (entertainment, shopping)
5. Determine if it's recurring (monthly bills) or one-time (purchases)

Return ONLY a valid JSON object (no markdown, no explanations) with this EXACT structure:
{
  "description": "Brief description of what this is for",
  "amount": 0.00,
  "date": "YYYY-MM-DD",
  "categoryType": "essential",
  "recurrence": "monthly",
  "confidence": 0.8
}

IMPORTANT RULES:
- If text is empty or unreadable, return: {"description": "Invalid input: No extractable text.", "amount": 0, "date": "${new Date().toISOString().split('T')[0]}", "categoryType": "essential", "recurrence": "once", "confidence": 0}
- If you can't find an amount, use 0
- If you can't find a date, use today's date: ${new Date().toISOString().split('T')[0]}
- categoryType must be EXACTLY "essential" or "non_essential" (no other values)
- recurrence must be EXACTLY "monthly" or "once" (no other values)
- confidence should be between 0 and 1

Examples of essential: electricity, water, gas, internet, rent, health insurance, phone bill
Examples of non_essential: Netflix, Spotify, restaurant, shopping, entertainment

Return ONLY the JSON, nothing else.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const textResponse = response.text();

    // Clean up any potential markdown formatting
    let jsonString = textResponse.trim();
    jsonString = jsonString.replace(/^```json\n?/gm, "");
    jsonString = jsonString.replace(/^```\n?/gm, "");
    jsonString = jsonString.replace(/\n?```$/gm, "");
    jsonString = jsonString.trim();

    const parsed = JSON.parse(jsonString) as ExtractedInvoiceData;

    // Validate the response
    if (!parsed.description || !parsed.categoryType || !parsed.recurrence) {
      throw new Error("Invalid response structure from Gemini");
    }

    return parsed;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("Failed to extract data from invoice.");
  }
}
