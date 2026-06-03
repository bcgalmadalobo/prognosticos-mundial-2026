import { NextResponse } from "next/server";

// Cron automático desativado. Usar envio manual em /admin/notificacoes
// ou o botão "Enviar lembrete" em /admin/jogos/[matchId].
export async function GET() {
  return NextResponse.json({ disabled: true }, { status: 410 });
}

export async function POST() {
  return NextResponse.json({ disabled: true }, { status: 410 });
}
