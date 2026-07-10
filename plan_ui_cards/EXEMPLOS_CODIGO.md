# 💻 Exemplos de Código: Como Tudo Se Integra

## Exemplo 1: CardRenderer Completo

```typescript
// client/src/components/cards/CardRenderer.tsx

import { CardTheme } from '../../systems/card-system/themes/types';
import { formatCard, isRedCard } from '../../lib/cards';

interface CardRendererProps {
  card?: string;
  theme: CardTheme;
  hidden?: boolean;
}

export function CardRenderer({ card, theme, hidden }: CardRendererProps) {
  if (hidden || !card) {
    return (
      <div
        style={{
          width: theme.card.width,
          height: theme.card.height,
          borderRadius: theme.card.borderRadius,
          background: '#404040',
          border: `2px solid ${theme.colors.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#666',
          fontSize: '18px',
          fontWeight: 'bold',
          boxShadow: `0 4px 8px rgba(0,0,0,${theme.card.shadowIntensity === 'high' ? 0.4 : 0.2})`,
        }}
      >
        ?
      </div>
    );
  }

  const rank = card[0];
  const suit = card[1];
  const suitSymbol = { s: '♠', h: '♥', d: '♦', c: '♣' }[suit] || suit;
  const isRed = isRedCard(card);
  const suitColor = isRed ? theme.colors.suitRed : theme.colors.suitBlack;

  return (
    <div
      style={{
        width: theme.card.width,
        height: theme.card.height,
        borderRadius: theme.card.borderRadius,
        background: theme.colors.background,
        border: `2px solid ${theme.colors.border}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        boxShadow: `0 4px 12px rgba(0,0,0,${theme.card.shadowIntensity === 'high' ? 0.4 : 0.15})`,
        transition: 'transform 0.2s ease-out',
      }}
    >
      {/* Canto superior esquerdo */}
      <div
        style={{
          position: 'absolute',
          top: 4,
          left: 4,
          fontSize: '12px',
          fontWeight: 'bold',
          color: suitColor,
          textAlign: 'center',
          lineHeight: 1,
        }}
      >
        <div>{rank}</div>
        <div>{suitSymbol}</div>
      </div>

      {/* Centro */}
      <div
        style={{
          fontSize: '24px',
          color: suitColor,
          fontWeight: 'bold',
        }}
      >
        {suitSymbol}
      </div>

      {/* Canto inferior direito (invertido) */}
      <div
        style={{
          position: 'absolute',
          bottom: 4,
          right: 4,
          fontSize: '12px',
          fontWeight: 'bold',
          color: suitColor,
          textAlign: 'center',
          lineHeight: 1,
          transform: 'rotate(180deg)',
        }}
      >
        <div>{rank}</div>
        <div>{suitSymbol}</div>
      </div>
    </div>
  );
}
```

---

## Exemplo 2: CardTheme Registry

```typescript
// client/src/systems/card-system/CardThemeRegistry.ts

import { CardTheme } from './themes/types';
import { classicTheme } from './themes/classic';

class CardThemeRegistryClass {
  private themes: Map<string, CardTheme> = new Map();

  constructor() {
    this.registerTheme(classicTheme);
  }

  registerTheme(theme: CardTheme): void {
    if (this.themes.has(theme.id)) {
      console.warn(`Tema '${theme.id}' já registrado. Sobrescrevendo...`);
    }
    this.themes.set(theme.id, theme);
  }

  getTheme(id: string): CardTheme {
    const theme = this.themes.get(id);
    if (!theme) {
      console.warn(`Tema '${id}' não encontrado. Retornando classic.`);
      return this.themes.get('classic')!;
    }
    return theme;
  }

  getAllThemes(): CardTheme[] {
    return Array.from(this.themes.values());
  }

  listThemeIds(): string[] {
    return Array.from(this.themes.keys());
  }
}

export const CardThemeRegistry = new CardThemeRegistryClass();
```

---

## Exemplo 3: useCardTheme Hook

```typescript
// client/src/hooks/useCardTheme.ts

import { useCallback } from 'react';
import { CardTheme } from '../systems/card-system/themes/types';
import { CardThemeRegistry } from '../systems/card-system/CardThemeRegistry';
import { useUIStore } from '../store/uiStore';

export function useCardTheme(): CardTheme {
  const selectedThemeId = useUIStore((state) => state.selectedCardTheme);
  return CardThemeRegistry.getTheme(selectedThemeId);
}

export function useSetCardTheme() {
  const setTheme = useUIStore((state) => state.setCardTheme);
  
  return useCallback((themeId: string) => {
    setTheme(themeId);
  }, [setTheme]);
}

export function useAvailableThemes() {
  return CardThemeRegistry.getAllThemes();
}
```

---

## Exemplo 4: CardContainer com Animações

```typescript
// client/src/components/cards/CardContainer.tsx

import { useEffect, useState } from 'react';
import { CardTheme } from '../../systems/card-system/themes/types';
import { CardRenderer } from './CardRenderer';
import styles from './styles/default.module.css';

interface CardContainerProps {
  card?: string;
  theme: CardTheme;
  hidden?: boolean;
  animationType?: 'enter' | 'flip' | 'exit';
}

export function CardContainer({
  card,
  theme,
  hidden,
  animationType = 'enter',
}: CardContainerProps) {
  const [isAnimating, setIsAnimating] = useState(true);

  useEffect(() => {
    if (!animationType) {
      setIsAnimating(false);
      return;
    }

    // Resetar animação ao trocar de tipo
    setIsAnimating(true);
    
    const speedMs = {
      fast: 150,
      medium: 300,
      slow: 500,
    }[theme.card.animationSpeed];

    const timeout = setTimeout(() => setIsAnimating(false), speedMs);
    return () => clearTimeout(timeout);
  }, [animationType, theme.card.animationSpeed]);

  const getAnimationClass = () => {
    if (!isAnimating) return '';

    switch (animationType) {
      case 'enter':
        return styles.cardEnter;
      case 'flip':
        return styles.cardFlip;
      case 'exit':
        return styles.cardExit;
      default:
        return '';
    }
  };

  return (
    <div className={getAnimationClass()}>
      <CardRenderer card={card} theme={theme} hidden={hidden} />
    </div>
  );
}
```

---

## Exemplo 5: CSS Animations (Module)

```css
/* client/src/components/cards/styles/default.module.css */

@keyframes cardEnter {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.8);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes cardFlip {
  from {
    transform: rotateY(0deg);
  }
  50% {
    transform: rotateY(90deg);
  }
  to {
    transform: rotateY(0deg);
  }
}

@keyframes cardExit {
  from {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
  to {
    opacity: 0;
    transform: translateY(20px) scale(0.8);
  }
}

.cardEnter {
  animation: cardEnter 0.3s ease-out;
}

.cardFlip {
  animation: cardFlip 0.6s ease-in-out;
  transform-style: preserve-3d;
}

.cardExit {
  animation: cardExit 0.3s ease-in;
}
```

---

## Exemplo 6: UIStore (Zustand)

```typescript
// client/src/store/uiStore.ts

import { create } from 'zustand';

interface UIStore {
  // Preferências de UI
  selectedCardTheme: string;
  selectedTableLayout: string;
  enableAnimations: boolean;

  // Ações
  setCardTheme: (themeId: string) => void;
  setTableLayout: (layoutId: string) => void;
  setEnableAnimations: (enabled: boolean) => void;
  
  // Persistência
  loadFromLocalStorage: () => void;
  saveToLocalStorage: () => void;
}

const STORAGE_KEY = 'pokerbuild_ui_prefs';

export const useUIStore = create<UIStore>((set, get) => ({
  selectedCardTheme: 'classic',
  selectedTableLayout: 'oval-6',
  enableAnimations: true,

  setCardTheme: (themeId: string) => {
    set({ selectedCardTheme: themeId });
    get().saveToLocalStorage();
  },

  setTableLayout: (layoutId: string) => {
    set({ selectedTableLayout: layoutId });
    get().saveToLocalStorage();
  },

  setEnableAnimations: (enabled: boolean) => {
    set({ enableAnimations: enabled });
    get().saveToLocalStorage();
  },

  loadFromLocalStorage: () => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        set(parsed);
      } catch (e) {
        console.error('Erro ao carregar UI prefs:', e);
      }
    }
  },

  saveToLocalStorage: () => {
    const state = get();
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        selectedCardTheme: state.selectedCardTheme,
        selectedTableLayout: state.selectedTableLayout,
        enableAnimations: state.enableAnimations,
      })
    );
  },
}));

// Carregar preferences ao inicializar a app
useUIStore.getState().loadFromLocalStorage();
```

---

## Exemplo 7: Seat Component (Mesa Visual)

```typescript
// client/src/components/table/Seat.tsx

import { SeatState, GameState } from '../../types';
import { CardTheme } from '../../systems/card-system/themes/types';
import { CardContainer } from '../cards/CardContainer';
import { useCardTheme } from '../../hooks/useCardTheme';

interface SeatProps {
  seat: SeatState;
  gameState: GameState;
  myUserId: string;
  myCards: string[] | null;
  position: {
    top: string;
    left: string;
    rotation?: number;
  };
}

export function Seat({
  seat,
  gameState,
  myUserId,
  myCards,
  position,
}: SeatProps) {
  const theme = useCardTheme();
  const isMe = seat.userId === myUserId;
  const isMyTurn = gameState.currentTurnUserId === seat.userId;
  const isFolded = seat.status === 'folded';
  
  const inHand = gameState.phase !== 'waiting';
  const cards = isMe ? (seat.holeCards ?? myCards) : null;

  return (
    <div
      style={{
        position: 'absolute',
        top: position.top,
        left: position.left,
        transform: `translate(-50%, -50%)${position.rotation ? ` rotate(${position.rotation}deg)` : ''}`,
      }}
      className={`
        flex flex-col items-center gap-1 rounded-lg p-2
        ${isMyTurn ? 'bg-emerald-900/50 border-2 border-emerald-400' : 'bg-gray-800/50'}
        ${isFolded ? 'opacity-50' : 'opacity-100'}
        ${isMe ? 'border-2 border-blue-400' : 'border border-gray-700'}
      `}
    >
      {/* Nome do jogador */}
      <div className="text-xs font-semibold text-gray-200">
        {seat.displayName}
        {isMe && <span className="ml-1 text-emerald-400">(você)</span>}
      </div>

      {/* Cartas */}
      <div className="flex gap-1">
        {cards ? (
          <>
            <CardContainer
              card={cards[0]}
              theme={theme}
              animationType="enter"
            />
            <CardContainer
              card={cards[1]}
              theme={theme}
              animationType="enter"
            />
          </>
        ) : inHand && (seat.status === 'active' || seat.status === 'all_in') ? (
          <>
            <CardContainer
              theme={theme}
              hidden
            />
            <CardContainer
              theme={theme}
              hidden
            />
          </>
        ) : (
          <span className="text-xs text-gray-500">—</span>
        )}
      </div>

      {/* Stack */}
      <div className="text-xs text-gray-300">
        <span className="font-semibold">${seat.stackSize}</span>
      </div>

      {/* Aposta atual */}
      {seat.currentBet > 0 && (
        <div className="text-xs text-amber-400 font-bold">
          Aposta: ${seat.currentBet}
        </div>
      )}

      {/* Status */}
      {seat.status === 'folded' && (
        <div className="text-xs text-red-400">Foldou</div>
      )}
      {seat.status === 'all_in' && (
        <div className="text-xs text-amber-400">All-in</div>
      )}

      {/* Badges (Dealer, SB, BB) */}
      <div className="flex gap-1">
        {seat.isDealer && (
          <span className="rounded bg-white px-1 text-xs font-bold text-gray-900">D</span>
        )}
        {seat.isSmallBlind && (
          <span className="rounded bg-blue-600 px-1 text-xs">SB</span>
        )}
        {seat.isBigBlind && (
          <span className="rounded bg-purple-600 px-1 text-xs">BB</span>
        )}
      </div>
    </div>
  );
}
```

---

## Exemplo 8: PokerTable Component Completo

```typescript
// client/src/components/table/PokerTable.tsx

import { TableState } from '../../types';
import { PokerTableLayout } from './PokerTableLayout';
import { Seat } from './Seat';
import { CommunityCards } from './CommunityCards';
import { PotDisplay } from './PotDisplay';

interface PokerTableProps {
  state: TableState;
  myUserId: string;
  myCards: string[] | null;
}

const SEAT_POSITIONS = {
  0: { top: '10%', left: '50%' },
  1: { top: '35%', left: '75%', rotation: 60 },
  2: { top: '65%', left: '75%', rotation: 120 },
  3: { top: '90%', left: '50%', rotation: 180 },
  4: { top: '65%', left: '25%', rotation: 240 },
  5: { top: '35%', left: '25%', rotation: 300 },
};

export function PokerTable({ state, myUserId, myCards }: PokerTableProps) {
  return (
    <PokerTableLayout>
      {/* Cartas Comunitárias */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <CommunityCards cards={state.game.communityCards} />
      </div>

      {/* Pote */}
      <div className="absolute top-1/3 left-1/2 transform -translate-x-1/2">
        <PotDisplay amount={state.game.pot} />
      </div>

      {/* Assentos */}
      {state.seats.map((seat) => (
        <Seat
          key={seat.userId}
          seat={seat}
          gameState={state.game}
          myUserId={myUserId}
          myCards={myCards}
          position={SEAT_POSITIONS[seat.seatPosition] || SEAT_POSITIONS[0]}
        />
      ))}
    </PokerTableLayout>
  );
}
```

---

## Exemplo 9: Como Registrar um Novo Tema

```typescript
// client/src/systems/card-system/themes/modern.ts

import { CardTheme } from './types';

export const modernTheme: CardTheme = {
  id: 'modern',
  name: 'Moderno',
  description: 'Estilo minimalista com gradientes suaves',
  
  card: {
    width: 70,
    height: 100,
    borderRadius: 10,
    shadowIntensity: 'high',
    animationSpeed: 'fast',
  },
  
  colors: {
    suitRed: '#ff6b6b',
    suitBlack: '#2d3436',
    background: 'linear-gradient(135deg, #f5f6f7 0%, #ffffff 100%)',
    border: '#dfe6e9',
    cornerBg: '#ecf0f1',
  },
};
```

```typescript
// Em main.tsx ou App.tsx - Registrar o novo tema

import { CardThemeRegistry } from './systems/card-system/CardThemeRegistry';
import { modernTheme } from './systems/card-system/themes/modern';

// Antes de renderizar a app
CardThemeRegistry.registerTheme(modernTheme);

// Agora o tema 'modern' está disponível em useCardTheme()
// e aparecerá em seletores de tema
```

---

## Exemplo 10: Seletor de Temas (Página de Settings)

```typescript
// client/src/pages/SettingsPage.tsx

import { useCardTheme, useSetCardTheme, useAvailableThemes } from '../hooks/useCardTheme';
import { CardRenderer } from '../components/cards/CardRenderer';

export function SettingsPage() {
  const currentTheme = useCardTheme();
  const setCardTheme = useSetCardTheme();
  const availableThemes = useAvailableThemes();

  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6 text-gray-200">Configurações</h1>

      {/* Seletor de Temas */}
      <section className="bg-gray-800 p-6 rounded-lg mb-6">
        <h2 className="text-lg font-semibold text-gray-300 mb-4">Tema de Cartas</h2>
        
        <div className="space-y-4">
          {availableThemes.map((theme) => (
            <div
              key={theme.id}
              className={`
                p-4 rounded-lg cursor-pointer border-2 transition
                ${currentTheme.id === theme.id 
                  ? 'border-emerald-400 bg-emerald-900/20' 
                  : 'border-gray-700 bg-gray-700/30 hover:border-gray-500'}
              `}
              onClick={() => setCardTheme(theme.id)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-md font-semibold text-gray-200">{theme.name}</h3>
                  <p className="text-sm text-gray-400">{theme.description}</p>
                </div>
                
                {/* Preview de carta */}
                <div className="flex gap-2">
                  <CardRenderer card="AH" theme={theme} />
                  <CardRenderer card="KS" theme={theme} />
                  <CardRenderer theme={theme} hidden />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Botão para salvar */}
      <button className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-500">
        Salvar Preferências
      </button>
    </div>
  );
}
```

---

## Exemplo 11: Integração no TablePage

```typescript
// client/src/pages/TablePage.tsx (modificado)

import { useState } from 'react';
import { PlayersTable } from '../components/PlayersTable';
import { PokerTable } from '../components/table/PokerTable';
import { useUIStore } from '../store/uiStore';

export default function TablePage() {
  const { tableState, myCards, user } = useGameStore();
  const [visualMode, setVisualMode] = useState<'table' | 'mesa'>('mesa');

  if (!tableState || !user) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-4">
      {/* Header com toggle de visualização */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-emerald-400">
          {tableState.table.name}
        </h1>
        
        <div className="flex gap-2">
          <button
            onClick={() => setVisualMode('mesa')}
            className={`px-3 py-2 rounded ${
              visualMode === 'mesa'
                ? 'bg-emerald-600'
                : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            Vista Mesa
          </button>
          <button
            onClick={() => setVisualMode('table')}
            className={`px-3 py-2 rounded ${
              visualMode === 'table'
                ? 'bg-emerald-600'
                : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            Vista Tabela
          </button>
        </div>
      </div>

      {/* Renderizar conforme modo selecionado */}
      {visualMode === 'mesa' ? (
        <PokerTable
          state={tableState}
          myUserId={user.id}
          myCards={myCards}
        />
      ) : (
        <PlayersTable
          state={tableState}
          myUserId={user.id}
          myCards={myCards}
        />
      )}

      {/* Rest do componente... */}
    </div>
  );
}
```

---

## 🎯 Resumo: Como Tudo Se Conecta

1. **CardRenderer** renderiza a carta visualmente baseado em um `CardTheme`
2. **CardContainer** envolve CardRenderer com animações CSS
3. **useCardTheme** hook puxa o tema selecionado do **uiStore**
4. **CardThemeRegistry** gerencia todos os temas registrados
5. **Seat** usa CardContainer para renderizar hole cards
6. **PokerTable** renderiza múltiplos Seat em posições circulares
7. **TablePage** alterna entre vista de mesa e vista de tabela
8. **SettingsPage** permite ao usuário trocar de tema
9. **uiStore** persiste a preferência do usuário

**Fluxo de dados:**
```
uiStore (tema selecionado)
    ↓
useCardTheme (hook que lê o tema)
    ↓
CardContainer, Seat, PokerTable (usam o hook)
    ↓
CardRenderer (renderiza com o tema)
    ↓
Tela do jogador
```

**Adicionando novo tema:**
```
Criar: themes/novo.ts (define objeto CardTheme)
    ↓
Registrar: CardThemeRegistry.registerTheme(novo)
    ↓
Pronto! Aparece em seletores automaticamente
```

