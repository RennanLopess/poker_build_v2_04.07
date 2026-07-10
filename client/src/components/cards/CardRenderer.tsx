import { CardTheme } from '../../systems/card-system/themes/types';
import { isRedCard } from '../../lib/cards';

interface CardRendererProps {
  card?: string;
  theme: CardTheme;
  hidden?: boolean;
}

const SUIT_SYMBOLS: Record<string, string> = { s: '♠', h: '♥', d: '♦', c: '♣' };

function shadowAlpha(intensity: CardTheme['card']['shadowIntensity']): number {
  switch (intensity) {
    case 'high':
      return 0.4;
    case 'low':
      return 0.1;
    default:
      return 0.15;
  }
}

export function CardRenderer({ card, theme, hidden }: CardRendererProps) {
  if (hidden || !card) {
    if (theme.assets) {
      return (
        <div
          style={{
            width: theme.card.width,
            height: theme.card.height,
            borderRadius: theme.card.borderRadius,
            background: theme.assets.backColor ?? theme.colors.back,
            border: `2px solid ${theme.colors.border}`,
            boxShadow: `0 4px 8px rgba(0,0,0,${shadowAlpha(theme.card.shadowIntensity)})`,
          }}
        />
      );
    }
    return (
      <div
        style={{
          width: theme.card.width,
          height: theme.card.height,
          borderRadius: theme.card.borderRadius,
          background: theme.colors.back,
          border: `2px solid ${theme.colors.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#888',
          fontSize: '18px',
          fontWeight: 'bold',
          boxShadow: `0 4px 8px rgba(0,0,0,${shadowAlpha(theme.card.shadowIntensity)})`,
        }}
      >
        ?
      </div>
    );
  }

  if (theme.assets) {
    return (
      <img
        src={theme.assets.getCardSrc(card)}
        alt={card}
        draggable={false}
        style={{
          width: theme.card.width,
          height: theme.card.height,
          borderRadius: theme.card.borderRadius,
          objectFit: 'contain',
          imageRendering: 'pixelated',
          boxShadow: `0 4px 12px rgba(0,0,0,${shadowAlpha(theme.card.shadowIntensity)})`,
        }}
      />
    );
  }

  const suit = card[1].toLowerCase();
  const rank = card[0] === 'T' ? '10' : card[0].toUpperCase();
  const suitSymbol = SUIT_SYMBOLS[suit] ?? suit;
  const isRed = isRedCard(card.toLowerCase());
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
        boxShadow: `0 4px 12px rgba(0,0,0,${shadowAlpha(theme.card.shadowIntensity)})`,
        transition: 'transform 0.2s ease-out',
      }}
    >
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

      <div
        style={{
          fontSize: '24px',
          color: suitColor,
          fontWeight: 'bold',
        }}
      >
        {suitSymbol}
      </div>

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
