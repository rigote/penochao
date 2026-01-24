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

// Expense suggestion interfaces
export interface ExpenseSuggestion {
  description: string;
  currentAmount: number;
  savingsAmount: number;
  priority: "high" | "medium" | "low";
  reason: string;
  category?: string;
  recurrence?: "monthly" | "once";
}

export interface ExpenseAnalysisData {
  suggestions: ExpenseSuggestion[];
  totalPotentialSavings: number;
  summary: string;
}

const expenseSuggestionSchema: Schema = {
  description: "Dados de sugestão de gasto",
  type: SchemaType.OBJECT,
  properties: {
    description: {
      type: SchemaType.STRING,
      description: "Descrição do gasto que pode ser cortado ou reduzido (em português)",
      nullable: false,
    },
    currentAmount: {
      type: SchemaType.NUMBER,
      description: "Valor mensal atual gasto neste item",
      nullable: false,
    },
    savingsAmount: {
      type: SchemaType.NUMBER,
      description: "Valor que pode ser economizado cortando ou reduzindo este gasto",
      nullable: false,
    },
    priority: {
      type: SchemaType.STRING,
      description: "Nível de prioridade: 'high' para cortes fáceis com grande impacto, 'medium' para impacto moderado, 'low' para economias pequenas",
      enum: ["high", "medium", "low"],
      format: "enum",
      nullable: false,
    },
    reason: {
      type: SchemaType.STRING,
      description: "Breve explicação do porquê este gasto pode ser cortado (em português, ex: 'Assinatura não utilizada', 'Pode ser substituído por alternativa gratuita', 'Luxo não essencial')",
      nullable: false,
    },
    category: {
      type: SchemaType.STRING,
      description: "Categoria do gasto (em português, ex: 'Streaming', 'Delivery', 'Academia', 'Compras')",
      nullable: true,
    },
    recurrence: {
      type: SchemaType.STRING,
      description: "Se é um gasto recorrente mensal ou único",
      enum: ["monthly", "once"],
      format: "enum",
      nullable: true,
    },
  },
  required: ["description", "currentAmount", "savingsAmount", "priority", "reason"],
};

const expenseAnalysisSchema: Schema = {
  description: "Análise de gastos com sugestões",
  type: SchemaType.OBJECT,
  properties: {
    suggestions: {
      type: SchemaType.ARRAY,
      description: "Array de sugestões de gastos, ordenadas por prioridade (alta para baixa)",
      items: expenseSuggestionSchema,
      nullable: false,
    },
    totalPotentialSavings: {
      type: SchemaType.NUMBER,
      description: "Valor total que pode ser economizado se todas as sugestões de prioridade alta e média forem seguidas",
      nullable: false,
    },
    summary: {
      type: SchemaType.STRING,
      description: "Breve resumo da situação financeira e recomendações (em português)",
      nullable: false,
    },
  },
  required: ["suggestions", "totalPotentialSavings", "summary"],
};

export async function analyzeExpensesForSavings(
  expenses: Array<{ description: string; amount: number; type: "essential" | "non_essential"; recurrence: "monthly" | "once"; category?: string }>,
  totalIncome: number,
  totalExpenses: number,
  monthlyBalance: number
): Promise<ExpenseAnalysisData> {
  // Only analyze if user is in the red (negative balance)
  if (monthlyBalance >= 0) {
    return {
      suggestions: [],
      totalPotentialSavings: 0,
      summary: "Seu saldo está positivo! Continue assim."
    };
  }

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash-lite",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: expenseAnalysisSchema,
    },
  });

  // Filter to non-essential expenses for suggestions
  const nonEssentialExpenses = expenses.filter(e => e.type === "non_essential");
  
  // If no non-essential expenses, suggest looking at essential ones
  const expensesToAnalyze = nonEssentialExpenses.length > 0 ? nonEssentialExpenses : expenses;

  const prompt = `Você é um consultor financeiro especializado em ajudar brasileiros endividados. O CARTÃO DE CRÉDITO é o principal vilão do endividamento no Brasil (83,6% dos endividados).

SITUAÇÃO:
- Renda Mensal: R$ ${totalIncome.toFixed(2)}
- Gastos Mensais: R$ ${totalExpenses.toFixed(2)}
- Saldo Mensal: R$ ${monthlyBalance.toFixed(2)} (NEGATIVO - gastando mais do que ganha)
- Déficit: R$ ${Math.abs(monthlyBalance).toFixed(2)}

GASTOS PARA ANALISAR:
${expensesToAnalyze.map((e, i) => {
  // Identificar se é gasto com cartão de crédito
  const isCreditCard = e.description.toLowerCase().includes('fatura') || 
                       e.description.toLowerCase().includes('cartão') ||
                       e.description.toLowerCase().includes('credito') ||
                       e.description.toLowerCase().includes('pay') ||
                       e.description.toLowerCase().includes('rscss') ||
                       e.description.toLowerCase().includes('ifood') ||
                       e.description.toLowerCase().includes('uber') ||
                       e.description.toLowerCase().includes('netflix') ||
                       e.description.toLowerCase().includes('spotify') ||
                       e.description.toLowerCase().includes('amazon') ||
                       e.description.toLowerCase().includes('magazine') ||
                       e.description.toLowerCase().includes('shopping')
  
  return `${i + 1}. ${e.description} - R$ ${e.amount.toFixed(2)}/mês (${e.type === 'essential' ? 'essencial' : 'não essencial'}, ${e.recurrence === 'monthly' ? 'mensal' : 'única vez'}${isCreditCard ? ', CARTÃO DE CRÉDITO' : ''}${e.category ? `, ${e.category}` : ''})`
}).join('\n')}

FOCO PRINCIPAL: CARTÃO DE CRÉDITO
O cartão de crédito é responsável por 83,6% das dívidas dos brasileiros. Identifique especialmente:
- Gastos recorrentes no cartão (assinaturas, parcelamentos)
- Uso do cartão para despesas do dia a dia (delivery, compras pequenas)
- Parcelamentos desnecessários
- Faturas altas com múltiplos gastos pequenos

GASTOS SUPÉRFLUOS QUE MAIS PREJUDICAM BRASILEIROS (prioridade):
1. **ASSINATURAS RECORRENTES NO CARTÃO** (ALTA PRIORIDADE):
   - Streaming (Netflix, Spotify, Amazon Prime, Disney+, HBO Max)
   - Academia não utilizada
   - Apps de assinatura (Tinder Gold, apps de produtividade)
   - Serviços de nuvem pagos (Dropbox, iCloud storage extra)
   - Assinaturas de revistas/jornais digitais

2. **DELIVERY E COMIDA FORA** (ALTA PRIORIDADE):
   - iFood, Uber Eats, Rappi (delivery de comida)
   - Restaurantes frequentes
   - Lanches e cafés fora de casa
   - Padarias e conveniências

3. **COMPRAS POR IMPULSO NO CARTÃO** (MÉDIA/ALTA PRIORIDADE):
   - Compras online (Amazon, Magazine Luiza, Americanas)
   - Roupas e acessórios desnecessários
   - Eletrônicos parcelados sem necessidade
   - Produtos de beleza/cosméticos em excesso

4. **PARCELAMENTOS DESNECESSÁRIOS** (ALTA PRIORIDADE):
   - Parcelas de compras que poderiam ser pagas à vista
   - Múltiplos parcelamentos simultâneos
   - Juros embutidos em parcelamentos

5. **SERVIÇOS NÃO UTILIZADOS** (MÉDIA PRIORIDADE):
   - Planos de celular com dados excessivos
   - Seguros desnecessários
   - Serviços bancários pagos (anuidades, pacotes)

DIRETRIZES DE PRIORIDADE ESPECÍFICAS:
- **ALTA PRIORIDADE**: 
  * Gastos recorrentes no cartão (R$ 30+): assinaturas, delivery frequente, parcelamentos
  * Fácil de cortar imediatamente (cancelar assinatura, parar delivery)
  * Alto impacto (economia de R$ 50+ ao mês)
  
- **MÉDIA PRIORIDADE**:
  * Gastos no cartão que podem ser reduzidos (delivery ocasional, compras menores)
  * Economia moderada (R$ 20-50)
  * Requer mudança de hábito mas é viável

- **BAIXA PRIORIDADE**:
  * Gastos pequenos (< R$ 20)
  * Mais difíceis de cortar
  * Menor impacto individual

ESTRATÉGIA DE ANÁLISE:
1. **PRIMEIRO**: Identifique TODOS os gastos com cartão de crédito (procure por palavras-chave: FATURA, PAY, RSCSS, IFOOD, NETFLIX, etc)
2. **SEGUNDO**: Priorize gastos RECORRENTES no cartão (mensais) - estes são os mais perigosos
3. **TERCEIRO**: Foque em assinaturas e delivery - são os maiores vilões silenciosos
4. **QUARTO**: Identifique parcelamentos que poderiam ser evitados

IMPORTANTE:
- DÊ PRIORIDADE ABSOLUTA a gastos identificados como "CARTÃO DE CRÉDITO"
- Seja específico: "Assinatura Netflix no cartão - R$ 45,90/mês" em vez de apenas "Netflix"
- Mencione o impacto: "Se cortar este gasto, economiza R$ X por mês"
- Seja direto e prático: "Cancele a assinatura" em vez de "considere cancelar"
- Não sugira cortar gastos essenciais (aluguel, contas básicas, alimentação básica)
- Limite a 5-7 sugestões principais, priorizando maior impacto
- Calcule totalPotentialSavings como soma das economias de prioridade alta + média
- Todas as respostas devem estar em PORTUGUÊS (descrição, motivo, categoria, resumo)

EXEMPLOS DE SUGESTÕES BEM FEITAS:
- "Assinatura Netflix no cartão - R$ 45,90/mês" (Alta) - "Assinatura de streaming não essencial. Pode ser substituída por alternativas gratuitas ou cancelada temporariamente."
- "iFood recorrente - R$ 200/mês" (Alta) - "Delivery frequente. Cozinhar em casa pode economizar até 70% do valor gasto."
- "Parcelamento iPhone - R$ 300/mês" (Média) - "Parcelamento de eletrônico. Considere quitar ou reduzir parcelas se possível."

Retorne as sugestões em ordem de prioridade (alta para baixa), dando preferência absoluta a gastos com cartão de crédito.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const textResponse = response.text();
    const parsed = JSON.parse(textResponse) as ExpenseAnalysisData;
    
    return parsed;
  } catch (error) {
    console.error("Error calling Gemini API for expense analysis:", error);
    return {
      suggestions: [],
      totalPotentialSavings: 0,
      summary: "Erro ao analisar gastos. Tente novamente mais tarde."
    };
  }
}
