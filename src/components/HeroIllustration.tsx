'use client';

export default function HeroIllustration() {
  return (
    <div className="relative w-full aspect-square max-w-lg mx-auto">
      <svg viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        {/* Background shape */}
        <rect x="20" y="20" width="360" height="360" rx="40" fill="#f5f4f1"/>
        
        {/* Abstract sound wave shapes */}
        <ellipse cx="200" cy="200" rx="150" ry="150" fill="#2d6a6a" opacity="0.9"/>
        
        {/* Orange accent wave */}
        <path 
          d="M80 200 Q120 120 200 140 T320 200 Q280 280 200 260 T80 200" 
          fill="#e85d04"
        />
        
        {/* Rust colored shape */}
        <circle cx="280" cy="140" r="60" fill="#dc6b43"/>
        
        {/* Yellow accent */}
        <ellipse cx="140" cy="280" rx="50" ry="40" fill="#f4a442"/>
        
        {/* Dark accent shapes */}
        <circle cx="320" cy="280" r="40" fill="#1a1a1a"/>
        
        {/* White highlights */}
        <circle cx="160" cy="160" r="25" fill="white" opacity="0.9"/>
        <circle cx="240" cy="240" r="15" fill="white" opacity="0.7"/>
        
        {/* Sound wave lines */}
        <g stroke="white" strokeWidth="3" strokeLinecap="round" opacity="0.8">
          <path d="M170 200 v-30 v60 v-30"/>
          <path d="M190 200 v-45 v90 v-45"/>
          <path d="M210 200 v-55 v110 v-55"/>
          <path d="M230 200 v-45 v90 v-45"/>
          <path d="M250 200 v-30 v60 v-30"/>
        </g>
        
        {/* Microphone icon abstraction */}
        <g transform="translate(180, 100)">
          <rect x="0" y="0" width="40" height="60" rx="20" fill="white"/>
          <rect x="15" y="65" width="10" height="20" fill="white"/>
          <rect x="5" y="85" width="30" height="5" rx="2" fill="white"/>
        </g>
        
        {/* Decorative dots */}
        <circle cx="100" cy="120" r="8" fill="#1a1a1a"/>
        <circle cx="320" cy="100" r="6" fill="#f4a442"/>
        <circle cx="80" cy="320" r="10" fill="#e85d04"/>
      </svg>
    </div>
  );
}
