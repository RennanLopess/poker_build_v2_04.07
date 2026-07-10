# 🏗️ Arquitetura Visual e Fluxos de Dados

## 🔄 Fluxo 1: Renderização de Carta com Tema

```
User Component (Seat.tsx)
        ↓
    CardContainer ← tema selecionado (uiStore)
        ↓
    CardRenderer ← CardTheme específico
        ↓
    <div> com CSS do tema
        ↓
    Tela do jogador
```

**Código:**
```typescript
// Em Seat.tsx
const theme = useCardTheme();  // Hook que pega tema do store
<CardContainer 
  card="AH" 
  theme={theme}
  animation="enter"
/>
```

---

## 🎮 Fluxo 2: Seleção e Persistência de Tema

```
┌─────────────────────────────────────────────────┐
│  SettingsPage (página de preferências)          │
│  Seletor: [Clássico ▼] [Moderno ▼] [Dark ▼]   │
└────────────────────┬────────────────────────────┘
                     ↓
            uiStore.setCardTheme('modern')
                     ↓
            localStorage: { cardTheme: 'modern' }
                     ↓
            Todos os componentes re-renderizam
                     ↓
        useCardTheme() retorna tema 'modern'
                     ↓
         Cartas mudam de estilo instantaneamente
```

---

## 🎯 Fluxo 3: Animação de Carta (Entrada de Flop)

```
Timeline de 300ms:
│
├─ 0ms: CardContainer monta
│       ↓
│       className = 'card-enter' (CSS animation)
│       top: -50px, opacity: 0
│
├─ 150ms (metade):
│       Animação em progresso
│       top: 0px gradualmente
│       opacity: 1 gradualmente
│
└─ 300ms: Animação termina
          className remove 'card-enter'
          Card em posição final

     [Visual do CSS]
     @keyframes cardEnter {
       from { opacity: 0; transform: translateY(-20px); }
       to { opacity: 1; transform: translateY(0); }
     }
```

---

## 🪑 Fluxo 4: Posicionamento de Assentos na Mesa

```
PokerTableLayout recebe: maxSeats = 6

↓ Calcula posições usando tableGeometry.ts

Assento 1: top: 10%, left: 50%  (topo)
Assento 2: top: 35%, left: 75%  (direita-cima)
Assento 3: top: 65%, left: 75%  (direita-baixo)
Assento 4: top: 90%, left: 50%  (baixo)
Assento 5: top: 65%, left: 25%  (esquerda-baixo)
Assento 6: top: 35%, left: 25%  (esquerda-cima)

↓ CSS Grid posiciona cada Seat

        ┌─────────────────────┐
      S1/S6                   S2
        │     MESA VISUAL     │
      S5│                     │S3
        │                     │
      S4/S4                   S4
        └─────────────────────┘
```

---

## 🎨 Fluxo 5: Carregamento de Tema na Inicialização

```
App.tsx monta
    ↓
useGameStore.token carrega do localStorage
    ↓
CardThemeRegistry.init() executa
    ├─ Registra: classicTheme
    ├─ Registra: modernTheme (futuro)
    └─ Registra: darkTheme (futuro)
    ↓
uiStore.selectedCardTheme = 'classic' (padrão)
    ou
uiStore.selectedCardTheme = localStorage['theme'] (se existir)
    ↓
Components usam: const theme = useCardTheme()
    ↓
Todos renderizam com tema correto
```

---

## 📊 Estrutura do CardTheme Object

```typescript
CardTheme {
  id: 'classic'                    // Identificador único
  name: 'Clássico'                 // Nome legível
  description: 'Estilo tradicional'// Descrição
  
  card: {
    width: 60px                    // Tamanho
    height: 90px
    borderRadius: 6px
    shadowIntensity: 'medium'      // Sombra: low/medium/high
    animationSpeed: 'medium'       // Velocidade: fast/medium/slow
  }
  
  colors: {
    suitRed: '#dc2626'            // Cor de ouros/copas
    suitBlack: '#1f2937'          // Cor de espadas/paus
    background: '#ffffff'         // Fundo da carta
    border: '#e5e7eb'             // Borda
    cornerBg: '#f3f4f6'           // Fundo dos cantos
  }
  
  assets?: {                        // Futuro
    cardBackImage: 'url(...)'      // Imagem do verso
    borderPattern: 'url(...)'      // Padrão de borda
  }
}
```

---

## 🏢 Estrutura da Mesa Visual

```typescript
TableLayoutConfig {
  id: 'oval-6'                      // ID único
  name: 'Oval para 6'               // Nome
  maxSeats: 6                       // Máximo de assentos
  
  dimensions: {
    width: 600px        // ou 80vw para responsivo
    height: 400px       // ou 60vh
    cornerRadius: 50    // Bordas arredondadas
  }
  
  seatPositions: {
    0: { top: '10%', left: '50%', rotation: 0 }
    1: { top: '35%', left: '75%', rotation: 60 }
    2: { top: '65%', left: '75%', rotation: 120 }
    3: { top: '90%', left: '50%', rotation: 180 }
    4: { top: '65%', left: '25%', rotation: 240 }
    5: { top: '35%', left: '25%', rotation: 300 }
  }
  
  chipStackPosition?: {
    offsetX: 0
    offsetY: 20
  }
}
```

---

## 🔗 Integração com Store Zustand Existente

```
gameStore (EXISTENTE)           uiStore (NOVO)
├─ token                        ├─ selectedCardTheme: 'classic'
├─ user                         ├─ selectedTableLayout: 'oval-6'
├─ tableState                   ├─ animationSpeed: 'medium'
├─ myCards                      ├─ setCardTheme(id)
├─ actionRequired               └─ setTableLayout(id)
├─ lastHandResult
├─ chatMessages
└─ lastError

Ambas os stores são independentes:
- gameStore: estado do jogo (não muda)
- uiStore: preferências do jogador (novo)

Separação de responsabilidades:
- gameStore cuida de lógica
- uiStore cuida de UI/tema
```

---

## 🎬 Sequência: Jogador Entra na Mesa

```
1. TablePage monta
   ├─ joinTable(tableId) via socket
   └─ useSocket hook ativa

2. Server responde com tableState
   └─ gameStore.setTableState(state)

3. Componentes renderizam
   ├─ PokerTable monta
   ├─ useCardTheme() retorna tema
   ├─ CardRenderer renderiza cada carta
   └─ Tela mostra mesa visual

4. Animações iniciam
   ├─ CardContainer aplica keyframes
   ├─ Cartas entram com transição
   └─ Mesa aparece com fade-in

5. Estado final
   └─ Mesa visual pronta para jogar
```

---

## 🎥 Sequência: Flop é Distribuído

```
1. Server emite 'table_state' atualizado
   ├─ game.phase: 'flop'
   └─ game.communityCards: ['AH', 'KD', '7C']

2. gameStore.setTableState(novoState)

3. CommunityCards component atualiza
   ├─ Detecta novas cartas via array length
   ├─ Renderiza CardContainer para cada uma
   └─ Aplica animation: 'enter'

4. CSS keyframes executam
   ├─ 0ms:   opacity: 0, transform: scale(0.5)
   ├─ 150ms: opacity: 0.5, transform: scale(1.2)
   └─ 300ms: opacity: 1, transform: scale(1)

5. Visual
   ├─ 3 cartas entram com flip suave
   └─ Efeito "dealing from deck"
```

---

## 🎨 Sequência: Jogador Troca de Tema

```
1. SettingsPage renderiza <select> com temas
   ├─ Opção 1: "Clássico"
   ├─ Opção 2: "Moderno"
   └─ Opção 3: "Dark"

2. Usuário clica em "Moderno"
   └─ onChange handler executa

3. uiStore.setCardTheme('modern')
   ├─ Zustand atualiza state
   └─ localStorage['cardTheme'] = 'modern'

4. useCardTheme() em todos os componentes
   ├─ Hook re-executa (subscribe ao store)
   ├─ Retorna modernTheme object
   └─ Components re-renderizam

5. CardRenderer recebe novo theme
   ├─ Cores mudam: classicTheme.colors → modernTheme.colors
   ├─ Tamanho pode mudar: 60px → 70px
   └─ Sombras mudam: medium → high

6. Visual
   ├─ Todas as cartas na mesa mudam de estilo
   ├─ Transição suave (via CSS transition)
   └─ Tema persiste no localStorage
```

---

## 🔌 Integração com useSocket Hook

```
useSocket hook (EXISTENTE)
    ↓ mantém listener em 'table_state'
    ↓
Socket emite: { gameState, seats, ... }
    ↓
gameStore.setTableState(event.state)
    ↓
PokerTable component
    ├─ Recebe state via props
    ├─ Renderiza cada Seat
    └─ Cartas animam (via CardContainer)

Sem mudança na lógica existente!
Apenas renderização diferente da mesma data.
```

---

## 🎯 Mapa de Dependências entre Componentes

```
TablePage (página)
    ├─ PlayersTable (tabular - EXISTENTE) OU
    └─ PokerTable (visual - NOVO)
           ├─ PokerTableLayout
           │   └─ layout.ts
           ├─ CommunityCards
           │   └─ CardContainer x 5
           │       └─ CardRenderer
           ├─ PotDisplay
           └─ Seat x 6
               ├─ CardContainer x 2 (hole cards)
               │   └─ CardRenderer
               └─ StatusIndicators

CardContainer
    ├─ CardRenderer
    ├─ useAnimation hook
    └─ useCardTheme hook

useCardTheme hook
    └─ uiStore (Zustand)

CardRenderer
    ├─ CardTheme object
    └─ formatCard lib (EXISTENTE)
```

---

## 📱 Responsividade: Desktop vs Mobile

```
DESKTOP (≥1024px)
┌─────────────────────────────────────────┐
│                                         │
│  [Clássico ▼]           Mesa Visual     │
│  Tema:                  ┌─────────────┐ │
│                        │  A♥ K♦ 7♣   │ │
│                        │             │ │
│  Players:              │   S1   S2   │ │
│  • João                │            │ │
│  • Maria               │ S6   S3     │ │
│                        │            │ │
│                        │ S5   S4     │ │
│                        └─────────────┘ │
│                                        │
└─────────────────────────────────────────┘

MOBILE (≤640px)
┌────────────────────┐
│ [Clássico ▼]       │
│ Mostrar mesa?      │
│ [Mesa] [Tabela]    │
│                    │
│ ┌────────────────┐ │
│ │ A♥ K♦ 7♣      │ │
│ │ [Seu stack]    │ │
│ │ Jogador 1: ??? │ │
│ │ Jogador 2: ??? │ │
│ └────────────────┘ │
│                    │
│ [Fold] [Call] ... │ │
└────────────────────┘

Estratégia:
- Desktop: Mesa visual por padrão
- Mobile: Toggle entre mesa reduzida e tabela
- CSS media queries adaptam tamanho de cards
```

---

## 🔐 Type Safety (TypeScript)

```typescript
// Todos os tipos validados em build-time

// ❌ Isso não compila:
const theme: CardTheme = {
  id: 'modern',
  // Falta 'name' - erro de build!
};

// ❌ Isso não compila:
const seat: SeatState = {
  userId: '123',
  // Falta 'displayName', 'stackSize', etc - erro!
};

// ✅ Isso compila:
const theme: CardTheme = {
  id: 'modern',
  name: 'Moderno',
  description: '...',
  card: { /* ... */ },
  colors: { /* ... */ },
};

Benefício: Erros catados antes de enviar pro production
```

---

## 📈 Performance Considerations

```
ANTES (CardText)
├─ Renderização: O(n) onde n = número de cartas
├─ Re-renders: Quando tableState muda
├─ CSS: Tailwind classes
└─ Animações: Nenhuma

DEPOIS (CardRenderer + CardContainer)
├─ Renderização: O(n) - não piorou
├─ Re-renders: Zustand subscriptions (otimizado)
├─ CSS: CSS modules + keyframes (mais eficiente)
├─ Animações: GPU-accelerated (transform + opacity)
└─ Memory: +5-10% por cada CardContainer

Otimizações aplicadas:
- CardRenderer: React.memo para evitar re-renders desnecessários
- Animações: CSS em vez de JS (60 FPS garantido)
- Keyframes: animation-delay staggered para suavidade
- Layout: CSS Grid/Flex em vez de JS calculations
```

---

## ✅ Validação: Tipos de Teste

```
UNIT TESTS
├─ CardRenderer renderiza corretamente
├─ CardTheme valida cores (hex válido)
├─ tableGeometry.calculatePositions retorna correto
└─ formatCard('AH') === 'A♥'

INTEGRATION TESTS
├─ CardContainer recebe tema e renderiza CardRenderer
├─ Trocar tema em uiStore atualiza todos os Cards
├─ PokerTable renderiza 6 Seats em posições corretas
└─ Animação dispara quando card mount

END-TO-END TESTS
├─ Usuário entra na mesa → vê layout visual
├─ Flop distribuído → 3 cartas animam entrada
├─ Jogador troca tema → todas as cartas mudam estilo
└─ Mobile → mesa compacta ou modo tabular
```

---

## 🚀 Performance Targets

```
Métrica              | Alvo      | Como alcançar
─────────────────────┼───────────┼──────────────────────
FPS durante animação | 60 FPS    | CSS transforms
Time to Interactive  | < 2s      | Lazy load temas
Bundle size          | +15KB     | Tree-shake não usados
Memory (6 cards)     | < 2MB     | React.memo
First Paint          | Sem mudança| Async temas
```

