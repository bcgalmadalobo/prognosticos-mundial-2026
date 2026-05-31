# Especificação da App Final

## Nome provisório

Prognósticos Mundial 2026

## Descrição

PWA privada de prognósticos do Mundial 2026 entre amigos.

Não é uma aplicação de apostas a dinheiro.
Não existem depósitos, levantamentos, pagamentos, prémios monetários ou funcionalidades de gambling real.

A app deve funcionar como um simulador completo do Mundial 2026, com:
- entrada apenas por convite individual;
- aposta inicial completa;
- simulador de grupos;
- seleção dos melhores terceiros lugares;
- bracket automático dos 16-avos até à final;
- prémios individuais;
- apostas nos jogos reais das eliminatórias;
- notificações;
- ranking automático.

## Entrada por convite individual

A app não deve permitir registo livre.

Fluxo correto:
1. Admin cria um participante.
2. A app gera um código de convite único e aleatório.
3. O admin envia esse código à pessoa.
4. A pessoa cria conta com email, password pessoal e código.
5. A app valida o código.
6. O código fica marcado como usado.
7. O código não pode ser reutilizado.

O código deve ser individual. Não pode existir uma password geral partilhada.

Coleção Firestore sugerida:

invites:
- id
- code
- expectedName
- expectedEmail
- used
- usedByUserId
- createdAt
- usedAt
- createdBy

## Estados do utilizador

users:
- uid
- name
- email
- role: user ou admin
- inviteCode
- approved
- hasSubmittedInitialPrediction
- createdAt

Apenas utilizadores approved=true podem usar a app.

Admins podem:
- criar convites;
- ver convites usados e por usar;
- copiar códigos;
- desativar utilizadores;
- promover admins.

## Registo

Página /login ou /registo deve permitir:
- criar conta;
- nome;
- email;
- password;
- código de convite.

Sem código válido, a conta não fica aprovada.

Depois de entrar, se o utilizador ainda não submeteu a aposta inicial, deve ser redirecionado para /aposta-inicial.

## Aposta inicial

A aposta inicial é obrigatória e bloqueia depois de submetida.

Deve funcionar como um simulador do Mundial 2026.

### Grupos

Devem aparecer todos os grupos.

Em cada grupo:
- mostrar bandeira ou símbolo de cada país;
- mostrar nome da seleção;
- permitir ordenar as equipas por drag and drop;
- guardar a posição prevista de cada equipa.

Exemplo de dados guardados:

groupOrders:
{
  "A": ["mexico", "south_africa", "korea_republic", "czechia"],
  "B": ["canada", "switzerland", "qatar", "bosnia"]
}

A pontuação dá 5 pontos por cada posição correta no grupo.

### Melhores terceiros lugares

Depois dos grupos, a app deve listar os 12 terceiros classificados previstos.

O utilizador deve ordenar esses terceiros lugares.

Passam para os 16-avos os 8 melhores terceiros lugares.

A app deve guardar:
- thirdPlaceRanking;
- qualifiedThirdPlacedTeams.

### Equipas apuradas para 16-avos

A app deve guardar:
- todos os primeiros classificados;
- todos os segundos classificados;
- os 8 melhores terceiros classificados;
- total de 32 equipas.

Estes dados são usados para pontuação e para gerar o bracket.

### Bracket dos 16-avos

A app deve gerar automaticamente os matchups dos 16-avos de acordo com o formato oficial do Mundial 2026.

Importante:
- não inventar bracket;
- seguir a lógica oficial da FIFA;
- implementar matriz correta para alocação dos terceiros classificados;
- guardar os matchups gerados.

### Rondas

O utilizador escolhe quem passa em cada matchup.

Rondas:
- 16-avos / Round of 32;
- oitavos;
- quartos;
- meias;
- final.

A app deve guardar:
- roundOf32Teams;
- roundOf16Teams;
- quarterFinalTeams;
- semiFinalTeams;
- finalTeams;
- winner;
- runnerUp.

Isto é necessário para a pontuação.

### Prémios individuais

Na aposta inicial, o utilizador também escolhe:
- melhor marcador;
- melhor jogador;
- melhor jogador jovem;
- melhor guarda-redes.

Inicialmente pode ser texto livre.
Mais tarde pode passar a autocomplete.

## Pontuação da aposta inicial

Configuração editável pelo admin.

Valores default:
- 80 pontos por acertar vencedor;
- 60 pontos por acertar finalista;
- 40 pontos por acertar melhor marcador;
- 40 pontos por acertar melhor jogador;
- 30 pontos por acertar melhor jogador jovem;
- 25 pontos por acertar melhor guarda-redes;
- 40 pontos por cada equipa certa na final;
- 25 pontos por cada equipa certa na meia-final;
- 15 pontos por cada equipa certa nos quartos;
- 10 pontos por cada equipa certa nos oitavos;
- 5 pontos por cada equipa certa nos 16-avos;
- 5 pontos por cada posição certa no grupo.

## Jogos reais das eliminatórias

Durante as eliminatórias reais:
- a app cria os jogos automaticamente;
- importa odds 24h antes do jogo, se possível;
- permite fallback manual no admin;
- envia notificação quando a aposta abre;
- envia notificação 1h antes do jogo;
- fecha apostas no kickoff.

Nos jogos eliminatórios:
- utilizador aposta no resultado aos 90 minutos: casa, empate ou fora;
- utilizador aposta na equipa que passa;
- a partir dos quartos, também aposta no resultado exato final após 90/120 minutos, conforme regra definida.

## Odds

Objetivo:
- importar odds da Betclic 24h antes do jogo.

Requisito importante:
- deve existir fallback manual no admin, porque odds automáticas podem falhar ou exigir API paga.

## Resultados reais

Objetivo:
- atualizar resultados automaticamente através de fonte externa.

Requisito importante:
- deve existir fallback manual no admin.

## Ranking

Ranking deve atualizar:
- automaticamente no fim de cada dia;
- manualmente através de botão admin "Recalcular agora".

Leaderboard deve mostrar:
- posição;
- nome;
- pontos da aposta inicial;
- pontos dos jogos eliminatórios;
- total;
- data da última atualização.

## Notificações

Usar OneSignal.

Notificações:
- aposta aberta para jogo eliminatório;
- lembrete 1h antes;
- ranking atualizado;
- opcionalmente fim de prazo da aposta inicial.

## Design

A app deve ter aspeto premium, mobile-first, semelhante a uma plataforma oficial de prognósticos.

Pode usar:
- bandeiras;
- cores fortes;
- cartões;
- brackets visuais;
- animações subtis;
- ícones de bola/troféu.

Não deve usar logótipos oficiais protegidos da FIFA ou dizer que é site oficial.

Nome recomendado:
Prognósticos Mundial 2026

## Prioridades de implementação

Fase 1:
- sistema de convites individuais;
- bloquear acesso sem convite;
- admin cria convites.

Fase 2:
- simulador da aposta inicial;
- grupos com drag and drop;
- terceiros lugares;
- bracket;
- submissão bloqueada.

Fase 3:
- pontuação completa da aposta inicial.

Fase 4:
- jogos reais das eliminatórias;
- odds;
- resultados;
- notificações.

Fase 5:
- ranking automático diário;
- deploy final;
- melhoria visual.
