# CLAUDE.md — Padrões do Projeto PokerBuild

Este arquivo orienta o Claude Code (Fable 5) sobre como trabalhar neste repositório.
Leia por completo antes de gerar ou modificar código.

---

## Visão Geral

PokerBuild é uma plataforma web de poker (cash game Texas Hold'em No-Limit) para migrar
os jogadores do clube EXplode. O foco é **simplicidade e funcionalidade completa** —
rodar o quanto antes, sem recursos supérfluos. Ver `spec.md` para o escopo completo.

**Prioridade absoluta**: a lógica do jogo tem que estar 100% correta. Um bug em side pot,
em ordem de ação ou em vazamento de cartas é inaceitável. Visual é secundário.

---

## Stack e Versões

- Node.js 20, NestJS 10, TypeScript 5
- Socket.IO via `@nestjs/websockets` + `@nestjs/platform-socket.io`
- TypeORM 0.3 + `better-sqlite3` (SQLite)
- `pokersolver` para avaliação de mãos
- JWT (`@nestjs/jwt`) + `bcrypt`
- Frontend: React 18 + Vite 5 + TailwindCSS 3 + Zustand

Não introduzir bibliotecas novas sem necessidade clara. Se precisar de uma, justifique
no comentário do commit.

---

## Estrutura de Pastas

```
pokerbuild/
├── spec.md                   ← especificação (fonte de verdade do escopo)
├── CLAUDE.md                 ← este arquivo
├── package.json              ← root (scripts orquestradores)
├── server/                   ← backend NestJS (porta 3000)
│   └── src/
│       ├── auth/             ← login, JWT, guards, roles
│       ├── users/            ← usuários e saldos
│       ├── tables/           ← mesas
│       ├── game/             ← MOTOR DO JOGO (parte mais crítica)
│       ├── manager/          ← endpoints do manager (fichas, relatórios)
│       └── database/         ← seed e config
└── client/                   ← frontend React (porta 5173 em dev)
    └── src/
        ├── pages/            ← Login, Lobby, Table, Manager
        ├── components/       ← componentes por domínio
        ├── hooks/            ← useSocket, useAuth
        ├── store/            ← Zustand
        └── types/            ← tipos compartilhados
```

---

## Princípios de Arquitetura

### 1. O servidor é a única fonte de verdade
O cliente **nunca**:
- Calcula o vencedor de uma mão
- Decide de quem é a vez
- Conhece as cartas de outros jogadores
- Valida se uma ação é legal (o servidor revalida sempre)

O cliente só renderiza o estado que o servidor envia e emite intenções de ação.

### 2. Segurança de cartas (regra inviolável)
O método que monta o estado da mesa (`getTableState`) recebe o `userId` de quem está
pedindo e **mascara as holeCards de todos os outros jogadores** (envia `null`).
Nunca fazer broadcast único do estado com cartas de todos — cada jogador recebe sua
versão. Testar isso explicitamente.

### 3. Persistir antes de emitir
Toda mudança de estado é salva no banco **antes** de qualquer broadcast via Socket.IO.
O WebSocket reflete o banco, nunca o contrário.

### 4. Separação de camadas
- **Gateway** (`*.gateway.ts`): recebe eventos do socket, valida autenticação, delega
  para o service, emite respostas. NÃO contém lógica de jogo.
- **Service** (`*.service.ts`): toda a lógica de negócio. Não conhece Socket.IO.
- **Controller** (`*.controller.ts`): endpoints HTTP (REST) para o que não é tempo real.
- **Entity** (`*.entity.ts`): modelo de dados TypeORM.

---

## Convenções de Código

### Geral
- TypeScript estrito onde possível; evitar `any` (exceto em integrações sem tipos).
- **Não escrever comentários no código de produção.** O código deve ser autoexplicativo
  através de nomes claros. Exceção: a lógica do motor de poker pode ter comentários curtos
  explicando regras de negócio não óbvias (ex: cálculo de side pot).
- Nomes de variáveis e funções em inglês; textos de UI em português (pt-BR).
- Funções pequenas e com responsabilidade única.

### Backend (NestJS)
- Um módulo por domínio (`AuthModule`, `GameModule`, etc.).
- Injeção de dependência via construtor.
- DTOs com `class-validator` para validar entrada de dados.
- Guards para autorização: `JwtAuthGuard` (autenticado) e `RolesGuard` (papel específico).
- Usar o decorator `@Roles('admin', 'manager')` para proteger rotas por papel.

### Frontend (React)
- Componentes funcionais com hooks.
- Estado global de jogo no Zustand (`gameStore`).
- Toda comunicação com socket centralizada no hook `useSocket`.
- Componentes de UI simples e funcionais — sem animações complexas nesta fase.
- Representar cartas como texto (`A♠`, `K♥`, `10♦`) — não priorizar imagens/estilo.

### Banco (SQLite + TypeORM)
- Arrays e objetos são armazenados como JSON string (`JSON.stringify`/`parse`).
  SQLite não tem tipo array nativo.
- `synchronize: true` apenas em dev. Não usar em produção.
- IDs são UUID (`@PrimaryGeneratedColumn('uuid')`).

---

## Padrão de Eventos WebSocket

### Cliente → Servidor
- `join_table` `{ tableId, buyIn }`
- `leave_table` `{}`
- `player_action` `{ action, amount? }`
- `request_start_hand` `{}`
- `chat_message` `{ message }`

### Servidor → Cliente
- `table_state` — estado completo da mesa (com cartas mascaradas por jogador)
- `your_cards` — cartas privadas do jogador (enviado só para ele)
- `action_required` — opções de ação quando é a vez do jogador
- `hand_result` — resultado do showdown
- `chat_message` — mensagem de chat
- `error` — erro (ação inválida, não autorizado)

Nomes de eventos em snake_case. Payloads sempre objetos (nunca valores soltos).

---

## O Motor de Jogo (game/) — atenção redobrada

Esta é a parte mais crítica do projeto. Ao trabalhar em `game.service.ts`:

- Implementar a lógica de forma testável e determinística.
- Testar mentalmente cada cenário: heads-up, 9-max, all-in múltiplo, side pots,
  empates, jogador que desconecta no meio da mão.
- A ordem de ação pré-flop começa em UTG (esquerda do BB); pós-flop começa no
  primeiro jogador ativo à esquerda do dealer.
- Side pots: quando há all-in com valores diferentes, calcular os potes corretamente.
  Este é o ponto que mais gera bug — dar atenção especial e escrever de forma clara.
- Rake: descontar do pote antes de distribuir. Aplicar "no flop, no drop".

Se possível, criar testes unitários para a lógica de distribuição de potes e avaliação
de mãos antes de conectar ao WebSocket.

---

## Fluxo de Trabalho

1. Antes de codar uma feature, confira o `spec.md` para o escopo.
2. Trabalhe em incrementos pequenos e funcionais.
3. Após cada mudança relevante, verifique que `npm run dev` sobe sem erros.
4. Não adicione features fora do escopo da v1 (ver `spec.md` seção 2).
5. Ao terminar uma parte, teste o fluxo completo antes de seguir.

---

## O que NÃO fazer

- Não implementar torneios, pagamentos, ou modalidades além do Hold'em na v1.
- Não colocar lógica de jogo no cliente.
- Não fazer broadcast de estado com cartas de todos os jogadores.
- Não escrever comentários desnecessários no código.
- Não adicionar dependências sem necessidade.
- Não priorizar visual/animação em detrimento da lógica.
- Não usar `synchronize: true` em produção.

---

## Comandos Úteis

```bash
npm run install:all   # instala deps de root, server e client
npm run seed          # popula o banco com usuários e mesas de teste
npm run dev           # sobe server + client juntos
npm run build         # build de produção
```

Usuários de teste (após seed):
- `admin` / `admin123` (admin)
- `pedro` / `explode123` (manager — Pedrão)
- `jogador1` a `jogador6` / `poker123` (players)
