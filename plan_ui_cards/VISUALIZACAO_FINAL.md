# 🎮 Visualização Final da UI

## Estado Atual vs Estado Final

### ATUAL (Text-based)

```
┌──────────────────────────────────────────────────────────────┐
│ Mesa High Stakes                  Stack: 1000    [Sair]      │
│ Blinds 10/20 (active)                                        │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ Mão #42 │ Fase: Pré-flop │ Pote: 450 │ Vez de: João (5s)  │
│ Mesa: A♥ K♦ 7♣                                              │
│ Suas cartas: J♠ T♠                                          │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│ Pos. │ Jogador   │ Stack │ Aposta │ Status      │ Cartas   │
├──────┼───────────┼───────┼────────┼─────────────┼──────────┤
│ 1    │ João      │ 800   │ 20     │ Na mão ◄    │ ?  ?     │
│ 2    │ Maria   D │ 1200  │ 0      │ Aguardando  │ —        │
│ 3    │ Pedro  SB│ 300   │ 10     │ Foldou      │ —        │
│ 4    │ Ana    BB│ 2000  │ 20     │ Na mão      │ ?  ?     │
│ 5    │ Carlos    │ 500   │ 0      │ Aguardando  │ —        │
│ 6    │ Fernando  │ 1500  │ 400    │ All-in      │ ?  ?     │
│      │ (você)    │ 1000  │ 0      │ Aguardando  │ J♠ T♠    │
├──────────────────────────────────────────────────────────────┤
│ Histórico       │ Chat                                       │
│ • João fez bet  │ João: let's go!                           │
│ • Ana called    │ Maria: nice hand                          │
│ • Fernando fold │ Pedro: que cartas...                      │
│                 │ [Digitar mensagem...]                     │
└──────────────────────────────────────────────────────────────┘
```

---

### NOVO (Mesa Visual Interativa)

```
╔═══════════════════════════════════════════════════════════════════════╗
║                    🎰 Mesa High Stakes - Jogo Ao Vivo 🎰             ║
║                                                                       ║
║           [👁️ Vista Mesa] [📊 Vista Tabela] ⚙️ Configurações         ║
║                                                                       ║
║ ┌─────────────────────────────────────────────────────────────────┐ ║
║ │                                                                 │ ║
║ │                  ┌──────────────────────┐                      │ ║
║ │                  │  MESA (Felt Verde)   │                      │ ║
║ │                  │                      │                      │ ║
║ │      Maria (SB)  │    A♥  K♦  7♣       │   João ◄(Vez)        │
║ │       $1200      │                      │      $800            │
║ │    ┌────┬────┐   │    [Pote: 450]       │   ┌────┬────┐        │
║ │    │ ?  │ ?  │   │                      │   │ J♠ │ T♠ │✨       │
║ │    └────┴────┘   │                      │   └────┴────┘        │
║ │                  │                      │                      │
║ │    Pedro (Fold)  │                      │   Ana                │
║ │    (opacity 50%) │    [Dealer Badge]    │   (All-in) $2000    │
║ │    $300          │                      │   ┌────┬────┐        │
║ │                  │                      │   │ ?  │ ?  │        │
║ │                  │                      │   └────┴────┘        │
║ │      Carlos      │                      │   Fernando           │
║ │     $500         │  🔹 Fernando: $500   │   $1500              │
║ │   ┌────┬────┐    │  🔹 João: $400      │   ┌────┬────┐        │
║ │   │ ?  │ ?  │    │                      │   │ ?  │ ?  │        │
║ │   └────┴────┘    │                      │   └────┴────┘        │
║ │                  │                      │                      │
║ │   Fernando (BB)  │     Aposta: $20      │   Você               │
║ │    $1500         │  Fase: Pré-flop     │   $1000              │
║ │   ┌────┬────┐    │  Mão: #42           │   ┌────┬────┐        │
║ │   │ J♦ │ 9♦ │✨   │                      │   │ J♠ │ T♠ │✨✨     │
║ │   └────┴────┘    │                      │   └────┴────┘        │
║ │                  └──────────────────────┘                      │
║ │                                                                 │
║ │                      [Fold] [Check] [Bet]                      │
║ │                         [Raise] [All-in]                       │
║ │                                                                 │
║ └─────────────────────────────────────────────────────────────────┘ ║
║                                                                       ║
║ Legenda:                                                              ║
║ ✨ = Suas cartas (realçadas)                                         ║
║ ◄ = Sua vez (realçado em verde)                                      ║
║ 🔹 = Apostas na mesa                                                 ║
║ D = Dealer  |  SB = Small Blind  |  BB = Big Blind                  ║
║                                                                       ║
╚═══════════════════════════════════════════════════════════════════════╝

ANIMAÇÕES:
┌─ Cartas entram com fade + slide (300ms)
├─ Flip 3D quando reveladas (600ms)
├─ Sombra dinâmica baseada no tema
├─ Transição suave ao trocar temas
└─ Pulsação sutil na sua vez
```

---

## Página de Configurações

```
╔════════════════════════════════════════════════════════════════╗
║                    ⚙️ CONFIGURAÇÕES                          ║
║                                                                ║
║ PREFERÊNCIAS DE JOGO                                          ║
║ ───────────────────────────────────────────────────────────── ║
║                                                                ║
║ 🎨 Tema de Cartas:                                            ║
║                                                                ║
║ ┌─────────────────────────────────────────────────────────┐  ║
║ │                                                         │  ║
║ │ ✓ CLÁSSICO                                              │  ║
║ │   Estilo tradicional com fundo branco                   │  ║
║ │                                                         │  ║
║ │   [Preview: A♥  K♠  ?]                                  │  ║
║ │                                                         │  ║
║ └─────────────────────────────────────────────────────────┘  ║
║                                                                ║
║ ┌─────────────────────────────────────────────────────────┐  ║
║ │                                                         │  ║
║ │ ○ MODERNO                                               │  ║
║ │   Minimalista com gradientes suaves                     │  ║
║ │                                                         │  ║
║ │   [Preview: A♥  K♠  ?]                                  │  ║
║ │                                                         │  ║
║ └─────────────────────────────────────────────────────────┘  ║
║                                                                ║
║ ┌─────────────────────────────────────────────────────────┐  ║
║ │                                                         │  ║
║ │ ○ ESCURO (Dark Mode)                                    │  ║
║ │   Tema dark com acentos dourados                        │  ║
║ │                                                         │  ║
║ │   [Preview: A♥  K♠  ?]                                  │  ║
║ │                                                         │  ║
║ └─────────────────────────────────────────────────────────┘  ║
║                                                                ║
║ 🏆 Layout da Mesa:                                            ║
║                                                                ║
║ ✓ Oval para 6 jogadores                                       ║
║ ○ Circular para 9 jogadores  (futuro)                        ║
║ ○ Hexagonal customizado      (futuro)                        ║
║                                                                ║
║ ☑️ Habilitar Animações                                        ║
║ ☑️ Som nos eventos                                            ║
║ ☑️ Notificações quando é sua vez                              ║
║                                                                ║
║ ────────────────────────────────────────────────────────────  ║
║                                                                ║
║                         [💾 Salvar]  [❌ Cancelar]            ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
```

---

## Efeitos Visuais & Animações

### 1. Entrada de Carta (Flop)

```
Timeline: 0ms → 300ms

0ms (início):
    ┌──┐
    │?│  opacity: 0% | transform: scale(0.8) translateY(-20px)
    └──┘

150ms (meio):
    ┌──┐
    │A│  opacity: 50% | scale(1.1) translateY(-5px)
    └──┘

300ms (final):
    ┌──┐
    │A♥│ opacity: 100% | scale(1) translateY(0)
    └──┘  [Carta fixada na posição]
```

### 2. Flip 3D (Revelar Hole Cards)

```
Timeline: 0ms → 600ms

0ms:       150ms:      300ms:       450ms:      600ms:
┌──┐      ┌──┐        ╱────╲       ┌──┐        ┌──┐
│?│        │░│  ════   ║░░░░║  ════ │A│        │A♥│
└──┘      └──┘        ╲────╱       └──┘        └──┘
(face)    (turning)    (middle)    (turning)   (revealed)

Efeito 3D com perspectiva e depth
```

### 3. Pulse na Sua Vez

```
Contínuo enquanto sua vez:

     ╔═══════════════════╗
     ║                   ║
     ║    Suas Cartas    ║  brightness: 100%
     ║    ┌────┬────┐    ║
     ║    │ J  │ T  │    ║
     ║    └────┴────┘    ║
     ║                   ║
     ╚═══════════════════╝

     ╔═══════════════════╗
     ║ ✨ ✨             ║
     ║    Suas Cartas    ║  brightness: 120% + glow
     ║    ┌────┬────┐    ║
     ║    │ J  │ T  │    ║
     ║    └────┴────┘    ║
     ║ ✨ ✨             ║
     ╚═══════════════════╝

Ciclo: 500ms → 1000ms → 500ms (repetir)
```

### 4. Fade-In da Mesa

```
Quando entrar na mesa (página carrega):

     (vazio)          50%              100%
     
                     ┌────────┐
                     │ MESA   │  opacity: 50%
                     │        │  scale: 0.95
                     └────────┘

                     ┌────────────┐
                     │   MESA     │  opacity: 100%
                     │  (assentos)│  scale: 1
                     │  (pote)    │
                     └────────────┘
```

### 5. Highlight do Jogador Atual

```
Estado Normal:              Estado da Sua Vez:

┌─ Maria ─┐                ┌─ Maria ─┐
│ $1200   │                │ $1200   │
│ ┌─┬─┐   │                │ ┌─┬─┐   │
│ │?│?│   │                │ │?│?│   │  ✨ Brilho verde
│ └─┴─┘   │                │ └─┴─┘   │
└─────────┘                └─────────┘
bg: gray                   bg: emerald
border: gray               border: bright emerald
```

---

## Feedback Visual por Ação

```
┌──────────────────────────────────────────────────────────┐
│ AÇÃO DO JOGADOR                                          │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ FOLD                                                     │
│ ├─ Card container fade out (200ms)                      │
│ ├─ Status muda para "Foldou"                            │
│ ├─ Opacity da linha reduz para 50%                      │
│ └─ Texto fica cinza                                     │
│                                                          │
│ CALL / BET                                               │
│ ├─ Cartas destacam com glow                             │
│ ├─ Stack diminui com animação                           │
│ ├─ Chip animado vai pra mesa                            │
│ ├─ Pote atualiza com transição                          │
│ └─ Status muda para "Aguardando"                        │
│                                                          │
│ ALL-IN                                                   │
│ ├─ Card container pisca (pulsa)                         │
│ ├─ Stack vira 0 com shake                               │
│ ├─ Status fica "All-in" em vermelho                     │
│ └─ Background fica levemente vermelha                   │
│                                                          │
│ TURNOS TROCAM                                            │
│ ├─ Jogador anterior: highlight sai                      │
│ ├─ Novo jogador: glow entra + pulse                     │
│ ├─ Delay pequeno (100ms) entre mudanças                 │
│ └─ Timer de ação aparece ao lado                        │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## Responsividade

### Desktop (≥1024px)

```
┌─────────────────────────────────────────────────────────────┐
│ Header                                                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                  ┌─────────────────┐                        │
│                  │   MESA VISUAL   │                        │
│                  │   (GRANDE)      │                        │
│                  │                 │                        │
│  Histórico       │  600x400px      │   Chat                │
│  da Mão          │                 │   Panel               │
│  (botão)         │                 │   (sidebar)           │
│                  └─────────────────┘                        │
│                                                             │
│                [Fold] [Check] [Bet] ...                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Tablet (640px - 1024px)

```
┌──────────────────────────┐
│ Header                   │
├──────────────────────────┤
│  ┌────────────────────┐  │
│  │   MESA VISUAL      │  │
│  │   (MÉDIO)          │  │
│  │  450x350px         │  │
│  └────────────────────┘  │
│                          │
│ [Fold][Check][Bet]...   │
│                          │
│ Histórico | Chat (stack) │
│                          │
└──────────────────────────┘
```

### Mobile (≤640px)

```
┌─────────────────┐
│  Header         │
├─────────────────┤
│                 │
│ [📊 Tabela]     │  Toggle:
│ [🎮 Mesa]       │  - Mesa compactada
│                 │  - Ou voltar para tabela
├─────────────────┤
│   ┌───────────┐ │
│   │ MESA MINI │ │
│   │ 350x250px │ │
│   └───────────┘ │
│                 │
│   Suas cartas   │
│   ┌─┬─┐        │
│   │J│T│        │
│   └─┴─┘        │
│                 │
│  [Fold][Call]  │
│   [Raise]      │
│                 │
│  Histórico/Chat │
│   (scrollable)  │
│                 │
└─────────────────┘
```

---

## Temas: Comparação Visual

### Tema Clássico (Padrão)

```
┌────────────────────┐
│  [A♥] [K♠] [?]    │
│  ██████████████    │
│ ┌────────────────┐ │
│ │A♥              │ │
│ │                │ │ Fundo: Branco
│ │                │ │ Borda: Cinza
│ │           K♠   │ │ Sombra: Média
│ │                │ │ Size: 60x90px
│ │              A♥│ │
│ └────────────────┘ │
│  ██████████████    │
│ card-classic.css   │
└────────────────────┘
```

### Tema Moderno (Futuro)

```
┌────────────────────┐
│  [A♥] [K♠] [?]    │
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓   │
│ ┌────────────────┐ │
│ │A♥──────────────│ │
│ │                │ │ Fundo: Gradiente
│ │                │ │ Borda: Fina/moderno
│ │                │ │ Sombra: Alta
│ │                │ │ Size: 70x100px
│ │──────────────K♠│ │
│ └────────────────┘ │
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓   │
│ card-modern.css    │
└────────────────────┘
```

### Tema Dark (Futuro)

```
┌────────────────────┐
│  [A♥] [K♠] [?]    │
│  ████████████████  │
│ ┌────────────────┐ │
│ │▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│ │
│ │▓ A♥         ▓  │ │ Fundo: Preto/Dark
│ │▓            ▓  │ │ Borda: Gold/Bronze
│ │▓     ♥      ▓  │ │ Sombra: Alta
│ │▓            ▓  │ │ Size: 65x95px
│ │▓ K♠        ▓   │ │ Detalhes: Gold
│ │▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│ │
│ └────────────────┘ │
│  ████████████████  │
│ card-dark.css      │
└────────────────────┘
```

---

## Estados da Mesa

### Estado: Aguardando Jogo

```
┌──────────────────────────────┐
│   MESA (Aguardando)          │
│                              │
│                              │
│   [Nenhuma mão em progresso]  │
│                              │
│   [📊 Pressione para iniciar] │
│                              │
│                              │
└──────────────────────────────┘
```

### Estado: Pré-Flop

```
┌──────────────────────────────┐
│   Mão #42 | Pré-flop         │
│                              │
│         [?]                  │
│      [Pote: 450]             │
│                              │
│   ◄ João tem a vez (5s)      │
│   Aposta atual: 20           │
│                              │
└──────────────────────────────┘
```

### Estado: Flop

```
┌──────────────────────────────┐
│   Mão #42 | Flop             │
│                              │
│    [A♥][K♦][7♣]              │
│      [Pote: 450]             │
│                              │
│   ◄ Fernando tem a vez (3s)  │
│                              │
└──────────────────────────────┘
```

### Estado: Showdown

```
┌──────────────────────────────┐
│   Mão #42 | Showdown         │
│                              │
│    [A♥][K♦][7♣][2♠][9♥]      │
│                              │
│   🏆 João venceu!            │
│   Mão: Flush em Copas        │
│   Prêmio: +650 chips         │
│                              │
│ [👍 Próxima mão em 3s...]    │
│                              │
└──────────────────────────────┘
```

---

## Performance Targets Visuais

```
┌─────────────────────────────────────────────────┐
│ MÉTRICA VISUAL                    │ ALVO        │
├─────────────────────────────────────────────────┤
│ FPS durante animação             │ 60 FPS ✓   │
│ Latência de ação → animação      │ < 100ms    │
│ Tempo de carregamento            │ < 2s       │
│ Uso de memória (6 cards)         │ < 2MB      │
│ Tamanho de bundle (cards)        │ < 15KB     │
│ Suporte a 100+ animações         │ Sim ✓      │
│ Mobile smooth scrolling          │ Sim ✓      │
│ Compatibilidade browsers         │ Chrome,   │
│                                  │ Firefox,  │
│                                  │ Safari,   │
│                                  │ Edge      │
└─────────────────────────────────────────────────┘
```

