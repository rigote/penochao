import { PrevisaoDiariaClient } from "./previsao-diaria-client"

export const metadata = {
  title: "Previsão Diária | Penochão",
  description:
    "Calcule sua previsão de gastos diários com base nos seus gastos mensais estimados.",
}

export default function PrevisaoDiariaPage() {
  return (
    <div className="space-y-6">
      <PrevisaoDiariaClient />
    </div>
  )
}
