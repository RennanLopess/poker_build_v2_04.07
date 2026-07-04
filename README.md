# PokerBuild

Plataforma web de poker (cash game Texas Hold'em No-Limit) para o clube **EXplode**.
Simplicidade e correção da lógica de jogo acima de tudo — sem torneios, sem pagamento
integrado, sem recursos supérfluos nesta v1. Ver [`spec.md`](spec.md) para a especificação
completa e [`CLAUDE.md`](CLAUDE.md) para os padrões de arquitetura do projeto.

## Stack

- **Backend**: Node.js 20, NestJS 10, Socket.IO, TypeORM 0.3 + SQLite (`better-sqlite3`)
- **Motor de mãos**: [`pokersolver`](https://www.npmjs.com/package/pokersolver)
- **Auth**: JWT (`@nestjs/jwt`) + `bcrypt`
- **Frontend**: React 18 + Vite 5 + TailwindCSS 3 + Zustand + `socket.io-client`

## Arquitetura

O **servidor é a única fonte de verdade**. O cliente nunca calcula o vencedor de uma
mão, nunca decide de quem é a vez e nunca conhece as cartas de outros jogadores — o
método que monta o estado da mesa mascara as `holeCards` de todos exceto do jogador que
está pedindo o estado. Toda mudança de estado é persistida no banco antes de qualquer
broadcast via WebSocket.

```
pokerbuild/
├── server/                   backend NestJS (porta 3000)
│   └── src/
│       ├── auth/             login, JWT, guards, roles
│       ├── users/             usuários e saldos
│       ├── tables/            mesas
│       ├── game/              motor do jogo (poker.ts + game.service.ts + gateway)
│       ├── manager/           fichas, relatórios, controle de mesas
│       └── database/          seed
└── client/                   frontend React (porta 5173 em dev)
    └── src/
        ├── pages/             Login, Lobby, Table, Manager
        ├── components/        componentes por domínio
        ├── hooks/             useSocket, useAuth
        ├── store/              Zustand
        └── lib/                api, socket, cartas
```

## Como rodar

Requer Node.js 20+.

```bash
npm run install:all   # instala dependências de root, server e client
npm run seed          # popula o banco com usuários e mesas de teste (idempotente)
npm run dev           # sobe server (:3000) e client (:5173) juntos
```

Acesse `http://localhost:5173` e faça login com um dos usuários de teste abaixo.

### Outros comandos

```bash
npm run build          # build de produção (client + server)
cd server && npx jest   # testes unitários do motor de jogo (side pots, showdown, rake)
```

### Usuários de teste (após `npm run seed`)

| Usuário     | Senha         | Papel   |
|-------------|---------------|---------|
| `admin`     | `admin123`    | admin   |
| `pedro`     | `explode123`  | manager |
| `jogador1`  | `poker123`    | player  |
| `jogador2`…`jogador6` | `poker123` | player |

## Funcionalidades da v1

- Cadastro/login com JWT e três papéis de acesso (`admin`, `manager`, `player`)
- Lobby com mesas de cash game disponíveis (buy-in configurável por mesa)
- Motor completo de Texas Hold'em No-Limit: blinds, preflop → flop → turn → river →
  showdown, todas as ações (fold, check, call, bet, raise, all-in)
- **Side pots** corretos em cenários de all-in múltiplo, com sobras de divisão indo
  para a pior posição
- Rake configurável por mesa (percentual + teto), com regra "no flop, no drop"
- Timer de ação (30s) com auto-fold/check e início automático da próxima mão
- Painel do manager: ajuste de fichas (auditado), controle de mesas (criar, pausar,
  fechar, kick), relatório de sessão exportável em `.txt`
- Chat em tempo real na mesa

## Fora de escopo (v1)

Torneios, pagamento integrado, outras modalidades além de Hold'em, app mobile nativo —
ver seção 2 de [`spec.md`](spec.md) para a lista completa.
