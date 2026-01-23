import * as dotenv from "dotenv"
dotenv.config({ path: ".env.local" })

import { db } from "./index"
import { categories } from "./schema/finance"

const defaultCategories = [
  // Entradas (Income) - Using Lucide icon names (kebab-case)
  { name: "Salário Líquido", type: "income" as const, icon: "banknote" },
  { name: "Vale-Alimentação", type: "income" as const, icon: "utensils" },
  { name: "Vale-Refeição", type: "income" as const, icon: "salad" },
  { name: "Vale", type: "income" as const, icon: "ticket" },
  { name: "Comissões/Bônus", type: "income" as const, icon: "target" },
  { name: "Aluguel Recebido", type: "income" as const, icon: "home" },
  { name: "Freelance", type: "income" as const, icon: "briefcase" },
  { name: "Outras Entradas", type: "income" as const, icon: "circle-dollar-sign" },

  // Despesas Essenciais
  { name: "Moradia", type: "essential" as const, icon: "home" },
  { name: "Condomínio", type: "essential" as const, icon: "building" },
  { name: "Supermercado", type: "essential" as const, icon: "shopping-cart" },
  { name: "Água", type: "essential" as const, icon: "droplets" },
  { name: "Luz", type: "essential" as const, icon: "lightbulb" },
  { name: "Gás", type: "essential" as const, icon: "flame" },
  { name: "IPTU", type: "essential" as const, icon: "file-text" },
  { name: "Plano de Saúde", type: "essential" as const, icon: "heart" },
  { name: "Seguro de Vida", type: "essential" as const, icon: "shield" },
  { name: "Investimentos", type: "essential" as const, icon: "trending-up" },

  // Despesas Não Essenciais
  { name: "Cartão de Crédito", type: "non_essential" as const, icon: "credit-card" },
  { name: "Combustível", type: "non_essential" as const, icon: "fuel" },
  { name: "Farmácia", type: "non_essential" as const, icon: "pill" },
  { name: "Gastos com Animais", type: "non_essential" as const, icon: "dog" },
  { name: "Transporte", type: "non_essential" as const, icon: "bus" },
  { name: "Veículo", type: "non_essential" as const, icon: "car" },
  { name: "Internet", type: "non_essential" as const, icon: "globe" },
  { name: "Streaming", type: "non_essential" as const, icon: "tv" },
  { name: "Lazer", type: "non_essential" as const, icon: "clapperboard" },
  { name: "Salão/Estética", type: "non_essential" as const, icon: "scissors" },
  { name: "Telefonia", type: "non_essential" as const, icon: "smartphone" },
  { name: "Tarifas Bancárias", type: "non_essential" as const, icon: "landmark" },
  { name: "Outras Despesas", type: "non_essential" as const, icon: "package" },
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
