import * as dotenv from "dotenv"
dotenv.config({ path: ".env.local" })

import { db } from "./index"
import { categories } from "./schema/finance"

const defaultCategories = [
  // Entradas (Income)
  { name: "Salário Líquido", type: "income" as const, icon: "💰" },
  { name: "Vale-Alimentação", type: "income" as const, icon: "🍽️" },
  { name: "Vale-Refeição", type: "income" as const, icon: "🥗" },
  { name: "Vale", type: "income" as const, icon: "🎫" },
  { name: "Comissões/Bônus", type: "income" as const, icon: "🎯" },
  { name: "Aluguel Recebido", type: "income" as const, icon: "🏠" },
  { name: "Freelance", type: "income" as const, icon: "💻" },
  { name: "Outras Entradas", type: "income" as const, icon: "➕" },

  // Despesas Essenciais
  { name: "Moradia", type: "essential" as const, icon: "🏡" },
  { name: "Condomínio", type: "essential" as const, icon: "🏢" },
  { name: "Supermercado", type: "essential" as const, icon: "🛒" },
  { name: "Água", type: "essential" as const, icon: "💧" },
  { name: "Luz", type: "essential" as const, icon: "💡" },
  { name: "Gás", type: "essential" as const, icon: "🔥" },
  { name: "IPTU", type: "essential" as const, icon: "📋" },
  { name: "Plano de Saúde", type: "essential" as const, icon: "🏥" },
  { name: "Seguro de Vida", type: "essential" as const, icon: "🛡️" },
  { name: "Investimentos", type: "essential" as const, icon: "📈" },

  // Despesas Não Essenciais
  { name: "Cartão de Crédito", type: "non_essential" as const, icon: "💳" },
  { name: "Combustível", type: "non_essential" as const, icon: "⛽" },
  { name: "Farmácia", type: "non_essential" as const, icon: "💊" },
  { name: "Gastos com Animais", type: "non_essential" as const, icon: "🐾" },
  { name: "Transporte", type: "non_essential" as const, icon: "🚌" },
  { name: "Veículo", type: "non_essential" as const, icon: "🚗" },
  { name: "Internet", type: "non_essential" as const, icon: "🌐" },
  { name: "Streaming", type: "non_essential" as const, icon: "📺" },
  { name: "Lazer", type: "non_essential" as const, icon: "🎬" },
  { name: "Salão/Estética", type: "non_essential" as const, icon: "💇" },
  { name: "Telefonia", type: "non_essential" as const, icon: "📱" },
  { name: "Tarifas Bancárias", type: "non_essential" as const, icon: "🏦" },
  { name: "Outras Despesas", type: "non_essential" as const, icon: "📦" },
]

export async function seedCategories() {
  console.log("🌱 Seeding categories...")

  for (const category of defaultCategories) {
    await db
      .insert(categories)
      .values({
        name: category.name,
        type: category.type,
        icon: category.icon,
        isDefault: true,
      })
      .onConflictDoNothing()
  }

  console.log("✅ Categories seeded successfully!")
}

// Run if called directly
if (require.main === module) {
  seedCategories()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("❌ Seed failed:", error)
      process.exit(1)
    })
}
