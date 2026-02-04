'use client';

export default function SoundWave() {
  const bars = 24;
  
  return (
    <div className="flex items-center justify-center gap-1 h-16">
      {Array.from({ length: bars }).map((_, i) => {
        const delay = i * 0.08;
        const baseHeight = Math.sin((i / bars) * Math.PI) * 100;
        
        return (
          <div
            key={i}
            className="w-1 rounded-full"
            style={{
              background: `linear-gradient(to top, var(--accent-primary), var(--accent-secondary))`,
              height: `${Math.max(20, baseHeight)}%`,
              animation: `soundWave 1.2s ease-in-out infinite`,
              animationDelay: `${delay}s`,
              opacity: 0.6 + (baseHeight / 200)
            }}
          />
        );
      })}
    </div>
  );
}
