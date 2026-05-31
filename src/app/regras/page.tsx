import { Card } from "@/components/Card";

export default function RulesPage() {
  return (
    <main className="mx-auto max-w-3xl space-y-4 p-4">
      <Card title="Regras">
        <div className="space-y-3 text-sm text-slate-700">
          <p>Jogo privado de prognosticos entre amigos, sem dinheiro real.</p>
          <p>A aposta inicial inclui vencedor, finalista, fases atingidas, posicoes nos grupos e premios individuais.</p>
          <p>Nas eliminatorias, cada jogador aposta no resultado aos 90 minutos e na equipa que passa. A partir dos quartos tambem aposta no resultado apos 120 minutos.</p>
          <p>A pontuacao e configuravel no painel admin.</p>
        </div>
      </Card>
    </main>
  );
}
