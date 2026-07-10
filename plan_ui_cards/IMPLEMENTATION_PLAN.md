# Plano de Implementação: UI Interativa com Animações e Mesa Visual

## 📋 Visão Geral

Implementar uma interface de usuário moderna e escalável com:
- **Mesa Visual**: Layout visual de mesa de poker (em círculo/oval) em vez de tabela
- **Cartas Animadas**: Animações fluidas para cartas (entrada, flip, saída)
- **Skins Suportadas**: Arquitetura preparada para múltiplos temas (deck styles)
- **Escalabilidade**: Sistema modular para adicionar novos tipos de cartas/mesas sem quebrar código existente

---

## 🏗️ Arquitetura Proposta

### 1. Sistema de Cartas (Card System)

```
client/src/
├── components/
│   └── cards/
│       ├── CardRenderer.tsx          # Componente base que renderiza uma carta
│       ├── CardContainer.tsx         # Container com animações
│       ├── types.ts                  # Tipos para sistema de cartas
│       └── styles/
│           ├── default.module.css    # Estilo padrão
│           └── modern.module.css     # Exemplo de segundo estilo
├── systems/
│   └── card-system/
│       ├── CardTheme.ts              # Sistema de temas/skins
│       ├── CardThemeRegistry.ts      # Registro de temas disponíveis
│       ├── useCardTheme.ts           # Hook customizado
│       └── themes/
│           ├── classic.ts            # Tema clássico (padrão)
│           ├── modern.ts             # Tema moderno (exemplo futuro)
│           └── types.ts              # Tipos de tema
└── store/
    └── themeStore.ts                 # Zustand store para tema selecionado
```

### 2. Sistema de Mesa (Table Layout)

```
client/src/
├── components/
│   ├── table/
│   │   ├── PokerTable.tsx            # Componente principal da mesa visual
│   │   ├── PokerTableLayout.tsx      # Layout e posicionamento de assentos
│   │   ├── Seat.tsx                  # Um assento na mesa
│   │   ├── CommunityCards.tsx        # Exibição de cartas comunitárias
│   │   ├── PotDisplay.tsx            # Exibição visual do pote
│   │   └── styles/
│   │       └── table.module.css      # Estilos da mesa (CSS Grid/Flex)
│   └── (componentes existentes mantidos)
└── lib/
    └── table-layout/
        ├── seatPositions.ts          # Cálculo de posições dos assentos
        ├── tableGeometry.ts          # Matemática para layout oval/circular
        └── types.ts                  # Tipos de layout
```

### 3. Animações

```
client/src/
├── animations/
│   ├── card.ts                       # Animações de cartas
│   ├── table.ts                      # Animações de mesa
│   ├── transitions.ts                # Transições gerais
│   └── keyframes.css                 # Keyframes globais
└── hooks/
    └── useAnimation.ts               # Hook para controlar animações
```

### 4. Store para Temas (Theme Management)

```
client/src/
├── store/
│   ├── gameStore.ts                  # (existente - sem alterações)
│   └── uiStore.ts                    # NOVO: Tema, layout preferences
```

---

## 📊 Estrutura de Tipos

### CardTheme Interface

```typescript
interface CardTheme {
  id: string;                          // 'classic', 'modern', etc
  name: string;                        // Nome legível
  description: string;
  
  card: {
    width: number;                     // em pixels
    height: number;
    borderRadius: number;
    shadowIntensity: 'low' | 'medium' | 'high';
    animationSpeed: 'fast' | 'medium' | 'slow';
  };
  
  colors: {
    suitRed: string;
    suitBlack: string;
    background: string;
    border: string;
    cornerBg: string;
  };
  
  assets?: {
    cardBackImage?: string;           // URL para imagem de verso da carta
    borderPattern?: string;
  };
}
```

### TableLayout Interface

```typescript
interface TableLayoutConfig {
  id: string;
  name: string;
  maxSeats: number;
  
  dimensions: {
    width: number;                     // em pixels (responsivo com %)
    height: number;
    cornerRadius: number;              // Para mesa oval
  };
  
  seatPositions: {
    [seatNumber: number]: {
      top: string | number;            // % ou px
      left: string | number;
      rotation?: number;               // Rotação visual para cards do jogador
    };
  };
  
  chipStackPosition?: {                // Onde mostrar a stack de chips
    offsetX: number;
    offsetY: number;
  };
}
```

---

## 🎯 Componentes a Serem Implementados

### Fase 1: Fundação (Cartas)

#### 1. `CardRenderer.tsx`
- Renderiza uma única carta com tema aplicado
- Suporta estados: normal, hidden (face down), disabled
- Props: `card: string`, `theme: CardTheme`, `hidden?: boolean`
- Sem animações - apenas renderização

#### 2. `CardContainer.tsx`
- Wrapper animado em volta de CardRenderer
- Gerencia animações: entrance, flip, exit
- Props: `card`, `theme`, `animation?: 'enter' | 'flip' | 'exit'`
- Usa `useAnimation` hook

#### 3. `useCardTheme.ts` Hook
- Retorna tema atual selecionado
- Função para trocar tema (futura seleção de skin)
- Integra com `themeStore`

#### 4. `CardThemeRegistry.ts`
- Singleton que gerencia temas disponíveis
- `registerTheme(theme: CardTheme)`
- `getTheme(id: string): CardTheme`
- `getAllThemes(): CardTheme[]`
- Inicializa com tema 'classic' padrão

#### 5. `themeStore.ts` (Zustand)
```typescript
interface UIStore {
  selectedCardTheme: string;           // ID do tema
  selectedTableLayout: string;         // ID do layout
  setCardTheme: (themeId: string) => void;
  setTableLayout: (layoutId: string) => void;
}
```

### Fase 2: Mesa Visual

#### 6. `PokerTable.tsx`
- Componente principal que substitui a visualização textual
- Renderiza mesa com assentos posicionados
- Props: `state: TableState`, `myUserId: string`, `myCards: string[] | null`
- Composto por:
  - PokerTableLayout (posicionamento)
  - Múltiplos Seat components
  - CommunityCards
  - PotDisplay

#### 7. `PokerTableLayout.tsx`
- Grid CSS responsivo que posiciona assentos
- Usa `tableGeometry.ts` para cálculos
- Renderiza overlay da mesa (felt green, bordas, etc)

#### 8. `Seat.tsx`
- Um assento individual na mesa
- Mostra: nome jogador, stack, cartas (2 cartas do jogador ou hidden cards)
- Indicadores: dealer, SB, BB, turn/status
- Cards usam CardContainer para animações

#### 9. `CommunityCards.tsx`
- Exibe as 5 cartas da mesa
- Posicionadas no centro
- Animação de reveal conforme cartas aparecem

#### 10. `PotDisplay.tsx`
- Exibe valor do pote visualmente
- Posição: centro-baixo da mesa

### Fase 3: Animações

#### 11. `useAnimation.ts` Hook
```typescript
interface UseAnimationReturn {
  animating: boolean;
  trigger: (type: 'enter' | 'flip' | 'exit') => void;
  getAnimationClass: () => string;
}
```

#### 12. `animations/keyframes.css`
Keyframes CSS:
- `@keyframes cardEnter` - Carta entra de forma suave
- `@keyframes cardFlip` - Efeito flip 3D
- `@keyframes cardExit` - Saída suave
- `@keyframes chipAnim` - Animação de chips ao pote
- `@keyframes shake` - Tremor para ações

---

## 🔄 Fluxo de Integração com Código Existente

### Mudanças em `PlayersTable.tsx`
- **Mantém comportamento original** (para compatibilidade)
- Aceita prop opcional: `visualMode?: 'table' | 'mesa'` (padrão: 'table')
- Se `visualMode === 'mesa'`, renderiza `PokerTable` em vez de tabela HTML

### Mudanças em `TablePage.tsx`
- Adiciona toggle/selector para modo visual (table vs mesa)
- Passa `selectedCardTheme` para componentes de cartas
- Passa `selectedTableLayout` para PokerTable

### Mudanças em `CardText.tsx`
- Adiciona prop: `theme?: CardTheme`
- Se theme não fornecido, continua comportamento atual (text-only)
- Se theme fornecido, usa CardRenderer em vez de `<span>`

### Novas Integrações
- `themeStore` integrado no `useGameStore` ou separado
- `CardThemeRegistry` inicializado na carga da app

---

## 🎨 Sistema de Temas (Escalabilidade)

### Tema Clássico (Padrão)

```typescript
const classicTheme: CardTheme = {
  id: 'classic',
  name: 'Clássico',
  card: {
    width: 60,
    height: 90,
    borderRadius: 6,
    shadowIntensity: 'medium',
    animationSpeed: 'medium',
  },
  colors: {
    suitRed: '#dc2626',
    suitBlack: '#1f2937',
    background: '#ffffff',
    border: '#e5e7eb',
    cornerBg: '#f3f4f6',
  },
};
```

### Exemplo Futuro: Tema Moderno
```typescript
const modernTheme: CardTheme = {
  id: 'modern',
  name: 'Moderno',
  // ... com gradientes, animations mais sofisticadas, etc
};
```

### Exemplo Futuro: Tema Dark
```typescript
const darkTheme: CardTheme = {
  id: 'dark',
  name: 'Escuro',
  // ... com cores dark mode
};
```

**Como adicionar um novo tema:**
1. Criar arquivo `themes/novo-tema.ts`
2. Definir objeto CardTheme
3. Registrar no CardThemeRegistry: `CardThemeRegistry.registerTheme(novoTema)`
4. Pronto! Aparece automaticamente no seletor

---

## 📱 Responsividade

- Mesa usa **CSS Grid com unidades relativas** (%, vh, vw)
- Cards escalam com tamanho da tela (usando `min()` function)
- Layout mobile: mesa compactada ou switch para modo tabular

---

## 🚀 Plano de Implementação (Fases)

### **Fase 1: Sistema de Cartas (Dias 1-2)**
1. Criar estrutura de tipos e interfaces
2. Implementar CardRenderer (renderização básica)
3. Implementar CardThemeRegistry e tema classic
4. Criar hooks de tema
5. Integrar com CardText.tsx (backward compatible)
6. **Teste**: Cards renderizam com novo sistema, CardText fallback funciona

### **Fase 2: Animações de Cartas (Dia 3)**
1. Implementar useAnimation hook
2. Criar keyframes.css
3. Implementar CardContainer com animações
4. Integrar animações em Seat.tsx
5. **Teste**: Cartas entram/saem com animações fluidas

### **Fase 3: Mesa Visual (Dias 4-6)**
1. Criar `tableGeometry.ts` (cálculos de posição)
2. Implementar PokerTableLayout
3. Implementar componente Seat
4. Implementar CommunityCards
5. Implementar PotDisplay
6. Implementar PokerTable (integração)
7. Integrar com TablePage.tsx
8. **Teste**: Mesa visual aparece corretamente, assentos posicionados

### **Fase 4: Refinamentos & Otimizações (Dias 7-8)**
1. Testes de performance
2. Ajustes de animações (velocidade, easing)
3. Responsividade mobile
4. Exemplo de segundo tema (moderno/dark)
5. **Teste**: Tudo funciona no mobile, themes switcham corretamente

### **Fase 5: Documentação & Preparação para Skins (Dia 9)**
1. Documentar como adicionar novos temas
2. Documentar como adicionar novos layouts de mesa
3. Exemplo comentado de novo tema
4. **Teste**: Outro dev consegue adicionar tema sem problemas

---

## 🎮 Seletor de Themes (Futura Feature)

### Localização
- Página de Settings / Preferences
- ou Menu suspenso na header de TablePage

### UI
```
Tema de Cartas:  [Clássico ▼]  [Preview de carta]
Layout da Mesa:  [Oval ▼]       [Preview da mesa]
```

### Implementação
```typescript
// Em uma página Settings
function SettingsPage() {
  const { selectedCardTheme, setCardTheme } = useUIStore();
  const themes = CardThemeRegistry.getAllThemes();
  
  return (
    <select 
      value={selectedCardTheme} 
      onChange={e => setCardTheme(e.target.value)}
    >
      {themes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
    </select>
  );
}
```

---

## 📦 Dependências

### Novas
- **Opcional**: `framer-motion` (v10.x) para animações mais sofisticadas
  - Alternativa: CSS puro (keyframes) - mais leve
- **Mantém**: TailwindCSS, clsx, zustand, react

### Recomendação
Começar com **CSS puro** (keyframes) para não adicionar dependência pesada. Se precisar de animações muito complexas depois, migrar para Framer Motion é simples (wrapper em CardContainer).

---

## 💾 Estrutura de Diretórios Final

```
client/src/
├── components/
│   ├── cards/
│   │   ├── CardRenderer.tsx
│   │   ├── CardContainer.tsx
│   │   ├── types.ts
│   │   └── styles/
│   │       ├── default.module.css
│   │       └── modern.module.css
│   ├── table/
│   │   ├── PokerTable.tsx
│   │   ├── PokerTableLayout.tsx
│   │   ├── Seat.tsx
│   │   ├── CommunityCards.tsx
│   │   ├── PotDisplay.tsx
│   │   └── styles/
│   │       └── table.module.css
│   ├── ActionBar.tsx           (existente)
│   ├── CardText.tsx            (modificado - add theme support)
│   ├── ChatPanel.tsx           (existente)
│   ├── HandResultBanner.tsx    (existente)
│   └── PlayersTable.tsx        (modificado - add visualMode)
│
├── systems/
│   └── card-system/
│       ├── CardTheme.ts
│       ├── CardThemeRegistry.ts
│       ├── useCardTheme.ts
│       └── themes/
│           ├── classic.ts
│           ├── modern.ts
│           └── types.ts
│
├── animations/
│   ├── card.ts
│   ├── table.ts
│   ├── transitions.ts
│   └── keyframes.css
│
├── lib/
│   ├── cards.ts                (existente)
│   ├── socket.ts               (existente)
│   ├── api.ts                  (existente)
│   └── table-layout/
│       ├── seatPositions.ts
│       ├── tableGeometry.ts
│       └── types.ts
│
├── hooks/
│   ├── useAuth.ts              (existente)
│   ├── useSocket.ts            (existente)
│   ├── useAnimation.ts         (novo)
│   └── useCardTheme.ts         (novo)
│
├── store/
│   ├── gameStore.ts            (existente)
│   └── uiStore.ts              (novo)
│
├── types/
│   └── index.ts                (existente - add novos tipos se necessário)
│
├── pages/
│   ├── LoginPage.tsx           (existente)
│   ├── LobbyPage.tsx           (existente)
│   ├── TablePage.tsx           (modificado - add seletor visual)
│   └── ManagerPage.tsx         (existente)
│
├── App.tsx                     (existente)
├── main.tsx                    (existente)
├── index.css                   (existente - add animações)
```

---

## ✅ Checklist de Escalabilidade

- [x] Sistema modular para novos temas/skins
- [x] Novo tema pode ser adicionado sem modificar código existente
- [x] Diferentes layouts de mesa suportados (preparado)
- [x] Compatibilidade backward com modo tabular
- [x] Hooks customizados para lógica reutilizável
- [x] Store centralizado para preferências de UI
- [x] Animações desacopladas de renderização
- [x] Tipos bem definidos para extensões futuras

---

## 🔐 Testes Mínimos

1. **Renderização de Carta**: Carta clássica renderiza corretamente
2. **Tema Clássico**: Tema 'classic' renderiza com cores corretas
3. **Animação de Entrada**: Carta entra com animação ao aparecer
4. **Mesa Visual**: 6 assentos posicionados corretamente em oval
5. **Backward Compat**: CardText antigo ainda funciona
6. **Switching Themes**: Trocar tema atualiza todas as cartas
7. **Responsividade**: Mesa redimensiona em mobile
8. **Performance**: Sem memory leaks em animações

---

## 📝 Notas Importantes

- **Sem breaking changes**: Código existente continua funcionando
- **Gradual adoption**: PlayersTable pode usar modo visual ou tabular
- **Extensível**: Novos temas/layouts adicionáveis sem conhecer internals
- **Performante**: CSS animations em vez de JS quando possível
- **Type-safe**: TypeScript em todos os novos componentes

