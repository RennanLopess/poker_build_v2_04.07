import { CardTheme } from '../../systems/card-system/themes/types';
import { CardContainer } from '../cards/CardContainer';
import { useCardTheme } from '../../hooks/useCardTheme';

interface CommunityCardsProps {
  cards: string[];
}

export function CommunityCards({ cards }: CommunityCardsProps) {
  const theme: CardTheme = useCardTheme();

  if (!cards || cards.length === 0) {
    return null;
  }

  return (
    <div className="flex gap-2">
      {cards.map((card) => (
        <CardContainer key={card} card={card} theme={theme} animationType="enter" />
      ))}
    </div>
  );
}
