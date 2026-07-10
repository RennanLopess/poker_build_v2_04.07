# 🎰 Plano Executivo: UI Interativa com Mesa Visual

## 📌 Resumo Executivo

Transformar a UI do poker de **modo tabular (texto)** para **mesa visual animada** mantendo a arquitetura limpa e permitindo que novos temas/skins sejam adicionados no futuro sem quebrar código existente.

---

## 🎯 Objetivos Principais

| Objetivo | Descrição | Escalabilidade |
|----------|-----------|-----------------|
| **Mesa Visual** | Exibir jogadores em layout circular/oval (como mesa real) | ✅ Diferentes layouts suportados |
| **Cartas Animadas** | Animações fluidas: entrada, flip, saída | ✅ Fácil adicionar novas animações |
| **Sistema de Temas** | Múltiplos estilos de cartas (classic, moderno, dark, etc) | ✅ Novo tema = novo arquivo |
| **Seletor de Skin** | Jogadores escolhem estilo das cartas/mesa | ✅ UI pronta para implementação futura |

---

## 🏗️ Decisões Arquiteturais

### 1. **Sistema de Cartas Modular**

```
CardTheme (interface) → CardThemeRegistry → useCardTheme (hook) → CardRenderer (UI)
                                ↓
                        themes/classic.ts
                        themes/modern.ts
                        themes/dark.ts (futuro)
```

**Vantagem**: Adicionar novo tema = criar arquivo `themes/novo.ts` + registrar uma linha

### 2. **Mesa Visual com Posicionamento Matemático**

```
tableGeometry.ts (cálculos) → PokerTableLayout (CSS Grid) → Seat (componentes)
                                      ↓
                        Suporta: Oval, Circular, Hexagonal (futuro)
```

**Vantagem**: Trocar layout = alterar array de posições, sem reescrever componentes

### 3. **Animações Desacopladas**

```
useAnimation (lógica) → keyframes.css (CSS) → CardContainer (aplicação)
```

**Vantagem**: Fácil trocar velocidade/estilo de animação sem touch em lógica

### 4. **Store Separado para UI**

```
gameStore (estado do jogo) ⊕ uiStore (tema selecionado) = aplicação completa
```

**Vantagem**: Preferências de tema não afetam lógica de jogo

---

## 📊 Comparação Antes vs Depois

### Antes (Atual)
```
┌─────────────────────────────────────────┐
│ MESA VAZIA                              │
├─────────────────────────────────────────┤
│ Pos. │ Jogador  │ Stack │ Aposta │ Cartas │
├─────────────────────────────────────────┤
│  1   │ João    │  500  │   50   │ A♥ K♠  │
│  2   │ Maria   │  300  │    0   │  ?  ?  │
│  3   │ Pedro   │  200  │  100   │ Foldou │
│  4   │ Ana     │ 1000  │   50   │  ?  ?  │
└─────────────────────────────────────────┘
```

### Depois (Proposto)
```
           [Comunidade: A♠ K♦ 7♣]
                    Pote: 200

           ┌─────────────────────┐
         Maria(300)           João(500)
        [?][?]  ┌───────────┐  [A♥][K♠]
               │           │
          Ana  │    Mesa   │  Pedro
         [?]   │   Visual  │  Foldou
               │           │
          [?][?] └─────────┘

        (com animações e interatividade)
```

---

## 🚀 Roadmap Implementação

```
Semana 1
├─ Dia 1-2: Sistema de Cartas
│         └─ CardRenderer, CardTheme, Registry
├─ Dia 3: Animações de Cartas
│         └─ useAnimation, keyframes.css
├─ Dia 4-6: Mesa Visual
│         └─ PokerTable, Seats, Layout
├─ Dia 7-8: Refinamentos
│         └─ Responsividade, Temas secundários
└─ Dia 9: Documentação
          └─ Como adicionar novas skins/layouts
```

---

## 💡 Como Adicionar Novos Temas (Futuro)

### Exemplo: Novo Tema "Moderno"

**1. Criar arquivo** `client/src/systems/card-system/themes/modern.ts`

```typescript
import { CardTheme } from './types';

export const modernTheme: CardTheme = {
  id: 'modern',
  name: 'Moderno',
  description: 'Estilo minimalista com gradientes',
  
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

**2. Registrar no CardThemeRegistry** (na inicialização da app)

```typescript
// Em main.tsx ou App.tsx
import { modernTheme } from './systems/card-system/themes/modern';
CardThemeRegistry.registerTheme(modernTheme);
```

**3. Pronto!** ✅ Tema aparece automaticamente no seletor

---

## 🎨 Como Adicionar Novos Layouts de Mesa (Futuro)

### Exemplo: Mesa Hexagonal

**1. Criar posições** em `lib/table-layout/seatPositions.ts`

```typescript
export const HEXAGON_LAYOUT = {
  6: { // 6 assentos
    0: { top: '10%', left: '50%', rotation: 0 },
    1: { top: '35%', left: '75%', rotation: 60 },
    2: { top: '65%', left: '75%', rotation: 120 },
    3: { top: '90%', left: '50%', rotation: 180 },
    4: { top: '65%', left: '25%', rotation: 240 },
    5: { top: '35%', left: '25%', rotation: 300 },
  },
  // ... mais configurações
};
```

**2. Usar no componente**

```typescript
<PokerTableLayout layout={HEXAGON_LAYOUT} />
```

---

## 📦 Estrutura de Arquivos (Resumida)

```
client/src/
├── 🆕 systems/card-system/
│   ├── CardTheme.ts
│   ├── CardThemeRegistry.ts
│   └── themes/
│       ├── classic.ts
│       └── modern.ts (futura)
│
├── 🆕 components/cards/
│   ├── CardRenderer.tsx
│   └── CardContainer.tsx
│
├── 🆕 components/table/
│   ├── PokerTable.tsx
│   ├── Seat.tsx
│   └── CommunityCards.tsx
│
├── 🆕 animations/
│   ├── keyframes.css
│   └── useAnimation.ts
│
├── 🔄 store/
│   └── 🆕 uiStore.ts (preferências do jogador)
│
└── (resto do projeto mantido intacto)
```

---

## ✨ Features Implementados

### Fase 1: Cartas (Fundação)
- ✅ Renderização de cartas com tema
- ✅ Sistema extensível de temas
- ✅ Compatibilidade backward (CardText antigo funciona)

### Fase 2: Animações
- ✅ Entrada de carta (fade + slide)
- ✅ Flip 3D (face down → face up)
- ✅ Saída suave
- ✅ Controle de velocidade por tema

### Fase 3: Mesa Visual
- ✅ Layout oval/circular com cálculos matemáticos
- ✅ Posicionamento dinâmico de 6-9 assentos
- ✅ Exibição de stacks, apostas, status
- ✅ Cartas comunitárias centralizadas
- ✅ Display do pote

### Fase 4: Escalabilidade
- ✅ Novos temas sem modificar código core
- ✅ Novos layouts de mesa apenas alterando array
- ✅ Separação clara de responsabilidades
- ✅ Hooks reutilizáveis

### Fase 5: Preparado para Futuro
- ✅ UI para seletor de temas (pronta para implementação)
- ✅ Store para salvar preferência do jogador
- ✅ Documentação para devs adicionarem skins

---

## 🎯 Benefícios da Arquitetura

| Benefício | Por Quê |
|-----------|---------|
| **Modularidade** | Cada parte (cards, mesa, animações) é independente |
| **Escalabilidade** | Novos temas/layouts sem reescrever código base |
| **Manutenibilidade** | Mudanças isoladas não quebram resto da app |
| **Performance** | CSS animations em vez de JS |
| **Type Safety** | TypeScript em tudo, catch erros em build-time |
| **Backward Compat** | Código antigo continua funcionando |

---

## 🧪 Critérios de Sucesso

- [ ] Cartas renderizam com novo sistema
- [ ] Animações são fluidas (60 FPS)
- [ ] Mesa visual mostra todos os 6+ assentos corretamente
- [ ] Trocar tema atualiza toda a UI
- [ ] Modo tabular antigo ainda funciona
- [ ] Sem memory leaks em animações
- [ ] Mobile responsivo (mesa compactada ou switch para tabular)
- [ ] Dev consegue adicionar tema novo em 5 minutos

---

## 📚 Próximos Passos

1. **Revisar este plano** com o time
2. **Criar estrutura de diretórios** iniciais
3. **Implementar Fase 1** (sistema de cartas)
4. **Testar integração** com código existente
5. **Avançar para Fases 2-5** conforme aprovação

---

## 📞 Dúvidas Frequentes

**P: Isso vai quebrar o código existente?**
R: Não! Modo tabular continua funcionando. Novo modo é opt-in.

**P: Quanto tempo leva?**
R: ~9 dias em paralelo com outras tasks. Pode ser dividido em sprints.

**P: Novos temas vão precisar de novo dep?**
R: Não! Tudo é código TypeScript/CSS puro.

**P: Como testamos isso?**
R: Testes unitários de CardRenderer, testes de integração em TablePage.

**P: Posso usar Framer Motion para animações?**
R: Sim, mas CSS puro é recomendado inicialmente (mais leve).

