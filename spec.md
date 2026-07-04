# PokerBuild — Especificação do Projeto (spec.md)

## 1. Objetivo

PokerBuild é uma plataforma web de poker online focada em **cash games de Texas
Hold'em**. O objetivo imediato e prioritário é **migrar os 15 a 30 jogadores do clube
EXplode** (gerenciado pelo Pedrão, hoje no Suprema Poker) para uma plataforma própria,
gerando receita o quanto antes.

A referência de produto é o **Suprema Poker** — nos inspiramos nele, mas construímos
algo **mais simples e 100% funcional**. Nada de recursos supérfluos nesta fase.

### Princípio norteador
Rodar o quanto antes, com o essencial funcionando perfeitamente. Cada decisão de escopo
deve responder à pergunta: *"isso é necessário para os jogadores do EXplode jogarem
cash game hoje?"* Se a resposta for não, fica para depois.

---

## 2. Escopo do MVP

### Dentro do escopo (v1)
- Cadastro e login de jogadores (autenticação simples)
- Três papéis de acesso: `admin`, `manager`, `player`
- Lobby com lista de mesas de cash game disponíveis
- Mesa de Texas Hold'em cash game (No-Limit), 2 a 9 jogadores
- Motor de jogo completo: blinds, distribuição de cartas, rodadas de aposta,
  showdown, distribuição de pote (incluindo side pots para all-in)
- Ações do jogador: fold, check, call, bet, raise, all-in
- Comunicação em tempo real via WebSocket
- Gestão manual de fichas pelo `manager` (Pedrão adiciona/remove fichas)
- Painel do manager: controle de fichas, mesas e relatório de sessão
- Timer de ação por jogador (auto-fold ao esgotar)

### Fora do escopo (v1) — deixar como placeholder "Em breve"
- Torneios (MTT, Sit & Go)
- Sistema de pagamento integrado (depósito/saque automático)
- Modalidades além do Hold'em (Omaha, etc.)
- App mobile nativo
- Fast-fold, loterias, bounty, satélites
- Programa de afiliados / multi-clube

---

## 3. Papéis de Acesso (Roles)

### `admin` — Administrador do sistema (Luis e Luis-dev)
- Gerenciar todos os usuários (criar, editar role, desativar)
- Criar, editar, fechar mesas
- Acesso total ao painel financeiro (fichas em circulação)
- Manutenção do sistema
- Tudo que o manager pode fazer

### `manager` — Gerente do clube (Pedrão)
- Adicionar e remover fichas dos jogadores (é o "caixa" do clube)
- Criar, pausar e fechar mesas
- Iniciar mãos, remover jogadores de mesas (kick)
- Ver relatório de sessão (ganhos/perdas por jogador)
- NÃO pode criar admins/managers nem fazer manutenção do sistema

### `player` — Jogador (comunidade EXplode)
- Ver lobby e entrar/sair de mesas
- Executar ações de jogo
- Ver o próprio saldo e histórico

---

## 4. Regras de Negócio do Poker (Texas Hold'em No-Limit)

### 4.1 Estrutura da mão
1. **Blinds**: small blind (SB) e big blind (BB) postados obrigatoriamente
2. **Pré-flop**: cada jogador recebe 2 cartas privadas (hole cards); primeira aposta
   começa no jogador à esquerda do BB (UTG)
3. **Flop**: 3 cartas comunitárias reveladas; nova rodada de apostas
4. **Turn**: 1 carta comunitária; nova rodada
5. **River**: 1 carta comunitária; rodada final
6. **Showdown**: melhores 5 cartas de 7 (2 hole + 5 comunitárias) definem o vencedor

### 4.2 Posição do dealer
- O botão do dealer (D) rotaciona uma posição no sentido horário a cada mão
- SB = posição à esquerda do dealer; BB = posição à esquerda do SB
- Heads-up (2 jogadores): dealer é o SB e age primeiro no pré-flop

### 4.3 Ações válidas
- **Fold**: desiste da mão, perde o que já apostou
- **Check**: passa a vez sem apostar (só se não há aposta a pagar)
- **Call**: iguala a aposta atual
- **Bet**: primeira aposta da rodada (mínimo = 1 BB)
- **Raise**: aumenta uma aposta existente (mínimo = valor do último raise; padrão: dobrar)
- **All-in**: aposta todas as fichas restantes

### 4.4 Fim da rodada de apostas
A rodada termina quando todos os jogadores ativos igualaram a maior aposta (ou estão
all-in), e todos tiveram a chance de agir. Se um raise acontece, todos os demais
precisam agir novamente.

### 4.5 Side pots (all-in)
Quando um jogador vai all-in com menos fichas que a aposta dos demais, cria-se um
**pote lateral**. O jogador all-in só disputa o pote principal (main pot) até o valor
que contribuiu. Esta lógica é obrigatória e crítica.

### 4.6 Avaliação de mãos
Ranking padrão do poker (do mais forte ao mais fraco):
Royal Flush > Straight Flush > Quadra > Full House > Flush > Sequência >
Trinca > Dois Pares > Par > Carta Alta.
Usar a biblioteca `pokersolver` — não reimplementar.

### 4.7 Empates
Em caso de empate, o pote é dividido igualmente entre os vencedores. Sobras de fichas
(divisão não exata) vão para o jogador na pior posição (mais próximo do SB).

### 4.8 Rake (comissão)
O rake é como a plataforma gera receita. Configuração inicial:
- Percentual: 5% do pote (configurável por mesa)
- Teto (cap): máximo de 3 BB por mão (configurável)
- "No flop, no drop": se a mão termina no pré-flop sem flop, não há rake
Aplicar o rake ao pote antes de distribuir aos vencedores. Registrar o rake acumulado
por mesa/sessão (é a métrica de receita do negócio).

---

## 5. Gestão de Fichas (sem pagamento integrado)

Na v1 não há integração bancária. As fichas funcionam como um sistema fechado:
- O `manager` (Pedrão) adiciona fichas ao saldo de um jogador quando ele "deposita"
  (transação combinada fora da plataforma, como já funciona no clube hoje)
- O `manager` remove fichas quando o jogador "saca"
- Todo movimento de fichas fica registrado num log de transações (auditoria)
- O `manager` vê um relatório de sessão: quanto cada jogador tinha, quanto tem agora,
  resultado líquido

Isso espelha exatamente como o Pedrão já opera o clube no Suprema Poker hoje, o que
facilita a migração dos jogadores.

---

## 6. Arquitetura Técnica

### Stack
- **Backend**: Node.js 20 + NestJS 10
- **Tempo real**: Socket.IO (WebSocket) via `@nestjs/websockets`
- **Banco**: SQLite (dev/beta) com TypeORM — migração para PostgreSQL quando escalar
- **Auth**: JWT + bcrypt
- **Avaliação de mãos**: `pokersolver`
- **Frontend**: React 18 + TypeScript + Vite
- **Estado (client)**: Zustand
- **Estilo**: TailwindCSS (mínimo, funcional)

### Por que WebSocket
Poker é um jogo de estado compartilhado em tempo real: quando um jogador age, todos os
outros na mesa precisam ver imediatamente. HTTP request/response não serve para isso.
O Socket.IO gerencia as "rooms" (uma por mesa) e o broadcast do estado.

### Regra de ouro da segurança
O **servidor é a única fonte de verdade**. O cliente nunca calcula resultado de mão,
nunca decide de quem é a vez, nunca sabe as cartas dos outros. O servidor:
- Mantém todo o estado do jogo
- Valida cada ação (é a vez desse jogador? a ação é legal?)
- Envia para cada jogador **apenas** as informações que ele pode ver
  (suas próprias cartas + cartas comunitárias + ações públicas)

Vazar as `holeCards` de um jogador para outro é a falha mais grave possível. O método
que monta o estado da mesa deve mascarar as cartas alheias sempre.

### Topologia de rede (beta)
- Servidor roda na máquina do Pedrão (ou um VPS quando for pra valer)
- Jogadores acessam via browser
- Para hospedagem online: **Railway** ou **Render** (mais fáceis) ou **Hostinger VPS**
  (Hostinger shared hosting NÃO funciona — não suporta processo Node.js persistente)

---

## 7. Modelo de Dados (entidades principais)

### User
`id, username, displayName, passwordHash, chips, role, isActive, createdAt`

### PokerTable
`id, name, maxSeats, smallBlind, bigBlind, minBuyIn, maxBuyIn, rakePercent, rakeCap, status`

### Game (uma mão/estado de jogo por mesa)
`id, tableId, phase, handNumber, pot, communityCards, deck, dealerPosition,
currentTurnUserId, currentBetAmount, startedAt`

### PlayerSeat (um jogador sentado numa mesa)
`id, gameId, userId, seatPosition, stackSize, currentBet, totalBetInHand, holeCards,
status, isDealer, isSmallBlind, isBigBlind, hasActed, isConnected`

### ChipTransaction (auditoria de fichas)
`id, userId, managerId, amount, operation (add/remove/set), reason, createdAt`

---

## 8. Fluxo Principal (jogador)

1. Jogador abre o browser no endereço da plataforma
2. Faz login com usuário/senha
3. Vê o lobby com as mesas de cash game do EXplode
4. Escolhe uma mesa e define o buy-in (dentro do min/max da mesa)
5. Senta na mesa (fichas do saldo viram stack na mesa)
6. Joga as mãos em tempo real
7. Sai da mesa a qualquer momento (stack restante volta ao saldo)

## 9. Fluxo do Manager (Pedrão)

1. Login como manager
2. Painel: vê jogadores, fichas de cada um, mesas ativas
3. Adiciona fichas quando um jogador deposita (combinado externamente)
4. Cria mesas conforme a demanda
5. Acompanha o relatório da sessão (receita de rake, resultado dos jogadores)

---

## 10. Critérios de "Pronto" (Definition of Done da v1)

A v1 está pronta para o clube EXplode quando:
- [ ] Um jogador consegue se cadastrar/logar
- [ ] O manager consegue adicionar fichas a um jogador
- [ ] Um jogador consegue entrar numa mesa com buy-in
- [ ] Uma mão completa roda: blinds → preflop → flop → turn → river → showdown
- [ ] Todas as ações funcionam: fold, check, call, bet, raise, all-in
- [ ] Side pots funcionam corretamente em cenários de all-in
- [ ] O vencedor é determinado corretamente e recebe o pote
- [ ] O rake é descontado e registrado
- [ ] As cartas de um jogador nunca aparecem para outro
- [ ] 6+ jogadores conseguem jogar simultaneamente sem travar
- [ ] O manager vê o relatório de sessão ao final

Quando todos os itens acima passam, a plataforma pode receber os jogadores do EXplode.
