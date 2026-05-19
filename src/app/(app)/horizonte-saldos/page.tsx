import { HorizonteSaldosClient } from "./horizonte-saldos-client"

export const metadata = {
  title: "Horizonte de Saldos | Penochão",
  description:
    "Visualize a projeção do seu saldo diário acumulado para os próximos meses.",
}

export default function HorizonteSaldosPage() {
  return (
    <div className="space-y-6">
      <HorizonteSaldosClient />
    </div>
  )
}
