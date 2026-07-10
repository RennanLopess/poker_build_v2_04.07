import { useEffect, useState } from 'react';
import { CardTheme } from '../../systems/card-system/themes/types';
import { CardRenderer } from './CardRenderer';
import { useUIStore } from '../../store/uiStore';
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
  const enableAnimations = useUIStore((state) => state.enableAnimations);
  const [isAnimating, setIsAnimating] = useState(true);

  useEffect(() => {
    if (!animationType || !enableAnimations) {
      setIsAnimating(false);
      return;
    }

    setIsAnimating(true);

    const speedMs = {
      fast: 150,
      medium: 300,
      slow: 500,
    }[theme.card.animationSpeed];

    const timeout = setTimeout(() => setIsAnimating(false), speedMs);
    return () => clearTimeout(timeout);
  }, [animationType, theme.card.animationSpeed, enableAnimations]);

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
