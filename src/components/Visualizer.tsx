'use client';

interface VisualizerProps {
  isPlaying?: boolean;
}

export default function Visualizer({ isPlaying = true }: VisualizerProps) {
  const barHeights = [8, 12, 6, 10, 14, 8, 16, 10, 5, 12, 8, 4, 10, 14, 8];
  
  return (
    <div className="h-16 flex items-center justify-center gap-1 opacity-80">
      {barHeights.map((height, i) => (
        <div
          key={i}
          className={`w-1 bg-[#7b39fc] rounded-full ${isPlaying ? 'bar' : ''}`}
          style={{ height: isPlaying ? undefined : `${height}px` }}
        />
      ))}
    </div>
  );
}
