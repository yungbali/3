'use client';

import { Check, Loader2 } from 'lucide-react';

interface GenerationStatusProps {
  status: string;
}

const STATUS_STEPS = [
  { key: 'validating', label: 'Analyze Topic Semantics' },
  { key: 'researching', label: 'Generate Research Context' },
  { key: 'scripting', label: 'Generate Multi-Speaker Script' },
  { key: 'generating', label: 'Synthesizing Audio (Neural Model)' },
];

export default function GenerationStatus({ status }: GenerationStatusProps) {
  const currentIndex = STATUS_STEPS.findIndex(s => status.includes(s.key));
  
  return (
    <div className="linear-card rounded-xl p-5 border-t border-white/5">
      <h4 className="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wider mb-4 pl-1">
        Generation Process
      </h4>
      <div className="space-y-4">
        {STATUS_STEPS.map((step, index) => {
          const isActive = index === currentIndex;
          const isComplete = index < currentIndex;
          
          return (
            <div key={step.key} className="flex items-center gap-3">
              {isComplete ? (
                <div className="w-5 h-5 rounded-full bg-[#22c55e]/10 border border-[#22c55e]/30 flex items-center justify-center text-[#22c55e]">
                  <Check className="w-3 h-3" />
                </div>
              ) : isActive ? (
                <div className="relative w-5 h-5 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border border-[#7b39fc] border-t-transparent animate-spin" />
                </div>
              ) : (
                <div className="w-5 h-5 rounded-full border border-white/10" />
              )}
              <span
                className={`text-xs transition-colors ${
                  isComplete
                    ? 'text-[#a1a1aa] line-through decoration-[#a1a1aa]/50'
                    : isActive
                    ? 'font-medium text-white'
                    : 'text-[#a1a1aa]/50'
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
