import { GoogleGenerativeAI, SchemaType, type Schema } from "@google/generative-ai";

if (!process.env.GOOGLE_GEMINI_API_KEY) {
  throw new Error("Missing GOOGLE_GEMINI_API_KEY environment variable");
}

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY);

export interface ExtractedTransaction {
  description: string;
  amount: number;
  date: string; // YYYY-MM-DD
  transactionType: "income" | "expense"; // NEW: Distinguishes income from expenses
  categoryType: "essential" | "non_essential"; // Only used for expenses
  recurrence: "monthly" | "once";
  confidence: number;
}

// Legacy interface for backward compatibility (single invoice)
export interface ExtractedInvoiceData extends ExtractedTransaction {}

// New interface for bank statements (multiple transactions)
export interface ExtractedBankStatementData {
  transactions: ExtractedTransaction[];
  accountInfo?: {
    accountNumber?: string;
    agency?: string;
    bankName?: string;
    period?: string;
  };
}

const transactionSchema: Schema = {
  description: "Transaction data",
  type: SchemaType.OBJECT,
  properties: {
    description: {
      type: SchemaType.STRING,
      description: "Brief description of the transaction (e.g., 'PIX Transfer', 'PAY Shop', 'Electricity Bill', 'REMUNERACAO/SALARIO'). For bank statements, use the transaction description from the statement.",
      nullable: false,
    },
    amount: {
      type: SchemaType.NUMBER,
      description: "Transaction amount. ALWAYS use POSITIVE values. Convert negative values from the statement to positive (e.g., -70.00 becomes 70.00). The system expects positive values for all transactions.",
      nullable: false,
    },
    date: {
      type: SchemaType.STRING,
      description: "Date of the transaction in YYYY-MM-DD format",
      nullable: false,
    },
    transactionType: {
      type: SchemaType.STRING,
      description: "Type of transaction: 'income' for money coming in (salaries, transfers received, etc.) or 'expense' for money going out (purchases, bills, transfers sent, etc.)",
      enum: ["income", "expense"],
      format: "enum",
      nullable: false,
    },
    categoryType: {
      type: SchemaType.STRING,
      description: "Classification of the expense (only used when transactionType is 'expense'). Ignore this field for income transactions, but still provide a value.",
      enum: ["essential", "non_essential"],
      format: "enum",
      nullable: false,
    },
    recurrence: {
      type: SchemaType.STRING,
      description: "Recurrence of the transaction: 'monthly' for recurring items (salaries, bills, subscriptions) or 'once' for one-time transactions",
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
  required: ["description", "amount", "date", "transactionType", "categoryType", "recurrence", "confidence"],
};

const bankStatementSchema: Schema = {
  description: "Bank statement extraction schema - supports multiple transactions",
  type: SchemaType.OBJECT,
  properties: {
    transactions: {
      type: SchemaType.ARRAY,
      description: "Array of all transactions found in the bank statement. Extract EVERY transaction, not just the first one.",
      items: transactionSchema,
      nullable: false,
    },
    accountInfo: {
      type: SchemaType.OBJECT,
      description: "Optional account information if available in the statement",
      properties: {
        accountNumber: {
          type: SchemaType.STRING,
          nullable: true,
        },
        agency: {
          type: SchemaType.STRING,
          nullable: true,
        },
        bankName: {
          type: SchemaType.STRING,
          nullable: true,
        },
        period: {
          type: SchemaType.STRING,
          nullable: true,
        },
      },
      nullable: true,
    },
  },
  required: ["transactions"],
};

// Helper function to detect if text is a bank statement
function isBankStatement(text: string): boolean {
  const bankStatementIndicators = [
    /extrato/i,
    /conta.*lançamentos/i,
    /período de visualização/i,
    /data.*lançamentos.*valor/i,
    /saldo do dia/i,
    /agência.*conta/i,
    /PIX|PAY|RSCSS|REMUNERACAO|FATURA PAGA/i,
    /-- \d+ of \d+ --/i, // Page indicators
  ];
  
  const matches = bankStatementIndicators.filter(pattern => pattern.test(text));
  return matches.length >= 3; // Need at least 3 indicators to be confident
}

// Legacy function for single invoice extraction (backward compatibility)
export async function extractInvoiceData(text: string): Promise<ExtractedInvoiceData> {
  const bankStatement = await extractBankStatementData(text);
  
  // If it's a bank statement with transactions, return the first one for backward compatibility
  if (bankStatement.transactions.length > 0) {
    return bankStatement.transactions[0];
  }
  
  // Fallback
  return {
    description: "Erro na leitura automática",
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    transactionType: "expense",
    categoryType: "essential",
    recurrence: "once",
    confidence: 0
  };
}

// New function for bank statement extraction (multiple transactions)
export async function extractBankStatementData(text: string): Promise<ExtractedBankStatementData> {
  const isBankStmt = isBankStatement(text);
  
  // Using Flash-Lite for cost efficiency ($0.10/1M input) in 2026/late 2025
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash-lite",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: bankStatementSchema,
    },
  });

  const prompt = isBankStmt
    ? `You are analyzing a BANK STATEMENT (extrato bancário) in Portuguese. Extract ALL transactions from this bank statement.

CRITICAL: You must distinguish between INCOME (entrada) and EXPENSE (despesa) transactions.

INCOME TRANSACTIONS (transactionType: "income"):
- REMUNERACAO/SALARIO = Salary (always income, usually monthly)
- REMUNERACAO = Remuneration (income)
- SALARIO = Salary (income)
- REND PAGO = Interest paid (income)
- APLIC AUT = Automatic investment returns (income)
- Any transfer received (PIX TRANSF received, not sent)
- Any credit to the account

EXPENSE TRANSACTIONS (transactionType: "expense"):
- PIX TRANSF = PIX transfer sent (expense)
- PAY = Payment/credit card purchase (expense)
- RSCSS = Credit card chargeback (expense)
- FATURA PAGA = Credit card bill paid (expense)
- PIX QRS = PIX QR code payment (expense)
- PAGTO/PAG BOLETO = Bill payment (expense)
- Any debit from the account
- Any payment or purchase

IMPORTANT INSTRUCTIONS:
1. Extract EVERY transaction you find in the statement, not just the first one
2. Look for transaction lines with dates, descriptions, and values
3. For each transaction, identify:
   - Date (convert from DD/MM/YYYY to YYYY-MM-DD format)
   - Description (use the transaction description from the statement)
   - Amount (ALWAYS use POSITIVE values. Even if the statement shows negative values (like -70,00), convert to positive (70.00). The system expects positive values for all transactions)
   - Transaction Type: "income" for money coming in (salaries, interest, transfers received) OR "expense" for money going out (purchases, bills, transfers sent)
   - Category type: "essential" or "non_essential" (ONLY used for expenses, but still provide a value for income transactions - use "essential" as default)
   - Recurrence: "monthly" for recurring items (salaries, bills, subscriptions) OR "once" for one-time transactions
   - Confidence (0.0 to 1.0 based on how clear the transaction data is)

4. Ignore lines like "SALDO DO DIA" (daily balance) - these are not transactions
5. Ignore header/footer text, page numbers, and legal disclaimers
6. If you see multiple pages (indicated by "-- X of Y --"), extract transactions from ALL pages
7. For account info, extract if available: account number, agency, bank name, period

Common transaction patterns in Brazilian bank statements:
INCOME:
- REMUNERACAO/SALARIO = Salary (income, usually monthly)
- REND PAGO = Interest/returns (income)
- APLIC AUT = Investment returns (income)

EXPENSES:
- PIX TRANSF = PIX transfer sent (expense)
- PAY = Payment/credit card purchase (expense)
- RSCSS = Credit card chargeback (expense)
- FATURA PAGA = Credit card bill paid (expense)
- PIX QRS = PIX QR code payment (expense)
- PAGTO/PAG BOLETO = Bill payment (expense)
- DA VIVO-SP, ENEL DISTRI = Utility bills (expense, usually monthly)
- CONDOMINIO = Condo fees (expense, usually monthly)
- IPVA, FINANC VEIC = Vehicle taxes/financing (expense)

Text:
"""
${text}
"""`

    : `You are analyzing a financial document. If this is a bank statement with multiple transactions, extract ALL of them. If it's a single invoice/bill, extract it as a single transaction.

CRITICAL: Distinguish between INCOME and EXPENSE:
- INCOME (transactionType: "income"): Salaries (REMUNERACAO/SALARIO), interest (REND PAGO), transfers received, credits
- EXPENSE (transactionType: "expense"): Purchases, bills, transfers sent, payments, debits

IMPORTANT: If you see multiple transactions (like in a bank statement), extract ALL of them in the transactions array. Do not extract only the first one.

For bank statements, look for:
- Multiple lines with dates, descriptions, and amounts
- Patterns like "PIX", "PAY", "FATURA PAGA", "REMUNERACAO"
- Page indicators like "-- 1 of 4 --"
- REMUNERACAO/SALARIO = Income (transactionType: "income")
- Other transactions = Usually expenses (transactionType: "expense")

For single invoices/bills, extract as a single transaction (usually expense).

Text:
"""
${text}
"""`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const textResponse = response.text();

    const parsed = JSON.parse(textResponse) as ExtractedBankStatementData;
    
    // Ensure we always have a transactions array
    if (!parsed.transactions || parsed.transactions.length === 0) {
      return {
        transactions: [{
          description: "Erro na leitura automática",
          amount: 0,
          date: new Date().toISOString().split('T')[0],
          transactionType: "expense",
          categoryType: "essential",
          recurrence: "once",
          confidence: 0
        }],
      };
    }
    
    return parsed;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    // Return safe fallback instead of throwing to prevent app crash on AI error
    return {
      transactions: [{
        description: "Erro na leitura automática",
        amount: 0,
        date: new Date().toISOString().split('T')[0],
        transactionType: "expense",
        categoryType: "essential",
        recurrence: "once",
        confidence: 0
      }],
    };
  }
}
