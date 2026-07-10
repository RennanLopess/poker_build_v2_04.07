import { ReactNode } from 'react';

interface PokerTableLayoutProps {
  children: ReactNode;
}

export function PokerTableLayout({ children }: PokerTableLayoutProps) {
  return (
    <div className="relative mx-auto w-full" style={{ aspectRatio: '16 / 9', maxWidth: 900 }}>
      <div
        className="absolute inset-6 rounded-[45%] border-8 border-amber-950/60 shadow-2xl"
        style={{
          background: 'radial-gradient(ellipse at center, #14684a 0%, #0b4a34 70%, #073825 100%)',
          boxShadow: 'inset 0 0 60px rgba(0,0,0,0.5), 0 10px 30px rgba(0,0,0,0.4)',
        }}
      />
      {children}
    </div>
  );
}
